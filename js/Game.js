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
        this.gameState = 'playing'; // 'playing', 'paused', 'gameOver'
        this.gameOverTimer = 0;
        
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
        if (!this.hero || !this.level) return;
        
        // Handle different game states
        switch (this.gameState) {
            case 'playing':
                this.updatePlaying();
                break;
            case 'gameOver':
                this.updateGameOver();
                break;
            case 'paused':
                // Don't update anything when paused
                break;
        }
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
        
        // Update camera to follow hero
        this.level.updateCamera(this.hero, this.canvas.width, this.canvas.height);
        
        // Keep hero within level bounds
        this.constrainHeroToLevelBounds();
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
        
        // Draw UI
        this.drawUI();
        
        // Draw game over screen if needed
        if (this.gameState === 'gameOver') {
            this.drawGameOverScreen();
        }
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
    
    drawUI() {
        // Game title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('2D Platformer - Phase 3', 20, 40);
        
        // Draw health hearts in top right
        this.drawHealthBar();
        
        // Instructions
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Arrow Keys: Move and Jump | Avoid Enemies!', 20, this.canvas.height - 40);
        
        // Level info
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#7f8c8d';
        if (this.level && this.level.mapData) {
            this.ctx.fillText(`Level: ${this.level.mapData.name || 'Test Level'}`, this.canvas.width - 200, 25);
        }
        this.ctx.fillText('Phase 3: Enemy System', this.canvas.width - 200, 45);
        
        // Enemy count
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, this.canvas.width - 200, 65);
        
        // Camera info (debug)
        if (this.level && this.level.camera) {
            this.ctx.fillText(`Camera: (${Math.round(this.level.camera.x)}, ${Math.round(this.level.camera.y)})`, 20, this.canvas.height - 20);
        }
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
        
        // Respawn enemies
        this.createEnemies();
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
    
    // Draw game over screen
    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over text
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // Restart countdown
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        const restartTime = Math.ceil(this.gameOverTimer / 60);
        this.ctx.fillText(`Restarting in ${restartTime}...`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Press R to restart immediately
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press R to restart immediately', this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    // Add level switching for testing
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') {
            game.switchLevel(0);
        } else if (e.key === '2') {
            game.switchLevel(1);
        } else if (e.key === 'r' || e.key === 'R') {
            game.restart();
        }
    });
    
    console.log('2D Platformer Game - Phase 3 Loaded!');
    console.log('Use arrow keys to move and jump!');
    console.log('Avoid the enemies or they will damage you!');
    console.log('Press 1 or 2 to switch between test levels!');
    console.log('Press R to restart the game!');
});