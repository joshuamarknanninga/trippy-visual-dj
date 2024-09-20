// app.js

// Select DOM elements
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('mediaCanvas');
const ctx = canvas.getContext('2d');

const glitchBtn = document.getElementById('glitchBtn');
const analogBtn = document.getElementById('analogBtn');
const trailsBtn = document.getElementById('trailsBtn');

const strobeSpeedSlider = document.getElementById('strobeSpeed');
const strobeColorPicker = document.getElementById('strobeColor');
const speedValueDisplay = document.getElementById('speedValue');

const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const downloadVideoLink = document.getElementById('downloadVideoLink');

const launchVisualizationBtn = document.getElementById('launchVisualizationBtn');

// Initialize variables
let video = null;
let audio = null;
let animationFrameId = null;

// Effect States
let isGlitch = false;
let isAnalog = false;
let isTrails = false;

// Strobe Effect Variables
let isStrobeActive = false;
let strobeInterval = null;
let strobeSpeed = 5; // default flashes per second
let strobeColor = '#FFFFFF';
let showStrobe = false;

// Audio Visualization Variables
let audioContext = null;
let analyser = null;
let source = null;
let dataArray = null;
let bufferLength = 0;
let previousEnergy = 0;
let beatThreshold = 1.3; // Threshold for beat detection

// Video Recording Variables
let mediaRecorder = null;
let recordedChunks = [];

// Live Visualization Variables
let visualizationWindow = null;
let broadcastChannel = null;

// Handle File Upload
fileInput.addEventListener('change', handleFileUpload);

// Handle Effect Buttons
glitchBtn.addEventListener('click', toggleGlitch);
analogBtn.addEventListener('click', toggleAnalog);
trailsBtn.addEventListener('click', toggleTrails);

// Handle Strobe Controls
strobeSpeedSlider.addEventListener('input', updateStrobeSpeed);
strobeColorPicker.addEventListener('input', updateStrobeColor);

// Handle Audio Controls
playPauseBtn.addEventListener('click', togglePlayPause);
stopBtn.addEventListener('click', stopAudio);

// Handle Recording Controls
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);

// Handle Live Visualization Controls
launchVisualizationBtn.addEventListener('click', launchVisualization);

// Initialize Speed Display
speedValueDisplay.textContent = strobeSpeed;

// Update Strobe Speed
function updateStrobeSpeed(event) {
    strobeSpeed = parseInt(event.target.value);
    speedValueDisplay.textContent = strobeSpeed;
    if (isStrobeActive) {
        clearInterval(strobeInterval);
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    }
}

// Update Strobe Color
function updateStrobeColor(event) {
    strobeColor = event.target.value;
}

// Toggle Glitch Effect
function toggleGlitch() {
    isGlitch = !isGlitch;
    glitchBtn.style.backgroundColor = isGlitch ? '#666' : '#444';
}

// Toggle Analog Effect
function toggleAnalog() {
    isAnalog = !isAnalog;
    analogBtn.style.backgroundColor = isAnalog ? '#666' : '#444';
}

// Toggle Trails Effect
function toggleTrails() {
    isTrails = !isTrails;
    trailsBtn.style.backgroundColor = isTrails ? '#666' : '#444';
}

// Toggle Strobe Effect
function toggleStrobe() {
    isStrobeActive = !isStrobeActive;
    if (isStrobeActive) {
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    } else {
        clearInterval(strobeInterval);
    }
}

function toggleStrobeVisibility() {
    showStrobe = !showStrobe;
    if (showStrobe) {
        ctx.fillStyle = strobeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Clear the strobe by redrawing the media
        if (video && !video.paused) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else if (audio && !audio.paused) {
            // Optionally, you can leave trails or clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Send strobe state to visualization window if open
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'strobe', show: showStrobe, color: strobeColor });
    }
}

// Toggle Play/Pause Audio
function togglePlayPause() {
    if (!audio) return;

    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = 'Pause';
        startAudioVisualization();
    } else {
        audio.pause();
        playPauseBtn.textContent = 'Play';
    }
}

