class Hero {
    constructor(x, y, assetLoader) {
        // Position and velocity
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Physics constants
        this.speed = 3;
        this.jumpPower = -13;
        this.gravity = 0.3;
        this.friction = 0.8;
        this.maxFallSpeed = 10;
        
        // Size
        this.width = 32;
        this.height = 48;
        
        // State
        this.isOnGround = false;
        this.canJump = true;
        
        // Create sprite (using colored rectangle as placeholder)
        const heroImage = assetLoader.createColoredRect('hero', this.width, this.height, '#e74c3c');
        this.sprite = new Sprite(heroImage, this.x, this.y, this.width, this.height);
    }
    
    update(inputHandler, level) {
        // Handle horizontal movement
        this.handleHorizontalMovement(inputHandler);
        
        // Handle jumping
        this.handleJumping(inputHandler);
        
        // Apply gravity
        this.applyGravity();
        
        // Apply friction to horizontal movement
        this.velocityX *= this.friction;
        
        // Limit fall speed
        if (this.velocityY > this.maxFallSpeed) {
            this.velocityY = this.maxFallSpeed;
        }
        
        // Handle tile collisions
        this.handleTileCollisions(inputHandler, level);
        
        // Update sprite position
        this.sprite.setPosition(this.x, this.y);
    }
    
    handleHorizontalMovement(inputHandler) {
        if (inputHandler.isLeftPressed()) {
            this.velocityX = -this.speed;
        } else if (inputHandler.isRightPressed()) {
            this.velocityX = this.speed;
        }
    }
    
    handleJumping(inputHandler) {
        if (inputHandler.isUpPressed() && this.isOnGround && this.canJump) {
            this.velocityY = this.jumpPower;
            this.isOnGround = false;
            this.canJump = false;
        }
        
        // Reset jump ability when key is released
        if (!inputHandler.isUpPressed()) {
            this.canJump = true;
        }
    }
    
    applyGravity() {
        this.velocityY += this.gravity;
    }
    
    handleGroundCollision(canvasHeight) {
        // This method is replaced by handleTileCollisions
        // Kept for compatibility but no longer used
    }
    
    handleTileCollisions(inputHandler, level) {
        if (!level) return;
        
        const isDownPressed = inputHandler.isDownPressed();
        
        // Special case: Check if standing on passthrough platform and want to drop
        if (this.isOnGround && isDownPressed) {
            // Check all tiles the hero is standing on (hero might span multiple tiles)
            const standingBounds = {
                left: this.x,
                right: this.x + this.width,
                top: this.y + this.height - 2,  // Just below hero's feet
                bottom: this.y + this.height + 8  // A bit below to catch the platform
            };
            
            const tilesBelow = level.getTilesInArea(standingBounds);
            const hasPassthroughBelow = tilesBelow.some(tile => {
                return tile.canPassThrough && 
                       tile.intersects(standingBounds) &&
                       // Make sure we're actually standing on top of this tile
                       this.y + this.height >= tile.y - 5 &&
                       this.y + this.height <= tile.y + 10;
            });
            
            if (hasPassthroughBelow) {
                this.isOnGround = false;
                this.velocityY = 4; // Force downward movement through platform
                this.y += 2; // Move down slightly to ensure we pass through
                return; // Skip normal collision this frame
            }
        }
        
        // Handle horizontal movement with collision
        this.x += this.velocityX;
        let horizontalCollision = level.checkCollision(this.getBounds(), this.velocityY, isDownPressed);
        
        if (horizontalCollision.hasCollision) {
            // Undo horizontal movement and stop horizontal velocity
            this.x -= this.velocityX;
            this.velocityX = 0;
        }
        
        // Handle vertical movement with collision
        this.y += this.velocityY;
        let verticalCollision = level.checkCollision(this.getBounds(), this.velocityY, isDownPressed);
        
        if (verticalCollision.hasCollision && !verticalCollision.shouldPassThrough) {
            if (this.velocityY > 0) {
                // Landing on top of a solid tile
                // But first check if ALL colliding tiles are passthrough and down is pressed
                const allTilesPassthrough = verticalCollision.collidingTiles.every(tile => 
                    tile.canPassThrough || !tile.isSolid
                );
                
                if (allTilesPassthrough && isDownPressed) {
                    // Allow falling through all passthrough tiles
                    this.isOnGround = false;
                    return;
                }
                
                this.y -= this.velocityY;
                this.velocityY = 0;
                this.isOnGround = true;
                
                // Snap to top of highest solid tile
                const solidTiles = verticalCollision.collidingTiles.filter(tile => 
                    tile.isSolid && !tile.canPassThrough &&
                    this.y + this.height > tile.y &&
                    this.y + this.height < tile.y + tile.height &&
                    this.x + this.width > tile.x &&
                    this.x < tile.x + tile.width
                );
                if (solidTiles.length > 0) {
                    const highestTile = solidTiles.reduce((highest, tile) => 
                        tile.y < highest.y ? tile : highest
                    );
                    this.y = highestTile.y - this.height;
                }
            } else {
                // Hit ceiling
                this.y -= this.velocityY;
                this.velocityY = 0;
            }
        } else {
            this.isOnGround = false;
        }
    }
    
    render(ctx, camera = {x: 0, y: 0}) {
        // Save context state
        ctx.save();
        
        // Apply camera offset
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Update sprite position for camera
        this.sprite.setPosition(screenX, screenY);
        this.sprite.render(ctx);
        
        // Debug info (optional)
        this.renderDebugInfo(ctx, screenX, screenY);
        
        // Restore context state
        ctx.restore();
    }
    
    renderDebugInfo(ctx, screenX, screenY) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.fillText(`Pos: (${Math.round(this.x)}, ${Math.round(this.y)})`, screenX, screenY - 10);
        ctx.fillText(`Vel: (${Math.round(this.velocityX)}, ${Math.round(this.velocityY)})`, screenX, screenY - 25);
        ctx.fillText(`Ground: ${this.isOnGround}`, screenX, screenY - 40);
    }
    
    // Get bounding box for collision detection
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height,
            width: this.width,
            height: this.height
        };
    }
}