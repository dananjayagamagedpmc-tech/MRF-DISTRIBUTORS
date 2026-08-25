# Building APK Without Android Studio

This guide explains how to build the MRF Distributors Android app APK from the command line without Android Studio.

## Prerequisites

### 1. Install Java Development Kit (JDK)
- Download JDK 11 or higher from [Oracle](https://www.oracle.com/java/technologies/downloads/) or use OpenJDK
- Set `JAVA_HOME` environment variable to your JDK installation path

**Verify Java Installation:**
```bash
java -version
javac -version
```

### 2. Install Android SDK
- Download Android SDK from [Android Developers](https://developer.android.com/studio/releases/cmdline-tools)
- Extract it to a directory (e.g., `~/Android/sdk`)
- Set `ANDROID_HOME` environment variable

**On Linux/Mac:**
```bash
export ANDROID_HOME=~/Android/sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
```

**On Windows:**
```bash
set ANDROID_HOME=C:\Android\sdk
set PATH=%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%
```

### 3. Install Required SDK Components
```bash
sdkmanager --sdk_root=$ANDROID_HOME "platforms;android-34"
sdkmanager --sdk_root=$ANDROID_HOME "build-tools;34.0.0"
sdkmanager --sdk_root=$ANDROID_HOME "platform-tools"
sdkmanager --sdk_root=$ANDROID_HOME "cmdline-tools;latest"
```

## Building the APK

### Step 1: Clone or Navigate to the Repository
```bash
git clone https://github.com/dananjayagamagedpmc-tech/MRF-DISTRIBUTORS.git
cd MRF-DISTRIBUTORS
```

### Step 2: Make Gradle Wrapper Executable (Linux/Mac)
```bash
chmod +x gradlew
```

### Step 3: Build Debug APK
```bash
# On Linux/Mac
./gradlew assembleDebug

# On Windows
gradlew.bat assembleDebug
```

### Step 4: Build Release APK (Recommended for Distribution)
```bash
# On Linux/Mac
./gradlew assembleRelease

# On Windows
gradlew.bat assembleRelease
```

**Note:** For Release builds, you need to sign the APK with a keystore:
```bash
# Create a keystore (one-time setup)
keytool -genkey -v -keystore my-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Then configure in app/build.gradle.kts:
# signingConfigs {
#     release {
#         storeFile file("my-release-key.keystore")
#         storePassword "your-password"
#         keyAlias "my-key-alias"
#         keyPassword "your-key-password"
#     }
# }
```

## Output Location

After successful build, the APK files will be located at:

**Debug APK:**
```
app/build/outputs/apk/debug/app-debug.apk
```

**Release APK:**
```
app/build/outputs/apk/release/app-release.apk
```

## Installing the APK on Device/Emulator

### Start Android Emulator (if not already running)
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd your-emulator-name
```

### Install APK
```bash
# Debug APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Release APK
adb install app/build/outputs/apk/release/app-release.apk
```

### Check Connected Devices
```bash
adb devices
```

## Troubleshooting

### Issue: "ANDROID_HOME not set"
- Set the ANDROID_HOME environment variable to your Android SDK path

### Issue: "Gradle daemon is running but not compatible"
```bash
./gradlew --stop
```

### Issue: "Build fails with SDK version error"
- Make sure you have installed the correct Android SDK platform version (34 for this project)

### Issue: "Java not found"
- Ensure JAVA_HOME is set and points to a valid JDK installation

## Complete Setup Script (Linux/Mac)

```bash
#!/bin/bash

# Set environment variables
export JAVA_HOME=/path/to/your/jdk
export ANDROID_HOME=~/Android/sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Navigate to project
cd MRF-DISTRIBUTORS

# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

echo "APK built successfully at: app/build/outputs/apk/debug/app-debug.apk"
```

## Additional Commands

```bash
# Clean build directory
./gradlew clean

# Check gradle version
./gradlew --version

# Run tests
./gradlew test

# Build and install directly
./gradlew installDebug

# View gradle tasks
./gradlew tasks
```

## Development Tips

1. **Use Debug APK** for development and testing
2. **Use Release APK** for distribution on Play Store
3. **Always test** on multiple devices/API levels before release
4. **Keep your SDK updated** for latest features and security patches
5. **Monitor build output** for warnings and errors

## Resources

- [Android Gradle Plugin Documentation](https://developer.android.com/build)
- [Build APK from Command Line](https://developer.android.com/build/building-cmdline)
- [Gradle Wrapper Documentation](https://docs.gradle.org/current/userguide/gradle_wrapper.html)
