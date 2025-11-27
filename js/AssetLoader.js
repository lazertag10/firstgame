class AssetLoader {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.loadPromises = [];
    }
    
    // Load an image asset
    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }
    
    // Load multiple images
    loadImages(imageMap) {
        const promises = Object.entries(imageMap).map(([name, src]) => {
            return this.loadImage(name, src);
        });
        this.loadPromises.push(...promises);
        return Promise.all(promises);
    }
    
    // Get a loaded image
    getImage(name) {
        return this.images[name];
    }
    
    // Wait for all assets to load
    waitForAll() {
        return Promise.all(this.loadPromises);
    }
    
    // Create a colored rectangle as a placeholder sprite
    createColoredRect(name, width, height, color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        this.images[name] = canvas;
        return canvas;
    }
}