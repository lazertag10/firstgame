class InputHandler {
    constructor() {
        this.keys = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Handle keydown events
        document.addEventListener('keydown', (event) => {
            this.keys[event.key] = true;
            
            // Prevent default behavior for arrow keys to avoid page scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
            }
        });
        
        // Handle keyup events
        document.addEventListener('keyup', (event) => {
            this.keys[event.key] = false;
        });
        
        // Handle window focus loss to prevent stuck keys
        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }
    
    // Check if a key is currently pressed
    isKeyPressed(key) {
        return !!this.keys[key];
    }
    
    // Check for arrow key states
    isLeftPressed() {
        return this.isKeyPressed('ArrowLeft');
    }
    
    isRightPressed() {
        return this.isKeyPressed('ArrowRight');
    }
    
    isUpPressed() {
        return this.isKeyPressed('ArrowUp');
    }
    
    isDownPressed() {
        return this.isKeyPressed('ArrowDown');
    }
}