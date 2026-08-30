import logging
from pathlib import Path

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..database import get_db
from ..security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["account"])


def _image_filename(image_url: str) -> str:
    """Derive the stored filename from an item's ``image_url``."""
    return image_url.rsplit("/", 1)[-1]


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    image_urls = [item.image_url for item in user.items if item.image_url]

    db.delete(user)
    db.commit()

    upload_dir = Path(settings.upload_dir)
    for image_url in image_urls:
        filename = _image_filename(image_url)
        if not filename:
            continue
        file_path = upload_dir / filename
        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            logger.warning("could not remove image file %s", file_path)
