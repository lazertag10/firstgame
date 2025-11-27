class Game {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game systems
        this.inputHandler = new InputHandler();
        this.assetLoader = new AssetLoader();
        
        // Game objects
        this.hero = null;
        this.level = null;
        this.enemies = [];
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.currentLevelIndex = 0;
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameOver', 'levelComplete'
        this.gameOverTimer = 0;
        this.levelCompleteTimer = 0;
        this.pauseButtonPressed = false;
        this.escapeButtonPressed = false;
        
        // UI state
        this.showingMenu = true;
        this.selectedMenuOption = 0;
        this.menuOptions = ['Start Game', 'Instructions', 'Credits'];
        
        // Level progression
        this.totalLevels = 2;
        this.levelGoals = {
            1: { type: 'survive', time: 3000 }, // Survive 5 seconds
            2: { type: 'survive', time: 6000 }  // Survive 10 seconds
        };
        this.levelTimer = 0;
        
        // Initialize the game
        this.init();
    }
    
    async init() {
        try {
            // Create placeholder assets
            this.createPlaceholderAssets();
            
            // Create and load first level
            this.level = new Level(this.assetLoader);
            const levelData = Level.createTestLevel1();
            this.level.loadFromData(levelData);
            
            // Create hero at spawn point
            const spawnPoint = this.level.getSpawnPoint();
            this.hero = new Hero(spawnPoint.x, spawnPoint.y, this.assetLoader);
            
            // Create enemies for this level
            this.createEnemies();
            
            // Start the game loop
            this.isRunning = true;
            this.gameLoop();
            
            console.log('Game initialized successfully!');
            console.log('Use Enter to start, Arrow keys to navigate menu');
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }
    
    createPlaceholderAssets() {
        // Create colored rectangles as placeholder sprites
        this.assetLoader.createColoredRect('ground', this.canvas.width, 50, '#8B4513');
        this.assetLoader.createColoredRect('sky', this.canvas.width, this.canvas.height, '#87CEEB');
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render everything
        this.render();
        
        // Continue the loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Handle input for all states
        this.handleGlobalInput();
        
        // Handle different game states
        switch (this.gameState) {
            case 'menu':
                this.updateMenu();
                break;
            case 'playing':
                if (this.hero && this.level) {
                    this.updatePlaying();
                }
                break;
            case 'paused':
                // Don't update game objects when paused
                break;
            case 'gameOver':
                this.updateGameOver();
                break;
            case 'levelComplete':
                this.updateLevelComplete();
                break;
        }
    }
    
    handleGlobalInput() {
        // Handle pause toggle (Escape key)
        const escapePressed = this.inputHandler.isKeyPressed('Escape');
        if (escapePressed && !this.escapeButtonPressed) {
            this.escapeButtonPressed = true;
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        } else if (!escapePressed) {
            this.escapeButtonPressed = false;
        }
        
        // Handle pause button (P key)
        const pausePressed = this.inputHandler.isKeyPressed('p') || this.inputHandler.isKeyPressed('P');
        if (pausePressed && !this.pauseButtonPressed) {
            this.pauseButtonPressed = true;
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        } else if (!pausePressed) {
            this.pauseButtonPressed = false;
        }
    }
    
    updateMenu() {
        // Handle menu navigation
        if (this.inputHandler.isKeyPressed('ArrowUp')) {
            if (!this.menuKeyPressed) {
                this.selectedMenuOption = Math.max(0, this.selectedMenuOption - 1);
                this.menuKeyPressed = true;
            }
        } else if (this.inputHandler.isKeyPressed('ArrowDown')) {
            if (!this.menuKeyPressed) {
                this.selectedMenuOption = Math.min(this.menuOptions.length - 1, this.selectedMenuOption + 1);
                this.menuKeyPressed = true;
            }
        } else if (this.inputHandler.isKeyPressed('Enter')) {
            if (!this.menuKeyPressed) {
                this.handleMenuSelection();
                this.menuKeyPressed = true;
            }
        } else {
            this.menuKeyPressed = false;
        }
    }
    
    handleMenuSelection() {
        switch (this.selectedMenuOption) {
            case 0: // Start Game
                this.startGame();
                break;
            case 1: // Instructions
                console.log('Instructions: Use arrow keys to move, avoid enemies!');
                break;
            case 2: // Credits
                console.log('Game by: 2D Platformer Development Team');
                break;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.showingMenu = false;
        this.currentLevelIndex = 0;
        this.levelTimer = 0;
        this.restart();
    }
    
    updatePlaying() {
        // Update hero with level collision
        this.hero.update(this.inputHandler, this.level);
        
        // Update enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.hero, this.level);
        });
        
        // Check hero-enemy collisions
        this.checkEnemyCollisions();
        
        // Check if hero is dead
        if (this.hero.isDead() && this.gameState === 'playing') {
            this.gameState = 'gameOver';
            this.gameOverTimer = 180; // 3 seconds to restart
            console.log('Game Over!');
        }
        
        // Update level timer and check completion
        this.levelTimer++;
        this.checkLevelCompletion();
        
        // Update camera to follow hero
        this.level.updateCamera(this.hero, this.canvas.width, this.canvas.height);
        
        // Keep hero within level bounds
        this.constrainHeroToLevelBounds();
    }
    
    checkLevelCompletion() {
        const currentLevel = this.currentLevelIndex + 1;
        const goal = this.levelGoals[currentLevel];
        
        if (goal && goal.type === 'survive' && this.levelTimer >= goal.time) {
            this.gameState = 'levelComplete';
            this.levelCompleteTimer = 180; // 3 seconds
            console.log(`Level ${currentLevel} Complete!`);
        }
    }
    
    updateLevelComplete() {
        this.levelCompleteTimer--;
        if (this.levelCompleteTimer <= 0) {
            this.nextLevel();
        }
    }
    
    nextLevel() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex >= this.totalLevels) {
            // Game completed!
            this.gameState = 'menu';
            this.showingMenu = true;
            this.selectedMenuOption = 0;
            console.log('Congratulations! You completed all levels!');
        } else {
            // Load next level
            this.switchLevel(this.currentLevelIndex);
            this.gameState = 'playing';
            this.levelTimer = 0;
        }
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            console.log('Game Paused');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            console.log('Game Resumed');
        }
    }
    
    updateGameOver() {
        this.gameOverTimer--;
        if (this.gameOverTimer <= 0) {
            this.restart();
        }
    }
    
    constrainHeroToLevelBounds() {
        if (!this.level) return;
        
        const bounds = this.level.boundaries;
        
        if (this.hero.x < bounds.left) {
            this.hero.x = bounds.left;
            this.hero.velocityX = 0;
        } else if (this.hero.x + this.hero.width > bounds.right) {
            this.hero.x = bounds.right - this.hero.width;
            this.hero.velocityX = 0;
        }
        
        // If hero falls below level, respawn at spawn point
        if (this.hero.y > bounds.bottom + 100) {
            const spawnPoint = this.level.getSpawnPoint();
            this.hero.x = spawnPoint.x;
            this.hero.y = spawnPoint.y;
            this.hero.velocityX = 0;
            this.hero.velocityY = 0;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw different content based on game state
        switch (this.gameState) {
            case 'menu':
                this.drawMenu();
                break;
            
            case 'playing':
            case 'paused':
            case 'levelComplete':
                this.drawGameplay();
                this.drawGameUI();
                
                if (this.gameState === 'paused') {
                    this.drawPauseScreen();
                } else if (this.gameState === 'levelComplete') {
                    this.drawLevelCompleteScreen();
                }
                break;
                
            case 'gameOver':
                this.drawGameplay();
                this.drawGameUI();
                this.drawGameOverScreen();
                break;
        }
    }
    
    drawGameplay() {
        // Draw background
        this.drawBackground();
        
        // Draw level (tiles)
        if (this.level) {
            this.level.render(this.ctx);
        }
        
        // Draw hero
        if (this.hero && this.level) {
            this.hero.render(this.ctx, this.level.camera);
        }
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx, this.level.camera);
        });
    }
    
    drawBackground() {
        // Simple gradient sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B0E0E6');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGround() {
        // Ground rendering is now handled by the level system
        // This method is kept for compatibility but no longer used
    }
    
    drawMenu() {
        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game title
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('2D PLATFORMER', this.canvas.width / 2, 150);
        
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillText('Phase 4: UI & Game States', this.canvas.width / 2, 200);
        
        // Menu options
        this.ctx.font = '24px Arial';
        const startY = 300;
        const spacing = 50;
        
        for (let i = 0; i < this.menuOptions.length; i++) {
            const y = startY + (i * spacing);
            
            // Highlight selected option
            if (i === this.selectedMenuOption) {
                this.ctx.fillStyle = '#f39c12';
                this.ctx.fillText('> ' + this.menuOptions[i] + ' <', this.canvas.width / 2, y);
            } else {
                this.ctx.fillStyle = '#bdc3c7';
                this.ctx.fillText(this.menuOptions[i], this.canvas.width / 2, y);
            }
        }
        
        // Instructions
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillText('Use Arrow Keys to navigate, Enter to select', this.canvas.width / 2, 500);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }
    
    drawGameUI() {
        // Draw pause button (top left)
        this.drawPauseButton();
        
        // Draw health hearts (top right)
        this.drawHealthBar();
        
        // Draw level info and timer
        this.drawLevelInfo();
        
        // Draw controls info
        this.drawControlsInfo();
    }
    
    drawPauseButton() {
        const buttonX = 20;
        const buttonY = 20;
        const buttonSize = 40;
        
        // Button background
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.8)';
        this.ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
        
        // Button border
        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX, buttonY, buttonSize, buttonSize);
        
        // Pause icon (two rectangles)
        this.ctx.fillStyle = '#ecf0f1';
        const iconX = buttonX + 12;
        const iconY = buttonY + 8;
        this.ctx.fillRect(iconX, iconY, 6, 24);
        this.ctx.fillRect(iconX + 10, iconY, 6, 24);
        
        // Button label
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillText('P', buttonX + buttonSize + 10, buttonY + 25);
    }
    
    drawLevelInfo() {
        const currentLevel = this.currentLevelIndex + 1;
        const goal = this.levelGoals[currentLevel];
        
        // Level number
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillText(`Level ${currentLevel}`, 20, 90);
        
        // Progress towards goal
        if (goal && goal.type === 'survive') {
            const remainingTime = Math.max(0, goal.time - this.levelTimer);
            const seconds = Math.ceil(remainingTime / 60);
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText(`Survive: ${seconds}s`, 20, 115);
            
            // Progress bar
            const barWidth = 150;
            const barHeight = 10;
            const progress = Math.min(1, this.levelTimer / goal.time);
            
            // Background
            this.ctx.fillStyle = 'rgba(189, 195, 199, 0.5)';
            this.ctx.fillRect(20, 125, barWidth, barHeight);
            
            // Progress
            this.ctx.fillStyle = '#27ae60';
            this.ctx.fillRect(20, 125, barWidth * progress, barHeight);
        }
    }
    
    drawControlsInfo() {
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillText('Arrow Keys: Move | P/ESC: Pause | R: Restart', 20, this.canvas.height - 20);
    }
    
    // Public methods for game control
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameLoop();
        }
    }
    
    restart() {
        // Reset hero to spawn point and full health
        if (this.hero && this.level) {
            const spawnPoint = this.level.getSpawnPoint();
            this.hero.x = spawnPoint.x;
            this.hero.y = spawnPoint.y;
            this.hero.velocityX = 0;
            this.hero.velocityY = 0;
            this.hero.resetHealth();
        }
        
        // Reset game state
        this.gameState = 'playing';
        this.gameOverTimer = 0;
        this.levelCompleteTimer = 0;
        this.levelTimer = 0;
        
        // Respawn enemies
        this.createEnemies();
        
        console.log(`Level ${this.currentLevelIndex + 1} restarted!`);
    }
    
    returnToMenu() {
        this.gameState = 'menu';
        this.showingMenu = true;
        this.selectedMenuOption = 0;
        this.currentLevelIndex = 0;
        this.levelTimer = 0;
        console.log('Returned to main menu');
    }
    
    // Switch to next level
    switchLevel(levelIndex) {
        if (levelIndex === 1) {
            const levelData = Level.createTestLevel2();
            this.level.loadFromData(levelData);
        } else {
            const levelData = Level.createTestLevel1();
            this.level.loadFromData(levelData);
        }
        
        // Reset hero to new spawn point
        this.restart();
        
        // Create enemies for new level
        this.createEnemies();
    }
    
    // Create enemies for current level
    createEnemies() {
        this.enemies = [];
        
        // Level 1: 1 enemy
        if (this.currentLevelIndex === 0) {
            this.enemies.push(new Enemy(400, 300, this.assetLoader, 'chicken'));
        } else {
            // Level 2: 2 enemies
            this.enemies.push(new Enemy(300, 400, this.assetLoader, 'chicken'));
            this.enemies.push(new Enemy(600, 200, this.assetLoader, 'chicken'));
        }
        
        console.log(`Created ${this.enemies.length} enemies for level ${this.currentLevelIndex + 1}`);
    }
    
    // Check collisions between hero and enemies
    checkEnemyCollisions() {
        if (!this.hero || this.hero.isDead()) return;
        
        this.enemies.forEach(enemy => {
            if (enemy.isActive && enemy.intersects(this.hero.getBounds())) {
                // Hero takes damage from enemy
                const damaged = this.hero.takeDamage(enemy);
                if (damaged) {
                    console.log('Hero hit by enemy!');
                }
            }
        });
    }
    
    // Draw health hearts in top right corner
    drawHealthBar() {
        if (!this.hero) return;
        
        const heartSize = 24;
        const heartSpacing = 30;
        const startX = this.canvas.width - (this.hero.maxHealth * heartSpacing) - 20;
        const startY = 20;
        
        for (let i = 0; i < this.hero.maxHealth; i++) {
            const x = startX + (i * heartSpacing);
            const y = startY;
            
            // Draw heart background
            this.ctx.fillStyle = '#ecf0f1';
            this.drawHeart(x, y, heartSize);
            
            // Draw filled heart if health remaining
            if (i < this.hero.health) {
                this.ctx.fillStyle = '#e74c3c';
                this.drawHeart(x, y, heartSize);
            }
        }
    }
    
    // Draw a heart shape
    drawHeart(x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // Simple heart using text character
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('\u2665', centerX, centerY);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'top';
    }
    
    drawPauseScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Instructions
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press P or ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press R to restart level', this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }
    
    drawLevelCompleteScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Level complete text
        this.ctx.fillStyle = '#27ae60';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Next level info
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '24px Arial';
        const nextTime = Math.ceil(this.levelCompleteTimer / 60);
        
        if (this.currentLevelIndex + 1 >= this.totalLevels) {
            this.ctx.fillText('All levels completed!', this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.fillText(`Returning to menu in ${nextTime}...`, this.canvas.width / 2, this.canvas.height / 2 + 60);
        } else {
            this.ctx.fillText(`Next level in ${nextTime}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Get ready for more enemies!', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }
    
    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over text
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Stats
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '20px Arial';
        const currentLevel = this.currentLevelIndex + 1;
        const survivedTime = Math.floor(this.levelTimer / 60);
        this.ctx.fillText(`Level: ${currentLevel} | Survived: ${survivedTime}s`, this.canvas.width / 2, this.canvas.height / 2);
        
        // Restart countdown
        this.ctx.font = '24px Arial';
        const restartTime = Math.ceil(this.gameOverTimer / 60);
        this.ctx.fillText(`Restarting in ${restartTime}...`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        
        // Options
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press R to restart immediately', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText('Press ESC to return to menu', this.canvas.width / 2, this.canvas.height / 2 + 110);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    // Add level switching and game controls
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') {
            if (game.gameState === 'playing' || game.gameState === 'paused') {
                game.currentLevelIndex = 0;
                game.switchLevel(0);
            }
        } else if (e.key === '2') {
            if (game.gameState === 'playing' || game.gameState === 'paused') {
                game.currentLevelIndex = 1;
                game.switchLevel(1);
            }
        } else if (e.key === 'r' || e.key === 'R') {
            if (game.gameState === 'gameOver' || game.gameState === 'playing' || game.gameState === 'paused') {
                game.restart();
            }
        } else if (e.key === 'Escape') {
            if (game.gameState === 'gameOver') {
                game.returnToMenu();
            }
        }
    });
    
    console.log('2D Platformer Game - Phase 4 Loaded!');
    console.log('=== CONTROLS ===');
    console.log('Menu: Arrow keys to navigate, Enter to select');
    console.log('Game: Arrow keys to move and jump');
    console.log('P or ESC: Pause/Resume game');
    console.log('R: Restart current level');
    console.log('1/2: Switch levels (debug)');
    console.log('=== GOAL ===');
    console.log('Survive the timer to complete each level!');
    console.log('Avoid enemies or they will damage you!');
});