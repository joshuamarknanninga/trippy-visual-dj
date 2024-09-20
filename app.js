// app.js

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('mediaCanvas');
const ctx = canvas.getContext('2d');

let video = null;
let animationFrameId = null;

// Handle File Upload
fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Clear previous media
    if (video) {
        video.pause();
        video.src = "";
        video = null;
        cancelAnimationFrame(animationFrameId);
    }

    if (file.type.startsWith('video/')) {
        handleVideoFile(file);
    } else if (file.type === 'image/gif') {
        handleGifFile(file);
    } else {
        alert('Unsupported file type!');
    }
}

function handleVideoFile(file) {
    video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.play();

    video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        drawVideoFrame();
    });
}

function drawVideoFrame() {
    if (!video) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    animationFrameId = requestAnimationFrame(drawVideoFrame);
}

function handleGifFile(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        // For GIFs, drawing static image. To handle animation, consider using gif.js or similar.
        ctx.drawImage(img, 0, 0,
