#!/bin/bash
set -e

echo "🔨 Compilazione CLI Swift in corso..."
cd "$(dirname "$0")/../cli"
swift build -c release 2>&1

mkdir -p ../server/bin
cp .build/release/RemindersKit ../server/bin/reminders-kit

echo "🔐 Firma con entitlements Reminders..."
codesign --force --sign - \
  --entitlements "$(dirname "$0")/../cli/reminders.entitlements" \
  ../server/bin/reminders-kit

echo "✅ CLI compilata e firmata in server/bin/reminders-kit"
