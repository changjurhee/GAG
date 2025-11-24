import Entity from './entity.js';

export default class Item extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30, 0.15);
        this.type = Math.random() < 0.5 ? 'umbrella' : 'sword';
    }

    applyEffect(player) {
        if (this.type === 'umbrella') {
            player.isInvincible = true;
            player.invincibleTimer = 5000; // 5 seconds
        } else if (this.type === 'sword') {
            player.hasSword = true;
            player.swordTimer = 5000; // 5 seconds
        }
    }

    draw(ctx) {
        ctx.font = '30px Arial';
        const icon = this.type === 'umbrella' ? '☂️' : '🗡️';
        ctx.fillText(icon, this.x, this.y + this.height);
    }
}
