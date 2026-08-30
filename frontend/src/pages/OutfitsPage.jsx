import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import request from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const styles = `
.outfit-creator { margin-bottom: var(--space-5); }
.outfit-creator h2, .outfits-section h2 { font-size: 22px; margin: 0 0 var(--space-3); }
.outfit-form { display: flex; flex-direction: column; gap: var(--space-3); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field-label { font-size: 13px; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.input { background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 16px; color: var(--color-fg); min-height: 44px; font-size: 15px; width: 100%; }
.input:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px rgba(201,162,39,0.25); outline: none; }
.input::placeholder { color: var(--color-muted); }
.picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--space-2); }
.picker-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-2); background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; color: var(--color-fg); text-align: center; font-family: inherit; }
.picker-item:hover { border-color: var(--color-accent); }
.picker-item.selected { border-color: var(--color-accent); box-shadow: 0 0 0 2px rgba(201,162,39,0.4); }
.picker-name { font-weight: 600; font-size: 13px; word-break: break-word; }
.picker-category { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.picker-thumb { width: 64px; height: 64px; border-radius: var(--radius-md); object-fit: cover; background: var(--color-surface); }
.picker-thumb-placeholder { width: 64px; height: 64px; border-radius: var(--radius-md); background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-size: 22px; font-family: var(--font-heading); }
.outfits-section { margin-top: var(--space-5); }
.outfits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-4); }
.outfit-card { display: flex; flex-direction: column; gap: var(--space-3); text-align: left; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); cursor: pointer; color: var(--color-fg); box-shadow: 0 10px 30px rgba(0,0,0,0.35); font-family: inherit; transition: border-color 0.15s ease, transform 0.15s ease; }
.outfit-card:hover { border-color: var(--color-accent); transform: translateY(-2px); }
.thumb-strip { display: flex; align-items: center; }
.thumb { width: 48px; height: 48px; border-radius: var(--radius-pill); object-fit: cover; border: 2px solid var(--color-bg); margin-left: -12px; background: var(--color-surface-alt); }
.thumb:first-child { margin-left: 0; }
.thumb-placeholder { width: 48px; height: 48px; border-radius: var(--radius-pill); border: 2px solid var(--color-bg); background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-family: var(--font-heading); }
.outfit-info { display: flex; flex-direction: column; gap: 2px; }
.outfit-name { font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: var(--color-fg); }
.outfit-meta { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-muted); }
.empty-state { padding: 48px 24px; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); text-align: center; color: var(--color-muted); }
.muted { color: var(--color-muted); }
.form-error { color: #B4433A; font-size: 13px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.72); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-3); }
.modal-dialog { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
.modal-title { font-size: 20px; margin: 0; }
.modal-close { width: 44px; height: 44px; border: none; background: transparent; color: var(--color-muted); font-size: 24px; cursor: pointer; border-radius: var(--radius-sm); }
.modal-close:hover { color: var(--color-fg); }
.detail-body { display: flex; flex-direction: column; gap: var(--space-3); }
.detail-items { display: flex; flex-direction: column; gap: var(--space-2); }
.detail-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2); background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.detail-item-info { display: flex; flex-direction: column; gap: 2px; }
.detail-thumb { width: 56px; height: 56px; border-radius: var(--radius-md); object-fit: cover; background: var(--color-surface); }
.detail-thumb-placeholder { width: 56px; height: 56px; border-radius: var(--radius-md); background: var(--color-surface); display: flex; align-items: center; justify-content: center; color: var(--color-muted); font-family: var(--font-heading); font-size: 20px; }
.rename-form { display: flex; gap: var(--space-2); align-items: flex-end; }
.rename-form .field { flex: 1; }
.btn-danger { background: #B4433A; color: var(--color-fg); }
.btn-danger:hover { background: #c85449; }
.btn-danger:active { background: #96372f; transform: translateY(1px); }
.toast { position: fixed; bottom: var(--space-4); right: var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 16px; color: var(--color-fg); max-width: 360px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); z-index: 200; }
.toast-success { border-left: 3px solid var(--color-accent); }
.toast-error { border-left: 3px solid #B4433A; }
@media (max-width: 640px) {
  .outfits-grid { gap: var(--space-3); }
  .picker-grid { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
  .rename-form { flex-direction: column; align-items: stretch; }
  .toast { left: var(--space-3); right: var(--space-3); bottom: var(--space-3); max-width: none; }
}
`;

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/')) return `${API_BASE}${imageUrl}`;
  return `${API_BASE}/api/uploads/${imageUrl}`;
}

