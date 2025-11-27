# 2D Platformer Game - Development Todo List

## Overview
This todo list breaks down the development of a 2D side-scrolling platformer game into manageable phases for systematic testing and implementation.

---

## Phase 1: Core Foundation & Basic Movement
**Goal**: Get basic game loop running with hero movement

### 1.1 Project Setup
- [x] Set up HTML5 Canvas game structure
- [x] Create basic game loop (update/render cycle)
- [x] Set up input handling system
- [x] Create basic asset loading system
- [x] Implement basic sprite rendering

### 1.2 Hero Basic Movement
- [x] Create Hero class with position and velocity
- [x] Implement left/right movement with arrow keys
- [x] Add basic jump mechanics (up arrow)
- [x] Add gravity system
- [x] Add ground collision detection
- [x] Test: Hero can move left, right, and jump

**Testing Milestone**: Hero moves smoothly in all directions with gravity

---

## Phase 2: World & Collision System
**Goal**: Create a tile-based world with proper collision

### 2.1 Tile System
- [x] Create Tile class with different types (normal, passthrough)
- [x] Implement tilemap loading from external files
- [x] Create tile rendering system
- [x] Add collision detection between hero and tiles
- [x] Implement "down arrow" passthrough mechanics

### 2.2 Level Management
- [x] Create Level class to manage tilemaps
- [x] Implement level loading system
- [x] Create at least 2 test levels
- [x] Add level boundaries and camera system

**Testing Milestone**: Hero moves through a tile-based world with proper collisions ✅

---

## Phase 3: Enemy System
**Goal**: Add enemy AI and hero-enemy interactions

### 3.1 Basic Enemy
- [x] Create Enemy class (enemy_chicken)
- [x] Implement enemy movement (left, right, jump)
- [x] Add basic AI for chasing hero when nearby
- [x] Make enemy move slower than hero
- [x] Add enemy-tile collision detection

### 3.2 Hero-Enemy Interaction
- [x] Implement collision detection between hero and enemy
- [x] Add heart/life system (5 hearts at start)
- [x] Create knockback effect when enemy touches hero
- [x] Add invincibility frames to prevent repeated damage
- [x] Implement game over when all hearts are lost

**Testing Milestone**: Single enemy chases hero and damages on contact ✅

---

## Phase 4: UI & Game States
**Goal**: Add user interface and game management

### 4.1 User Interface
- [x] Create heart display (top right corner)
- [x] Add pause button (top left corner)
- [x] Implement pause functionality
- [x] Create game over screen
- [x] Add level completion detection

### 4.2 Game State Management
- [x] Implement game states (playing, paused, game over)
- [x] Add restart functionality
- [x] Create level progression system
- [x] Add basic menu system

**Testing Milestone**: Complete UI works with proper game state management ✅

---

## Phase 5: Power-ups System
**Goal**: Add power-ups to enhance gameplay

### 5.1 Power-up Infrastructure
- [ ] Create PowerUp base class
- [ ] Implement power-up spawning system
- [ ] Add collision detection between hero and power-ups
- [ ] Create power-up visual effects

### 5.2 Power-up Types
- [ ] **Heart Power-up**: Restore one heart
- [ ] **Invincibility**: 5-second invincibility with visual indicator
- [ ] **Speed Boost**: 10-second speed increase with timer
- [ ] **Double Jump**: Enable double jump for rest of level
- [ ] Add power-up status indicators in UI

**Testing Milestone**: All power-ups work correctly with proper timing and effects

---

## Phase 6: Advanced Features & Polish
**Goal**: Add multiple enemies and polish the game

### 6.1 Multiple Enemies
- [ ] Implement enemy scaling system (1 enemy level 1, 2 enemies level 2, etc.)
- [ ] Add enemy spawning at level start
- [ ] Test enemy AI with multiple enemies
- [ ] Optimize performance with multiple entities

### 6.2 Audio & Polish
- [ ] Add sound effects (jump, damage, power-up collection)
- [ ] Implement background music
- [ ] Add particle effects for power-ups
- [ ] Create smooth transitions between levels
- [ ] Add background scrolling/parallax

**Testing Milestone**: Complete game with multiple levels and enemies

---

## Phase 7: Assets & Final Integration
**Goal**: Integrate all sprites and finalize the game

### 7.1 Asset Integration
- [ ] Create/integrate background sprites
- [ ] Add hero sprite animations (idle, run, jump)
- [ ] Implement enemy_chicken sprite animations
- [ ] Add tile sprites for different tile types
- [ ] Create power-up sprites

### 7.2 Final Polish & Testing
- [ ] Test all levels thoroughly
- [ ] Balance game difficulty
- [ ] Add level select screen
- [ ] Implement high score system
- [ ] Add responsive design for different screen sizes
- [ ] Final bug testing and fixes

**Testing Milestone**: Complete polished game ready for deployment

---

## Asset Requirements Checklist
- [ ] Background sprites
- [ ] Hero sprites (idle, run, jump, damage)
- [ ] Enemy_chicken sprites (idle, run, jump)
- [ ] Tile sprites (normal, passthrough)
- [ ] Power-up sprites (heart, invincibility, speed, double jump)
- [ ] UI elements (hearts, pause button)

---

## Testing Strategy
Each phase should be thoroughly tested before moving to the next:
1. **Unit Testing**: Test individual components in isolation
2. **Integration Testing**: Test how components work together
3. **Gameplay Testing**: Ensure fun and balanced gameplay
4. **Performance Testing**: Maintain smooth 60fps gameplay
5. **Cross-browser Testing**: Ensure compatibility across browsers

---

## Notes
- Prioritize core gameplay mechanics over visual polish initially
- Each phase builds upon the previous one
- Test thoroughly at each milestone before proceeding
- Keep code modular for easier debugging and feature addition