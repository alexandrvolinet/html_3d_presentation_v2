import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow map
camera.position.setZ(5.1); // Start camera a bit further back
camera.position.setY(-1.5);
camera.position.setX(0); // Center camera
camera.rotation.x = Math.PI / 25; // Tilt camera up

renderer.render(scene, camera);

// Load the phone model
const loader = new GLTFLoader();
let phone;
let videoTexture;

// Add video texture to the phone screen
const video = document.getElementById('video');
videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

const assetsLoaded = {
  video: false,
  model: false
};

function checkAssetsLoaded() {
  if (assetsLoaded.video && assetsLoaded.model) {
    document.getElementById('loading-screen').style.display = 'none';
  }
}

loader.load('/scene.gltf', function (gltf) {
  phone = gltf.scene;
  phone.castShadow = true; // Enable shadow casting for the phone
  scene.add(phone);
  phone.position.set(0, -1.3, 0);

  phone.traverse((child) => {
    if (child.isMesh && child.name === 'phoneScreen') {
      let material = new THREE.MeshBasicMaterial({ map: videoTexture });

      // Adjust texture scaling and offset
      material.map.repeat.set(1.10, 1.00);
      material.map.offset.set(0.0, 0.008); // Center the scaled texture

      child.material = material;

      material.map.rotation = -Math.PI / 2; // Rotate the texture to fit the vertical screen
      material.map.center.set(0.5, 0.5); // Set rotation center
    }
  });

  assetsLoaded.model = true;
  checkAssetsLoaded();

}, undefined, function (error) {
  console.error(error);
});

// Lights
const pointLight = new THREE.DirectionalLight(0xffffff, 1);
pointLight.position.set(0, 20, 10);
pointLight.castShadow = true; // Enable shadows for the point light
pointLight.shadow.camera.top = 10;
pointLight.shadow.camera.bottom = -10;
pointLight.shadow.camera.left = -10;
pointLight.shadow.camera.right = 10;
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

// Background
const backgroundColor = new THREE.Color(0x010912);
scene.background = backgroundColor;

// Create pedestals with different sizes
const pedestalGeometry1 = new THREE.CylinderGeometry(1.5, 1.5, 1, 64);
const pedestalGeometry2 = new THREE.CylinderGeometry(2.5, 2.5, 1, 64);
const pedestalGeometry3 = new THREE.CylinderGeometry(2.7, 2.7, 1, 64);
const pedestalMaterial = new THREE.MeshPhongMaterial({ color: 0x080B10 });
const pedestal1 = new THREE.Mesh(pedestalGeometry1, pedestalMaterial);
const pedestal2 = new THREE.Mesh(pedestalGeometry2, pedestalMaterial);
const pedestal3 = new THREE.Mesh(pedestalGeometry3, pedestalMaterial);

pedestal1.position.set(0, -2.9, 0);
pedestal2.position.set(0, -2.93, 0);
pedestal3.position.set(0, -2.96, 0);

pedestal1.receiveShadow = true; // Enable shadow receiving for pedestals
pedestal2.receiveShadow = true;
pedestal3.receiveShadow = true;

scene.add(pedestal1, pedestal2, pedestal3);

// Load coin model and add to scene
const coinLoader = new GLTFLoader();
let coins = [];
coinLoader.load('/coin.gltf', function (gltf) {
  const positions = [
    [2, 0.1, -1],
    [2, 1, -2],
    [-1.5, 1, 0],
    [-1.5, -1, 2],
    [-2, 1.5, 2]
  ];

  positions.forEach((position, index) => {
    let coin = gltf.scene.clone();
    coin.scale.set(0.3, 0.3, 0.3); // Set coin size
    coin.position.set(...position); // Set initial position

    let axis = ['x', 'y', 'z'][Math.floor(Math.random() * 3)]; // Randomly choose an axis to rotate
    let direction = Math.random() > 0.5 ? 1 : -1; // Randomly choose direction

    gsap.to(coin.rotation, {
      [axis]: direction * Math.PI * 2,
      duration: 5,
      repeat: -1,
      ease: "none"
    });

    scene.add(coin);
    coins.push(coin);
  });
}, undefined, function (error) {
  console.error(error);
});

