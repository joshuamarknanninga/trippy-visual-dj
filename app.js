// app.js

// ------------------------------
// 1. Select DOM Elements
// ------------------------------

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('mediaCanvas');
const ctx = canvas.getContext('2d');

const glitchBtn = document.getElementById('glitchBtn');
const glitchIntensitySlider = document.getElementById('glitchIntensity');

const analogBtn = document.getElementById('analogBtn');
const analogIntensitySlider = document.getElementById('analogIntensity');

const trailsBtn = document.getElementById('trailsBtn');
const trailsIntensitySlider = document.getElementById('trailsIntensity');

const strobeSpeedSlider = document.getElementById('strobeSpeed');
const strobeColorPicker = document.getElementById('strobeColor');
const speedValueDisplay = document.getElementById('speedValue');
const strobeBtn = document.getElementById('strobeBtn');

const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');

const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const downloadVideoLink = document.getElementById('downloadVideoLink');

const launchVisualizationBtn = document.getElementById('launchVisualizationBtn');

const startAbstractBtn = document.getElementById('startAbstractBtn'); // New Button
const stopAbstractBtn = document.getElementById('stopAbstractBtn');   // New Button

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
let strobeSpeed = 5; // flashes per second
let strobeColor = '#FFFFFF';
let showStrobe = false;

// Effect Intensities
let glitchIntensity = 5;  // 1 to 10
let analogIntensity = 5;  // 1 to 10
let trailsIntensity = 5;  // 1 to 10

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

// Effect Buttons and Sliders
glitchBtn.addEventListener('click', toggleGlitch);
glitchIntensitySlider.addEventListener('input', updateGlitchIntensity);

analogBtn.addEventListener('click', toggleAnalog);
analogIntensitySlider.addEventListener('input', updateAnalogIntensity);

trailsBtn.addEventListener('click', toggleTrails);
trailsIntensitySlider.addEventListener('input', updateTrailsIntensity);

// Strobe Controls
strobeSpeedSlider.addEventListener('input', updateStrobeSpeed);
strobeColorPicker.addEventListener('input', updateStrobeColor);
strobeBtn.addEventListener('click', toggleStrobe);

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
    } else if (file.type === 'image/gif') {
        handleGifFile(file);
    } else if (file.type.startsWith('audio/')) {
        handleAudioFile(file);
    } else if (file.type === 'application/pdf') {
        handlePdfFile(file);
    } else if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/jpg')) {
        handleImageFile(file);
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

    glitchBtn.style.backgroundColor = '#444';
    analogBtn.style.backgroundColor = '#444';
    trailsBtn.style.backgroundColor = '#444';
    strobeBtn.style.backgroundColor = '#444';
    stopAbstractBtn.disabled = true;

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

// 4.5. Handle Image File (JPEG, JPG)
function handleImageFile(file) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        setCanvasSize(img.width, img.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
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

// 4.7. Handle PDF File
function handlePdfFile(file) {
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            // Fetch the first page
            pdf.getPage(1).then(function(page) {
                const viewport = page.getViewport({ scale: 1.5 });
                setCanvasSize(viewport.width, viewport.height);
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                page.render(renderContext).promise.then(function() {
                    // Page rendered, you can apply effects here if needed
                });
            });
        }, function(reason) {
            console.error(reason);
            alert('Error loading PDF');
        });
    };
    fileReader.readAsArrayBuffer(file);
}

// 4.8. Toggle Glitch Effect
function toggleGlitch() {
    isGlitch = !isGlitch;
    glitchBtn.style.backgroundColor = isGlitch ? '#666' : '#444';
}

// 4.9. Update Glitch Intensity
function updateGlitchIntensity(event) {
    glitchIntensity = parseInt(event.target.value);
}

// 4.10. Toggle Analog Effect
function toggleAnalog() {
    isAnalog = !isAnalog;
    analogBtn.style.backgroundColor = isAnalog ? '#666' : '#444';
}

// 4.11. Update Analog Intensity
function updateAnalogIntensity(event) {
    analogIntensity = parseInt(event.target.value);
}

// 4.12. Toggle Trails Effect
function toggleTrails() {
    isTrails = !isTrails;
    trailsBtn.style.backgroundColor = isTrails ? '#666' : '#444';
}

// 4.13. Update Trails Intensity
function updateTrailsIntensity(event) {
    trailsIntensity = parseInt(event.target.value);
}

// 4.14. Update Strobe Speed
function updateStrobeSpeed(event) {
    strobeSpeed = parseInt(event.target.value);
    speedValueDisplay.textContent = strobeSpeed;
    if (isStrobeActive) {
        clearInterval(strobeInterval);
        strobeInterval = setInterval(toggleStrobeVisibility, 1000 / strobeSpeed);
    }
}

// 4.15. Update Strobe Color
function updateStrobeColor(event) {
    strobeColor = event.target.value;
}

// 4.16. Toggle Strobe Effect
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

// 4.17. Toggle Strobe Visibility
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

// 4.18. Toggle Play/Pause Audio
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

