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
        
        // Health system
        this.maxHealth = 5;
        this.health = this.maxHealth;
        this.isInvincible = false;
        this.invincibilityDuration = 120; // 2 seconds at 60fps
        this.invincibilityTimer = 0;
        
        // Damage effects
        this.knockbackForce = 8;
        this.knockbackDuration = 15;
        this.knockbackTimer = 0;
        this.knockbackDirection = 0;
        
        // Power-up system
        this.activePowerUps = [];
        this.baseSpeed = this.speed; // Store original speed
        this.hasDoubleJump = false;
        this.jumpCount = 0;
        this.maxJumps = 1;
        this.speedMultiplier = 1;
        this.powerUpInvincibility = false;
        this.powerUpInvincibilityTimer = 0;
        
        // Create sprite (using colored rectangle as placeholder)
        const heroImage = assetLoader.createColoredRect('hero', this.width, this.height, '#e74c3c');
        this.sprite = new Sprite(heroImage, this.x, this.y, this.width, this.height);
    }
    
    update(inputHandler, level) {
        // Update power-ups
        this.updatePowerUps();
        
        // Update invincibility timer (damage-based)
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer--;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        // Update power-up invincibility timer
        if (this.powerUpInvincibilityTimer > 0) {
            this.powerUpInvincibilityTimer--;
            if (this.powerUpInvincibilityTimer <= 0) {
                this.powerUpInvincibility = false;
            }
        }
        
        // Update knockback timer and apply knockback
        if (this.knockbackTimer > 0) {
            this.knockbackTimer--;
            this.velocityX = this.knockbackDirection * this.knockbackForce * (this.knockbackTimer / this.knockbackDuration);
        } else {
            // Handle horizontal movement (only if not in knockback)
            this.handleHorizontalMovement(inputHandler);
        }
        
        // Handle jumping
        this.handleJumping(inputHandler);
        
        // Apply gravity
        this.applyGravity();
        
        // Apply friction to horizontal movement (less friction during knockback)
        if (this.knockbackTimer <= 0) {
            this.velocityX *= this.friction;
        }
        
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
        const currentSpeed = this.baseSpeed * this.speedMultiplier;
        
        if (inputHandler.isLeftPressed()) {
            this.velocityX = -currentSpeed;
        } else if (inputHandler.isRightPressed()) {
            this.velocityX = currentSpeed;
        }
    }
    
    handleJumping(inputHandler) {
        // Reset jump count when on ground
        if (this.isOnGround) {
            this.jumpCount = 0;
        }
        
        // Handle jumping (including double jump)
        if (inputHandler.isUpPressed() && this.canJump) {
            const maxJumps = this.hasDoubleJump ? 2 : 1;
            
            if (this.jumpCount < maxJumps) {
                this.velocityY = this.jumpPower;
                this.jumpCount++;
                this.canJump = false;
                
                if (this.jumpCount > 1) {
                    console.log('Double jump!');
                }
            }
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
        
        // Apply invincibility flashing effect
        if (this.isInvincible || this.powerUpInvincibility) {
            ctx.globalAlpha = Math.sin((this.invincibilityTimer + this.powerUpInvincibilityTimer) * 0.5) * 0.5 + 0.5;
        }
        
        // Apply speed boost visual effect
        if (this.speedMultiplier > 1) {
            // Add a subtle glow effect for speed boost
            const glowSize = 4;
            ctx.shadowColor = '#3498db';
            ctx.shadowBlur = glowSize;
        }
        
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
    
    // Take damage from enemy
    takeDamage(enemy) {
        if (this.isInvincible || this.powerUpInvincibility || this.health <= 0) return false;
        
        this.health--;
        this.isInvincible = true;
        this.invincibilityTimer = this.invincibilityDuration;
        
        // Apply knockback
        this.knockbackDirection = enemy.getCenterX() < this.getCenterX() ? 1 : -1;
        this.knockbackTimer = this.knockbackDuration;
        this.velocityY = Math.min(this.velocityY, -5); // Small upward boost
        
        console.log(`Hero took damage! Health: ${this.health}`);
        
        return true; // Damage was applied
    }
    
    // Check if hero is dead
    isDead() {
        return this.health <= 0;
    }
    
    // Heal hero (for power-ups later)
    heal(amount = 1) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        console.log(`Hero healed! Health: ${this.health}`);
    }
    
    // Get center position for calculations
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
    
    // Reset hero to full health (for level restart)
    resetHealth() {
        this.health = this.maxHealth;
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.knockbackTimer = 0;
        
        // Reset power-ups (except permanent ones like double jump in same level)
        this.clearTemporaryPowerUps();
    }
    
    // Power-up system methods
    updatePowerUps() {
        // Update active power-up timers
        this.activePowerUps = this.activePowerUps.filter(powerUp => {
            if (powerUp.permanent) {
                return true; // Keep permanent power-ups
            }
            
            powerUp.timer--;
            if (powerUp.timer <= 0) {
                this.removePowerUpEffect(powerUp);
                return false; // Remove expired power-up
            }
            
            return true; // Keep active power-up
        });
    }
    
    applyPowerUp(powerUpEffect) {
        switch (powerUpEffect.effect) {
            case 'heal':
                this.heal(powerUpEffect.value);
                break;
                
            case 'invincibility':
                this.powerUpInvincibility = true;
                this.powerUpInvincibilityTimer = powerUpEffect.duration;
                this.activePowerUps.push({
                    type: 'invincibility',
                    timer: powerUpEffect.duration,
                    permanent: false
                });
                console.log(`Invincibility activated for ${Math.ceil(powerUpEffect.duration/60)} seconds!`);
                break;
                
            case 'speed':
                this.speedMultiplier = powerUpEffect.multiplier;
                this.activePowerUps.push({
                    type: 'speed',
                    timer: powerUpEffect.duration,
                    permanent: false,
                    multiplier: powerUpEffect.multiplier
                });
                console.log(`Speed boost activated for ${Math.ceil(powerUpEffect.duration/60)} seconds!`);
                break;
                
            case 'doubleJump':
                this.hasDoubleJump = true;
                this.maxJumps = 2;
                this.activePowerUps.push({
                    type: 'doubleJump',
                    permanent: true
                });
                console.log('Double jump unlocked for this level!');
                break;
                
            default:
                console.log('Unknown power-up effect:', powerUpEffect.effect);
                break;
        }
    }
    
    removePowerUpEffect(powerUp) {
        switch (powerUp.type) {
            case 'speed':
                this.speedMultiplier = 1;
                console.log('Speed boost ended.');
                break;
                
            case 'invincibility':
                this.powerUpInvincibility = false;
                this.powerUpInvincibilityTimer = 0;
                console.log('Invincibility ended.');
                break;
                
            // Double jump is permanent for the level, so no removal needed
        }
    }
    
    clearTemporaryPowerUps() {
        // Remove all temporary power-ups but keep permanent ones like double jump
        const permanentPowerUps = this.activePowerUps.filter(p => p.permanent);
        
        // Remove effects of temporary power-ups
        this.activePowerUps.forEach(powerUp => {
            if (!powerUp.permanent) {
                this.removePowerUpEffect(powerUp);
            }
        });
        
        this.activePowerUps = permanentPowerUps;
    }
    
    clearAllPowerUps() {
        // Clear all power-ups including permanent ones (for new levels)
        this.activePowerUps.forEach(powerUp => {
            this.removePowerUpEffect(powerUp);
        });
        
        this.activePowerUps = [];
        this.hasDoubleJump = false;
        this.maxJumps = 1;
        this.speedMultiplier = 1;
        this.powerUpInvincibility = false;
        this.powerUpInvincibilityTimer = 0;
    }
    
    getActivePowerUps() {
        return this.activePowerUps;
    }
}