export default class Entity {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
    }

    draw(ctx) {
        // Override in subclasses
    }
}
