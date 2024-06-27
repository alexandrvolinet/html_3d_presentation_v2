import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

// Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow map
camera.position.setZ(10); // Start camera a bit further back
camera.position.setY(-2);
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

// Cool white glow lights
const coolWhiteLight1 = new THREE.PointLight(0xe0ffff, 1, 10);
coolWhiteLight1.position.set(0, -1, 2);
scene.add(coolWhiteLight1);

const coolWhiteLight2 = new THREE.PointLight(0xe0ffff, 0.5, 10);
coolWhiteLight2.position.set(0, -1, -2);
scene.add(coolWhiteLight2);

// Additional white light
const additionalLight = new THREE.PointLight(0xffffff, 1.5, 10);
additionalLight.position.set(-5, 0, 0);
scene.add(additionalLight);

// Background
const textureLoader = new THREE.TextureLoader();
textureLoader.load('background.png', function(texture) {
  const geometry = new THREE.SphereGeometry(600, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(0, 0, 0); // initial sphere position
  sphere.rotation.y = Math.PI / 1; // rotate sphere left
  sphere.rotation.x = Math.PI / -5; //rotate sphere down
  scene.add(sphere);
});

// Create pedestals with different sizes
const pedestalGeometry1 = new THREE.CylinderGeometry(1.2, 1.2, 2, 64);
const pedestalGeometry2 = new THREE.CylinderGeometry(2.2, 2.2, 2, 64);
const pedestalGeometry3 = new THREE.CylinderGeometry(2.3, 2.27, 2, 64);
const pedestalMaterial = new THREE.MeshPhongMaterial({ color: 0x080B10 });
const pedestal1 = new THREE.Mesh(pedestalGeometry1, pedestalMaterial);
const pedestal2 = new THREE.Mesh(pedestalGeometry2, pedestalMaterial);
const pedestal3 = new THREE.Mesh(pedestalGeometry3, pedestalMaterial);

pedestal1.position.set(0, -3.5, 0);
pedestal2.position.set(0, -3.53, 0);
pedestal3.position.set(0, -3.56, 0);

pedestal1.receiveShadow = true; // Enable shadow receiving for pedestals
pedestal2.receiveShadow = true;
pedestal3.receiveShadow = true;

scene.add(pedestal1, pedestal2, pedestal3);

// Load coin model and add to scene
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0x0080FF, roughness: 0.1, metalness: 0.4 });
const coinLoader = new GLTFLoader();
let coins = [];
coinLoader.load('/coin.gltf', function (gltf) {
  const positions = [

    //right side
    [2, 0, 2],
    [2, 1, -2],
    [2.5, -1, 1],
    [3, 1, 0.5],
    [2, 0, -2.5],
    [2.5, -2, 1.9],
    [1, 1, 1.5],
    [0.2, 1.9, 0],

    //left side
    [-2, 0, 1.2],
    [-1, -1, -2],
    [-2, -1.7, 3],
    [-2, -1, 0],
    [-2, 1, -1],
    [-2.5, 1, 2],
    [-0.4, 1.5, -1],
    [-3.9, 0.4, 2],

  ];

  positions.forEach((position, index) => {
    let coin = gltf.scene.clone();
    coin.scale.set(0.3, 0.3, 0.3); // Set coin size
    coin.position.set(...position); // Set initial position

    // Apply the matte material to the coins
    coin.traverse((child) => {
      if (child.isMesh) {
        child.material = coinMaterial.clone();
        // Modify shader to reduce light intensity on the coins
        child.material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
            `
              outgoingLight *= 0.3; // Reduce the light intensity
              gl_FragColor = vec4( outgoingLight, diffuseColor.a );
            `
          );
        };
      }
    });

    scene.add(coin);
    coins.push(coin);
  });

  // Start the coin animation after loading
  coins.forEach(coin => randomizeCoinRotation(coin));
}, undefined, function (error) {
  console.error(error);
});

// Function to create random rotation for each coin
function randomizeCoinRotation(coin) {
  let axis1 = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
  let axis2 = ['x', 'y', 'z'].filter(axis => axis !== axis1)[Math.floor(Math.random() * 2)];
  let duration1 = Math.random() * 5 + 10; // Random duration between 10 and 15 seconds
  let duration2 = Math.random() * 5 + 10; // Random duration between 10 and 15 seconds

  gsap.to(coin.rotation, {
    [axis1]: Math.PI * 2,
    duration: duration1,
    repeat: -1,
    ease: "none",
    onRepeat: () => {
      axis1 = ['x', 'y', 'z'][Math.floor(Math.random() * 3)];
      axis2 = ['x', 'y', 'z'].filter(axis => axis !== axis1)[Math.floor(Math.random() * 2)];
      duration1 = Math.random() * 5 + 10;
      duration2 = Math.random() * 5 + 10;
    }
  });

  gsap.to(coin.rotation, {
    [axis2]: Math.PI * 2,
    duration: duration2,
    repeat: -1,
    ease: "none"
  });
}

