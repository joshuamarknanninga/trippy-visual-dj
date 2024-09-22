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
let imageElement = null;

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
const maxShapes = 100;

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
    } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        if (file.type === 'application/pdf') {
            handlePDFFile(file);
        } else {
            handleImageFile(file);
        }
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

    // Stop and remove image
    if (imageElement) {
        imageElement = null;
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
    imageElement = new Image();
    imageElement.src = URL.createObjectURL(file);
    imageElement.onload = () => {
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    }
}

// 4.7. Handle PDF File
function handlePDFFile(file) {
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);

        if (pdfjsLib) {
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
        } else {
            alert('PDF.js library is not loaded.');
        }
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
    // Store the intensity value
    canvas.glitchIntensity = value;
}

// 4.13. Update Analog Intensity
function updateAnalogIntensity(event) {
    const value = parseFloat(event.target.value);
    analogIntensityValue.textContent = value.toFixed(2);
    // Store the intensity value
    canvas.analogIntensity = value;
}

// 4.14. Update Trails Intensity
function updateTrailsIntensity(event) {
    const value = parseFloat(event.target.value);
    trailsIntensityValue.textContent = value.toFixed(2);
    // Store the intensity value
    canvas.trailsIntensity = value;
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
    const glitchIntensity = glitchIntensitySlider.value; // 0 to 1

    const glitchAmount = Math.floor(10 * glitchIntensity); // Number of glitch lines

    for (let i = 0; i < glitchAmount; i++) {
        const y = Math.floor(Math.random() * canvas.height);
        const x = Math.floor(Math.random() * canvas.width);
        const width = Math.floor(Math.random() * 20 * glitchIntensity); // Width of glitch strip
        const height = 1;

        // Randomly shift the pixels horizontally
        const shift = Math.floor(Math.random() * 20 * glitchIntensity) - 10 * glitchIntensity;

        for (let w = 0; w < width; w++) {
            const srcX = x + w;
            const destX = srcX + shift;

            if (destX >= 0 && destX < canvas.width) {
                for (let h = 0; h < height; h++) {
                    const srcIndex = ((y + h) * canvas.width + srcX) * 4;
                    const destIndex = ((y + h) * canvas.width + destX) * 4;

                    // Swap RGB values
                    data[destIndex] = data[srcIndex];
                    // data[srcIndex + 1] = data[srcIndex + 1]; // Green remains the same
                    // data[srcIndex + 2] = data[srcIndex + 2]; // Blue remains the same
                    // Alpha remains the same
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// 4.25. Apply Analog Effect
function applyAnalogEffect() {
    const analogIntensity = analogIntensitySlider.value; // 0 to 1
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(0, 255, 255, ${analogIntensity * 0.1})`; // Cyan tint with adjustable opacity
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
}

// 4.26. Apply Trails Effect
function applyTrailsEffect() {
    const trailsIntensity = trailsIntensitySlider.value; // 0 to 1
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - trailsIntensity * 0.1})`; // Lower alpha means longer trails
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
        // Clear the strobe by redrawing the media
        if (videoElement && !videoElement.paused) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        } else if (imageElement) {
            ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
        } else if (audioElement && !audioElement.paused) {
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
                    const glitchIntensity = 0.5; // Fixed intensity for visualization window

                    const glitchAmount = Math.floor(10 * glitchIntensity); // Number of glitch lines

                    for (let i = 0; i < glitchAmount; i++) {
                        const y = Math.floor(Math.random() * canvas.height);
                        const x = Math.floor(Math.random() * canvas.width);
                        const width = Math.floor(Math.random() * 20 * glitchIntensity); // Width of glitch strip
                        const height = 1;

                        // Randomly shift the pixels horizontally
                        const shift = Math.floor(Math.random() * 20 * glitchIntensity) - 10 * glitchIntensity;

                        for (let w = 0; w < width; w++) {
                            const srcX = x + w;
                            const destX = srcX + shift;

                            if (destX >= 0 && destX < canvas.width) {
                                for (let h = 0; h < height; h++) {
                                    const srcIndex = ((y + h) * canvas.width + srcX) * 4;
                                    const destIndex = ((y + h) * canvas.width + destX) * 4;

                                    // Swap RGB values
                                    data[destIndex] = data[srcIndex];
                                    // data[srcIndex + 1] = data[srcIndex + 1]; // Green remains the same
                                    // data[srcIndex + 2] = data[srcIndex + 2]; // Blue remains the same
                                    // Alpha remains the same
                                }
                            }
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);
                }

                function applyAnalogEffect() {
                    // Apply a color overlay
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)'; // Cyan tint with fixed opacity
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over';
                }

                function applyTrailsEffect() {
                    const trailsIntensity = 0.5; // Fixed intensity for visualization window
                    ctx.fillStyle = 'rgba(0, 0, 0, ' + (1 - trailsIntensity * 0.1) + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Handle Strobe Effect
                let strobeInterval = null;
                let showStrobe = false;
                let strobeColor = '#FFFFFF';
                let strobeSpeed = 5;

                function handleStrobe(show, color) {
                    if (show) {
                        strobeColor = color;
                        strobeSpeed = 5; // Fixed speed for visualization window
                        strobeInterval = setInterval(() => {
                            showStrobe = !showStrobe;
                            if (showStrobe) {
                                ctx.fillStyle = strobeColor;
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                            } else {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                            }
                        }, 1000 / strobeSpeed);
                    } else {
                        clearInterval(strobeInterval);
                        strobeInterval = null;
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
                    const color = 'hsl(' + (Math.random() * 360) + ', 100%, 50%)';

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

                        // Optionally, reduce size over time
                        // shape.size *= 0.99;
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

    // Clear abstract shapes
    abstractShapes.length = 0;

    // Optionally, clear the canvas or redraw media
    if (videoElement && !videoElement.paused) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } else if (imageElement) {
        ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    } else if (audioElement && !audioElement.paused) {
        // Optionally, you can leave trails or clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    // Add new shapes randomly
    if (Math.random() < 0.1) { // 10% chance to add a new shape each frame
        addRandomShape();
    }

    // Update and draw shapes
    updateAbstractShapes();

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.35. Add Random Shape
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

// 4.36. Update Abstract Shapes
function updateAbstractShapes() {
    const pixelSize = 2; // Smallest pixel size
    const glitchIntensity = glitchIntensitySlider.value; // 0 to 1

    // For each shape, create pixelations
    abstractShapes.forEach((shape, index) => {
        // Draw pixelated shape
        ctx.fillStyle = shape.color;
        ctx.fillRect(shape.x, shape.y, pixelSize, pixelSize);

        // Update position
        shape.x += shape.dx;
        shape.y += shape.dy;

        // Bounce off edges
        if (shape.x + pixelSize > canvas.width || shape.x < 0) {
            shape.dx *= -1;
        }
        if (shape.y + pixelSize > canvas.height || shape.y < 0) {
            shape.dy *= -1;
        }
    });
}

// 4.37. Apply Abstract Effect
function applyAbstractEffect() {
    if (!isAbstractActive) return;

    // No specific code here as abstract shapes are handled in the abstract loop
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