// Stop Audio
function stopAudio() {
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    playPauseBtn.textContent = 'Play';
    stopAudioVisualization();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Notify visualization window to clear
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'clear' });
    }
}

// Handle File Upload
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

    if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
        stopAudioVisualization();
    }

    if (file.type.startsWith('video/')) {
        handleVideoFile(file);
    } else if (file.type === 'image/gif') {
        handleGifFile(file);
    } else if (file.type.startsWith('audio/')) {
        handleAudioFile(file);
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

    // Apply visual effects
    applyVisualEffects();

    animationFrameId = requestAnimationFrame(drawVideoFrame);
}

function handleGifFile(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        // For GIFs, drawing static image. To handle animation, consider using gif.js or similar.
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
}

function handleAudioFile(file) {
    audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.crossOrigin = 'anonymous';
    audio.loop = true;

    // Initialize Audio Context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audio.addEventListener('play', () => {
        startAudioVisualization();
    });

    audio.addEventListener('ended', () => {
        stopAudioVisualization();
    });
}

function startAudioVisualization() {
    if (!analyser) return;
    previousEnergy = 0;
    detectBeats();
}

function stopAudioVisualization() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

function detectBeats() {
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    // Calculate the average frequency
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    let average = sum / bufferLength;

    // Energy is the sum of squares of frequencies
    let energy = 0;
    for (let i = 0; i < bufferLength; i++) {
        energy += dataArray[i] * dataArray[i];
    }

    // Simple beat detection
    if (energy > previousEnergy * beatThreshold) {
        triggerRandomEffect();
    }

    previousEnergy = energy;

    animationFrameId = requestAnimationFrame(detectBeats);
}

function triggerRandomEffect() {
    const effects = ['glitch', 'analog', 'trails', 'strobe'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    switch (randomEffect) {
        case 'glitch':
            isGlitch = true;
            glitchBtn.style.backgroundColor = '#666';
            setTimeout(() => {
                isGlitch = false;
                glitchBtn.style.backgroundColor = '#444';
            }, 300);
            break;
        case 'analog':
            isAnalog = true;
            analogBtn.style.backgroundColor = '#666';
            setTimeout(() => {
                isAnalog = false;
                analogBtn.style.backgroundColor = '#444';
            }, 300);
            break;
        case 'trails':
            isTrails = true;
            trailsBtn.style.backgroundColor = '#666';
            setTimeout(() => {
                isTrails = false;
                trailsBtn.style.backgroundColor = '#444';
            }, 300);
            break;
        case 'strobe':
            toggleStrobe();
            setTimeout(() => {
                toggleStrobe();
            }, 300);
            break;
        default:
            break;
    }

    // Send effect trigger to visualization window if open
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'effect', effect: randomEffect });
    }
}

