class Level {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.tiles = [];
        this.tileSize = 32;
        this.width = 0;
        this.height = 0;
        this.mapData = null;
        
        // Camera system
        this.camera = {
            x: 0,
            y: 0,
            width: 800,  // Canvas width
            height: 600, // Canvas height
            target: null // Hero to follow
        };
        
        // Level boundaries
        this.boundaries = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        };
    }
    
    // Load level from data object
    loadFromData(levelData) {
        this.mapData = levelData;
        this.width = levelData.width;
        this.height = levelData.height;
        this.tiles = [];
        
        // Create tiles from map data
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileType = this.getTileType(levelData.data[y * this.width + x]);
                const tile = new Tile(
                    tileType,
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
                this.tiles.push(tile);
            }
        }
        
        // Set level boundaries
        this.boundaries = {
            left: 0,
            right: this.width * this.tileSize,
            top: 0,
            bottom: this.height * this.tileSize
        };
        
        console.log(`Level loaded: ${this.width}x${this.height} tiles`);
    }
    
    // Convert tile ID to tile type
    getTileType(tileId) {
        switch(tileId) {
            case 0: return 'air';
            case 1: return 'solid';
            case 2: return 'passthrough';
            default: return 'air';
        }
    }
    
    // Get tile at world position
    getTileAt(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return null;
        }
        
        const index = tileY * this.width + tileX;
        return this.tiles[index];
    }
    
    // Get all tiles that intersect with a bounding box
    getTilesInArea(bounds) {
        const tiles = [];
        
        const startX = Math.max(0, Math.floor(bounds.left / this.tileSize));
        const endX = Math.min(this.width - 1, Math.floor(bounds.right / this.tileSize));
        const startY = Math.max(0, Math.floor(bounds.top / this.tileSize));
        const endY = Math.min(this.height - 1, Math.floor(bounds.bottom / this.tileSize));
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const index = y * this.width + x;
                if (index < this.tiles.length) {
                    tiles.push(this.tiles[index]);
                }
            }
        }
        
        return tiles;
    }
    
    // Update camera to follow target (hero)
    updateCamera(target, canvasWidth, canvasHeight) {
        if (!target) return;
        
        this.camera.target = target;
        this.camera.width = canvasWidth;
        this.camera.height = canvasHeight;
        
        // Center camera on target
        const targetCameraX = target.x + target.width / 2 - this.camera.width / 2;
        const targetCameraY = target.y + target.height / 2 - this.camera.height / 2;
        
        // Smoothly move camera towards target
        const cameraSpeed = 0.1;
        this.camera.x += (targetCameraX - this.camera.x) * cameraSpeed;
        this.camera.y += (targetCameraY - this.camera.y) * cameraSpeed;
        
        // Constrain camera to level boundaries
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.boundaries.right - this.camera.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.boundaries.bottom - this.camera.height));
    }
    
    // Render the level
    render(ctx) {
        // Get visible tiles based on camera position
        const cameraBounds = {
            left: this.camera.x - this.tileSize,
            right: this.camera.x + this.camera.width + this.tileSize,
            top: this.camera.y - this.tileSize,
            bottom: this.camera.y + this.camera.height + this.tileSize
        };
        
        const visibleTiles = this.getTilesInArea(cameraBounds);
        
        // Render visible tiles
        visibleTiles.forEach(tile => {
            tile.render(ctx, this.camera);
        });
        
        // Draw level boundaries (debug)
        this.renderBoundaries(ctx);
    }
    
    renderBoundaries(ctx) {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Left boundary
        ctx.beginPath();
        ctx.moveTo(-this.camera.x, 0);
        ctx.lineTo(-this.camera.x, ctx.canvas.height);
        ctx.stroke();
        
        // Right boundary
        const rightBoundaryX = this.boundaries.right - this.camera.x;
        ctx.beginPath();
        ctx.moveTo(rightBoundaryX, 0);
        ctx.lineTo(rightBoundaryX, ctx.canvas.height);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    // Check collision between entity and level tiles
    checkCollision(entityBounds, entityVelocityY = 0, isDownPressed = false) {
        const collisionInfo = {
            collidingTiles: [],
            hasCollision: false,
            canLandOnTop: false,
            shouldPassThrough: false
        };
        
        const nearbyTiles = this.getTilesInArea(entityBounds);
        
        nearbyTiles.forEach(tile => {
            if (tile.intersects(entityBounds)) {
                collisionInfo.collidingTiles.push(tile);
                
                if (tile.isSolid) {
                    // Check if can pass through (for passthrough tiles)
                    if (tile.canHeroPassThrough(entityBounds, entityVelocityY, isDownPressed)) {
                        collisionInfo.shouldPassThrough = true;
                    } else {
                        // Only count as collision if we can't pass through
                        collisionInfo.hasCollision = true;
                        
                        // Check if entity is landing on top
                        if (tile.isLandingOnTop(entityBounds, entityVelocityY)) {
                            collisionInfo.canLandOnTop = true;
                        }
                    }
                }
            }
        });
        
        // If all solid tiles can be passed through, don't count as collision
        if (collisionInfo.shouldPassThrough) {
            const solidTiles = collisionInfo.collidingTiles.filter(t => t.isSolid);
            const passthroughTiles = solidTiles.filter(t => 
                t.canHeroPassThrough(entityBounds, entityVelocityY, isDownPressed)
            );
            
            if (solidTiles.length === passthroughTiles.length) {
                collisionInfo.hasCollision = false;
            }
        }
        
        return collisionInfo;
    }
    
    // Get spawn point for hero
    getSpawnPoint() {
        // Find first air tile to spawn hero
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y * this.width + x];
                if (tile && tile.type === 'air') {
                    return {
                        x: tile.x + this.tileSize / 2,
                        y: tile.y
                    };
                }
            }
        }
        
        // Default spawn point
        return { x: 100, y: 100 };
    }
    
    // Create a simple test level
    static createTestLevel1() {
        const width = 25;
        const height = 15;
        const data = new Array(width * height).fill(0); // Start with all air
        
        // Create ground
        for (let x = 0; x < width; x++) {
            data[(height - 1) * width + x] = 1; // Bottom row solid
            data[(height - 2) * width + x] = 1; // Second bottom row solid
        }
        
        // Add some platforms
        for (let x = 5; x < 10; x++) {
            data[(height - 6) * width + x] = 2; // Passthrough platform
        }
        
        for (let x = 15; x < 20; x++) {
            data[(height - 8) * width + x] = 1; // Solid platform
        }
        
        // Add walls
        for (let y = 0; y < height - 2; y++) {
            data[y * width + 0] = 1; // Left wall
            data[y * width + (width - 1)] = 1; // Right wall
        }
        
        return {
            width: width,
            height: height,
            data: data,
            name: "Test Level 1"
        };
    }
    
    static createTestLevel2() {
        const width = 30;
        const height = 20;
        const data = new Array(width * height).fill(0); // Start with all air
        
        // Create ground with gaps
        for (let x = 0; x < 10; x++) {
            data[(height - 1) * width + x] = 1;
        }
        for (let x = 15; x < 25; x++) {
            data[(height - 1) * width + x] = 1;
        }
        
        // Create floating platforms
        for (let x = 8; x < 12; x++) {
            data[(height - 8) * width + x] = 2; // Passthrough
        }
        
        for (let x = 18; x < 22; x++) {
            data[(height - 12) * width + x] = 2; // Passthrough
        }
        
        // Add some solid platforms
        for (let x = 25; x < 30; x++) {
            data[(height - 5) * width + x] = 1; // Solid
        }
        
        return {
            width: width,
            height: height,
            data: data,
            name: "Test Level 2"
        };
    }
}