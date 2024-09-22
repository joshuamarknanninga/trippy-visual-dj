// app.js

// ------------------------------
// 1. Select DOM Elements
// ------------------------------

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('mediaCanvas');
const ctx = canvas.getContext('2d');

// Effect Buttons
const glitchBtn = document.getElementById('glitchBtn');
const analogBtn = document.getElementById('analogBtn');
const trailsBtn = document.getElementById('trailsBtn');
const strobeBtn = document.getElementById('strobeBtn');
const startAbstractBtn = document.getElementById('startAbstractBtn');
const stopAbstractBtn = document.getElementById('stopAbstractBtn');

// Effect Sliders
const glitchSpeedSlider = document.getElementById('glitchSpeed');
const glitchIntensitySlider = document.getElementById('glitchIntensity');
const analogSpeedSlider = document.getElementById('analogSpeed');
const analogIntensitySlider = document.getElementById('analogIntensity');
const trailsSpeedSlider = document.getElementById('trailsSpeed');
const trailsIntensitySlider = document.getElementById('trailsIntensity');
const strobeSpeedSliderControl = document.getElementById('strobeSpeed');
const strobeColorPicker = document.getElementById('strobeColor');

// Effect Values Display
const glitchSpeedValue = document.getElementById('glitchSpeedValue');
const glitchIntensityValue = document.getElementById('glitchIntensityValue');
const analogSpeedValue = document.getElementById('analogSpeedValue');
const analogIntensityValue = document.getElementById('analogIntensityValue');
const trailsSpeedValue = document.getElementById('trailsSpeedValue');
const trailsIntensityValue = document.getElementById('trailsIntensityValue');
const strobeSpeedValue = document.getElementById('strobeSpeedValue');

// Audio Controls
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');

// Recording Controls
const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const downloadVideoLink = document.getElementById('downloadVideoLink');

// Live Visualization Controls
const launchVisualizationBtn = document.getElementById('launchVisualizationBtn');

// ------------------------------
// 2. Initialize Variables
// ------------------------------

// Media Elements
let video = null;
let audio = null;

// Animation Frames
let mainAnimationFrameId = null;
let audioAnimationFrameId = null;
let abstractAnimationFrameId = null;

// Effect States
let isGlitch = false;
let isAnalog = false;
let isTrails = false;
let isStrobeActive = false;
let isAbstractActive = false;

// Strobe Effect Variables
let strobeInterval = null;
let strobeSpeed = parseInt(strobeSpeedSliderControl.value); // flashes per second
let strobeColor = strobeColorPicker.value;
let showStrobe = false;

// Audio Visualization Variables
let audioContext = null;
let analyser = null;
let source = null;
let dataArray = null;
let bufferLength = 0;
let previousEnergy = 0;
let beatThreshold = 1.3; // Threshold multiplier for beat detection

// Video Recording Variables
let mediaRecorder = null;
let recordedChunks = [];

// Live Visualization Variables
let visualizationWindow = null;
let broadcastChannel = null;

// Abstract Mode Variables
const abstractShapes = [];
const maxShapes = 50;

// ------------------------------
// 3. Event Listeners
// ------------------------------

// File Upload
fileInput.addEventListener('change', handleFileUpload);

// Effect Buttons
glitchBtn.addEventListener('click', toggleGlitch);
analogBtn.addEventListener('click', toggleAnalog);
trailsBtn.addEventListener('click', toggleTrails);
strobeBtn.addEventListener('click', toggleStrobe);
startAbstractBtn.addEventListener('click', startAbstractMode);
stopAbstractBtn.addEventListener('click', stopAbstractMode);

// Effect Sliders
glitchSpeedSlider.addEventListener('input', () => {
    glitchSpeed = parseInt(glitchSpeedSlider.value);
    glitchSpeedValue.textContent = glitchSpeed;
});
glitchIntensitySlider.addEventListener('input', () => {
    glitchIntensity = parseInt(glitchIntensitySlider.value);
    glitchIntensityValue.textContent = glitchIntensity;
});
analogSpeedSlider.addEventListener('input', () => {
    analogSpeed = parseInt(analogSpeedSlider.value);
    analogSpeedValue.textContent = analogSpeed;
});
analogIntensitySlider.addEventListener('input', () => {
    analogIntensity = parseInt(analogIntensitySlider.value);
    analogIntensityValue.textContent = analogIntensity;
});
trailsSpeedSlider.addEventListener('input', () => {
    trailsSpeed = parseInt(trailsSpeedSlider.value);
    trailsSpeedValue.textContent = trailsSpeed;
});
trailsIntensitySlider.addEventListener('input', () => {
    trailsIntensity = parseInt(trailsIntensitySlider.value);
    trailsIntensityValue.textContent = trailsIntensity;
});
strobeSpeedSliderControl.addEventListener('input', () => {
    strobeSpeed = parseInt(strobeSpeedSliderControl.value);
    strobeSpeedValue.textContent = strobeSpeed;
    if (isStrobeActive) {
        clearInterval(strobeInterval);
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    }
});
strobeColorPicker.addEventListener('input', () => {
    strobeColor = strobeColorPicker.value;
});

