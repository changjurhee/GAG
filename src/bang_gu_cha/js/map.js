class GameMap {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.cols = Math.floor(width / tileSize);
        this.rows = Math.floor(height / tileSize);

        // 0: Empty, 1: Wall
        this.grid = [];
        this.generateMap();
    }

    generateMap() {
        // Simple maze generation or predefined map
        // For now, let's create a border and some random blocks
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                if (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1) {
                    this.grid[r][c] = 1; // Border walls
                } else {
                    // Random walls, but keep center clear for player
                    // Also keep corners clear for spawning
                    if ((r < 3 && c < 3) || (r > this.rows - 4 && c > this.cols - 4) || (r < 3 && c > this.cols - 4) || (r > this.rows - 4 && c < 3)) {
                        this.grid[r][c] = 0;
                    } else if (Math.random() < 0.1 && (r > 5 || c > 5)) {
                        this.grid[r][c] = 1;
                    } else if (Math.random() < 0.05 && (r > 2 || c > 2)) {
                        this.grid[r][c] = 2; // 2 is Flag
                    } else {
                        this.grid[r][c] = 0;
                    }
                }
            }
        }
    }

    draw(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.grid[r][c] === 1) {
                    ctx.fillStyle = '#555'; // Wall
                    ctx.fillRect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                } else if (this.grid[r][c] === 2) {
                    ctx.fillStyle = '#ff0'; // Flag (Yellow)
                    ctx.beginPath();
                    ctx.arc(c * this.tileSize + this.tileSize / 2, r * this.tileSize + this.tileSize / 2, this.tileSize / 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    removeFlag(c, r) {
        if (this.grid[r][c] === 2) {
            this.grid[r][c] = 0;
            return true;
        }
        return false;
    }

    isWall(x, y) {
        const c = Math.floor(x / this.tileSize);
        const r = Math.floor(y / this.tileSize);

        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            return this.grid[r][c] === 1;
        }
        return true; // Out of bounds is a wall
    }

    getTileSize() {
        return this.tileSize;
    }
}
