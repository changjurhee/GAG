import Entity from './entity.js';

export default class Poop extends Entity {
    constructor(x, y, level) {
        // Random size: Small (20), Medium (30), Large (40)
        const size = 20 + Math.random() * 20;
        // Speed increases with level
        const speed = (0.1 + Math.random() * 0.1) + (level * 0.05);
        super(x, y, size, size, speed);
    }

    draw(ctx) {
        ctx.font = `${this.width}px Arial`;
        ctx.fillText('💩', this.x, this.y + this.height);
    }
}
