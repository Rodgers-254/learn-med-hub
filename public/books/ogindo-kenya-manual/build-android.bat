@echo off

REM OG Manual Kenya - Android Build Script for Windows
REM This script builds the medical manual app for Android devices

echo 🏥 Building OG Manual Kenya for Android...
echo ================================================

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

echo 🔧 Adding Android platform...
call npx cap add android

echo 📱 Updating Android platform...
call npx cap update android

echo 🏗️ Building the web app...
call npm run build

echo 🔄 Syncing to Android...
call npx cap sync android

echo 🚀 Opening Android Studio...
call npx cap open android

echo.
echo ✅ Android build process completed!
echo.
echo 📋 Next Steps:
echo 1. Android Studio should now be open
echo 2. Connect your Android device or start an emulator
echo 3. Click 'Run' in Android Studio to install the app
echo.
echo 📖 For more help, visit: https://capacitorjs.com/docs/android
echo.
echo 🔧 Troubleshooting:
echo - Make sure Android Studio is installed
echo - Enable USB debugging on your device
echo - Ensure you have Android SDK installed
echo.
pause