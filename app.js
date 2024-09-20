// app.js

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('mediaCanvas');
const ctx = canvas.getContext('2d');

const glitchBtn = document.getElementById('glitchBtn');
const analogBtn = document.getElementById('analogBtn');
const trailsBtn = document.getElementById('trailsBtn');

const strobeSpeedSlider = document.getElementById('strobeSpeed');
const strobeColorPicker = document.getElementById('strobeColor');
const speedValueDisplay = document.getElementById('speedValue');

let video = null;
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

// Handle File Upload
fileInput.addEventListener('change', handleFileUpload);

// Handle Effect Buttons
glitchBtn.addEventListener('click', toggleGlitch);
analogBtn.addEventListener('click', toggleAnalog);
trailsBtn.addEventListener('click', toggleTrails);

// Handle Strobe Controls
strobeSpeedSlider.addEventListener('input', updateStrobeSpeed);
strobeColorPicker.addEventListener('input', updateStrobeColor);

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
    analogBtn.style.backgroundColor = isAnalog ? '#666
