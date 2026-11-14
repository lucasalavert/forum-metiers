#!/usr/bin/env bash
# Script de lancement local — Forum des Métiers & de l'Orientation

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== Forum des Métiers & de l'Orientation — Démarrage local ==="

# Si Docker est présent et qu'aucun flag --no-docker n'est passé, lancer via Docker Compose
if [ "$1" != "--no-docker" ] && command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "Démarrage via Docker Compose (environnement de développement conteneurisé)..."
    [ -f "forum_metiers.db" ] || touch forum_metiers.db
    docker compose up -d
    echo ""
    echo "Application opérationnelle :"
    echo " - Frontend (Interface complète) : http://localhost:5190"
    echo " - Backend API & Docs Swagger    : http://localhost:8190/docs"
    echo " - Healthcheck                   : http://localhost:8190/api/health"
    echo ""
    echo "Commandes utiles :"
    echo " - Voir les logs : docker compose logs -f"
    echo " - Arrêter       : docker compose down"
    exit 0
fi

echo "Démarrage en local sans Docker..."

# Vérification venv
if [ ! -d ".venv" ]; then
  echo "Création du venv Python..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt
else
  source .venv/bin/activate
fi

# Lancement Backend FastAPI sur port 8190
echo "Démarrage du Backend FastAPI sur http://0.0.0.0:8190 ..."
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8190 --reload &
BACKEND_PID=$!

# Lancement Frontend Vite sur port 5190
echo "Démarrage du Frontend Vite sur http://0.0.0.0:5190 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

echo ""
echo "Application opérationnelle :"
echo " - Frontend (Interface complète) : http://localhost:5190"
echo " - Backend & Production intégrée : http://localhost:8190"
echo " - API Docs Swagger              : http://localhost:8190/docs"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs."

wait
