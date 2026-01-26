#!/bin/bash
# Quick Start Script pour SkyBot Inbox Frontend

echo "🚀 Démarrage de SkyBot Inbox Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "skybot-inbox-ui/node_modules" ]; then
  echo "📦 Installation des dépendances (première fois)..."
  cd skybot-inbox-ui
  npm install
  cd ..
fi

echo "✅ Lancement du serveur de développement..."
echo ""
echo "📍 Frontend accessible sur: http://localhost:3000"
echo "🔌 Connecté au backend: https://skybot-inbox.onrender.com/api"
echo ""
echo "Appuie sur Ctrl+C pour arrêter"
echo ""

cd skybot-inbox-ui
npm run dev
