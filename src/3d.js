import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Setup scene
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 3;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(150, 150);
renderer.setClearColor(0x000000, 0); // Transparante achtergrond

// Zorg dat container bestaat voordat je toevoegt
const container = document.getElementById('noteCanvasContainer');
if (container) {
  container.appendChild(renderer.domElement);
} else {
  console.error('noteCanvasContainer niet gevonden in HTML.');
}

// Licht
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// Texture laden (uit public folder)
const aoTexture = new THREE.TextureLoader().load('./public/textures/internal_ground_ao_texture.jpeg');

// Model laden (uit public folder)
const loader = new GLTFLoader();
let model;

loader.load('./public/models/Nota 2.glb',
  (gltf) => {
    model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        child.material.map = aoTexture;
        child.material.needsUpdate = true;
      }
    });

    model.scale.set(0.85, 0.85, 0.85);
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error('Fout bij laden van GLB-model:', error);
  }
);

function animate() {
  requestAnimationFrame(animate);

  const bpmSlider = document.getElementById('bpmSlider');
  const bpm = bpmSlider ? parseInt(bpmSlider.value) : 120; // fallback = 40 BPM
  const rotationSpeed = bpm / 3000; // experimenteer met deze deling voor juiste snelheid

  if (model) model.rotation.y += rotationSpeed;

  renderer.render(scene, camera);
}
animate();