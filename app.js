// app.js

// ------------------------------
// 1. Select DOM Elements
// ------------------------------

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('mediaCanvas');
const ctx = canvas.getContext('2d');

const glitchBtn = document.getElementById('glitchBtn');
const analogBtn = document.getElementById('analogBtn');
const trailsBtn = document.getElementById('trailsBtn');
const strobeBtn = document.getElementById('strobeBtn');

const glitchIntensitySlider = document.getElementById('glitchIntensity');
const glitchIntensityValue = document.getElementById('glitchIntensityValue');

const analogIntensitySlider = document.getElementById('analogIntensity');
const analogIntensityValue = document.getElementById('analogIntensityValue');

const trailsIntensitySlider = document.getElementById('trailsIntensity');
const trailsIntensityValue = document.getElementById('trailsIntensityValue');

const strobeSpeedSlider = document.getElementById('strobeSpeed');
const strobeColorPicker = document.getElementById('strobeColor');
const speedValueDisplay = document.getElementById('speedValue');

const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const downloadVideoLink = document.getElementById('downloadVideoLink');

const launchVisualizationBtn = document.getElementById('launchVisualizationBtn');

const abstractBtn = document.getElementById('abstractBtn');
const pixelBtn = document.getElementById('pixelBtn');
const blobBtn = document.getElementById('blobBtn');
const heartBtn = document.getElementById('heartBtn');
const smileyBtn = document.getElementById('smileyBtn');

// ------------------------------
// 2. Initialize Variables
// ------------------------------

// Media Elements
let videoElement = null;
let audioElement = null;
let imgElement = null;

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
let strobeSpeed = 5; // flashes per second
let strobeColor = '#FFFFFF';
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
const maxShapes = 1000;
let currentShapeType = 'pixel'; // 'pixel', 'blob', 'heart', 'smiley'

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

// Calibration Sliders
glitchIntensitySlider.addEventListener('input', updateGlitchIntensity);
analogIntensitySlider.addEventListener('input', updateAnalogIntensity);
trailsIntensitySlider.addEventListener('input', updateTrailsIntensity);

// Strobe Controls
strobeSpeedSlider.addEventListener('input', updateStrobeSpeed);
strobeColorPicker.addEventListener('input', updateStrobeColor);

// Audio Controls
playPauseBtn.addEventListener('click', togglePlayPause);
stopBtn.addEventListener('click', stopAudio);

// Recording Controls
startRecordingBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);

// Live Visualization Controls
launchVisualizationBtn.addEventListener('click', launchVisualization);

// Abstract Mode Controls
abstractBtn.addEventListener('click', toggleAbstractMode);
pixelBtn.addEventListener('click', () => setShapeType('pixel'));
blobBtn.addEventListener('click', () => setShapeType('blob'));
heartBtn.addEventListener('click', () => setShapeType('heart'));
smileyBtn.addEventListener('click', () => setShapeType('smiley'));

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
    } else if (file.type.startsWith('image/') && (file.type === 'image/gif' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
        handleImageFile(file);
    } else if (file.type === 'application/pdf') {
        handlePDFFile(file);
    } else if (file.type.startsWith('audio/')) {
        handleAudioFile(file);
    } else {
        alert('Unsupported file type!');
    }
}

// 4.2. Clear Media
function clearMedia() {
    // Stop and remove video
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
        videoElement = null;
    }

    // Stop and remove audio
    if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
        audioElement = null;
        stopAudioVisualization();
    }

    // Remove image
    if (imgElement) {
        imgElement = null;
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

    glitchBtn.style.backgroundColor = '#444';
    analogBtn.style.backgroundColor = '#444';
    trailsBtn.style.backgroundColor = '#444';
    strobeBtn.style.backgroundColor = '#444';

    // Reset Calibration Sliders
    glitchIntensitySlider.value = 0.5;
    glitchIntensityValue.textContent = '0.5';
    analogIntensitySlider.value = 0.5;
    analogIntensityValue.textContent = '0.5';
    trailsIntensitySlider.value = 0.5;
    trailsIntensityValue.textContent = '0.5';

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
    videoElement = document.createElement('video');
    videoElement.src = URL.createObjectURL(file);
    videoElement.crossOrigin = 'anonymous';
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.play();

    videoElement.addEventListener('loadeddata', () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        mainAnimationFrameId = requestAnimationFrame(drawVideoFrame);
    });
}

