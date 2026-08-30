# Design — Project Identity

> This document is project-long-lived. Tokens are not changed without
> the Architect's approval. Developers MUST use these tokens
> instead of improvising their own colors/spacings.

## Style Direction

Glamouröses Red-Carpet-Dunkel mit warmem Gold-Akzent und serifenbetonten Überschriften – edel wie ein Hollywood-Premierenabend, aber ruhig und klar genug für die tägliche Garderoben-Nutzung.

## Colors

- `--color-bg`: **#0E0B09**
- `--color-fg`: **#F5EFE6**
- `--color-accent`: **#C9A227**
- `--color-border`: **#3A322A**
- `--color-muted`: **#A99B85**

## Typography

- `font_family`: 'Didot', 'Bodoni MT', Georgia, 'Times New Roman', serif (Überschriften); -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif (Fließtext/UI)
- `heading_weight`: 600
- `body_weight`: 400

## Spacing Scale

- `--space-0`: 4px
- `--space-1`: 8px
- `--space-2`: 12px
- `--space-3`: 16px
- `--space-4`: 24px
- `--space-5`: 32px

## Border-Radii

- `--radius-sm`: 4px
- `--radius-md`: 8px
- `--radius-lg`: 16px
- `--radius-pill`: 999px

## Components

### Button

padding 12px 24px, min-height 44px (Touch-Ziel), radius pill, bg=accent (#C9A227), color=bg (#0E0B09), font-weight 600, letter-spacing 0.02em; hover: bg #D4AF37; active: bg #B08D1F + translateY(1px); disabled: opacity 0.45, cursor not-allowed; focus-visible: 2px outline #C9A227 mit 2px Abstand.

### SecondaryButton

wie Button, aber bg=transparent, 1px border #3A322A, color=#F5EFE6; hover: border #C9A227, color #C9A227; active: bg rgba(201,162,39,0.12); disabled: opacity 0.45.

### Card

bg #171310, 1px solid border #3A322A, radius lg (16px), padding 24px (mobil 16px), box-shadow 0 10px 30px rgba(0,0,0,0.35); Hover bei klickbaren Karten: border #C9A227, transform translateY(-2px).

### Input

bg #171310, 1px solid border #3A322A, radius md (8px), padding 12px 16px, color #F5EFE6, min-height 44px; placeholder color #A99B85; focus: border #C9A227 + box-shadow 0 0 0 3px rgba(201,162,39,0.25); error: border #B4433A.

### FilterChip

padding 8px 16px, min-height 40px, radius pill, bg transparent, 1px solid border #3A322A, color #A99B85; active: bg rgba(201,162,39,0.15), border #C9A227, color #F5EFE6; hover: border #C9A227.

### Navbar

sticky top, bg rgba(14,11,9,0.92) mit backdrop-blur 12px, 1px bottom border #3A322A, padding 12px 24px, Logo serif 20px/600 in #C9A227; mobil: Brand links, Menü/Logout rechts.

### Modal

Overlay rgba(0,0,0,0.72) mit backdrop-blur 4px; Dialog bg #171310, 1px solid #3A322A, radius lg (16px), padding 24px, max-width 480px, width calc(100% - 32px); Titel serif 20px/600 #F5EFE6; Schließen-Icon 44px Touch-Fläche.

### OutfitCard

Card-Variante mit horizontalem Vorschaustreifen: 3-4 runde Bild-Thumbnails 48px, radius pill, 2px ring #0E0B09, überlappend um -12px; Name serif 18px/600; Kategorie-Label 12px uppercase letter-spacing 0.08em in #A99B85.

### ImageTile

quadratisch, bg #1C1713, 1px solid #3A322A, radius md (8px), object-fit cover; Platzhalter: diagonales Gold-Verlaufsmuster auf #171310 mit Kleiderbügel-Symbol in #A99B85; Bild-Overlay mit Bearbeiten/Löschen-Icons 44px Touch-Fläche, bg rgba(14,11,9,0.6).

### EmptyState

zentriert, padding 48px 24px, gestrichelte 1px Border #3A322A, radius lg; Icon in #A99B85, Text in #A99B85, primärer Button zentriert darunter.

### Toast

fixiert unten rechts (mobil unten mittig), bg #171310, 1px solid #3A322A, radius md, padding 12px 16px, color #F5EFE6; Erfolg: linker 3px Balken #C9A227; Fehler: linker 3px Balken #B4433A; max-width 360px.

## Layout Principles

- Container max-width 1120px, seitlich 24px Padding (mobil 16px), zentriert.
- Breakpoints: 640px (mobil), 1024px (Tablet/Desktop); darunter einspaltig, darüber Grid.
- Garderobe/Outfits als responsive Grid: auto-fill, minmax(220px, 1fr), gap 24px (mobil 16px).
- Sektionen mit 32px Abstand, Seitenkopf mit 48px Abstand nach unten.
- Formulare einspaltig, max-width 480px, Labels über den Feldern mit 8px Abstand.
- Footer auf jeder Seite mit Impressum/Datenschutz-Links, 12px muted Text, oben 1px border #3A322A.
