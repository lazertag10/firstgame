class Enemy {
    constructor(x, y, assetLoader, type = 'chicken') {
        // Position and velocity
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Enemy type
        this.type = type;
        
        // Physics constants (slower than hero)
        this.speed = 1.5; // Slower than hero's 3
        this.jumpPower = -10; // Less than hero's -13
        this.gravity = 0.3;
        this.friction = 0.9;
        this.maxFallSpeed = 10;
        
        // Size
        this.width = 28;
        this.height = 32;
        
        // State
        this.isOnGround = false;
        this.direction = 1; // 1 = right, -1 = left
        this.isActive = true;
        
        // AI properties
        this.chaseDistance = 150;
        this.jumpCooldown = 0;
        this.maxJumpCooldown = 60; // Frames between jumps
        this.lastKnownHeroX = null;
        
        // Behavior state
        this.aiState = 'patrol'; // 'patrol', 'chase', 'jump'
        this.patrolStartX = x;
        this.patrolRange = 100;
        
        // Create sprite (using colored rectangle as placeholder)
        const enemyColor = this.type === 'chicken' ? '#ff9800' : '#f44336';
        const enemyImage = assetLoader.createColoredRect(`enemy_${type}`, this.width, this.height, enemyColor);
        this.sprite = new Sprite(enemyImage, this.x, this.y, this.width, this.height);
    }
    
    update(hero, level) {
        if (!this.isActive) return;
        
        // Update jump cooldown
        if (this.jumpCooldown > 0) {
            this.jumpCooldown--;
        }
        
        // AI behavior based on hero position
        this.updateAI(hero);
        
        // Apply gravity
        this.applyGravity();
        
        // Apply friction to horizontal movement
        this.velocityX *= this.friction;
        
        // Limit fall speed
        if (this.velocityY > this.maxFallSpeed) {
            this.velocityY = this.maxFallSpeed;
        }
        
        // Handle tile collisions
        this.handleTileCollisions(level);
        
        // Update sprite position
        this.sprite.setPosition(this.x, this.y);
    }
    
    updateAI(hero) {
        if (!hero) return;
        
        const distanceToHero = Math.abs(hero.x - this.x);
        const heroDirection = hero.x < this.x ? -1 : 1;
        
        // Switch AI states based on distance to hero
        if (distanceToHero <= this.chaseDistance) {
            this.aiState = 'chase';
            this.lastKnownHeroX = hero.x;
        } else {
            this.aiState = 'patrol';
        }
        
        // Execute behavior based on current state
        switch (this.aiState) {
            case 'chase':
                this.chaseHero(hero, heroDirection);
                break;
            case 'patrol':
                this.patrol();
                break;
        }
    }
    
    chaseHero(hero, heroDirection) {
        // Move towards hero
        this.direction = heroDirection;
        this.velocityX = this.speed * this.direction;
        
        // Try to jump if hero is above and we're on ground
        if (this.isOnGround && hero.y < this.y - 20 && this.jumpCooldown <= 0) {
            this.jump();
        }
        
        // Jump over obstacles (simple obstacle detection)
        if (this.isOnGround && this.jumpCooldown <= 0) {
            const futureX = this.x + (this.velocityX * 10);
            if (this.shouldJumpOverObstacle(futureX)) {
                this.jump();
            }
        }
    }
    
    patrol() {
        // Simple patrol behavior - move back and forth in a range
        const distanceFromStart = Math.abs(this.x - this.patrolStartX);
        
        if (distanceFromStart >= this.patrolRange) {
            // Turn around when reaching patrol range
            this.direction *= -1;
        }
        
        this.velocityX = this.speed * this.direction * 0.5; // Slower patrol speed
    }
    
    jump() {
        if (this.isOnGround && this.jumpCooldown <= 0) {
            this.velocityY = this.jumpPower;
            this.isOnGround = false;
            this.jumpCooldown = this.maxJumpCooldown;
        }
    }
    
    shouldJumpOverObstacle(futureX) {
        // Simple obstacle detection - could be enhanced with level checking
        // For now, randomly jump occasionally to add some variation
        return Math.random() < 0.02; // 2% chance per frame when conditions are met
    }
    
    applyGravity() {
        this.velocityY += this.gravity;
    }
    
    handleTileCollisions(level) {
        if (!level) return;
        
        // Handle horizontal movement with collision
        this.x += this.velocityX;
        let horizontalCollision = level.checkCollision(this.getBounds(), this.velocityY, false);
        
        if (horizontalCollision.hasCollision) {
            // Undo horizontal movement and turn around
            this.x -= this.velocityX;
            this.velocityX = 0;
            this.direction *= -1; // Turn around when hitting wall
        }
        
        // Handle vertical movement with collision
        this.y += this.velocityY;
        let verticalCollision = level.checkCollision(this.getBounds(), this.velocityY, false);
        
        if (verticalCollision.hasCollision && !verticalCollision.shouldPassThrough) {
            if (this.velocityY > 0) {
                // Landing on ground
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
        if (!this.isActive) return;
        
        // Save context state
        ctx.save();
        
        // Apply camera offset
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Update sprite position for camera
        this.sprite.setPosition(screenX, screenY);
        
        // Flip sprite based on direction
        if (this.direction === -1) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-screenX * 2 - this.width, 0);
            this.sprite.render(ctx);
            ctx.restore();
        } else {
            this.sprite.render(ctx);
        }
        
        // Debug info (optional)
        this.renderDebugInfo(ctx, screenX, screenY);
        
        // Restore context state
        ctx.restore();
    }
    
    renderDebugInfo(ctx, screenX, screenY) {
        ctx.fillStyle = '#ff5722';
        ctx.font = '10px Arial';
        ctx.fillText(`${this.type} - ${this.aiState}`, screenX, screenY - 5);
        ctx.fillText(`Dir: ${this.direction > 0 ? 'R' : 'L'}`, screenX, screenY - 15);
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
    
    // Check collision with another entity (like hero)
    intersects(otherBounds) {
        return !(otherBounds.right <= this.x || 
                 otherBounds.left >= this.x + this.width ||
                 otherBounds.bottom <= this.y || 
                 otherBounds.top >= this.y + this.height);
    }
    
    // Get center position
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
}