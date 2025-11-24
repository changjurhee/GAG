export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = 0.3; // pixels per ms
        this.moveLeft = false;
        this.moveRight = false;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.character = '😃';
        this.hasSword = false;
        this.swordTimer = 0;
    }

    reset(x, y, character) {
        this.x = x;
        this.y = y;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.hasSword = false;
        this.swordTimer = 0;
        this.character = character;
    }

    update(gameWidth, deltaTime) {
        if (this.moveLeft) {
            this.x -= this.speed * deltaTime;
        }
        if (this.moveRight) {
            this.x += this.speed * deltaTime;
        }

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > gameWidth) this.x = gameWidth - this.width;

        // Invincibility
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        // Sword
        if (this.hasSword) {
            this.swordTimer -= deltaTime;
            if (this.swordTimer <= 0) {
                this.hasSword = false;
            }
        }
    }

    draw(ctx) {
        if (this.isInvincible) {
            ctx.globalAlpha = 0.5; // Blink or transparent effect

            // Draw Umbrella
            ctx.font = '30px Arial';
            ctx.fillText('☂️', this.x + 15, this.y + 10); // Held in right hand
        } else if (this.hasSword) {
            // Draw Sword
            ctx.font = '30px Arial';
            ctx.fillText('🗡️', this.x + 15, this.y + 10); // Held in right hand
        }

        // Draw Head (Emoji)
        ctx.font = `${this.width}px Arial`;
        ctx.fillText(this.character, this.x, this.y + this.height - 5);

        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;

        if (this.character === '😃') {
            this.drawHumanBody(ctx, centerX, bottomY);
        } else if (this.character === '🐱') {
            this.drawCatBody(ctx, centerX, bottomY);
        } else if (this.character === '🐼') {
            this.drawPandaBody(ctx, centerX, bottomY);
        } else if (this.character === '🤖') {
            this.drawRobotBody(ctx, centerX, bottomY);
        } else {
            this.drawHumanBody(ctx, centerX, bottomY);
        }

        ctx.globalAlpha = 1.0;
    }

    drawHumanBody(ctx, centerX, bottomY) {
        // Shirt
        ctx.fillStyle = '#2196F3'; // Blue
        ctx.fillRect(centerX - 6, bottomY - 8, 12, 14);
        // Pants
        ctx.fillStyle = '#333';
        ctx.fillRect(centerX - 6, bottomY + 6, 12, 10);
        // Arms
        ctx.strokeStyle = '#FFCC80'; // Skin tone
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 6, bottomY - 5);
        ctx.lineTo(centerX - 12, bottomY + 5);
        ctx.moveTo(centerX + 6, bottomY - 5);
        ctx.lineTo(centerX + 12, bottomY + 5);
        ctx.stroke();
    }

    drawCatBody(ctx, centerX, bottomY) {
        // Body (Orange suit/fur)
        ctx.fillStyle = '#FFA000';
        ctx.beginPath();
        ctx.ellipse(centerX, bottomY + 2, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, bottomY + 10);
        ctx.quadraticCurveTo(centerX + 15, bottomY + 5, centerX + 10, bottomY - 5);
        ctx.stroke();
        // Paws
        ctx.fillStyle = 'white';
        ctx.fillRect(centerX - 6, bottomY + 10, 4, 6);
        ctx.fillRect(centerX + 2, bottomY + 10, 4, 6);
    }

    drawPandaBody(ctx, centerX, bottomY) {
        // Body (White)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, bottomY + 2, 10, 0, Math.PI * 2);
        ctx.fill();
        // Limbs (Black)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - 8, bottomY, 4, 0, Math.PI * 2); // L Arm
        ctx.arc(centerX + 8, bottomY, 4, 0, Math.PI * 2); // R Arm
        ctx.arc(centerX - 5, bottomY + 10, 4, 0, Math.PI * 2); // L Leg
        ctx.arc(centerX + 5, bottomY + 10, 4, 0, Math.PI * 2); // R Leg
        ctx.fill();
    }

    drawRobotBody(ctx, centerX, bottomY) {
        // Body (Grey Box)
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(centerX - 8, bottomY - 8, 16, 16);
        // Details
        ctx.fillStyle = '#F44336'; // Red light
        ctx.fillRect(centerX - 2, bottomY - 2, 4, 4);
        // Limbs (Lines)
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 8, bottomY - 4);
        ctx.lineTo(centerX - 14, bottomY + 4);
        ctx.moveTo(centerX + 8, bottomY - 4);
        ctx.lineTo(centerX + 14, bottomY + 4);
        ctx.moveTo(centerX - 4, bottomY + 8);
        ctx.lineTo(centerX - 4, bottomY + 18);
        ctx.moveTo(centerX + 4, bottomY + 8);
        ctx.lineTo(centerX + 4, bottomY + 18);
        ctx.stroke();
    }
}
