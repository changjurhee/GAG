import Player from './player.js';
import Poop from './poop.js';
import Item from './item.js';
import SoundManager from './sound.js';
import PoopFragment from './poop_fragment.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.player = new Player(this.width / 2, this.height - 50);
        this.entities = [];
        this.score = 0;
        this.level = 1;
        this.isRunning = false;
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1000; // Initial spawn rate
        this.levelDuration = 15000; // 15 seconds per level
        this.levelTimeRemaining = this.levelDuration;

        this.soundManager = new SoundManager();
        this.bindInput();
    }

    bindInput() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.player.moveLeft = true;
            if (e.key === 'ArrowRight') this.player.moveRight = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.player.moveLeft = false;
            if (e.key === 'ArrowRight') this.player.moveRight = false;
        });
    }

    start(characterType = '😃', bgmType = 'exciting') {
        this.soundManager.init(); // Ensure audio context is ready
        this.soundManager.playStart();
        this.soundManager.playBGM(bgmType);

        this.isRunning = true;
        this.score = 0;
        this.level = 1;
        this.levelTimeRemaining = this.levelDuration;
        this.entities = [];
        this.player.reset(this.width / 2, this.height - 50, characterType);
        this.lastTime = performance.now();
        this.updateUI();
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(deltaTime) {
        this.player.update(this.width, deltaTime);

        // Spawning logic
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnEntity();
            this.spawnTimer = 0;
        }

        // Update entities
        this.entities.forEach((entity, index) => {
            entity.update(deltaTime);
            if (entity.y > this.height) {
                this.entities.splice(index, 1);
                // Only give points for dodging intact poop, fragments don't count or count less? 
                // Let's keep it simple: if it's a Poop or Item, give points. Fragments don't count.
                if (entity instanceof Poop) {
                    this.score += 10;
                    this.updateUI();
                }
            }

            // Collision detection
            if (this.checkCollision(this.player, entity)) {
                if (entity instanceof Poop) {
                    if (this.player.hasSword) {
                        this.splitPoop(entity);
                        this.entities.splice(index, 1);
                        this.soundManager.playHit(); // Maybe a different sound for cut?
                    } else if (!this.player.isInvincible) {
                        this.soundManager.playHit();
                        this.gameOver();
                    }
                } else if (entity instanceof Item) {
                    this.soundManager.playItemPickup();
                    entity.applyEffect(this.player);
                    this.entities.splice(index, 1);
                }
            }
        });

        // Level up logic (Time based)
        this.levelTimeRemaining -= deltaTime;
        if (this.levelTimeRemaining <= 0) {
            this.level++;
            this.soundManager.playLevelUp();
            this.spawnInterval = Math.max(200, 1000 - (this.level * 100));
            this.levelTimeRemaining = this.levelDuration;
        }
        this.updateUI();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.player.draw(this.ctx);
        this.entities.forEach(entity => entity.draw(this.ctx));
    }

    spawnEntity() {
        const x = Math.random() * (this.width - 30);
        // 10% chance for item
        if (Math.random() < 0.1) {
            this.entities.push(new Item(x, 0));
        } else {
            this.entities.push(new Poop(x, 0, this.level));
        }
    }

    splitPoop(poop) {
        const size = poop.width / 2;
        // Left fragment
        this.entities.push(new PoopFragment(poop.x, poop.y, size, -0.1, -0.1));
        // Right fragment
        this.entities.push(new PoopFragment(poop.x + size, poop.y, size, 0.1, -0.1));
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    gameOver() {
        this.soundManager.playGameOver();
        this.soundManager.stopBGM();
        this.isRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('active');
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('time').textContent = Math.ceil(this.levelTimeRemaining / 1000);
    }
}
