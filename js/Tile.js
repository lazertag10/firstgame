class Tile {
    constructor(type, x, y, width = 32, height = 32) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Tile properties based on type
        this.setTileProperties();
    }
    
    setTileProperties() {
        switch(this.type) {
            case 'solid':
                this.isSolid = true;
                this.canPassThrough = false;
                this.color = '#8B4513'; // Brown for solid tiles
                break;
            case 'passthrough':
                this.isSolid = true; // Can be stood on from above
                this.canPassThrough = true; // Can pass through from below/sides
                this.color = '#32CD32'; // Green for passthrough platforms
                break;
            case 'air':
                this.isSolid = false;
                this.canPassThrough = false;
                this.color = 'transparent';
                break;
            default:
                this.isSolid = false;
                this.canPassThrough = false;
                this.color = 'transparent';
        }
    }
    
    render(ctx, camera = {x: 0, y: 0}) {
        if (this.type === 'air') return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Only render if tile is visible on screen
        if (screenX + this.width < 0 || screenX > ctx.canvas.width || 
            screenY + this.height < 0 || screenY > ctx.canvas.height) {
            return;
        }
        
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);
        
        // Add border for better visibility
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, this.width, this.height);
        
        // Add visual indicator for passthrough tiles
        if (this.type === 'passthrough') {
            ctx.fillStyle = '#FFFF00';
            ctx.font = '12px Arial';
            ctx.fillText('P', screenX + 5, screenY + 20);
        }
    }
    
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
    
    // Check if a point is within this tile
    containsPoint(x, y) {
        return x >= this.x && x < this.x + this.width &&
               y >= this.y && y < this.y + this.height;
    }
    
    // Check collision with another rectangle
    intersects(bounds) {
        return !(bounds.right <= this.x || 
                 bounds.left >= this.x + this.width ||
                 bounds.bottom <= this.y || 
                 bounds.top >= this.y + this.height);
    }
    
    // Check if hero is landing on this tile from above
    isLandingOnTop(heroBounds, heroVelocityY) {
        return this.isSolid && 
               heroVelocityY > 0 && // Hero is falling
               heroBounds.bottom <= this.y + 5 && // Hero's bottom is near tile top
               heroBounds.bottom > this.y &&
               heroBounds.right > this.x && 
               heroBounds.left < this.x + this.width;
    }
    
    // Check if hero can pass through this tile (for passthrough mechanics)
    canHeroPassThrough(heroBounds, heroVelocityY, isDownPressed) {
        if (!this.canPassThrough) return false;
        
        // Allow passing through passthrough platforms when:
        // 1. Hero is moving downward and down arrow is pressed, or
        // 2. Hero is approaching from below or sides
        return isDownPressed && heroVelocityY >= 0 || 
               heroBounds.top > this.y + this.height / 2;
    }
}