// 4.5. Draw Video Frame
function drawVideoFrame() {
    if (!videoElement) return;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Apply visual effects
    applyVisualEffects();

    mainAnimationFrameId = requestAnimationFrame(drawVideoFrame);
}

// 4.6. Handle Image File
function handleImageFile(file) {
    imgElement = new Image();
    imgElement.src = URL.createObjectURL(file);
    imgElement.onload = () => {
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    }
}

// 4.7. Handle PDF File
function handlePDFFile(file) {
    if (typeof pdfjsLib === 'undefined') {
        alert('PDF.js library is not loaded.');
        return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            // Fetch the first page
            pdf.getPage(1).then(function(page) {
                const viewport = page.getViewport({ scale: 1.5 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                page.render(renderContext);
            });
        }, function(reason) {
            console.error(reason);
        });
    };
    fileReader.readAsArrayBuffer(file);
}

// 4.8. Handle Audio File
function handleAudioFile(file) {
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.crossOrigin = 'anonymous';
    audioElement.loop = true;

    // Initialize Audio Context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioElement.addEventListener('ended', () => {
        stopAudioVisualization();
    });
}

// 4.9. Toggle Glitch Effect
function toggleGlitch() {
    isGlitch = !isGlitch;
    glitchBtn.style.backgroundColor = isGlitch ? '#666' : '#444';
}

// 4.10. Toggle Analog Effect
function toggleAnalog() {
    isAnalog = !isAnalog;
    analogBtn.style.backgroundColor = isAnalog ? '#666' : '#444';
}

// 4.11. Toggle Trails Effect
function toggleTrails() {
    isTrails = !isTrails;
    trailsBtn.style.backgroundColor = isTrails ? '#666' : '#444';
}

// 4.12. Toggle Strobe Effect
function toggleStrobe() {
    isStrobeActive = !isStrobeActive;
    strobeBtn.style.backgroundColor = isStrobeActive ? '#666' : '#444';

    if (isStrobeActive) {
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    } else {
        clearInterval(strobeInterval);
        strobeInterval = null;
        showStrobe = false;
        // Redraw the current frame without strobe
        if (videoElement && !videoElement.paused) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        } else if (audioElement && !audioElement.paused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (imgElement) {
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Notify visualization window
        if (broadcastChannel) {
            broadcastChannel.postMessage({ type: 'strobe', show: showStrobe, color: strobeColor });
        }
    }
}

// 4.13. Update Glitch Intensity
function updateGlitchIntensity(event) {
    const value = parseFloat(event.target.value);
    glitchIntensityValue.textContent = value.toFixed(2);
}

// 4.14. Update Analog Intensity
function updateAnalogIntensity(event) {
    const value = parseFloat(event.target.value);
    analogIntensityValue.textContent = value.toFixed(2);
}

// 4.15. Update Trails Intensity
function updateTrailsIntensity(event) {
    const value = parseFloat(event.target.value);
    trailsIntensityValue.textContent = value.toFixed(2);
}

// 4.16. Update Strobe Speed
function updateStrobeSpeed(event) {
    strobeSpeed = parseInt(event.target.value);
    speedValueDisplay.textContent = strobeSpeed;
    if (isStrobeActive) {
        clearInterval(strobeInterval);
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    }
}

// 4.17. Update Strobe Color
function updateStrobeColor(event) {
    strobeColor = event.target.value;
}

// 4.18. Toggle Play/Pause Audio
function togglePlayPause() {
    if (!audioElement) return;

    if (audioElement.paused) {
        audioElement.play();
        playPauseBtn.textContent = 'Pause';
        startAudioVisualization();
    } else {
        audioElement.pause();
        playPauseBtn.textContent = 'Play';
    }
}

// 4.19. Stop Audio
function stopAudio() {
    if (!audioElement) return;

    audioElement.pause();
    audioElement.currentTime = 0;
    playPauseBtn.textContent = 'Play';
    stopAudioVisualization();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Notify visualization window to clear
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'clear' });
    }
}

