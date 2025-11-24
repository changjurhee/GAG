import Game from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const charBtns = document.querySelectorAll('.char-btn');
    const bgmBtns = document.querySelectorAll('.bgm-btn');
    let selectedChar = '😃';
    let selectedBGM = 'exciting';

    charBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            charBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedChar = btn.dataset.char;
        });
    });

    bgmBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bgmBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedBGM = btn.dataset.bgm;
        });
    });

    startBtn.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('active');
        game.start(selectedChar, selectedBGM);
    });

    restartBtn.addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('active');
        // Restart with previously selected character and BGM
        game.start(selectedChar, selectedBGM);
    });
});