// Parameters for controlling timings
const videoPauseTime = 27500; // Time in milliseconds to pause the video
const buttonShowTime = 28100; // Time in milliseconds to show the button
const transitionToLastPhaseDuration = 26500; //26500 Duration for the transition to the last phase in milliseconds

// Video loading event
video.addEventListener('canplaythrough', () => {
  assetsLoaded.video = true;
  checkAssetsLoaded();
});

// Scroll Animation
let currentPhase = 0;
let isAnimating = false;
let timer = null;
let phase2Timeout = null;
let animationStarted = false; // Flag to track if the animation has started

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
      animationStarted = false; // Reset the flag when returning to phase 0
    }

    // Phase 1: Move camera back over the specified duration
    if (currentPhase === 1) {
      isAnimating = true;
      gsap.to(camera.position, {
        z: 12, y: -2, duration: transitionToLastPhaseDuration / 1000, onComplete: () => {
          isAnimating = false;
          moveCamera('down'); // Automatically move to phase 2
        }
      });
    }

    // Phase 2: Rotate camera around the phone with rotation and zoom animation
    if (currentPhase === 2) {
      isAnimating = true;
    
      const rotationDuration = 1.5; // Duration for full rotation
      const zoomDuration = 1.5; // Duration for zoom effect
      const endZoom = 11; // Final zoom position
    
      const startPosition = { angle: 0, zoom: 12 };
    
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating = false;
          showButton(); // Show the button after the animation completes
        }
      });
    
      tl.to(startPosition, {
        angle: Math.PI * 2,
        zoom: endZoom,
        duration: rotationDuration,
        ease: "power2.easeInOut",
        onUpdate: () => {
          camera.position.x = startPosition.zoom * Math.sin(startPosition.angle);
          camera.position.z = startPosition.zoom * Math.cos(startPosition.angle);
           // Keep the camera y position constant
           camera.lookAt(phone.position.x, -0.49, phone.position.z);
        }
      });
    
      tl.to(camera.position, {
        z: endZoom,
        duration: zoomDuration,
        ease: "power4.easeInOut",
        onUpdate: () => {
          camera.lookAt(phone.position.x, -0.49, phone.position.z);
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

function hideButton() {
  const button = document.getElementById('button');
  button.style.opacity = 0;
  setTimeout(() => {
    button.style.display = 'none';
  }, 500); // Wait for opacity transition before hiding
}

window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0 && currentPhase === 0 && !animationStarted) {
    animationStarted = true; // Set the flag to indicate animation has started
    video.play();
    
    setTimeout(() => {
      moveCamera('down'); // Move to phase 2
    }, videoPauseTime - transitionToLastPhaseDuration);
  
    setTimeout(() => {
      video.pause();
    }, videoPauseTime);
  
    setTimeout(() => {
      showButton(); // Show the button
    }, buttonShowTime);
    
    moveCamera('down');
  } else if (event.deltaY < 0 && currentPhase === 2) {
    resetToInitialState(); // Reset to initial state
  } else if (event.deltaY < 0 && currentPhase === 0) {
    video.pause();
    isAnimating = false;
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
  if (touchEndY < touchStartY && currentPhase === 0 && !animationStarted) {
    animationStarted = true; // Set the flag to indicate animation has started
    video.play();
    
    setTimeout(() => {
      moveCamera('down'); // Move to phase 2
    }, videoPauseTime - transitionToLastPhaseDuration);
  
    setTimeout(() => {
      video.pause();
    }, videoPauseTime);
  
    setTimeout(() => {
      showButton(); // Show the button
    }, buttonShowTime);
    
    moveCamera('down');
  } else if (touchEndY > touchStartY && currentPhase === 2) {
    resetToInitialState(); // Reset to initial state
  } else if (touchEndY > touchStartY && currentPhase === 0) {
    video.pause();
    isAnimating = false;
  }
});

// Function to reset to the initial state
function resetToInitialState() {
  currentPhase = 0;
  isAnimating = false;
  gsap.to(camera.position, {
    z: 10, y: -2, duration: 1, onComplete: () => {
      animationStarted = false; // Reset the flag when returning to the initial phase
      hideButton(); // Hide the button
    }
  });
  camera.rotation.x = Math.PI / 25; // Reset camera rotation
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
