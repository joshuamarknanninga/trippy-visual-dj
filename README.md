# Trippy Effects App

![Trippy Effects App Logo](https://via.placeholder.com/150) <!-- Replace with your actual logo -->

Welcome to the **Trippy Effects App**—a dynamic web application that transforms your media files into mesmerizing visual experiences. Whether you're looking to add a touch of glitchy charm to your videos, overlay analog-style filters on images, create stunning trails with your animations, or generate vibrant abstract art, this app has got you covered. Additionally, with features like video recording and live visualization on a secondary screen, you can capture and showcase your creative journey effortlessly.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
  - [Uploading Media](#uploading-media)
  - [Applying Effects](#applying-effects)
  - [Abstract Mode](#abstract-mode)
  - [Strobe Effect](#strobe-effect)
  - [Audio Visualization](#audio-visualization)
  - [Video Recording](#video-recording)
  - [Live Visualization](#live-visualization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- **Media Uploads:** Supports uploading of images (JPEG, JPG, GIF), videos, audio files, and PDFs.
- **Glitch Effect:** Adds randomized pixel distortions to your media for a retro-futuristic look.
- **Analog Effect:** Applies semi-transparent overlays to emulate analog displays.
- **Trails Effect:** Creates fading trails behind moving objects for a dynamic visual experience.
- **Strobe Effect:** Flashes a selected color at adjustable speeds to create a strobe light effect.
- **Abstract Mode:** Generates a mix of pixels, blobs, hearts, and smiley emojis for abstract art.
- **Shape Selection:** Choose between different shapes (Pixel, Blob, Heart, Smiley) in Abstract Mode.
- **Beat Detection:** Analyzes audio to detect beats and trigger random visual effects in sync with the music.
- **Video Recording:** Capture your canvas with all applied effects as a downloadable WebM video.
- **Live Visualization:** Launch a secondary window for real-time visualization of effects using the BroadcastChannel API.
- **Responsive Design:** Optimized for various screen sizes and devices.

## Demo

![Trippy Effects Demo](https://via.placeholder.com/800x450) <!-- Replace with an actual demo screenshot or GIF -->

*Note: Replace the placeholder image links with actual screenshots or GIFs demonstrating the app's features.*

## Technologies Used

- **HTML5** & **CSS3:** Structure and styling of the application.
- **JavaScript (ES6+)**: Core functionality and interactivity.
- **Canvas API:** Rendering media and applying visual effects.
- **PDF.js:** Rendering PDF files onto the canvas.
- **Web Audio API:** Audio playback and beat detection.
- **MediaRecorder API:** Recording canvas as video.
- **BroadcastChannel API:** Real-time communication between windows for live visualization.

## Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/trippy-effects-app.git
```

### Navigate to the Project Directory

```bash
cd trippy-effects-app
```

### Install Dependencies

The application relies on the **PDF.js** library, which is included via CDN in the `index.html`. No additional installations are required. However, ensure you have a local server to run the app.

### Run the Application

You can use any local server setup. Here's how to do it using **Live Server** in VSCode:

1. **Install the Live Server Extension:**
   - Open Visual Studio Code.
   - Go to the Extensions panel (`Ctrl+Shift+X` or `Cmd+Shift+X`).
   - Search for **"Live Server"** and install it.

2. **Open the Project Folder:**
   - Open the `trippy-effects-app` folder in VSCode.

3. **Start Live Server:**
   - Right-click on `index.html` in the Explorer panel.
   - Select **"Open with Live Server"**.
   - Your default browser should open `http://localhost:5500` (port may vary).

Alternatively, using Python's SimpleHTTPServer:

#### For Python 3.x:

```bash
python -m http.server
```

#### For Python 2.x:

```bash
python -m SimpleHTTPServer
```

- Open your browser and navigate to `http://localhost:8000`.

## Usage

### Uploading Media

#### Select File:

1. Click on the **"Choose File"** button in the header.
2. Select a media file from your device. Supported formats include:
   - **Images:** JPEG, JPG, GIF
   - **Videos:** MP4, WebM, etc.
   - **Audio:** MP3, WAV, etc.
   - **PDFs:** Any standard PDF document.

#### Processing:

- The app will process the uploaded file and render it onto the canvas.
- For PDFs, only the first page is rendered.

### Applying Effects

#### Glitch Effect:

1. Click the **"Toggle Glitch"** button to apply or remove the Glitch effect.
2. Adjust the **Glitch Intensity** slider to control the severity of the glitch.

#### Analog Effect:

1. Click the **"Toggle Analog"** button to apply or remove the Analog effect.
2. Adjust the **Analog Intensity** slider to control the transparency and strength of the overlay.

#### Trails Effect:

1. Click the **"Toggle Trails"** button to apply or remove the Trails effect.
2. Adjust the **Trails Intensity** slider to control how quickly trails fade.

#### Strobe Effect:

1. Click the **"Start Strobe"** button to begin the Strobe effect. The button text will change to **"Stop Strobe"** when active.
2. Adjust the **Strobe Speed** slider to set the frequency of flashes per second.
3. Use the **Strobe Color** picker to select the color of the strobe flashes.

### Abstract Mode

#### Activate Abstract Mode:

1. Click the **"Start Abstract"** button to begin generating abstract visuals.
2. The button text will change to **"Stop Abstract"** when active.

#### Shape Selection:

1. Choose the type of shapes to generate by clicking on the **"Pixel"**, **"Blob"**, **"Heart"**, or **"Smiley"** buttons.
2. The selected shape will be used for generating abstract visuals.

#### Deactivating Abstract Mode:

- Click the **"Stop Abstract"** button to cease generating abstract visuals.

### Audio Visualization

#### Upload an Audio File:

- Upload an audio file using the file input. Supported formats include MP3, WAV, etc.

#### Playback Controls:

1. Use the **"Play"** button to start or pause audio playback.
2. Click the **"Stop"** button to halt playback and reset the audio.

#### Beat Detection:

- As the audio plays, the app analyzes frequency data to detect beats.
- Upon detecting a beat, a random visual effect (Glitch, Analog, Trails, Strobe, or Abstract) is triggered, synchronizing the visuals with the music.

### Video Recording

#### Start Recording:

1. Click the **"Start Recording"** button to begin capturing the canvas with all active effects.

#### Stop Recording:

1. Click the **"Stop Recording"** button to end the recording process.
2. Once stopped, a **"Download Video"** link will appear, allowing you to download the recorded WebM video.

### Live Visualization

#### Launch Visualization:

1. Click the **"Launch Visualization"** button to open a new window dedicated to live visualization.
2. This window mirrors the effects applied on the main canvas in real-time.

#### Viewing Effects:

- Any effects triggered in the main window will be reflected in the visualization window.
- The strobe effect and abstract visuals are synchronized across both windows.

## Troubleshooting

### Common Issues

#### Buttons Not Responding:

- **Cause:** Event listeners might not be correctly attached, or the corresponding functions are undefined.
- **Solution:** Ensure that all functions referenced by event listeners are properly defined in `app.js`. Check the browser console for any JavaScript errors.

#### `startRecording` Not Defined:

- **Cause:** The `startRecording` function is being called before it's defined or not defined at all.
- **Solution:** Ensure that the `startRecording` function is correctly implemented in `app.js` and that there are no typos in the function name.

#### PDFs Not Rendering:

- **Cause:** PDF.js library might not be correctly loaded or linked.
- **Solution:** Verify that the PDF.js script is correctly included in `index.html` via the `<script>` tag. Check the browser console for any errors related to PDF rendering.

#### Media Not Displaying Correctly:

- **Cause:** The canvas size might not match the media dimensions, or media files might be corrupted.
- **Solution:** Ensure that the media files are not corrupted and are in supported formats. The canvas automatically resizes to match the media dimensions upon loading.

### Steps to Resolve

1. **Check Browser Console:**
   - Open the developer console (usually by pressing `F12` or `Ctrl + Shift + I`) to view any error messages or logs.

2. **Verify File Paths:**
   - Ensure that `app.js` is correctly linked in `index.html` and that all files are in their respective directories.

3. **Reload the Page:**
   - Sometimes, simply reloading the page can resolve temporary glitches.

4. **Clear Cache:**
   - Clear your browser cache to ensure that the latest versions of your scripts are loaded.

5. **Ensure Compatibility:**
   - Make sure you're using a modern browser that supports all required APIs like `Canvas`, `Web Audio`, `MediaRecorder`, and `BroadcastChannel`.

## Contributing

We welcome contributions to enhance the **Trippy Effects App**! Whether it's fixing bugs, adding new features, improving documentation, or optimizing performance, your input is valuable.

### Steps to Contribute:

1. **Fork the Repository:**
   - Click the **"Fork"** button at the top-right corner of the repository page to create a copy under your GitHub account.

2. **Clone Your Fork:**
   - Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/yourusername/trippy-effects-app.git
   ```

3. **Create a New Branch:**
   - Create a branch for your feature or bug fix.

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes:**
   - Implement your changes in the codebase.

5. **Commit Your Changes:**
   - Commit your changes with a descriptive message.

   ```bash
   git commit -m "Add feature X"
   ```

6. **Push to Your Fork:**
   - Push your changes to your forked repository.

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request:**
   - Navigate to the original repository and create a pull request from your forked repository.

8. **Review Process:**
   - The maintainers will review your pull request and may request changes or provide feedback.

9. **Merge:**
   - Once approved, your changes will be merged into the main codebase.

### Guidelines:

- **Code Quality:** Ensure your code follows consistent styling and is well-documented.
- **Commit Messages:** Write clear and concise commit messages.
- **Testing:** Test your changes thoroughly to prevent introducing new bugs.
- **Respect the Community:** Be respectful and considerate in all communications and interactions.

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software as per the terms of the license.

## Acknowledgements

- **[PDF.js](https://github.com/mozilla/pdf.js/):** For enabling PDF rendering within the app.
- **[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API):** For powerful 2D graphics rendering.
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API):** For audio analysis and visualization.
- **[MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder):** For recording the canvas as video.
- **[BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel):** For real-time communication between windows.

---

Thank you for using the **Trippy Effects App**! We hope it brings creativity and joy to your media projects. If you have any questions, suggestions, or feedback, please feel free to [open an issue](https://github.com/yourusername/trippy-effects-app/issues) or [reach out](mailto:your.email@example.com).

Happy Creating! 🎨✨