// Audio Controls
playPauseBtn.addEventListener('click', togglePlayPause);
stopBtn.addEventListener('click', stopAudio);

// Recording Controls
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);

// Live Visualization Controls
launchVisualizationBtn.addEventListener('click', launchVisualization);

// ------------------------------
// 4. Functions Implementation
// ------------------------------

// 4.1. Handle File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Clear previous media and effects
    clearMedia();
    clearEffects();

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

// 4.2. Clear Media
function clearMedia() {
    // Stop and remove video
    if (video) {
        video.pause();
        video.src = "";
        video = null;
    }

    // Stop and remove audio
    if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
        stopAudioVisualization();
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 4.3. Clear All Effects
function clearEffects() {
    isGlitch = false;
    isAnalog = false;
    isTrails = false;
    isStrobeActive = false;
    isAbstractActive = false;

    // Reset button colors
    glitchBtn.style.backgroundColor = '#444';
    analogBtn.style.backgroundColor = '#444';
    trailsBtn.style.backgroundColor = '#444';
    strobeBtn.style.backgroundColor = '#444';
    stopAbstractBtn.disabled = true;
    startAbstractBtn.disabled = false;

    // Stop strobe
    clearInterval(strobeInterval);
    strobeInterval = null;
    showStrobe = false;

    // Stop abstract mode
    stopAbstractMode();

    // Notify visualization window
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'clear' });
    }
}

// 4.4. Handle Video File
function handleVideoFile(file) {
    video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.play();

    video.addEventListener('loadeddata', () => {
        setCanvasSize(video.videoWidth, video.videoHeight);
        mainAnimationFrameId = requestAnimationFrame(drawVideoFrame);
    });
}

// 4.5. Draw Video Frame
function drawVideoFrame() {
    if (!video) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply visual effects
    applyVisualEffects();

    mainAnimationFrameId = requestAnimationFrame(drawVideoFrame);
}

// 4.6. Handle GIF File
function handleGifFile(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        setCanvasSize(img.width, img.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
}

// 4.7. Handle Audio File
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

    audio.addEventListener('ended', () => {
        stopAudioVisualization();
    });
}

// 4.8. Toggle Glitch Effect
let glitchSpeed = parseInt(glitchSpeedSlider.value);
let glitchIntensity = parseInt(glitchIntensitySlider.value);

function toggleGlitch() {
    isGlitch = !isGlitch;
    glitchBtn.style.backgroundColor = isGlitch ? '#666' : '#444';
}

// 4.9. Toggle Analog Effect
let analogSpeed = parseInt(analogSpeedSlider.value);
let analogIntensity = parseInt(analogIntensitySlider.value);

function toggleAnalog() {
    isAnalog = !isAnalog;
    analogBtn.style.backgroundColor = isAnalog ? '#666' : '#444';
}

// 4.10. Toggle Trails Effect
let trailsSpeed = parseInt(trailsSpeedSlider.value);
let trailsIntensity = parseInt(trailsIntensitySlider.value);

function toggleTrails() {
    isTrails = !isTrails;
    trailsBtn.style.backgroundColor = isTrails ? '#666' : '#444';
}

// 4.11. Update Strobe Speed
// Already handled via event listener

// 4.12. Update Strobe Color
// Already handled via event listener

// 4.13. Toggle Play/Pause Audio
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

// 4.14. Stop Audio
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

// 4.15. Start Audio Visualization
function startAudioVisualization() {
    if (!analyser) return;
    previousEnergy = 0;
    detectBeats();
}

// 4.16. Stop Audio Visualization
function stopAudioVisualization() {
    if (audioAnimationFrameId) {
        cancelAnimationFrame(audioAnimationFrameId);
    }
}

