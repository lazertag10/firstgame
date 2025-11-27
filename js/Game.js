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
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.currentLevelIndex = 0;
        
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
        
        // Update hero with level collision
        this.hero.update(this.inputHandler, this.level);
        
        // Update camera to follow hero
        this.level.updateCamera(this.hero, this.canvas.width, this.canvas.height);
        
        // Keep hero within level bounds
        this.constrainHeroToLevelBounds();
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
        
        // Draw UI
        this.drawUI();
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
        this.ctx.fillText('2D Platformer - Phase 2', 20, 40);
        
        // Instructions
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Arrow Keys: Move and Jump | Down+Jump: Drop through platforms', 20, this.canvas.height - 40);
        
        // Level info
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#7f8c8d';
        if (this.level && this.level.mapData) {
            this.ctx.fillText(`Level: ${this.level.mapData.name || 'Test Level'}`, this.canvas.width - 200, 25);
        }
        this.ctx.fillText('Phase 2: World & Collision', this.canvas.width - 200, 45);
        
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
        // Reset hero to spawn point
        if (this.hero && this.level) {
            const spawnPoint = this.level.getSpawnPoint();
            this.hero.x = spawnPoint.x;
            this.hero.y = spawnPoint.y;
            this.hero.velocityX = 0;
            this.hero.velocityY = 0;
        }
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
        }
    });
    
    console.log('2D Platformer Game - Phase 2 Loaded!');
    console.log('Use arrow keys to move and jump!');
    console.log('Hold Down + Jump to drop through green platforms!');
    console.log('Press 1 or 2 to switch between test levels!');
});