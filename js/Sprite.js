class Sprite {
    constructor(image, x = 0, y = 0, width = null, height = null) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width || (image ? image.width : 32);
        this.height = height || (image ? image.height : 32);
        this.visible = true;
    }
    
    // Render the sprite to a canvas context
    render(ctx, x = this.x, y = this.y) {
        if (!this.visible || !this.image) return;
        
        ctx.drawImage(
            this.image,
            x,
            y,
            this.width,
            this.height
        );
    }
    
    // Set position
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    // Set size
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    // Get bounding box for collision detection
    getBounds(x = this.x, y = this.y) {
        return {
            left: x,
            right: x + this.width,
            top: y,
            bottom: y + this.height,
            width: this.width,
            height: this.height
        };
    }
    
    // Check if this sprite overlaps with another sprite
    overlaps(otherSprite, x = this.x, y = this.y) {
        const bounds1 = this.getBounds(x, y);
        const bounds2 = otherSprite.getBounds();
        
        return !(bounds1.right <= bounds2.left ||
                bounds1.left >= bounds2.right ||
                bounds1.bottom <= bounds2.top ||
                bounds1.top >= bounds2.bottom);
    }
}