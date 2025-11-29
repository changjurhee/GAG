# Lozen - Premium Lottery Generator

Lozen is a high-quality mobile application for generating Lotto 6/45 numbers, built with React Native (Expo).

## 📱 Features

- **Premium UI**: Clean, modern interface with smooth animations.
- **Advanced Algorithms**:
  - **Weighted**: Based on historical frequency.
  - **Adaptive**: Trend-based generation with decay.
  - **Cold Numbers**: Focus on numbers that haven't appeared recently.
- **Secure RNG**:
  - **Web Crypto**: Cryptographically secure random number generation.
  - **VRF Simulation**: Verifiable Random Function logic.
  - **Blockchain**: Uses Bitcoin block hashes as entropy source.
- **History**: Automatically saves your generation history.

## 🚀 How to Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start the App**:
    ```bash
    npx expo start
    ```

3.  **Run on Device**:
    - Scan the QR code with the **Expo Go** app (Android) or Camera app (iOS).
    - Press `i` to run on iOS Simulator (if installed).
    - Press `a` to run on Android Emulator (if installed).
    - Press `w` to run in Web Browser.

## 📂 Project Structure

- **`App.js`**: Main entry point with Tab Navigation.
- **`screens/`**:
  - `HomeScreen.js`: Main generator interface.
  - `HistoryScreen.js`: History list.
- **`components/`**:
  - `Ball.js`: Reusable lottery ball component.
- **`utils/`**:
  - `algorithms.js`: Core generation logic.
  - `rng.js`: Random number generators.
  - `config.js`: Configuration constants.
- **`data/`**:
  - `winning_numbers.js`: Historical data.