function Thumb({ imageUrl, alt = '', className, placeholderClassName, style }) {
  const url = resolveImageUrl(imageUrl);
  if (url) {
    return (
      <img className={className} src={url} alt={alt} loading="lazy" style={style} />
    );
  }
  return (
    <span
      className={placeholderClassName}
      aria-label={alt || 'Kein Bild'}
      style={style}
    >
      {alt ? alt.charAt(0).toUpperCase() : ''}
    </span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function OutfitsPage() {
  const { token } = useAuth();

  const [outfits, setOutfits] = useState([]);
  const [wardrobe, setWardrobe] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [outfitName, setOutfitName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const loadAll = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const [outfitsData, wardrobeData] = await Promise.all([
        request('GET', '/api/outfits'),
        request('GET', '/api/wardrobe'),
      ]);
      setOutfits(Array.isArray(outfitsData) ? outfitsData : []);
      setWardrobe(Array.isArray(wardrobeData) ? wardrobeData : []);
    } catch (err) {
      setListError(err.message || 'Laden fehlgeschlagen');
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token, loadAll]);

  const itemById = useMemo(() => {
    const map = {};
    for (const item of wardrobe) {
      map[item.id] = item;
    }
    return map;
  }, [wardrobe]);

  function toggleItem(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    const name = outfitName.trim();
    if (!name) {
      setFormError('Bitte einen Namen vergeben.');
      return;
    }
    if (selectedIds.length === 0) {
      setFormError('Bitte mindestens ein Teil auswählen.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await request('POST', '/api/outfits', { name, item_ids: selectedIds });
      setOutfitName('');
      setSelectedIds([]);
      showToast('success', 'Outfit gespeichert');
      await loadAll();
    } catch (err) {
      const message = err.message || 'Speichern fehlgeschlagen';
      setFormError(message);
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  }

  async function openOutfit(id) {
    setDetailLoading(true);
    setDetailError('');
    setDetail(null);
    try {
      const data = await request('GET', `/api/outfits/${id}`);
      setDetail(data);
      setRenameValue(data && data.name ? data.name : '');
    } catch (err) {
      setDetailError(err.message || 'Outfit konnte nicht geladen werden');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    if (renaming || deleting) return;
    setDetail(null);
    setDetailError('');
    setDetailLoading(false);
  }

  async function handleRename(e) {
    e.preventDefault();
    if (!detail) return;
    const name = renameValue.trim();
    if (!name) return;
    setRenaming(true);
    try {
      const updated = await request('PATCH', `/api/outfits/${detail.id}`, {
        name,
      });
      setDetail(updated);
      setRenameValue(updated && updated.name ? updated.name : name);
      showToast('success', 'Outfit umbenannt');
      await loadAll();
    } catch (err) {
      showToast('error', err.message || 'Umbenennen fehlgeschlagen');
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!detail) return;
    setDeleting(true);
    try {
      await request('DELETE', `/api/outfits/${detail.id}`);
      setDetail(null);
      setDetailError('');
      showToast('success', 'Outfit gelöscht');
      await loadAll();
    } catch (err) {
      showToast('error', err.message || 'Löschen fehlgeschlagen');
    } finally {
      setDeleting(false);
    }
  }

  function outfitThumbnails(outfit) {
    return (outfit.item_ids || [])
      .map((id) => itemById[id])
      .filter(Boolean)
      .slice(0, 4);
  }

  const detailModal = detailLoading ? (
    <Modal title="Outfit" onClose={closeDetail}>
      <p className="muted">Lade…</p>
    </Modal>
  ) : detail ? (
    <Modal title={detail.name} onClose={closeDetail}>
      <div className="detail-body">
        <div className="detail-items">
          {(detail.items || []).map((item) => (
            <div key={item.id} className="detail-item">
              <Thumb
                imageUrl={item.image_url}
                alt={item.name}
                className="detail-thumb"
                placeholderClassName="detail-thumb-placeholder"
              />
              <div className="detail-item-info">
                <span className="outfit-name">{item.name}</span>
                <span className="outfit-meta">{item.category}</span>
              </div>
            </div>
          ))}
          {(detail.items || []).length === 0 && (
            <p className="muted">Dieses Outfit enthält keine Teile.</p>
          )}
        </div>

        <form onSubmit={handleRename} className="rename-form">
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              disabled={renaming}
            />
          </label>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={renaming || !renameValue.trim()}
          >
            {renaming ? 'Speichert…' : 'Umbenennen'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Löscht…' : 'Outfit löschen'}
        </button>
      </div>
    </Modal>
  ) : detailError ? (
    <Modal title="Fehler" onClose={closeDetail}>
      <p className="form-error">{detailError}</p>
    </Modal>
  ) : null;

  return (
    <>
      <style>{styles}</style>
      <section className="page">
        <h1 className="page-heading">Outfits</h1>

        <div className="outfit-creator card">
          <h2>Neues Outfit</h2>
          <form onSubmit={handleCreate} className="outfit-form">
            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="input"
                type="text"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
                placeholder="z. B. Abend-Outfit"
                disabled={saving}
              />
            </label>

            <div className="field">
              <span className="field-label">
                Teile auswählen ({selectedIds.length} ausgewählt)
              </span>
              {wardrobe.length === 0 && !listLoading ? (
                <p className="muted">
                  Noch keine Garderobenstücke vorhanden. Lege zuerst Teile in der
                  Garderobe an.
                </p>
              ) : (
                <div className="picker-grid">
                  {wardrobe.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`picker-item ${
                        selectedIds.includes(item.id) ? 'selected' : ''
                      }`}
                      onClick={() => toggleItem(item.id)}
                      disabled={saving}
                      aria-pressed={selectedIds.includes(item.id)}
                    >
                      <Thumb
                        imageUrl={item.image_url}
                        alt={item.name}
                        className="picker-thumb"
                        placeholderClassName="picker-thumb-placeholder"
                      />
                      <span className="picker-name">{item.name}</span>
                      <span className="picker-category">{item.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <button
              type="submit"
              className="btn"
              disabled={saving || selectedIds.length === 0}
            >
              {saving ? 'Speichert…' : 'Outfit speichern'}
            </button>
          </form>
        </div>

        <div className="outfits-section">
          <h2>Gespeicherte Outfits</h2>
          {listLoading ? (
            <p className="muted">Lade Outfits…</p>
          ) : listError ? (
            <p className="form-error">{listError}</p>
          ) : outfits.length === 0 ? (
            <div className="empty-state">
              <p>
                Noch keine Outfits. Kombiniere oben deine ersten Teile zu einem
                Outfit.
              </p>
            </div>
          ) : (
            <div className="outfits-grid">
              {outfits.map((outfit) => {
                const thumbs = outfitThumbnails(outfit);
                return (
                  <button
                    type="button"
                    key={outfit.id}
                    className="outfit-card"
                    onClick={() => openOutfit(outfit.id)}
                  >
                    <div className="thumb-strip">
                      {thumbs.length === 0 ? (
                        <span className="thumb-placeholder">+</span>
                      ) : (
                        thumbs.map((item, i) => (
                          <Thumb
                            key={item.id}
                            imageUrl={item.image_url}
                            alt={item.name}
                            className="thumb"
                            placeholderClassName="thumb-placeholder"
                            style={{ zIndex: thumbs.length - i }}
                          />
                        ))
                      )}
                    </div>
                    <div className="outfit-info">
                      <span className="outfit-name">{outfit.name}</span>
                      <span className="outfit-meta">
                        {(outfit.item_ids || []).length} Teile
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {detailModal}

        {toast && (
          <div className={`toast toast-${toast.type}`} role="status">
            {toast.text}
          </div>
        )}
      </section>
    </>
  );
}
