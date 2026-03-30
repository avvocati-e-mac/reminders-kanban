#!/bin/bash
set -e

echo "================================================"
echo "  RemindersKanban — Setup iniziale"
echo "================================================"
echo ""

# Verifica prerequisiti
echo "Verifica prerequisiti..."

if ! command -v xcode-select &> /dev/null; then
  echo "❌ xcode-select non trovato. Installa Xcode Command Line Tools:"
  echo "   xcode-select --install"
  exit 1
fi
echo "✅ xcode-select: $(xcode-select --version)"

if ! command -v swift &> /dev/null; then
  echo "❌ Swift non trovato. Installa Xcode Command Line Tools."
  exit 1
fi
echo "✅ Swift: $(swift --version 2>&1 | head -1)"

if ! command -v node &> /dev/null; then
  echo "❌ Node.js non trovato. Installa da https://nodejs.org"
  exit 1
fi
echo "✅ Node.js: $(node --version)"

echo ""

# Installa dipendenze
echo "Installazione dipendenze npm (server)..."
npm install --prefix server --silent

echo "Installazione dipendenze npm (client)..."
npm install --prefix client --silent

echo "Installazione concurrently (root)..."
npm install --silent

echo ""

# Compila CLI Swift
echo "Compilazione CLI Swift (può richiedere 1-2 minuti)..."
bash "$(dirname "$0")/build-cli.sh"

echo ""
echo "================================================"
echo "  Setup completato!"
echo "================================================"
echo ""
echo "Prossimi passi:"
echo ""
echo "1. Apri Reminders.app e crea una lista 'demo-app'"
echo "   con 3 sezioni: 'Da fare', 'In corso', 'Completato'"
echo "   e qualche task di prova con subtask."
echo ""
echo "2. Avvia l'applicazione:"
echo "   npm run dev"
echo ""
echo "3. Apri il browser su:"
echo "   http://localhost:5173"
echo ""
echo "Nota: al primo avvio macOS chiederà il permesso per"
echo "accedere ad Apple Reminders. Clicca 'Consenti'."
echo ""
