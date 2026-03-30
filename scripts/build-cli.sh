#!/bin/bash
set -e

echo "🔨 Compilazione CLI Swift in corso..."
cd "$(dirname "$0")/../cli"
swift build -c release 2>&1

mkdir -p ../server/bin
cp .build/release/RemindersKit ../server/bin/reminders-kit
echo "✅ CLI compilata in server/bin/reminders-kit"
