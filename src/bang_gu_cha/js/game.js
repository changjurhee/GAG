class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.tileSize = 40;
        this.faceAsset = null;

        this.map = new GameMap(this.width, this.height, this.tileSize);
        // Player will be initialized in reset() or start() after face selection
        this.player = null;

        // Enemies at corners
        const endCol = this.map.cols - 2;
        const endRow = this.map.rows - 2;
        this.enemies = [
            new Enemy(this.map, this.player, endCol * this.tileSize + 2, endRow * this.tileSize + 2),
            new Enemy(this.map, this.player, endCol * this.tileSize + 2, this.tileSize * 1 + 2)
        ];

        this.score = 0;
        this.isRunning = false;
        this.isGameOver = false;
        this.gracePeriod = 180; // 3 seconds at 60fps

        this.uiScore = document.getElementById('score');
        this.uiFuel = document.getElementById('fuel');
        this.uiMessage = document.getElementById('game-message');

        this.bindInput();
    }

    setFace(facePath) {
        this.faceAsset = facePath;
        this.reset();
    }

    bindInput() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver && e.code === 'Enter') {
                this.reset();
                return;
            }

            switch (e.code) {
                case 'ArrowUp': this.player.setDirection(0, -1); break;
                case 'ArrowDown': this.player.setDirection(0, 1); break;
                case 'ArrowLeft': this.player.setDirection(-1, 0); break;
                case 'ArrowRight': this.player.setDirection(1, 0); break;
                case 'Space': this.player.fart(); break;
            }
        });
    }

    start() {
        this.isRunning = true;
        this.loop();
    }

    reset() {
        this.map = new GameMap(this.width, this.height, this.tileSize);
        this.player = new Player(this.map, this.tileSize * 1 + 2, this.tileSize * 1 + 2, this.faceAsset);

        const endCol = this.map.cols - 2;
        const endRow = this.map.rows - 2;
        this.enemies = [
            new Enemy(this.map, this.player, endCol * this.tileSize + 2, endRow * this.tileSize + 2),
            new Enemy(this.map, this.player, endCol * this.tileSize + 2, this.tileSize * 1 + 2)
        ];
        this.score = 0;
        this.isGameOver = false;
        this.gracePeriod = 180;
        this.uiMessage.classList.add('hidden');
        this.uiMessage.classList.remove('visible');
        this.start();
    }

    update() {
        if (!this.isRunning) return;

        if (this.gracePeriod > 0) this.gracePeriod--;

        this.player.update();
        this.enemies.forEach(enemy => enemy.update());

        // Check Game Over
        if (this.gracePeriod === 0) {
            this.enemies.forEach(enemy => {
                if (enemy.stunned === 0 && Utils.rectIntersect(this.player.getBounds(), enemy.getBounds())) {
                    this.gameOver();
                }
            });
        }

        if (this.player.fuel <= 0) {
            // this.gameOver(); // Optional: Game over on empty fuel? Or just stop?
            // For now, just stop moving, which usually leads to death
        }

        // Check Flag Collection
        const pCenter = {
            x: this.player.x + this.player.size / 2,
            y: this.player.y + this.player.size / 2
        };
        const col = Math.floor(pCenter.x / this.tileSize);
        const row = Math.floor(pCenter.y / this.tileSize);

        if (this.map.removeFlag(col, row)) {
            this.score += 100;
            // Check if all flags collected
            let flagsRemaining = 0;
            for (let r = 0; r < this.map.rows; r++) {
                for (let c = 0; c < this.map.cols; c++) {
                    if (this.map.grid[r][c] === 2) flagsRemaining++;
                }
            }
            if (flagsRemaining === 0) {
                this.gameWin();
            }
        }

        this.updateUI();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.map.draw(this.ctx);
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        if (this.gracePeriod > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("GET READY! " + Math.ceil(this.gracePeriod / 60), this.width / 2, this.height / 2);
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.loop());
    }

    updateUI() {
        this.uiScore.innerText = this.score;
        this.uiFuel.innerText = Math.floor(this.player.fuel);
    }

    gameOver() {
        this.isRunning = false;
        this.isGameOver = true;
        this.uiMessage.innerText = "GAME OVER\nPress Enter to Restart";
        this.uiMessage.classList.remove('hidden');
        this.uiMessage.classList.add('visible');
    }

    gameWin() {
        this.isRunning = false;
        this.isGameOver = true;
        this.uiMessage.innerText = "YOU WIN!\nScore: " + this.score + "\nPress Enter to Restart";
        this.uiMessage.classList.remove('hidden');
        this.uiMessage.classList.add('visible');
    }
}