// 4.17. Detect Beats
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

    audioAnimationFrameId = requestAnimationFrame(detectBeats);
}

// 4.18. Trigger Random Effect
function triggerRandomEffect() {
    const effects = ['glitch', 'analog', 'trails', 'strobe', 'abstract'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    switch (randomEffect) {
        case 'glitch':
            if (!isGlitch) {
                isGlitch = true;
                glitchBtn.style.backgroundColor = '#666';
                setTimeout(() => {
                    isGlitch = false;
                    glitchBtn.style.backgroundColor = '#444';
                }, 300);
            }
            break;
        case 'analog':
            if (!isAnalog) {
                isAnalog = true;
                analogBtn.style.backgroundColor = '#666';
                setTimeout(() => {
                    isAnalog = false;
                    analogBtn.style.backgroundColor = '#444';
                }, 300);
            }
            break;
        case 'trails':
            if (!isTrails) {
                isTrails = true;
                trailsBtn.style.backgroundColor = '#666';
                setTimeout(() => {
                    isTrails = false;
                    trailsBtn.style.backgroundColor = '#444';
                }, 300);
            }
            break;
        case 'strobe':
            toggleStrobe();
            setTimeout(() => {
                toggleStrobe();
            }, 300);
            break;
        case 'abstract':
            if (!isAbstractActive) {
                startAbstractMode();
                setTimeout(() => {
                    stopAbstractMode();
                }, 3000); // Run abstract mode for 3 seconds
            }
            break;
        default:
            break;
    }

    // Send effect trigger to visualization window if open
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'effect', effect: randomEffect });
    }
}

// 4.19. Apply Visual Effects
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

    // Apply Abstract Effect
    if (isAbstractActive) {
        applyAbstractEffect();
    }
}

