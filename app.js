document.addEventListener('DOMContentLoaded', () => {
    // Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visual-container').appendChild(renderer.domElement);

    // Load Shaders
    const shaders = {
        analog: 'shaders/analog.frag',
        glitch: 'shaders/glitch.frag',
        strobe: 'shaders/strobe.frag',
        trails: 'shaders/trails.frag'
    };

    // Add Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add Directional Light
    const directionalLight = new THREE.DirectionalLight(0xffc0cb, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Geometry & Material for Weirdcore Effect
    const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x8a2be2, wireframe: true });
    const knot = new THREE.Mesh(geometry, material);
    scene.add(knot);

    camera.position.z = 50;

    // GSAP Animation Setup
    gsap.to(knot.rotation, {
        x: Math.PI * 2,
        y: Math.PI * 2,
        duration: 10,
        repeat: -1,
        ease: 'power1.inOut'
    });

    // Effect Control Variables
    let strobeActive = false;
    let crtActive = false;
    let pixelationActive = false;
    let etchActive = false;
    let currentShader = null;

    // Audio Setup with Tone.js
    const synth = new Tone.Synth().toDestination();
    let playing = false;
    document.getElementById('startButton').addEventListener('click', () => {
        if (!playing) {
            Tone.start();
            synth.triggerAttackRelease('C4', '8n');
            playing = true;
            document.getElementById('visual-container').style.background = 'none';
            activateEffects();
        }
    });

    // Toggle Button Event Listeners
    document.getElementById('strobeButton').addEventListener('click', () => {
        strobeActive = !strobeActive;
        updateShader();
    });

    document.getElementById('crtButton').addEventListener('click', () => {
        crtActive = !crtActive;
        document.body.classList.toggle('crt-active', crtActive);
    });

    document.getElementById('pixelationButton').addEventListener('click', () => {
        pixelationActive = !pixelationActive;
    });

    document.getElementById('etchButton').addEventListener('click', () => {
        etchActive = !etchActive;
    });

    // Slider Event Listeners
    document.getElementById('strobeSlider').addEventListener('input', (event) => {
        if (strobeActive) {
            const intensity = event.target.value;
            // Logic to adjust strobe effect intensity
        }
    });

    document.getElementById('crtSlider').addEventListener('input', (event) => {
        if (crtActive) {
            const intensity = event.target.value;
            // Logic to adjust CRT effect intensity
        }
    });

    document.getElementById('pixelationSlider').addEventListener('input', (event) => {
        if (pixelationActive) {
            const intensity = event.target.value;
            // Logic to adjust pixelation effect intensity
        }
    });

    document.getElementById('etchSlider').addEventListener('input', (event) => {
        if (etchActive) {
            const intensity = event.target.value;
            // Logic to adjust etch-a-sketch effect intensity
        }
    });

    // Shader Update Logic
    function updateShader() {
        if (strobeActive) {
            currentShader = shaders.strobe;
        } else if (etchActive) {
            currentShader = shaders.trails;
        } else if (pixelationActive) {
            currentShader = shaders.glitch;
        } else if (!strobeActive && !etchActive && !pixelationActive) {
            currentShader = shaders.analog;
        }
        // Load and apply shader logic here
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Handle Window Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Activate Effects Logic
    function activateEffects() {
        updateShader();
    }
});
