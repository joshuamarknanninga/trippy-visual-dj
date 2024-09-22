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

const startAbstractBtn = document.getElementById('startAbstractBtn');
const stopAbstractBtn = document.getElementById('stopAbstractBtn');

// ------------------------------
// 2. Initialize Variables
// ------------------------------

// Media Elements
let videoElement = null;
let audioElement = null;

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
const abstractPixels = [];
const maxPixels = 1000;

// ------------------------------
// 3. Event Listeners
// ------------------------------

// File Upload
fileInput.addEventListener('change', handleFileUpload);

// Effect Buttons
glitchBtn.addEventListener('click', toggleGlitch);
analogBtn.addEventListener('click', toggleAnalog);
trailsBtn.addEventListener('click', toggleTrails);

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
startAbstractBtn.addEventListener('click', startAbstractMode);
stopAbstractBtn.addEventListener('click', stopAbstractMode);

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
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

// 4.12. Update Glitch Intensity
function updateGlitchIntensity(event) {
    const value = parseFloat(event.target.value);
    glitchIntensityValue.textContent = value.toFixed(2);
    // The intensity will control the number of pixels altered
}

// 4.13. Update Analog Intensity
function updateAnalogIntensity(event) {
    const value = parseFloat(event.target.value);
    analogIntensityValue.textContent = value.toFixed(2);
    // The intensity will control the opacity of the color overlay
}

// 4.14. Update Trails Intensity
function updateTrailsIntensity(event) {
    const value = parseFloat(event.target.value);
    trailsIntensityValue.textContent = value.toFixed(2);
    // The intensity will control the fade rate
}

// 4.15. Update Strobe Speed
function updateStrobeSpeed(event) {
    strobeSpeed = parseInt(event.target.value);
    speedValueDisplay.textContent = strobeSpeed;
    if (isStrobeActive) {
        clearInterval(strobeInterval);
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    }
}

// 4.16. Update Strobe Color
function updateStrobeColor(event) {
    strobeColor = event.target.value;
}

// 4.17. Toggle Play/Pause Audio
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

// 4.18. Stop Audio
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

// 4.19. Start Audio Visualization
function startAudioVisualization() {
    if (!analyser) return;
    previousEnergy = 0;
    detectBeats();
}

// 4.20. Stop Audio Visualization
function stopAudioVisualization() {
    if (audioAnimationFrameId) {
        cancelAnimationFrame(audioAnimationFrameId);
    }
}

// 4.21. Detect Beats
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

// 4.22. Trigger Random Effect
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

// 4.23. Apply Visual Effects
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

// 4.24. Apply Glitch Effect
function applyGlitchEffect() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Determine number of pixels to glitch based on intensity
    const intensity = parseFloat(glitchIntensitySlider.value); // 0 to 1
    const numberOfPixels = Math.floor(canvas.width * canvas.height * intensity * 0.01); // Adjust factor as needed

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

// 4.25. Apply Analog Effect
function applyAnalogEffect() {
    // Determine intensity based on slider
    const intensity = parseFloat(analogIntensitySlider.value); // 0 to 1
    ctx.globalAlpha = intensity * 0.1; // Adjust alpha for intensity
    ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Cyan tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0; // Reset alpha
}

// 4.26. Apply Trails Effect
function applyTrailsEffect() {
    // Determine intensity based on slider
    const intensity = parseFloat(trailsIntensitySlider.value); // 0 to 1
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - intensity})`; // Higher intensity means less fading
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 4.27. Toggle Strobe Effect
function toggleStrobe() {
    isStrobeActive = !isStrobeActive;
    if (isStrobeActive) {
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    } else {
        clearInterval(strobeInterval);
        strobeInterval = null;
    }
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

                    const numberOfPixels = Math.floor(canvas.width * canvas.height * 0.01); // 1% of pixels

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
                const abstractPixels = [];
                const maxPixels = 1000;

                function applyAbstractEffect() {
                    const size = 1; // Single pixel
                    const x = Math.floor(Math.random() * canvas.width);
                    const y = Math.floor(Math.random() * canvas.height);
                    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

                    abstractPixels.push({ x, y, color });

                    // Limit number of pixels
                    if (abstractPixels.length > maxPixels) {
                        abstractPixels.shift();
                    }

                    drawAbstractPixels();
                }

                function drawAbstractPixels() {
                    abstractPixels.forEach(pixel => {
                        ctx.fillStyle = pixel.color;
                        ctx.fillRect(pixel.x, pixel.y, 1, 1); // Draw single pixel
                    });
                }

                // Abstract Animation Loop
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
    startAbstractBtn.disabled = true;
    stopAbstractBtn.disabled = false;

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.33. Stop Abstract Mode
function stopAbstractMode() {
    if (!isAbstractActive) return;

    isAbstractActive = false;
    startAbstractBtn.disabled = false;
    stopAbstractBtn.disabled = true;

    if (abstractAnimationFrameId) {
        cancelAnimationFrame(abstractAnimationFrameId);
        abstractAnimationFrameId = null;
    }

    // Clear abstract pixels
    abstractPixels.length = 0;
}

// 4.34. Abstract Loop
function abstractLoop() {
    if (!isAbstractActive) return;

    // Add new pixel randomly
    addRandomPixel();

    // Draw and manage abstract pixels
    drawAbstractPixels();

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.35. Add Random Pixel
function addRandomPixel() {
    const x = Math.floor(Math.random() * canvas.width);
    const y = Math.floor(Math.random() * canvas.height);
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

    abstractPixels.push({ x, y, color });

    // Limit number of pixels
    if (abstractPixels.length > maxPixels) {
        abstractPixels.shift();
    }
}

// 4.36. Draw Abstract Pixels
function drawAbstractPixels() {
    abstractPixels.forEach(pixel => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, 1, 1); // Draw single pixel
    });
}

// ------------------------------
// 5. Effect Implementations
// ------------------------------

// 5.1. Apply Glitch Effect
function applyGlitchEffect() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Determine number of pixels to glitch based on intensity
    const intensity = parseFloat(glitchIntensitySlider.value); // 0 to 1
    const numberOfPixels = Math.floor(canvas.width * canvas.height * intensity * 0.01); // Adjust factor as needed

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

// 5.2. Apply Analog Effect
function applyAnalogEffect() {
    // Determine intensity based on slider
    const intensity = parseFloat(analogIntensitySlider.value); // 0 to 1
    ctx.globalAlpha = intensity * 0.2; // Adjust alpha for intensity
    ctx.fillStyle = 'rgba(0, 255, 255, 1)'; // Cyan tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0; // Reset alpha
}

// 5.3. Apply Trails Effect
function applyTrailsEffect() {
    // Determine intensity based on slider
    const intensity = parseFloat(trailsIntensitySlider.value); // 0 to 1
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - intensity})`; // Higher intensity means less fading
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ------------------------------
// 6. Live Visualization via BroadcastChannel
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
// 7. Performance Optimizations
// ------------------------------

// Limit canvas resolution if needed
function setCanvasSize(width, height) {
    canvas.width = width;
    canvas.height = height;
}

// ------------------------------
// 8. Cleanup on Page Unload
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