// 4.20. Start Audio Visualization
function startAudioVisualization() {
    if (!analyser) return;
    previousEnergy = 0;
    detectBeats();
}

// 4.21. Stop Audio Visualization
function stopAudioVisualization() {
    if (audioAnimationFrameId) {
        cancelAnimationFrame(audioAnimationFrameId);
    }
}

// 4.22. Detect Beats
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

// 4.23. Trigger Random Effect
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

// 4.24. Apply Visual Effects
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

// 4.25. Apply Glitch Effect
function applyGlitchEffect() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Determine number of pixels to glitch based on intensity
    const intensity = parseFloat(glitchIntensitySlider.value); // 0 to 1
    const numberOfPixels = Math.floor(canvas.width * canvas.height * intensity * 0.001); // Adjust factor as needed

    for (let i = 0; i < numberOfPixels; i++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);
        const index = (y * canvas.width + x) * 4;

        // Randomly alter the pixel's color
        data[index] = Math.floor(Math.random() * 256);     // Red
        data[index + 1] = Math.floor(Math.random() * 256); // Green
        data[index + 2] = Math.floor(Math.random() * 256); // Blue
        // Alpha remains unchanged
    }

    ctx.putImageData(imageData, 0, 0);
}

// 4.26. Apply Analog Effect
function applyAnalogEffect() {
    // Determine intensity based on slider
    const intensity = parseFloat(analogIntensitySlider.value); // 0 to 1
    ctx.globalAlpha = intensity * 0.1; // Adjust alpha for intensity
    ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Cyan tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0; // Reset alpha
}

