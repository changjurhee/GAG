class Enemy {
    constructor(map, player, x, y) {
        this.map = map;
        this.player = player;
        this.x = x;
        this.y = y;
        this.size = map.getTileSize() - 4;
        this.speed = 2; // Slower than player
        this.vx = 0;
        this.vy = 0;
        this.stunned = 0;

        this.image = new Image();
        this.image.src = 'assets/enemy.png';
    }

    update() {
        if (this.stunned > 0) {
            this.stunned--;
            return;
        }

        // Simple AI: Move towards player
        // In a real grid game, we'd use A* or BFS, but for now, let's use a simple direction choice at intersections

        if (this.canTurn()) {
            this.chooseDirection();
        }

        const nextX = this.x + this.vx * this.speed;
        const nextY = this.y + this.vy * this.speed;

        if (!this.checkWallCollision(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // Hit a wall, pick new random direction
            this.vx = 0;
            this.vy = 0;
            this.chooseDirection(true);
        }

        // Check collision with farts
        this.player.farts.forEach(fart => {
            const dx = (this.x + this.size / 2) - (fart.x + this.map.getTileSize() / 2);
            const dy = (this.y + this.size / 2) - (fart.y + this.map.getTileSize() / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.map.getTileSize()) {
                this.stunned = 180; // 3 seconds stun
            }
        });
    }

    draw(ctx) {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Rotate based on direction
        // Assume sprite faces RIGHT
        let angle = 0;
        if (this.vx === 1) angle = 0;
        else if (this.vx === -1) angle = Math.PI;
        else if (this.vy === 1) angle = Math.PI / 2;
        else if (this.vy === -1) angle = -Math.PI / 2;

        // Default to facing Down if stationary (enemies usually come from top/sides)
        if (this.vx === 0 && this.vy === 0) angle = Math.PI / 2;

        ctx.rotate(angle);

        if (this.image.complete) {
            if (this.stunned > 0) ctx.globalAlpha = 0.5;
            ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
            ctx.globalAlpha = 1.0;
        } else {
            // Fallback
            ctx.fillStyle = this.stunned > 0 ? '#95a5a6' : '#c0392b'; // Red or Grey
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }

    chooseDirection(forceRandom = false) {
        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        // Filter out blocked directions and reverse direction (to prevent jitter)
        const validDirs = dirs.filter(d => {
            // Don't go back immediately unless stuck
            if (!forceRandom && d.dx === -this.vx && d.dy === -this.vy) return false;

            return !this.map.isWall(this.x + d.dx * this.map.getTileSize(), this.y + d.dy * this.map.getTileSize());
        });

        if (validDirs.length === 0) {
            // Dead end, go back
            const backDir = dirs.find(d => d.dx === -this.vx && d.dy === -this.vy);
            if (backDir) {
                this.vx = backDir.dx;
                this.vy = backDir.dy;
            }
            return;
        }

        let bestDir = validDirs[0];

        if (!forceRandom) {
            // Pick direction that minimizes distance to player
            let minDst = Infinity;

            validDirs.forEach(d => {
                const nextX = this.x + d.dx * this.map.getTileSize();
                const nextY = this.y + d.dy * this.map.getTileSize();
                const dst = Math.abs(nextX - this.player.x) + Math.abs(nextY - this.player.y);

                if (dst < minDst) {
                    minDst = dst;
                    bestDir = d;
                }
            });
        } else {
            bestDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        }

        this.vx = bestDir.dx;
        this.vy = bestDir.dy;
    }

    canTurn() {
        const tileSize = this.map.getTileSize();
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const tileX = Math.floor(centerX / tileSize) * tileSize + tileSize / 2;
        const tileY = Math.floor(centerY / tileSize) * tileSize + tileSize / 2;

        return Math.abs(centerX - tileX) < this.speed && Math.abs(centerY - tileY) < this.speed;
    }

    checkWallCollision(x, y) {
        const margin = 2;
        return this.map.isWall(x + margin, y + margin) ||
            this.map.isWall(x + this.size - margin, y + margin) ||
            this.map.isWall(x + margin, y + this.size - margin) ||
            this.map.isWall(x + this.size - margin, y + this.size - margin);
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.size,
            top: this.y,
            bottom: this.y + this.size
        };
    }
}
