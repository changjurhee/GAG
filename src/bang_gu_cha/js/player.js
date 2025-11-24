class Player {
    constructor(map, x, y, facePath) {
        this.map = map;
        this.x = x;
        this.y = y;
        this.size = map.getTileSize() - 4; // Slightly smaller than tile
        this.speed = 3;
        this.vx = 0;
        this.vy = 0;
        this.nextVx = 0;
        this.nextVy = 0;
        this.fuel = 100;
        this.farts = []; // Active smoke clouds

        this.image = new Image();
        this.image.src = 'assets/player.png';

        this.faceImage = new Image();
        if (facePath) {
            this.faceImage.src = facePath;
        }
    }

    update() {
        // Try to change direction if aligned with grid
        if (this.nextVx !== 0 || this.nextVy !== 0) {
            if (this.canTurn(this.nextVx, this.nextVy)) {
                this.vx = this.nextVx;
                this.vy = this.nextVy;
                this.nextVx = 0;
                this.nextVy = 0;

                // Snap to grid center to prevent drift
                const tileSize = this.map.getTileSize();
                if (this.vx !== 0) this.y = Math.floor((this.y + this.size / 2) / tileSize) * tileSize + (tileSize - this.size) / 2;
                if (this.vy !== 0) this.x = Math.floor((this.x + this.size / 2) / tileSize) * tileSize + (tileSize - this.size) / 2;
            }
        }

        // Move
        const nextX = this.x + this.vx * this.speed;
        const nextY = this.y + this.vy * this.speed;

        // Collision check with walls
        if (!this.checkWallCollision(nextX, nextY)) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // Stop if hitting wall
            // Snap to the nearest grid cell to ensure we don't get stuck "inside" the wall margin
            const tileSize = this.map.getTileSize();
            if (this.vx > 0) this.x = Math.floor((this.x + this.size + this.speed) / tileSize) * tileSize - this.size - 0.1;
            if (this.vx < 0) this.x = Math.ceil((this.x - this.speed) / tileSize) * tileSize + 0.1;
            if (this.vy > 0) this.y = Math.floor((this.y + this.size + this.speed) / tileSize) * tileSize - this.size - 0.1;
            if (this.vy < 0) this.y = Math.ceil((this.y - this.speed) / tileSize) * tileSize + 0.1;

            this.vx = 0;
            this.vy = 0;
        }

        // Fuel consumption
        if (this.vx !== 0 || this.vy !== 0) {
            this.fuel -= 0.05;
        }
        if (this.fuel < 0) this.fuel = 0;

        // Update farts
        this.farts.forEach(fart => fart.life--);
        this.farts = this.farts.filter(fart => fart.life > 0);
    }

    draw(ctx) {
        // Draw Player Car
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Rotate based on direction
        // Assume sprite faces RIGHT (0 deg)
        let angle = 0;
        if (this.vx === 1) angle = 0;
        else if (this.vx === -1) angle = Math.PI;
        else if (this.vy === 1) angle = Math.PI / 2;
        else if (this.vy === -1) angle = -Math.PI / 2;

        // Default to facing Up if stationary
        if (this.vx === 0 && this.vy === 0) angle = -Math.PI / 2;

        ctx.rotate(angle);

        if (this.image.complete) {
            ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Fallback
            ctx.fillStyle = '#3498db';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        // Draw Face
        if (this.faceImage && this.faceImage.complete) {
            // Bobbing animation
            const bobOffset = Math.sin(Date.now() / 150) * 3;

            // Scale up for "Big Head" effect
            const faceSize = this.size * 0.9;

            ctx.save();

            // Apply glow/shadow effect for "sticker" look
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw face centered but slightly higher due to bobbing
            // Note: We are already translated to center of car and rotated.
            // To make the face always upright relative to screen, we should counter-rotate?
            // Or just let it rotate with car? User said "character rendering", usually top-down faces rotate with body.
            // Let's keep rotation but add the bobbing.

            // Draw a white background circle behind face to help with contrast (optional, but shadowBlur helps)
            // ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            // ctx.beginPath();
            // ctx.arc(0, 0, faceSize/2 + 2, 0, Math.PI*2);
            // ctx.fill();

            ctx.drawImage(this.faceImage, -faceSize / 2, -faceSize / 2 + bobOffset, faceSize, faceSize);

            // Add a second layer of shadow for intensity if needed, or just restore
            ctx.restore();
        }

        ctx.restore();

        // Draw Farts
        this.farts.forEach(fart => {
            ctx.fillStyle = `rgba(255, 255, 255, ${fart.life / 120})`;
            ctx.beginPath();
            ctx.arc(fart.x + this.map.getTileSize() / 2, fart.y + this.map.getTileSize() / 2, this.map.getTileSize() / 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    setDirection(dx, dy) {
        this.nextVx = dx;
        this.nextVy = dy;
    }

    fart() {
        if (this.fuel >= 10) {
            this.fuel -= 10;
            this.farts.push({
                x: this.x,
                y: this.y,
                life: 120 // 2 seconds at 60fps
            });
        }
    }

    canTurn(dx, dy) {
        // Allow turning when roughly centered in a tile
        const tileSize = this.map.getTileSize();
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const tileX = Math.floor(centerX / tileSize) * tileSize + tileSize / 2;
        const tileY = Math.floor(centerY / tileSize) * tileSize + tileSize / 2;

        // Check if we are close enough to the center of the tile
        const dist = Math.abs(centerX - tileX) + Math.abs(centerY - tileY);
        if (dist > this.speed * 1.5) return false;

        // Check if the target tile is a wall
        const col = Math.floor(centerX / tileSize);
        const row = Math.floor(centerY / tileSize);
        if (this.map.isWall((col + dx) * tileSize + 2, (row + dy) * tileSize + 2)) return false;

        return true;
    }

    checkWallCollision(x, y) {
        // Check all 4 corners
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
