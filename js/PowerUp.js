class PowerUp {
    constructor(x, y, type, assetLoader) {
        // Position
        this.x = x;
        this.y = y;
        
        // Type and properties
        this.type = type;
        this.width = 24;
        this.height = 24;
        
        // State
        this.isActive = true;
        this.isCollected = false;
        
        // Visual effects
        this.animationTimer = 0;
        this.floatOffset = 0;
        this.glowIntensity = 0;
        
        // Physics
        this.velocityY = 0;
        this.gravity = 0.1;
        this.bounceHeight = 1.5;
        
        // Create sprite based on type
        this.createSprite(assetLoader);
        
        // Set type-specific properties
        this.setTypeProperties();
    }
    
    createSprite(assetLoader) {
        const colors = {
            'heart': '#e74c3c',     // Red for health
            'invincibility': '#f39c12', // Orange for invincibility
            'speed': '#3498db',     // Blue for speed
            'doubleJump': '#27ae60' // Green for double jump
        };
        
        const color = colors[this.type] || '#95a5a6';
        const image = assetLoader.createColoredRect(`powerup_${this.type}`, this.width, this.height, color);
        this.sprite = new Sprite(image, this.x, this.y, this.width, this.height);
    }
    
    setTypeProperties() {
        switch (this.type) {
            case 'heart':
                this.description = 'Restore 1 heart';
                this.effect = 'heal';
                this.value = 1;
                break;
            
            case 'invincibility':
                this.description = '5 seconds of invincibility';
                this.effect = 'invincibility';
                this.duration = 300; // 5 seconds at 60fps
                break;
            
            case 'speed':
                this.description = '10 seconds of speed boost';
                this.effect = 'speed';
                this.duration = 600; // 10 seconds at 60fps
                this.multiplier = 1.5;
                break;
            
            case 'doubleJump':
                this.description = 'Double jump for rest of level';
                this.effect = 'doubleJump';
                this.permanent = true;
                break;
            
            default:
                this.description = 'Unknown power-up';
                this.effect = 'none';
                break;
        }
    }
    
    update() {
        if (!this.isActive || this.isCollected) return;
        
        // Update animation timer
        this.animationTimer += 0.1;
        
        // Floating animation
        this.floatOffset = Math.sin(this.animationTimer) * this.bounceHeight;
        
        // Gentle gravity and bounce effect
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        // Simple ground bounce (you could integrate with level collision if needed)
        if (this.y > 400) { // Simple ground level
            this.y = 400;
            this.velocityY = -Math.abs(this.velocityY) * 0.3; // Bounce with damping
        }
        
        // Update glow effect
        this.glowIntensity = (Math.sin(this.animationTimer * 2) + 1) / 2;
        
        // Update sprite position with float offset
        this.sprite.setPosition(this.x, this.y + this.floatOffset);
    }
    
    render(ctx, camera = {x: 0, y: 0}) {
        if (!this.isActive || this.isCollected) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y + this.floatOffset - camera.y;
        
        // Save context for effects
        ctx.save();
        
        // Draw glow effect
        this.drawGlowEffect(ctx, screenX, screenY);
        
        // Draw main sprite
        this.sprite.setPosition(screenX, screenY);
        this.sprite.render(ctx);
        
        // Draw type indicator
        this.drawTypeIndicator(ctx, screenX, screenY);
        
        // Restore context
        ctx.restore();
    }
    
    drawGlowEffect(ctx, screenX, screenY) {
        const glowRadius = 15 + this.glowIntensity * 5;
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        
        // Create radial gradient for glow
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, glowRadius
        );
        
        const colors = {
            'heart': 'rgba(231, 76, 60, ',
            'invincibility': 'rgba(243, 156, 18, ',
            'speed': 'rgba(52, 152, 219, ',
            'doubleJump': 'rgba(39, 174, 96, '
        };
        
        const baseColor = colors[this.type] || 'rgba(149, 165, 166, ';
        
        gradient.addColorStop(0, baseColor + (0.3 * this.glowIntensity) + ')');
        gradient.addColorStop(0.5, baseColor + (0.1 * this.glowIntensity) + ')');
        gradient.addColorStop(1, baseColor + '0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            centerX - glowRadius,
            centerY - glowRadius,
            glowRadius * 2,
            glowRadius * 2
        );
    }
    
    drawTypeIndicator(ctx, screenX, screenY) {
        // Draw icon or letter to indicate power-up type
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let symbol = '';
        switch (this.type) {
            case 'heart':
                symbol = '♥';
                break;
            case 'invincibility':
                symbol = '★';
                break;
            case 'speed':
                symbol = '⚡';
                break;
            case 'doubleJump':
                symbol = '↑↑';
                ctx.font = 'bold 10px Arial';
                break;
            default:
                symbol = '?';
                break;
        }
        
        // Draw text with outline
        ctx.strokeText(symbol, centerX, centerY);
        ctx.fillText(symbol, centerX, centerY);
        
        // Reset text alignment
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
    }
    
    // Check collision with hero
    intersects(heroBounds) {
        if (!this.isActive || this.isCollected) return false;
        
        const powerUpBounds = this.getBounds();
        
        return !(powerUpBounds.right < heroBounds.left ||
                powerUpBounds.left > heroBounds.right ||
                powerUpBounds.bottom < heroBounds.top ||
                powerUpBounds.top > heroBounds.bottom);
    }
    
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y + this.floatOffset,
            bottom: this.y + this.floatOffset + this.height
        };
    }
    
    // Collect the power-up and return its effect
    collect() {
        if (this.isCollected || !this.isActive) return null;
        
        this.isCollected = true;
        this.isActive = false;
        
        console.log(`Power-up collected: ${this.type} - ${this.description}`);
        
        return {
            type: this.type,
            effect: this.effect,
            value: this.value || 0,
            duration: this.duration || 0,
            multiplier: this.multiplier || 1,
            permanent: this.permanent || false,
            description: this.description
        };
    }
    
    // Static method to create specific power-up types
    static createRandomPowerUp(x, y, assetLoader) {
        const types = ['heart', 'invincibility', 'speed', 'doubleJump'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        return new PowerUp(x, y, randomType, assetLoader);
    }
    
    static createHeartPowerUp(x, y, assetLoader) {
        return new PowerUp(x, y, 'heart', assetLoader);
    }
    
    static createInvincibilityPowerUp(x, y, assetLoader) {
        return new PowerUp(x, y, 'invincibility', assetLoader);
    }
    
    static createSpeedPowerUp(x, y, assetLoader) {
        return new PowerUp(x, y, 'speed', assetLoader);
    }
    
    static createDoubleJumpPowerUp(x, y, assetLoader) {
        return new PowerUp(x, y, 'doubleJump', assetLoader);
    }
}