// 4.27. Apply Trails Effect
function applyTrailsEffect() {
    // Determine intensity based on slider
    const intensity = parseFloat(trailsIntensitySlider.value); // 0 to 1
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - intensity})`; // Higher intensity means less fading
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 4.28. Toggle Strobe Visibility
function toggleStrobeVisibility() {
    showStrobe = !showStrobe;
    if (showStrobe) {
        ctx.fillStyle = strobeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Redraw the current frame without strobe
        if (videoElement && !videoElement.paused) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        } else if (audioElement && !audioElement.paused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (imgElement) {
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Send strobe state to visualization window if open
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'strobe', show: showStrobe, color: strobeColor });
    }
}

// 4.29. Start Recording
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

// 4.30. Stop Recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
}

// 4.31. Launch Visualization on Second Screen
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
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    const numberOfPixels = Math.floor(canvas.width * canvas.height * 0.001); // 0.1% of pixels

                    for (let i = 0; i < numberOfPixels; i++) {
                        const x = Math.floor(Math.random() * canvas.width);
                        const y = Math.floor(Math.random() * canvas.height);
                        const index = (y * canvas.width + x) * 4;

                        // Randomly alter the pixel's color
                        data[index] = Math.floor(Math.random() * 256);     // Red
                        data[index + 1] = Math.floor(Math.random() * 256); // Green
                        data[index + 2] = Math.floor(Math.random() * 256); // Blue
                        // Alpha remains unchanged
                    }

                    ctx.putImageData(imageData, 0, 0);
                }

                function applyAnalogEffect() {
                    // Apply a color overlay
                    ctx.globalAlpha = 0.1;
                    ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Cyan tint
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                }

                function applyTrailsEffect() {
                    // Apply trails by fading the canvas
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Adjust opacity for trails intensity
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

                // Abstract Mode
                const abstractShapes = [];
                const maxShapes = 1000;

                function applyAbstractEffect() {
                    const x = Math.floor(Math.random() * canvas.width);
                    const y = Math.floor(Math.random() * canvas.height);
                    const size = Math.random() * 20 + 5; // Size between 5 and 25
                    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    const typeOptions = ['pixel', 'blob', 'heart', 'smiley'];
                    const type = typeOptions[Math.floor(Math.random() * typeOptions.length)];

                    abstractShapes.push({ x, y, size, color, type });

                    if (abstractShapes.length > maxShapes) {
                        abstractShapes.shift();
                    }

                    drawAbstractShapes();
                }

                function drawAbstractShapes() {
                    abstractShapes.forEach(shape => {
                        switch(shape.type) {
                            case 'pixel':
                                drawPixel(shape.x, shape.y, shape.size, shape.color);
                                break;
                            case 'blob':
                                drawBlob(shape.x, shape.y, shape.size, shape.color);
                                break;
                            case 'heart':
                                drawHeart(shape.x, shape.y, shape.size, shape.color);
                                break;
                            case 'smiley':
                                drawSmiley(shape.x, shape.y, shape.size, shape.color);
                                break;
                            default:
                                drawPixel(shape.x, shape.y, shape.size, shape.color);
                        }
                    });
                }

                function drawPixel(x, y, size, color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, size, size);
                }

                function drawBlob(x, y, size, color) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(size / 100, size / 100); // Adjust scale based on size

                    ctx.beginPath();
                    // Random blob shape
                    const radius = 50;
                    ctx.moveTo(0, 0);
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        const r = radius + Math.random() * 20;
                        const px = r * Math.cos(angle);
                        const py = r * Math.sin(angle);
                        ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    ctx.restore();
                }

                function drawHeart(x, y, size, color) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(size / 100, size / 100); // Adjust scale based on size

                    ctx.beginPath();
                    ctx.moveTo(0, 30);
                    ctx.bezierCurveTo(-30, 0, -30, -40, 0, -50);
                    ctx.bezierCurveTo(30, -40, 30, 0, 0, 30);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    ctx.restore();
                }

                function drawSmiley(x, y, size, color) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(size / 100, size / 100); // Adjust scale based on size

                    // Face
                    ctx.beginPath();
                    ctx.arc(0, 0, 50, 0, Math.PI * 2, true); // Outer circle
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    // Eyes
                    ctx.beginPath();
                    ctx.arc(-15, -15, 5, 0, Math.PI * 2, true); // Left eye
                    ctx.arc(15, -15, 5, 0, Math.PI * 2, true); // Right eye
                    ctx.fillStyle = 'black';
                    ctx.fill();

                    // Mouth
                    ctx.beginPath();
                    ctx.arc(0, 10, 20, 0, Math.PI, false);  // Mouth (clockwise)
                    ctx.stroke();

                    ctx.restore();
                }

                // Start Abstract Animation Loop
                function abstractLoop() {
                    applyAbstractEffect();
                    requestAnimationFrame(abstractLoop);
                }

                abstractLoop(); // Start abstract visualization
            </script>
        </body>
        </html>
    `);

    // Initialize BroadcastChannel for communication
    broadcastChannel = new BroadcastChannel('visualization_channel');
}

