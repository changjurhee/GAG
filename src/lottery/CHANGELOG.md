# Changelog

All notable changes to this project will be documented in this file.

## [v1.5.1] - 2025-12-01

### Added
- **Root Cause Analysis**: Detailed report on recent display bugs (`ROOT_CAUSE_ANALYSIS.md`).
- **UI Centralization**: New `setButtonState` helper in `ui.js` to manage button states consistently.

### Changed
- **Refactoring**: Consolidated all UI logic into `ui.js` and cleaned up `main.js`.
- **Fix**: Resolved persistent "missing function" errors by ensuring all helpers (`createBallElement`, `getBallRangeClass`, `generateBallsHTML`) are properly exported.
- **Fix**: Removed duplicate display logic that caused balls to appear twice.

### Fixed
- **Simulation Settings**: Added input for "Training Sim Count" (up to 10M) in the Settings modal.

## [v1.5.0] - 2025-11-30

### Added
- **AI Simulation Training**: Added "Simulate & Train" feature to run 2,000 headless physics simulations and feed the data into the AI model.
- **Simulation Settings**: Added configuration for the number of training simulations in the Settings modal.
- **Chart Visualization**: Added "Sim Start Freq" (dashed orange line) to the frequency chart to compare simulated data against official history.
- **Architecture Documentation**: Added comprehensive `ARCHITECTURE.md` with Context, Module, Component, Class, and Sequence diagrams.
- **QA Strategy**: Documented testing strategies and quality attributes in `ARCHITECTURE.md`.

### Fixed
- **Generation Bug**: Resolved an issue where the "Generate" button would freeze due to uncaught errors in the display logic.
- **Data Loading**: Fixed `winning_numbers.js` to allow dynamic updates (changed `const` to `var`).

## [v1.4.0] - 2025-11-30

### Added
- **Data Source Settings**: Added a settings modal to switch data sources.
- **Excel Upload**: Users can now upload Donghang Lottery `.xls` files to update data client-side.
- **Bug Fix**: Fixed settings modal visibility issue.

## [v1.3.0] - 2025-11-30

### Added
- **Deep Learning (TensorFlow.js)**: Integrated a real LSTM neural network for number prediction.
- **Training UI**: Added a "Train Model" panel with real-time loss/epoch visualization.

## [v1.2.0] - 2025-11-30

### Added
- **Winning History Tab**: A new dedicated tab to view official lottery winning numbers.
- **Web Crawler**: Python script (`crawl_numbers.py`) to automatically fetch the latest winning numbers from the official website.
- **Pagination**: Implemented page navigation (First, Prev, Next, Last) for the history log to handle large datasets efficiently.
- **AI/RL Algorithm**: Added a "Sequential (AI/RL)" generation algorithm that uses reinforcement learning concepts (exploration/exploitation) and transition matrices.
- **Responsive Design**: Improved UI responsiveness for various screen sizes, including a collapsible sidebar and dynamic resizing.
- **Version Display**: Added version number display in the sidebar.

### Changed
- **UI Layout**: Optimized the main dashboard layout and sidebar for better usability.
- **Performance**: Implemented caching for history rendering to improve tab switching speed.

## [v1.1.0] - 2025-11-28 (Retrospective)

### Added
- **Frequency Chart**: Visual bar chart showing the frequency of each number's appearance.
- **Simulation Mode**: Physics-based lottery ball simulation using HTML5 Canvas.
- **Algorithm Options**: Added Weighted, Adaptive, and Non-Frequency generation algorithms.
- **Sound Effects**: Added audio feedback for ball generation.

## [v1.0.0] - 2025-11-27

### Initial Release
- Basic random number generation.
- Core UI with Sidebar and Main Content area.
- Ball visualization with color coding.
- "Main View" and "History View" tabs.
