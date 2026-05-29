# 🏦 J-Ledger Smart POS Terminal App: Running & Testing Guide 💳

This document provides complete, step-by-step instructions on how to compile, run, test, and deploy the native Android **Smart POS Terminal Application** (`pos-terminal-app`).

---

## 🛠️ 1. Prerequisites & Environment Setup

Before building the application, ensure your workstation matches these developer specifications:
*   **IDE**: Android Studio Hedgehog (2023.1.1+) or newer.
*   **Java Development Kit (JDK)**: Version 17 (highly recommended to use JetBrains Runtime pre-bundled with Android Studio).
*   **Android SDK**: API Level 34 installed (Android 14.0).
*   **Build Engine**: Gradle 8.2+ (configured in `gradle-wrapper.properties`).
*   **Device Options**:
    *   **Physical POS hardware**: Verifone, PAX, or a standard Android device connected via USB with "USB Debugging" enabled.
    *   **Android Emulator**: Recommended to run a simulated device configured with API Level 26 (Android 8.0) or higher.

---

## 🚀 2. Building the Application

You can compile and assemble the application using Android Studio or the Gradle wrapper command-line tool.

### Command-Line Compilation (Gradle Wrapper)
Run the compile commands from the monorepo root directory:

```bash
# 1. Clean build artifacts and cache
./gradlew clean --project-dir=j-ledger-portal/apps/pos-terminal-app

# 2. Build the Debug APK
./gradlew assembleDebug --project-dir=j-ledger-portal/apps/pos-terminal-app

# 3. Build the Release APK (Obfuscated & optimized via ProGuard/R8)
./gradlew assembleRelease --project-dir=j-ledger-portal/apps/pos-terminal-app
```

The successfully compiled APKs will be located at:
*   **Debug APK**: `j-ledger-portal/apps/pos-terminal-app/app/build/outputs/apk/debug/app-debug.apk`
*   **Release APK**: `j-ledger-portal/apps/pos-terminal-app/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🏃 3. Installing and Running the App

### Option A: Via Android Studio (Recommended)
1. Launch **Android Studio**.
2. Click **File ➔ Open** and choose the directory: `/Users/wiiznu/project/fintech/j-ledger-portal/apps/pos-terminal-app`.
3. Allow Gradle to sync and download dependencies.
4. Select your connected target device/emulator from the device manager selector dropdown at the top.
5. Click the green **Run** button (or press `Shift + F10`) to compile, install, and launch the application instantly.

### Option B: Via Command Line (ADB Sync)
Ensure you have a device connected (verify with `adb devices` command):

```bash
# Install the debug APK on the active device
./gradlew installDebug --project-dir=j-ledger-portal/apps/pos-terminal-app
```

---

## 🧪 4. Running Cryptographic Unit Tests

To verify that the HMAC signature algorithm behaves correctly, you can run the pre-configured automated tests:

```bash
# Run unit tests
./gradlew testDebugUnitTest --project-dir=j-ledger-portal/apps/pos-terminal-app
```

The test results report will be generated as a beautiful HTML dashboard at:
`j-ledger-portal/apps/pos-terminal-app/app/build/reports/tests/testDebugUnitTest/index.html`

---

## 📡 5. Aligning API Endpoints for Local Testing

The Retrofit Client in [ApiClient.kt](file:///Users/wiiznu/project/fintech/j-ledger-portal/apps/pos-terminal-app/app/src/main/java/com/jledger/pos/network/ApiClient.kt#L18) points to a staging/production server by default:

```kotlin
private const val BASE_URL = "https://api.potayyr.site/"
```

If you are developing and testing locally on your workspace machine (Mode 2) with Docker compose running, adjust the network endpoints:

### Testing on Android Emulator
The Android Emulator references the host machine's localhost through the special bridge IP `10.0.2.2`. To point the POS app to your local Docker Nginx Gateway:
1. Open [ApiClient.kt](file:///Users/wiiznu/project/fintech/j-ledger-portal/apps/pos-terminal-app/app/src/main/java/com/jledger/pos/network/ApiClient.kt)
2. Change the `BASE_URL` to:
   ```kotlin
   private const val BASE_URL = "http://10.0.2.2/"
   ```
3. Since Nginx listens on standard HTTP port 80, the emulator will automatically route all outgoing signed POS calls into your local Docker services!

### Testing on a Physical Android Device
Ensure both your host machine (running Docker) and the physical Android phone are connected to the **same Wi-Fi network**:
1. Get the local IP address of your host machine (e.g. `192.168.1.150`).
2. Update [ApiClient.kt](file:///Users/wiiznu/project/fintech/j-ledger-portal/apps/pos-terminal-app/app/src/main/java/com/jledger/pos/network/ApiClient.kt):
   ```kotlin
   private const val BASE_URL = "http://192.168.1.150/"
   ```

---

## 🖨️ 6. Testing the Thermal Printer IPC Driver

Because standard emulators do not have a physical thermal printer built-in, a background mock printer service [PrinterMockDriverService.kt](file:///Users/wiiznu/project/fintech/j-ledger-portal/apps/pos-terminal-app/app/src/main/java/com/jledger/pos/service/PrinterMockDriverService.kt) is active:
1. When you run the application, it binds to this background driver using Android's **AIDL Inter-Process Communication (IPC)**.
2. Upon processing any successful transaction (Sales charge, Loyalty redemption, or Coupon clearance), you will see formatted receipt logs appearing inside the **Logcat tab** in Android Studio under the tag `PosViewModel` or `PrinterMockDriver`.
3. This prints out a beautiful padded ticket like this:
   ```text
   ================================
           P-WALLET FINTECH        
         SMART POS TRANSACTION     
   ================================
   Merchant: Coffee Master
   Terminal ID: POS-T1790
   Time: 10:24:50
   --------------------------------
   Mode: CHARGE SALE
   Amount: 150.00 THB
   --------------------------------
   Status: APPROVED
   ================================
   ```