// Video loading event
video.addEventListener('canplaythrough', () => {
  assetsLoaded.video = true;
  checkAssetsLoaded();

  setTimeout(() => {
    moveCamera('down'); // Move to phase 2
  }, 28000);

  setTimeout(() => {
    video.pause();
  }, 28000);
});

// Scroll Animation
let currentPhase = 0;
let isAnimating = false;
let timer = null;
let phase2Timeout = null;

function moveCamera(direction) {
  if (phone && !isAnimating) {
    if (direction === 'down' && currentPhase < 2) {
      currentPhase++;
    } else if (direction === 'up' && currentPhase > 0) {
      currentPhase--;
    }

    // Phase 0: Initial phase
    if (currentPhase === 0) {
      clearTimeout(phase2Timeout);
      isAnimating = true;
    }

    // Phase 1: Move camera back over 28 seconds
    if (currentPhase === 1) {
      isAnimating = true;
      gsap.to(camera.position, {
        z: 6.1, y: -1.8, duration: 28, onComplete: () => {
          isAnimating = false;
          moveCamera('down'); // Automatically move to phase 2
        }
      });
    }

    // Phase 2: Rotate camera around the phone with rotation and zoom animation
    if (currentPhase === 2) {
      isAnimating = true;
      video.pause();

      const rotationDuration = 1.5; // Duration for full rotation
      const zoomDuration = 1.5; // Duration for zoom effect
      const endZoom = 6.1; // Final zoom position

      const startPosition = { angle: 0, zoom: 7 };
      const endPosition = { angle: Math.PI * 2, zoom: endZoom };

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
          showButton(); // Show the button after the animation completes
        }
      });

      tl.to(startPosition, {
        angle: endPosition.angle,
        zoom: endPosition.zoom,
        duration: rotationDuration,
        ease: "power4.easeInOut",
        onUpdate: () => {
          camera.position.x = startPosition.zoom * Math.sin(startPosition.angle);
          camera.position.z = startPosition.zoom * Math.cos(startPosition.angle);
          camera.lookAt(phone.position);
        }
      });

      tl.to(camera.position, {
        z: endZoom,
        duration: zoomDuration,
        ease: "power4.easeInOut",
        onUpdate: () => {
          camera.lookAt(phone.position);
        }
      });
    }
    camera.updateProjectionMatrix();
  }
}

function showButton() {
  const button = document.getElementById('button');
  button.style.display = 'block';
  setTimeout(() => {
    button.style.opacity = 1;
  }, 100); // Slight delay to ensure the display property is set before transitioning opacity
}

window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0) {
    video.play(); // Ensure video plays when scrolling down
    moveCamera('down');
  } else {
    video.pause(); // Ensure video pauses when scrolling up
    moveCamera('up');
  }
});

// Add touch event listeners for mobile devices
let touchStartY = 0;
let touchEndY = 0;

window.addEventListener('touchstart', (event) => {
  touchStartY = event.changedTouches[0].screenY;
}, false);

window.addEventListener('touchmove', (event) => {
  touchEndY = event.changedTouches[0].screenY;
}, false);

window.addEventListener('touchend', () => {
  if (touchEndY < touchStartY) {
    video.play(); // Ensure video plays when scrolling down
    moveCamera('down');
  } else if (touchEndY > touchStartY) {
    video.pause(); // Ensure video pauses when scrolling up
    moveCamera('up');
  }
}, false);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

// Start video in phase 0
window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0 && currentPhase === 0) {
    video.play();
    moveCamera('down');
  } else if (event.deltaY < 0 && currentPhase === 0) {
    video.pause();
    isAnimating = false;
  }
});