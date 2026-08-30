# Glamouröser Kleiderschrank-Manager

Ein eleganter Web-Kleiderschrank-Manager im Hollywood-Stil: Benutzer registrieren sich,
verwalten ihre Garderobe mit Bildern und Kategorien, durchstöbern sie und kombinieren im
Outfit-Creator Einzelteile zu gespeicherten Outfits – präsentiert in glamouröser
Red-Carpet-Optik.

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite
- **Auth**: JWT (Bearer-Token), Passwort-Hashing mit bcrypt
- **Frontend**: Vite + React
- **Runtime**: uvicorn

## Installation

```bash
cd backend
pip install -r requirements.txt
```

## Startbefehle (Entwicklung)

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Die API ist danach unter `http://localhost:8000` erreichbar. Der Server legt beim Start
automatisch das Datenbank-Schema an (Standard: `sqlite:///./wardrobe.db`).

### Konfiguration (Umgebungsvariablen)

| Variable          | Standard               | Beschreibung                                   |
| ----------------- | ---------------------- | ---------------------------------------------- |
| `SECRET_KEY`      | zufällig je Start      | Signaturschlüssel für JWT                      |
| `DATABASE_URL`    | `sqlite:///./wardrobe.db` | Datenbank-URL                                  |
| `CORS_ORIGINS`    | `http://localhost:5173` | Erlaubte Frontend-Origins (kommagetrennt)      |
| `UPLOAD_DIR`      | `uploads/`             | Ablageverzeichnis für hochgeladene Bilder      |
| `MAX_UPLOAD_SIZE` | `5242880` (5 MB)       | Größenlimit für Bild-Uploads in Bytes          |
| `VITE_API_URL`    | `http://localhost:8000` | API-Basis-URL für das Frontend                 |

## API-Endpunkte

Alle Endpunkte sprechen JSON. Geschützte Endpunkte erwarten den Header
`Authorization: Bearer <JWT>`.

| Methode | Pfad                            | Beschreibung                          | Antwort                             |
| ------- | ------------------------------- | ------------------------------------- | ----------------------------------- |
| GET     | `/api/health`                   | Health-Check                          | `200 {"status":"ok"}`               |
| POST    | `/api/auth/register`            | Registrierung `{email,password}`      | `201 {access_token,token_type}`     |
| POST    | `/api/auth/login`               | Login `{email,password}`              | `200 {access_token,token_type}`     |
| GET     | `/api/wardrobe?category=`       | Garderobe (optional nach Kategorie)   | `200 [Item]`                        |
| POST    | `/api/wardrobe`                 | Kleidungsstück anlegen                | `201 Item`                          |
| PATCH   | `/api/wardrobe/{item_id}`       | Kleidungsstück bearbeiten             | `200 Item`                          |
| DELETE  | `/api/wardrobe/{item_id}`       | Kleidungsstück löschen                | `204`                               |
| POST    | `/api/wardrobe/{item_id}/image` | Bild hochladen (multipart `file`)     | `200 Item`                          |
| GET     | `/api/uploads/{filename}`       | Bilddaten abrufen                     | `200` Bilddaten                     |
| GET     | `/api/outfits`                  | Outfit-Liste                          | `200 [Outfit]`                      |
| POST    | `/api/outfits`                  | Outfit erstellen                      | `201 Outfit`                        |
| GET     | `/api/outfits/{outfit_id}`      | Outfit-Details                        | `200 OutfitDetail`                  |
| PATCH   | `/api/outfits/{outfit_id}`      | Outfit bearbeiten                     | `200 OutfitDetail`                  |
| DELETE  | `/api/outfits/{outfit_id}`      | Outfit löschen                        | `204`                               |
| DELETE  | `/api/account`                  | Eigenes Konto löschen                 | `204`                               |

## Features

- Registrierung und Login mit JWT-Authentifizierung
- Garderobe mit Kategorien, Filtern und Bild-Uploads
- Outfit-Creator zum Kombinieren mehrerer Kleidungsstücke
- Konto-Löschung inklusive aller zugehörigen Daten
- Elegante Red-Carpet-Optik, mobil bedienbar