// 4.32. Start Abstract Mode
function startAbstractMode() {
    if (isAbstractActive) return;

    isAbstractActive = true;
    abstractBtn.style.backgroundColor = '#666';
    abstractBtn.textContent = 'Stop Abstract';

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.33. Stop Abstract Mode
function stopAbstractMode() {
    if (!isAbstractActive) return;

    isAbstractActive = false;
    abstractBtn.style.backgroundColor = '#444';
    abstractBtn.textContent = 'Start Abstract';

    if (abstractAnimationFrameId) {
        cancelAnimationFrame(abstractAnimationFrameId);
        abstractAnimationFrameId = null;
    }

    // Clear abstract shapes
    abstractShapes.length = 0;

    // Redraw the current frame to remove abstract elements
    if (videoElement && !videoElement.paused) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } else if (audioElement && !audioElement.paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (imgElement) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Notify visualization window to clear
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'clear' });
    }
}

// 4.34. Abstract Loop
function abstractLoop() {
    if (!isAbstractActive) return;

    // Add new shape randomly
    addRandomShape();

    // Draw and manage abstract shapes
    drawAbstractShapes();

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.35. Add Random Shape
function addRandomShape() {
    const x = Math.floor(Math.random() * canvas.width);
    const y = Math.floor(Math.random() * canvas.height);
    const size = Math.random() * 20 + 5; // Size between 5 and 25
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

    abstractShapes.push({ x, y, size, color, type: currentShapeType });

    if (abstractShapes.length > maxShapes) {
        abstractShapes.shift();
    }
}

// 4.36. Draw Abstract Shapes
function drawAbstractShapes() {
    abstractShapes.forEach(shape => {
        switch(shape.type) {
            case 'pixel':
                drawPixel(shape.x, shape.y, shape.size, shape.color);
                break;
            case 'blob':
                drawBlob(shape.x, shape.y, shape.size, shape.color);
                break;
            case 'heart':
                drawHeart(shape.x, shape.y, shape.size, shape.color);
                break;
            case 'smiley':
                drawSmiley(shape.x, shape.y, shape.size, shape.color);
                break;
            default:
                drawPixel(shape.x, shape.y, shape.size, shape.color);
        }
    });
}

// 4.37. Toggle Abstract Mode
function toggleAbstractMode() {
    if (isAbstractActive) {
        stopAbstractMode();
    } else {
        startAbstractMode();
    }
}

// 4.38. Draw Smiley Shape
function drawSmiley(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100); // Adjust scale based on size

    // Face
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2, true); // Outer circle
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Eyes
    ctx.beginPath();
    ctx.arc(-15, -15, 5, 0, Math.PI * 2, true); // Left eye
    ctx.arc(15, -15, 5, 0, Math.PI * 2, true); // Right eye
    ctx.fillStyle = 'black';
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(0, 10, 20, 0, Math.PI, false);  // Mouth (clockwise)
    ctx.stroke();

    ctx.restore();
}

// 4.39. Draw Heart Shape
function drawHeart(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100); // Adjust scale based on size

    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.bezierCurveTo(-30, 0, -30, -40, 0, -50);
    ctx.bezierCurveTo(30, -40, 30, 0, 0, 30);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.restore();
}

// 4.40. Draw Blob
function drawBlob(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100); // Adjust scale based on size

    ctx.beginPath();
    // Random blob shape
    const radius = 50;
    ctx.moveTo(0, 0);
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const r = radius + Math.random() * 20;
        const px = r * Math.cos(angle);
        const py = r * Math.sin(angle);
        ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    ctx.restore();
}

// 4.41. Draw Pixel
function drawPixel(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
}

// 4.42. Set Shape Type
function setShapeType(shape) {
    currentShapeType = shape;
}

// ------------------------------
// 5. Strobe Effect Implementation
// ------------------------------

