window.addEventListener('load', () => {
    const game = new Game('gameCanvas');
    const selectionScreen = document.getElementById('character-selection');
    const faceOptions = document.querySelectorAll('.face-option');

    faceOptions.forEach(option => {
        option.addEventListener('click', () => {
            const selectedFace = option.getAttribute('data-face');
            selectionScreen.classList.add('hidden');
            game.setFace(selectedFace);
            game.start();
        });
    });
});
