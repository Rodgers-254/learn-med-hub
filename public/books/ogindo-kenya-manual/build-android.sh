#!/bin/bash

# OG Manual Kenya - Android Build Script
# This script builds the medical manual app for Android devices

echo "🏥 Building OG Manual Kenya for Android..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Adding Android platform..."
npx cap add android

echo "📱 Updating Android platform..."
npx cap update android

echo "🏗️ Building the web app..."
npm run build

echo "🔄 Syncing to Android..."
npx cap sync android

echo "🚀 Opening Android Studio..."
npx cap open android

echo ""
echo "✅ Android build process completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Android Studio should now be open"
echo "2. Connect your Android device or start an emulator"
echo "3. Click 'Run' in Android Studio to install the app"
echo ""
echo "📖 For more help, visit: https://capacitorjs.com/docs/android"
echo ""
echo "🔧 Troubleshooting:"
echo "- Make sure Android Studio is installed"
echo "- Enable USB debugging on your device"
echo "- Ensure you have Android SDK installed"