function applyVisualEffects() {
    // Apply Glitch Effect
    if (isGlitch) {
        applyGlitchEffect();
    }

    // Apply Analog Effect
    if (isAnalog) {
        applyAnalogEffect();
    }

    // Apply Trails Effect
    if (isTrails) {
        applyTrailsEffect();
    }

    // Apply Strobe Effect
    if (showStrobe) {
        ctx.fillStyle = strobeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function applyGlitchEffect() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Introduce random pixel shifts
    for (let i = 0; i < 10; i++) { // Number of glitch lines
        const y = Math.floor(Math.random() * canvas.height);
        const start = y * canvas.width * 4;
        const length = Math.floor(Math.random() * canvas.width / 2);
        const offset = Math.floor(Math.random() * 100);

        for (let x = 0; x < length; x++) {
            const index = start + x * 4;
            if (index + offset * 4 < data.length) {
                data[index] = data[index + offset * 4];         // Red
                data[index + 1] = data[index + offset * 4 + 1]; // Green
                data[index + 2] = data[index + offset * 4 + 2]; // Blue
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function applyAnalogEffect() {
    // Simple color shifting with sine wave modulation
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.05)'; // Red tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
}

let trailsData = null;

function applyTrailsEffect() {
    if (!trailsData) {
        trailsData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    // Fade the previous frame
    for (let i = 0; i < trailsData.data.length; i += 4) {
        trailsData.data[i] *= 0.95;     // Red
        trailsData.data[i + 1] *= 0.95; // Green
        trailsData.data[i + 2] *= 0.95; // Blue
    }

    ctx.putImageData(trailsData, 0, 0);
    ctx.drawImage(video || audioElement(), 0, 0, canvas.width, canvas.height);
}

function audioElement() {
    // Placeholder function if you want to overlay audio visualizations
    return audio;
}

// Video Recording Functions
function startRecording() {
    if (!canvas.captureStream) {
        alert('Your browser does not support MediaRecorder API.');
        return;
    }

    const stream = canvas.captureStream(30); // 30 FPS
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        downloadVideoLink.href = url;
        downloadVideoLink.style.display = 'inline';
        recordedChunks = [];
    };

    mediaRecorder.start();
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
    downloadVideoLink.style.display = 'none';
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
}

// Live Visualization Functions
function launchVisualization() {
    if (visualizationWindow && !visualizationWindow.closed) {
        visualizationWindow.focus();
        return;
    }

    // Open a new window for visualization
    visualizationWindow = window.open('', 'Visualization', 'width=800,height=450');

    // Write minimal HTML to the new window
    visualizationWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Live Visualization</title>
            <style>
                body { margin: 0; background-color: #000; }
                canvas { display: block; width: 100%; height: 100%; }
            </style>
        </head>
        <body>
            <canvas id="visualCanvas"></canvas>
            <script>
                const canvas = document.getElementById('visualCanvas');
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                // Receive messages from the main window
                const bc = new BroadcastChannel('visualization_channel');
                bc.onmessage = function(event) {
                    const data = event.data;
                    if (data.type === 'effect') {
                        triggerEffect(data.effect);
                    } else if (data.type === 'strobe') {
                        handleStrobe(data.show, data.color);
                    } else if (data.type === 'clear') {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                };

                function triggerEffect(effect) {
                    switch(effect) {
                        case 'glitch':
                            applyGlitchEffect();
                            break;
                        case 'analog':
                            applyAnalogEffect();
                            break;
                        case 'trails':
                            applyTrailsEffect();
                            break;
                        case 'strobe':
                            applyStrobeEffect();
                            break;
                        default:
                            break;
                    }
                }

                function applyGlitchEffect() {
                    // Implement a simple glitch effect
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;
                    for (let i = 0; i < 1000; i++) { // Number of glitches
                        const randY = Math.floor(Math.random() * canvas.height);
                        const randX = Math.floor(Math.random() * canvas.width);
                        const index = (randY * canvas.width + randX) * 4;
                        const offset = Math.floor(Math.random() * 20) * 4;

                        if (index + offset < data.length) {
                            data[index] = data[index + offset];       // Red
                            data[index + 1] = data[index + offset + 1]; // Green
                            data[index + 2] = data[index + offset + 2]; // Blue
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                }

                function applyAnalogEffect() {
                    // Apply a color overlay
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'; // Cyan tint
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over';
                }

                let trailsData = null;

                function applyTrailsEffect() {
                    if (!trailsData) {
                        trailsData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    }

                    // Fade the previous frame
                    for (let i = 0; i < trailsData.data.length; i += 4) {
                        trailsData.data[i] *= 0.95;     // Red
                        trailsData.data[i + 1] *= 0.95; // Green
                        trailsData.data[i + 2] *= 0.95; // Blue
                    }

                    ctx.putImageData(trailsData, 0, 0);
                }

                function handleStrobe(show, color) {
                    if (show) {
                        ctx.fillStyle = color;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }

                function applyStrobeEffect() {
                    // Implement strobe effect if needed
                }
            </script>
        </body>
        </html>
    `);

    // Initialize BroadcastChannel for communication
    broadcastChannel = new BroadcastChannel('visualization_channel');
}