// 5.1. Toggle Strobe Effect
function toggleStrobe() {
    isStrobeActive = !isStrobeActive;
    strobeBtn.style.backgroundColor = isStrobeActive ? '#666' : '#444';
    strobeBtn.textContent = isStrobeActive ? 'Stop Strobe' : 'Start Strobe';

    if (isStrobeActive) {
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    } else {
        clearInterval(strobeInterval);
        strobeInterval = null;
        showStrobe = false;
        // Redraw the current frame without strobe
        if (videoElement && !videoElement.paused) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        } else if (audioElement && !audioElement.paused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (imgElement) {
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Notify visualization window
        if (broadcastChannel) {
            broadcastChannel.postMessage({ type: 'strobe', show: showStrobe, color: strobeColor });
        }
    }
}

// 5.2. Toggle Strobe Visibility
function toggleStrobeVisibility() {
    showStrobe = !showStrobe;
    if (showStrobe) {
        ctx.fillStyle = strobeColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Redraw the current frame without strobe
        if (videoElement && !videoElement.paused) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        } else if (audioElement && !audioElement.paused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (imgElement) {
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Send strobe state to visualization window if open
    if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'strobe', show: showStrobe, color: strobeColor });
    }
}

// ------------------------------
// 6. Live Visualization via BroadcastChannel
// ------------------------------

