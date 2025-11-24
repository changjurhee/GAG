# Bang-gu-cha (방구차) - Game Requirements

## 1. Game Overview
**Bang-gu-cha** is a top-down, grid-based action game inspired by the classic arcade game "New Rally-X". The player controls a car to collect flags while avoiding pursuing enemy cars. The player can use a special "Fart" (smoke screen) ability to stun enemies.

## 2. Core Mechanics

### 2.1 Player
- **Movement**: The player moves on a grid system. Movement is continuous until a wall is hit or direction is changed.
- **Speed**: Constant speed (currently set to 3).
- **Fuel**:
  - Starts at 100%.
  - Consumed continuously while moving (0.05 per tick).
  - Game does not currently end when fuel runs out, but movement might be affected (TBD).
- **Abilities**:
  - **Fart (Smoke Screen)**:
    - Triggered by the user.
    - Consumes 10 units of fuel.
    - Creates a smoke cloud at the player's current position.
    - Smoke cloud lasts for 2 seconds (120 frames).

### 2.2 Enemies
- **Spawning**: Two enemies spawn at the corners of the map.
- **Movement**:
  - Slower than the player (speed 2).
  - AI logic: Moves towards the player's position. Chooses the best available direction at intersections.
  - Reverses direction if hitting a dead end.
- **Interaction**:
  - **Collision with Player**: Causes "Game Over" immediately.
  - **Collision with Smoke**: Enemy is stunned for 3 seconds (180 frames) and cannot move or kill the player.

### 2.3 Map & Environment
- **Grid System**: The game world is divided into tiles (40x40 pixels).
- **Generation**:
  - Fixed outer border walls.
  - Randomly generated inner walls (10% chance).
  - Safe zones: No walls generated near the player's start position (top-left) and enemy spawn points.
- **Objectives (Flags)**:
  - Flags (Yellow dots) are randomly placed on the map (5% chance per tile).
  - Collecting a flag grants 100 points.
  - **Victory Condition**: Collect all flags on the map.

### 2.4 Game Loop
- **Start**: 3-second "Get Ready" grace period before enemies start moving.
- **End Conditions**:
  - **Win**: All flags collected.
  - **Loss**: Collision with an active enemy.

## 3. Controls
- **Arrow Keys**: Change movement direction (Up, Down, Left, Right).
- **Spacebar**: Activate "Fart" ability.
- **Enter**: Restart the game after Game Over or Victory.

## 4. User Interface (UI)
- **Score Board**: Displays current score.
- **Fuel Gauge**: Displays remaining fuel percentage.
- **Game Messages**:
  - "GET READY" countdown.
  - "GAME OVER" screen with restart prompt.
  - "YOU WIN" screen with final score.

## 5. Technical Requirements
- **Platform**: Web Browser (HTML5/Canvas).
- **Rendering**: 2D Canvas API.
- **Resolution**: 800x600 pixels.
- **Assets**:
  - `assets/player.png`: Player car sprite.
  - `assets/enemy.png`: Enemy car sprite.
  - Fallback colored rectangles if images fail to load.

## 6. Future Improvements (To Be Implemented)
- [ ] Improved Map Generation (Maze algorithms).
- [ ] Sound Effects (BGM, Fart sound, Crash sound).
- [ ] High Score System.
- [ ] Multiple Levels/Stages.
- [ ] Fuel replenishment items.
