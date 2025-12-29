// src/scene/scene.ts
import * as THREE from 'three';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

export const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

// Grid (visual reference)
const grid = new THREE.GridHelper(100, 100);
scene.add(grid);

// Invisible plane for raycasting
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({ visible: false })
);
plane.rotateX(-Math.PI / 2);
scene.add(plane);