// 4.20. Apply Glitch Effect
function applyGlitchEffect() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Introduce random pixel shifts based on intensity
    for (let i = 0; i < glitchIntensity; i++) { // Number of glitch lines
        const y = Math.floor(Math.random() * canvas.height);
        const start = y * canvas.width * 4;
        const length = Math.floor(Math.random() * (canvas.width / 2));
        const offset = Math.floor(Math.random() * 100);

        for (let x = 0; x < length; x++) {
            const index = start + x * 4;
            if (index + offset * 4 < data.length) {
                data[index] = data[index + offset * 4];           // Red
                data[index + 1] = data[index + offset * 4 + 1];   // Green
                data[index + 2] = data[index + offset * 4 + 2];   // Blue
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// 4.21. Apply Analog Effect
function applyAnalogEffect() {
    // Apply a color overlay based on intensity
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(0, 255, 255, ${analogIntensity / 100})`; // Cyan tint with variable intensity
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
}

// 4.22. Apply Trails Effect
function applyTrailsEffect() {
    // Apply fading effect based on intensity
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - trailsIntensity / 100})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 4.23. Toggle Strobe Effect
function toggleStrobe() {
    isStrobeActive = !isStrobeActive;
    strobeBtn.style.backgroundColor = isStrobeActive ? '#666' : '#444';

    if (isStrobeActive) {
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    } else {
        clearInterval(strobeInterval);
        strobeInterval = null;
    }
}

// 4.24. Toggle Strobe Visibility
function toggleStrobeVisibility() {
    showStrobe = !showStrobe;
    if (showStrobe) {
        ctx.fillStyle = strobeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Redraw the media or clear the canvas
        if (video && !video.paused) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else if (audio && !audio.paused) {
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

// 4.25. Start Recording
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

// 4.26. Stop Recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
}

// 4.27. Launch Visualization on Second Screen
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

                // BroadcastChannel for communication
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

                // Handle Effects
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
                        case 'abstract':
                            applyAbstractEffect();
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
                            data[index] = data[index + offset];           // Red
                            data[index + 1] = data[index + offset + 1];   // Green
                            data[index + 2] = data[index + offset + 2];   // Blue
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

                function applyTrailsEffect() {
                    // Apply fading effect
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Handle Strobe Effect
                function handleStrobe(show, color) {
                    if (show) {
                        ctx.fillStyle = color;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }

                // Abstract Effect
                const abstractShapes = [];
                const maxShapes = 100;

                function applyAbstractEffect() {
                    const size = Math.random() * 50 + 10;
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const dx = (Math.random() - 0.5) * 5;
                    const dy = (Math.random() - 0.5) * 5;
                    const color = \`hsl(\${Math.random() * 360}, 100%, 50%)\`;

                    const shape = { x, y, dx, dy, size, color };
                    abstractShapes.push(shape);

                    // Limit number of shapes
                    if (abstractShapes.length > maxShapes) {
                        abstractShapes.shift();
                    }

                    animateAbstractShapes();
                }

                function animateAbstractShapes() {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    abstractShapes.forEach((shape, index) => {
                        // Draw shape
                        ctx.beginPath();
                        ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
                        ctx.fillStyle = shape.color;
                        ctx.fill();

                        // Update position
                        shape.x += shape.dx;
                        shape.y += shape.dy;

                        // Bounce off edges
                        if (shape.x + shape.size > canvas.width || shape.x - shape.size < 0) {
                            shape.dx *= -1;
                        }
                        if (shape.y + shape.size > canvas.height || shape.y - shape.size < 0) {
                            shape.dy *= -1;
                        }
                    });

                    requestAnimationFrame(animateAbstractShapes);
                }
            </script>
        </body>
        </html>
    `);

    // Initialize BroadcastChannel for communication
    broadcastChannel = new BroadcastChannel('visualization_channel');
}

// 4.28. Start Abstract Mode
function startAbstractMode() {
    if (isAbstractActive) return;

    isAbstractActive = true;
    startAbstractBtn.disabled = true;
    stopAbstractBtn.disabled = false;

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.29. Stop Abstract Mode
function stopAbstractMode() {
    if (!isAbstractActive) return;

    isAbstractActive = false;
    startAbstractBtn.disabled = false;
    stopAbstractBtn.disabled = true;

    if (abstractAnimationFrameId) {
        cancelAnimationFrame(abstractAnimationFrameId);
        abstractAnimationFrameId = null;
    }

    // Clear abstract shapes by clearing the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 4.30. Abstract Loop
function abstractLoop() {
    if (!isAbstractActive) return;

    // Add new shapes randomly
    if (Math.random() < 0.1) { // 10% chance to add a new shape each frame
        addRandomShape();
    }

    // Update and draw shapes
    updateAbstractShapes();

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.31. Add Random Shape
function addRandomShape() {
    const size = Math.random() * 30 + 5;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const dx = (Math.random() - 0.5) * 4;
    const dy = (Math.random() - 0.5) * 4;
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

    const shape = { x, y, dx, dy, size, color };
    abstractShapes.push(shape);

    // Limit number of shapes
    if (abstractShapes.length > maxShapes) {
        abstractShapes.shift();
    }
}

// 4.32. Update Abstract Shapes
function updateAbstractShapes() {
    // Apply fading effect based on trailsIntensity
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - trailsIntensity / 100})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    abstractShapes.forEach((shape, index) => {
        // Draw shape
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.size, 0, Math.PI * 2);
        ctx.fillStyle = shape.color;
        ctx.fill();

        // Update position
        shape.x += shape.dx;
        shape.y += shape.dy;

        // Bounce off edges
        if (shape.x + shape.size > canvas.width || shape.x - shape.size < 0) {
            shape.dx *= -1;
        }
        if (shape.y + shape.size > canvas.height || shape.y - shape.size < 0) {
            shape.dy *= -1;
        }
    });
}

// ------------------------------
// 5. Live Visualization via BroadcastChannel
// ------------------------------

// Broadcast messages to visualization window
function sendEffectToVisualization(effect) {
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'effect', effect: effect });
    }
}

function sendStrobeToVisualization(show, color) {
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'strobe', show: show, color: color });
    }
}

// ------------------------------
// 6. Performance Optimizations
// ------------------------------

// Limit canvas resolution if needed
function setCanvasSize(width, height) {
    canvas.width = width;
    canvas.height = height;
}

// ------------------------------
// 7. Cleanup on Page Unload
// ------------------------------

window.addEventListener('beforeunload', () => {
    // Close visualization window if open
    if (visualizationWindow && !visualizationWindow.closed) {
        visualizationWindow.close();
    }

    // Close BroadcastChannel
    if (broadcastChannel) {
        broadcastChannel.close();
    }

    // Stop all animation frames
    if (mainAnimationFrameId) {
        cancelAnimationFrame(mainAnimationFrameId);
    }
    if (audioAnimationFrameId) {
        cancelAnimationFrame(audioAnimationFrameId);
    }
    if (abstractAnimationFrameId) {
        cancelAnimationFrame(abstractAnimationFrameId);
    }
});
