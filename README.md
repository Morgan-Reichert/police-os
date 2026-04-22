# POLICE-OS — Simulation RP Police Nationale (FiveM)

Interface "Bureau virtuel" immersive façon OS administratif pour enquêteurs RP.

## Structure

```
police-os/
├── frontend/                        # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx                  # Point d'entrée, monte le Desktop
│   │   ├── components/
│   │   │   ├── Desktop.jsx          # Fond d'écran + icônes
│   │   │   ├── Taskbar.jsx          # Barre des tâches bas d'écran
│   │   │   ├── StartMenu.jsx        # Menu démarrer
│   │   │   ├── WindowManager.jsx    # ⭐ Gestion z-index + drag & drop
│   │   │   ├── Window.jsx           # Fenêtre individuelle (titlebar + contenu)
│   │   │   └── windows/             # Contenu de chaque app
│   │   │       ├── BioLab.jsx
│   │   │       ├── Interception.jsx
│   │   │       ├── Magistrat.jsx
│   │   │       └── AdminPanel.jsx
│   │   ├── hooks/
│   │   │   └── useDraggable.js
│   │   ├── utils/
│   │   │   └── api.js               # Wrapper fetch vers backend
│   │   └── index.css                # Tailwind + polices monospace
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── backend/                         # Node.js + Express
    ├── server.js                    # Serveur principal
    ├── routes/
    │   ├── biolab.js                # POST /api/biolab/compare
    │   ├── interception.js          # GET /api/interception/list + stream audio
    │   ├── magistrat.js             # POST /api/magistrat/query
    │   └── admin.js                 # POST /api/admin/upload
    ├── services/
    │   └── aiMagistrat.js           # Prompt système + appel API LLM
    ├── data/
    │   ├── fingerprints.json        # DB empreintes (id, nom, suspect, hash)
    │   └── wiretaps.json            # DB écoutes (id, suspect, date, fichier)
    ├── uploads/
    │   ├── fingerprints/            # PNG/JPG empreintes cibles
    │   └── audio/                   # MP3/WAV écoutes
    └── package.json
```

## Installation rapide

```bash
# Backend
cd backend && npm install && npm run dev   # port 3001

# Frontend (autre terminal)
cd frontend && npm install && npm run dev  # port 5173
```

Variables d'env backend (`.env`) :
```
PORT=3001
ANTHROPIC_API_KEY=sk-...
# ou OPENAI_API_KEY=sk-...
```

## Identifiants MJ (Admin)
Par défaut : `admin / stariax` (à changer dans `backend/routes/admin.js`).
