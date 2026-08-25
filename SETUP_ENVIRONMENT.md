# Android Development Environment Setup

## Quick Start Guide

This document provides step-by-step instructions to set up your Android development environment without Android Studio.

## Step 1: Install Java Development Kit (JDK)

### On Windows
1. Download JDK 11+ from [Oracle](https://www.oracle.com/java/technologies/downloads/)
2. Run the installer and follow the prompts
3. Set `JAVA_HOME` environment variable:
   - Right-click "This PC" → Properties → Environment Variables
   - New → Variable name: `JAVA_HOME`, Value: `C:\Program Files\Java\jdk-11`
   - Add to PATH: `C:\Program Files\Java\jdk-11\bin`

### On macOS
```bash
brew install openjdk@11
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 11)' >> ~/.zshrc
```

### On Linux (Ubuntu)
```bash
sudo apt-get update
sudo apt-get install openjdk-11-jdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
```

## Step 2: Install Android SDK

### On All Platforms
1. Download Android Command-line Tools from [Android Developers](https://developer.android.com/studio/releases/cmdline-tools)
2. Extract to a directory (e.g., `~/Android/sdk/cmdline-tools/latest`)
3. Set environment variables:

**macOS/Linux (~/.bashrc or ~/.zshrc):**
```bash
export ANDROID_HOME=$HOME/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

**Windows (System Environment Variables):**
```
ANDROID_HOME = C:\Android\sdk
PATH += C:\Android\sdk\cmdline-tools\latest\bin;C:\Android\sdk\platform-tools
```

## Step 3: Install Required Android SDK Components

```bash
# Accept licenses
sdkmanager --licenses

# Install SDK components (for this project)
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "platform-tools"
sdkmanager "cmdline-tools;latest"
```

## Step 4: Verify Installation

```bash
# Check Java
java -version

# Check Android SDK
adb --version
androidemulator --version
```

## Step 5: Clone and Build

```bash
# Clone repository
git clone https://github.com/dananjayagamagedpmc-tech/MRF-DISTRIBUTORS.git
cd MRF-DISTRIBUTORS

# Make gradle wrapper executable (macOS/Linux)
chmod +x gradlew

# Build APK
./gradlew assembleDebug
```

## Building Emulator

### List Available Emulators
```bash
emulator -list-avds
```

### Create New Emulator
```bash
sdkmanager "system-images;android-34;default;x86_64"
avdmanager create avd -n TestEmulator -k "system-images;android-34;default;x86_64" -d "Nexus 5"
```

### Start Emulator
```bash
emulator -avd TestEmulator
```

### Install APK
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| `command not found: gradle` | Ensure gradlew is executable: `chmod +x gradlew` |
| `ANDROID_HOME not set` | Set environment variable and restart terminal |
| `SDK version mismatch` | Install required SDK: `sdkmanager "platforms;android-34"` |
| `Build fails with Java error` | Verify JAVA_HOME points to JDK (not JRE) |
| `APK not installing` | Ensure emulator is running: `emulator -list-avds` |

## Next Steps

- Read [BUILD_APK.md](BUILD_APK.md) for detailed build instructions
- Check [README.md](README.md) for project overview
- Start developing with command-line tools

## Useful Commands

```bash
# Build
./gradlew build                    # Full build
./gradlew assembleDebug            # Debug APK
./gradlew assembleRelease          # Release APK

# Test
./gradlew test                     # Unit tests
./gradlew connectedAndroidTest     # Instrumentation tests

# Device
adb devices                        # List devices
adb logcat                         # View logs
adb shell                          # Access device shell

# Emulator
emulator -list-avds               # List emulators
emulator -avd device-name         # Start emulator
```