// 6.1. Launch Visualization on Second Screen
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
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    const numberOfPixels = Math.floor(canvas.width * canvas.height * 0.005); // 0.5% of pixels

                    for (let i = 0; i < numberOfPixels; i++) {
                        const x = Math.floor(Math.random() * canvas.width);
                        const y = Math.floor(Math.random() * canvas.height);
                        const index = (y * canvas.width + x) * 4;

                        // Randomly alter the pixel's color
                        data[index] = Math.floor(Math.random() * 256);     // Red
                        data[index + 1] = Math.floor(Math.random() * 256); // Green
                        data[index + 2] = Math.floor(Math.random() * 256); // Blue
                        // Alpha remains unchanged
                    }

                    ctx.putImageData(imageData, 0, 0);
                }

                function applyAnalogEffect() {
                    // Apply a color overlay
                    ctx.globalAlpha = 0.1;
                    ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Cyan tint
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                }

                function applyTrailsEffect() {
                    // Apply trails by fading the canvas
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Adjust opacity for trails intensity
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

                // Abstract Mode
                const abstractShapes = [];
                const maxShapes = 1000;
                let currentShapeType = 'pixel'; // Default shape

                function applyAbstractEffect() {
                    const x = Math.floor(Math.random() * canvas.width);
                    const y = Math.floor(Math.random() * canvas.height);
                    const size = Math.random() * 20 + 5; // Size between 5 and 25
                    const color = \`hsl(\${Math.random() * 360}, 100%, 50%)\`;

                    abstractShapes.push({ x, y, size, color, type: currentShapeType });

                    if (abstractShapes.length > maxShapes) {
                        abstractShapes.shift();
                    }

                    drawAbstractShapes();
                }

                function drawAbstractShapes() {
                    abstractShapes.forEach(shape => {
                        switch(shape.type) {
                            case 'pixel':
                                drawPixel(shape.x, shape.y, shape.size, shape.color);
                                break;
                            case 'blob':
                                drawBlob(shape.x, shape.y, shape.size, shape.color);
                                break;
                            case 'heart':
                                drawHeart(shape.x, shape.y, shape.size, shape.color);
                                break;
                            case 'smiley':
                                drawSmiley(shape.x, shape.y, shape.size, shape.color);
                                break;
                            default:
                                drawPixel(shape.x, shape.y, shape.size, shape.color);
                        }
                    });
                }

                function drawPixel(x, y, size, color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, size, size);
                }

                function drawBlob(x, y, size, color) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(size / 100, size / 100);

                    ctx.beginPath();
                    const radius = 50;
                    ctx.moveTo(0, 0);
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        const r = radius + Math.random() * 20;
                        const px = r * Math.cos(angle);
                        const py = r * Math.sin(angle);
                        ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    ctx.restore();
                }

                function drawHeart(x, y, size, color) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(size / 100, size / 100);

                    ctx.beginPath();
                    ctx.moveTo(0, 30);
                    ctx.bezierCurveTo(-30, 0, -30, -40, 0, -50);
                    ctx.bezierCurveTo(30, -40, 30, 0, 0, 30);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    ctx.restore();
                }

                function drawSmiley(x, y, size, color) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.scale(size / 100, size / 100);

                    // Face
                    ctx.beginPath();
                    ctx.arc(0, 0, 50, 0, Math.PI * 2, true); // Outer circle
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.strokeStyle = 'black';
                    ctx.stroke();

                    // Eyes
                    ctx.beginPath();
                    ctx.arc(-15, -15, 5, 0, Math.PI * 2, true); // Left eye
                    ctx.arc(15, -15, 5, 0, Math.PI * 2, true); // Right eye
                    ctx.fillStyle = 'black';
                    ctx.fill();

                    // Mouth
                    ctx.beginPath();
                    ctx.arc(0, 10, 20, 0, Math.PI, false);  // Mouth (clockwise)
                    ctx.stroke();

                    ctx.restore();
                }

                // Animation Loop for Abstract Mode
                function abstractAnimationLoop() {
                    applyAbstractEffect();
                    requestAnimationFrame(abstractAnimationLoop);
                }

                abstractAnimationLoop(); // Start the abstract visualization
            </script>
        </body>
        </html>
    `);

    // Initialize BroadcastChannel for communication
    broadcastChannel = new BroadcastChannel('visualization_channel');
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

// ------------------------------
// 8. Additional Functionality
// ------------------------------

// 8.1. Detect and Replicate Image Outline (Basic Implementation)
function detectImageOutline() {
    if (!imgElement) return;

    // Create an off-screen canvas for processing
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;

    offCtx.drawImage(imgElement, 0, 0, offCanvas.width, offCanvas.height);

    const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imageData.data;

    // Simple edge detection (Sobel Operator can be implemented for better results)
    // For simplicity, we'll implement a basic threshold-based edge detection

    const grayscale = [];
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        grayscale.push(avg);
    }

    const edgeData = [];
    const threshold = 20; // Adjust as needed

    for (let y = 1; y < offCanvas.height - 1; y++) {
        for (let x = 1; x < offCanvas.width - 1; x++) {
            const idx = y * offCanvas.width + x;
            const pixel = grayscale[idx];

            // Simple neighbor difference
            const neighbors = [
                grayscale[idx - 1],
                grayscale[idx + 1],
                grayscale[idx - offCanvas.width],
                grayscale[idx + offCanvas.width]
            ];

            let edge = false;
            for (let neighbor of neighbors) {
                if (Math.abs(pixel - neighbor) > threshold) {
                    edge = true;
                    break;
                }
            }

            if (edge) {
                edgeData.push({ x, y, color: 'white' });
            }
        }
    }

    // Add detected edges to abstractShapes
    edgeData.forEach(edge => {
        abstractShapes.push({ x: edge.x, y: edge.y, size: 2, color: 'white', type: 'pixel' });
    });
}

// 8.2. Integrate Outline Detection with Upload
function handleImageFile(file) {
    imgElement = new Image();
    imgElement.src = URL.createObjectURL(file);
    imgElement.onload = () => {
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        // Detect and replicate outline
        detectImageOutline();
    }
}

// ------------------------------
// 9. Memory Optimization
// ------------------------------

// 9.1. Limit Number of Abstract Shapes
function limitAbstractShapes() {
    if (abstractShapes.length > maxShapes) {
        abstractShapes.splice(0, abstractShapes.length - maxShapes);
    }
}

// 9.2. Clear Abstract Shapes Periodically
setInterval(() => {
    limitAbstractShapes();
}, 1000);

// ------------------------------
// 10. Additional Enhancements
// ------------------------------

// 10.1. Responsive Canvas
window.addEventListener('resize', () => {
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Optionally, redraw the current media
    if (videoElement && !videoElement.paused) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } else if (audioElement && !audioElement.paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else if (imgElement) {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});