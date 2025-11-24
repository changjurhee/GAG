window.addEventListener('load', () => {
    const game = new Game('gameCanvas');
    const selectionScreen = document.getElementById('character-selection');
    const faceOptions = document.querySelectorAll('.face-option');
    const facesContainer = document.querySelector('.faces-container');
    const cameraBtn = document.getElementById('camera-btn');
    const cameraContainer = document.getElementById('camera-container');
    const videoElement = document.getElementById('camera-source');
    const canvasElement = document.getElementById('camera-preview');
    const canvasCtx = canvasElement.getContext('2d');
    const loadingOverlay = document.getElementById('loading-overlay');
    const cancelBtn = document.getElementById('cancel-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const canvas = document.getElementById('camera-canvas');
    let camera = null;
    let selfieSegmentation = null;

    // Store captured faces in memory
    const capturedFaces = [];

    // Face Selection - Initial binding for existing options
    function bindInitialFaceOptions() {
        const options = document.querySelectorAll('.face-option');
        options.forEach(option => {
            // Remove old listeners by cloning
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);

            newOption.addEventListener('click', () => {
                const selectedFace = newOption.getAttribute('data-face');
                console.log("Selected face:", selectedFace);
                selectionScreen.classList.add('hidden');
                game.setFace(selectedFace);
            });
        });
    }
    bindInitialFaceOptions();

    // MediaPipe Setup
    function onResults(results) {
        // Hide loading overlay on first result and enable capture
        if (loadingOverlay.classList.contains('visible')) {
            loadingOverlay.classList.remove('visible');
            loadingOverlay.classList.add('hidden');
            captureBtn.disabled = false;
            captureBtn.style.opacity = 1;
            captureBtn.style.cursor = 'pointer';
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Draw the segmentation mask
        canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);

        // Only overwrite existing pixels (the mask)
        canvasCtx.globalCompositeOperation = 'source-in';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        canvasCtx.restore();
    }

    async function initMediaPipe() {
        if (selfieSegmentation) return;

        // Show loading
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('visible');

        // Disable capture button while loading
        captureBtn.disabled = true;
        captureBtn.style.opacity = 0.5;
        captureBtn.style.cursor = 'not-allowed';

        selfieSegmentation = new SelfieSegmentation({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
            }
        });

        selfieSegmentation.setOptions({
            modelSelection: 1,
        });

        selfieSegmentation.onResults(onResults);

        camera = new Camera(videoElement, {
            onFrame: async () => {
                await selfieSegmentation.send({ image: videoElement });
            },
            width: 320,
            height: 240
        });
    }

    // Camera Handling
    cameraBtn.addEventListener('click', async () => {
        try {
            cameraContainer.classList.remove('hidden');
            cameraContainer.classList.add('visible');

            await initMediaPipe();

            // Set canvas size
            canvasElement.width = 320;
            canvasElement.height = 240;

            camera.start();
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow camera permissions.");
            loadingOverlay.classList.remove('visible');
            loadingOverlay.classList.add('hidden');
        }
    });

    function closeCamera() {
        if (camera) camera.stop();
        cameraContainer.classList.remove('visible');
        cameraContainer.classList.add('hidden');
        loadingOverlay.classList.remove('visible');
        loadingOverlay.classList.add('hidden');
    }

    cancelBtn.addEventListener('click', closeCamera);

    captureBtn.addEventListener('click', () => {
        if (captureBtn.disabled) return;

        // Show loading immediately
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('visible');

        // Use setTimeout to allow UI to update before processing
        setTimeout(() => {
            try {
                console.log("Starting capture...");
                const context = canvas.getContext('2d');
                canvas.width = canvasElement.width;
                canvas.height = canvasElement.height;

                // Mirror the capture to match preview
                context.translate(canvas.width, 0);
                context.scale(-1, 1);

                context.drawImage(canvasElement, 0, 0);

                const dataUrl = canvas.toDataURL('image/png');
                console.log("Captured Data URL length:", dataUrl.length);
                addCapturedFace(dataUrl);

                closeCamera();
            } catch (err) {
                console.error("Error capturing photo:", err);
                alert("Error capturing photo. Please try again.");
                // Hide loading if error
                loadingOverlay.classList.remove('visible');
                loadingOverlay.classList.add('hidden');
            }
        }, 50);
    });

    function addCapturedFace(dataUrl) {
        // Store dataUrl in array
        const index = capturedFaces.length;
        capturedFaces.push(dataUrl);

        const newOption = document.createElement('div');
        newOption.className = 'face-option';
        // Store index reference
        newOption.setAttribute('data-face', `captured:${index}`);

        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Captured Face';

        newOption.appendChild(img);
        facesContainer.appendChild(newOption);

        // Bind listener directly (no cloning needed for new element)
        newOption.addEventListener('click', () => {
            console.log("Selected captured face index:", index);
            const faceData = capturedFaces[index];
            selectionScreen.classList.add('hidden');
            game.setFace(faceData);
        });
    }
});