// 4.19. Stop Audio
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
        audioAnimationFrameId = null;
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

    const glitchLines = glitchIntensity; // Number of glitch lines based on intensity

    for (let i = 0; i < glitchLines; i++) {
        const y = Math.floor(Math.random() * canvas.height);
        const start = y * canvas.width * 4;
        const length = Math.floor(Math.random() * canvas.width / 2) + 1;
        const offset = Math.floor(Math.random() * 100);

        for (let x = 0; x < length; x++) {
            const index = start + x * 4;
            if (index + offset * 4 < data.length) {
                // Randomly decide to glitch R, G, or B channel
                const channel = Math.floor(Math.random() * 3);
                data[index + channel] = data[index + offset * 4 + channel];
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// 4.26. Apply Analog Effect
function applyAnalogEffect() {
    // Adjust the intensity by changing the alpha value
    const alpha = analogIntensity / 10 * 0.1; // Max alpha 0.1

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`; // Cyan tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
}

// 4.27. Apply Trails Effect
function applyTrailsEffect() {
    // Adjust the intensity by changing the fade factor
    const fadeFactor = trailsIntensity / 10 * 0.05; // Max fade 0.05

    ctx.fillStyle = `rgba(0, 0, 0, ${fadeFactor})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw the media on top
    if (video && !video.paused) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (audio && !audio.paused) {
        // Optionally, visualize audio
        ctx.drawImage(audioElement(), 0, 0, canvas.width, canvas.height);
    }
}

// 4.28. Toggle Play/Pause Audio
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

// 4.29. Stop Audio
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

// 4.30. Start Audio Visualization
function startAudioVisualization() {
    if (!analyser) return;
    previousEnergy = 0;
    detectBeats();
}

// 4.31. Stop Audio Visualization
function stopAudioVisualization() {
    if (audioAnimationFrameId) {
        cancelAnimationFrame(audioAnimationFrameId);
        audioAnimationFrameId = null;
    }
}

// 4.32. Detect Beats
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

// 4.33. Trigger Random Effect
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

// 4.34. Apply Visual Effects
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

// 4.35. Apply Abstract Effect
function applyAbstractEffect() {
    // Create random pixelations that draw out things or are random
    const pixelSize = Math.random() * 10 + 5; // Size between 5 and 15
    const x = Math.floor(Math.random() * canvas.width);
    const y = Math.floor(Math.random() * canvas.height);
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, pixelSize, pixelSize);
}

// 4.36. Start Recording
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

// 4.37. Stop Recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
}

// 4.38. Launch Visualization on Second Screen
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
                    const glitchLines = 10; // Fixed number for visualization

                    for (let i = 0; i < glitchLines; i++) {
                        const y = Math.floor(Math.random() * canvas.height);
                        const start = y * canvas.width * 4;
                        const length = Math.floor(Math.random() * canvas.width / 2) + 1;
                        const offset = Math.floor(Math.random() * 100);

                        for (let x = 0; x < length; x++) {
                            const index = start + x * 4;
                            if (index + offset * 4 < data.length) {
                                // Randomly decide to glitch R, G, or B channel
                                const channel = Math.floor(Math.random() * 3);
                                data[index + channel] = data[index + offset * 4 + channel];
                            }
                        }
                    }

                    ctx.putImageData(imgData, 0, 0);
                }

                function applyAnalogEffect() {
                    // Apply a color overlay
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.05)'; // Cyan tint
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over';
                }

                function applyTrailsEffect() {
                    // Fade the previous frame
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                function handleStrobe(show, color) {
                    if (show) {
                        ctx.fillStyle = color;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }

                // Abstract Effect
                function applyAbstractEffect() {
                    const pixelSize = Math.random() * 10 + 5; // Size between 5 and 15
                    const x = Math.floor(Math.random() * canvas.width);
                    const y = Math.floor(Math.random() * canvas.height);
                    const color = \`hsl(\${Math.random() * 360}, 100%, 50%)\`;

                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                }
            </script>
        </body>
        </html>
    `);

    // Initialize BroadcastChannel for communication
    broadcastChannel = new BroadcastChannel('visualization_channel');
}

// 4.39. Start Abstract Mode
function startAbstractMode() {
    if (isAbstractActive) return;

    isAbstractActive = true;
    startAbstractBtn.disabled = true;
    stopAbstractBtn.disabled = false;

    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.40. Stop Abstract Mode
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
}

// 4.41. Abstract Loop
function abstractLoop() {
    if (!isAbstractActive) return;

    // Add new pixelations randomly
    if (Math.random() < 0.1) { // 10% chance to add a new pixelation each frame
        addRandomPixelation();
    }

    // Continue the loop
    abstractAnimationFrameId = requestAnimationFrame(abstractLoop);
}

// 4.42. Add Random Pixelation
function addRandomPixelation() {
    const pixelSize = Math.random() * 10 + 5; // Size between 5 and 15
    const x = Math.floor(Math.random() * canvas.width);
    const y = Math.floor(Math.random() * canvas.height);
    const color = `hsl(${Math.random() * 360}, 100%, 50%)`;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, pixelSize, pixelSize);

    // Optionally, create lines or patterns
    if (Math.random() < 0.5) { // 50% chance to draw a line
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + pixelSize, y + pixelSize);
        ctx.stroke();
    }
}

// 4.43. Cleanup on Page Unload
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
