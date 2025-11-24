import Entity from './entity.js';

export default class PoopFragment extends Entity {
    constructor(x, y, size, velocityX, velocityY) {
        super(x, y, size, size, 0); // Base speed 0, controlled by velocity
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.gravity = 0.001; // Simple gravity
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(deltaTime) {
        this.velocityY += this.gravity * deltaTime;
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        this.rotation += this.rotationSpeed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.font = `${this.width}px Arial`;
        ctx.fillText('💩', -this.width / 2, this.height / 2);
        ctx.restore();
    }
}
