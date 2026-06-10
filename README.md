# 🎸 Chordo

Compagnon web pour guitaristes : analyse d'audio, bibliothèque d'accords et accordeur.

## Fonctionnalités

- **Analyseur audio** — dépose un extrait (`mp3`, `wav`, `ogg`, `m4a`, `flac`…). Le backend décode le signal (ffmpeg), détecte les hauteurs trame par trame (algorithme Macleod via `pitchfinder`), convertit en notes (`@tonaljs/tonal`) et propose les accords probables.
- **Bibliothèque d'accords** — diagrammes de manche SVG pour les accords courants (C, D, E, G, A, Am, Em, F, accords de 7e…). Clique pour entendre l'accord (Web Audio).
- **Accordeur de référence** — joue les cordes à vide (accordage standard EADGBe) + un **métronome** réglable.

## Architecture

Le projet est découplé : **backend** (API seule) et **frontend** (app Vite), chacun autonome dans son dossier.

```
backend/                  # API Express (aucun rendu de page)
  app.js                  # app Express (API + CORS)
  server.js               # point d'entrée
  routes/songRoutes.js    # POST /api/upload, GET /api/chords
  controllers/            # logique des endpoints
  services/audioAnalyzer.js  # pipeline ffmpeg → pitchfinder → tonal
  data/chordLibrary.js    # données d'accords et d'accordage
  test/analyzer.test.js   # tests de l'analyseur
frontend/                 # app Vite (vanilla JS)
  index.html
  vite.config.js          # proxy /api → backend en dev
  src/main.js, src/style.css
```

## Prérequis

- Node.js 18+
- `ffmpeg` installé et disponible dans le `PATH`

## Démarrage

Deux terminaux : l'API et le frontend.

```bash
# Terminal 1 — backend (API sur http://localhost:5000)
cd backend
npm install
npm start        # ou: npm run dev (nodemon)

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Puis ouvre http://localhost:5173 (Vite proxifie automatiquement `/api` vers le backend).

En production, build le frontend (`npm run build` → `dist/`) et définis l'URL de l'API
via `VITE_API_URL` (voir `frontend/.env.example`).

## API

| Méthode | Route          | Description                                    |
| ------- | -------------- | ---------------------------------------------- |
| `POST`  | `/api/upload`  | Champ `song` (multipart). Renvoie l'analyse.   |
| `GET`   | `/api/chords`  | Bibliothèque d'accords + accordage.            |
| `GET`   | `/health`      | État du serveur.                               |

## Tests

```bash
cd backend
npm test
```

## Variables d'environnement

`backend/.env` :

```
PORT=5000
```
