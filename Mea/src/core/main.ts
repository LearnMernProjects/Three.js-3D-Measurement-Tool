// src/main.ts
import * as THREE from 'three';
import { MeasurementSystem } from '../core/MeasurementSystem';
import { scene, camera } from './scene/scene';

/* =====================
   RENDERER
===================== */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* =====================
   RAYCASTING
===================== */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* =====================
   UI STATE (ONLY FOR UI)
===================== */
let firstPoint: THREE.Vector3 | null = null;

/* =====================
   MEASUREMENT SYSTEM
===================== */
const measurementSystem = MeasurementSystem.createReference();
measurementSystem.init({ scene, camera });
measurementSystem.activate();

/* =====================
   UI PANEL (TOP RIGHT)
===================== */
const measurementPanel = document.createElement('div');
measurementPanel.style.position = 'fixed';
measurementPanel.style.top = '15px';
measurementPanel.style.right = '35px';
measurementPanel.style.background = 'rgba(255,255,255,0.9)';
measurementPanel.style.border = '1px solid #ccc';
measurementPanel.style.borderRadius = '8px';
measurementPanel.style.padding = '15px';
measurementPanel.style.fontFamily = 'monospace';
measurementPanel.style.fontSize = '22px';
measurementPanel.style.zIndex = '1000';

measurementPanel.innerHTML = `
  <strong>Measurement</strong>
  <table style="margin-top:8px">
    <tr><td>Distance</td><td id="ui-distance">–</td></tr>
    <tr><td>Angle X</td><td id="ui-x">–</td></tr>
    <tr><td>Angle Y</td><td id="ui-y">–</td></tr>
    <tr><td>Angle Z</td><td id="ui-z">–</td></tr>
  </table>

  <div style="margin-top:12px; display:flex; gap:8px;">
    <button id="btn-undo">Undo</button>
    <button id="btn-clear">Clear</button>
    <button id="btn-toggle">Disable</button>
  </div>
`;

document.body.appendChild(measurementPanel);

/* =====================
   UI BUTTON WIRING
===================== */
const btnUndo = document.getElementById('btn-undo')!;
const btnClear = document.getElementById('btn-clear')!;
const btnToggle = document.getElementById('btn-toggle')!;

btnUndo.addEventListener('click', () => {
  measurementSystem.undoLastMeasurement();
});

btnClear.addEventListener('click', () => {
  measurementSystem.clearAllMeasurements();
});

btnToggle.addEventListener('click', () => {
  if (measurementSystem.isMeasurementActive()) {
    measurementSystem.deactivate();
    btnToggle.textContent = 'Enable';
  } else {
    measurementSystem.activate();
    btnToggle.textContent = 'Disable';
  }
});

/* =====================
   UI UPDATE FUNCTION
===================== */
function updateMeasurementUI(
  distance: number,
  ax: number,
  ay: number,
  az: number
) {
  (document.getElementById('ui-distance') as HTMLElement).innerText =
    distance.toFixed(2) + ' m';

  (document.getElementById('ui-x') as HTMLElement).innerText =
    ax.toFixed(1) + '°';

  (document.getElementById('ui-y') as HTMLElement).innerText =
    ay.toFixed(1) + '°';

  (document.getElementById('ui-z') as HTMLElement).innerText =
    az.toFixed(1) + '°';
}

/* =====================
   CLICK → FINALIZE MEASUREMENT
===================== */
window.addEventListener('click', (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length === 0) return;

  const worldPosition = intersects[0].point.clone();

  /* UI distance + angle calculation */
  if (firstPoint === null) {
    firstPoint = worldPosition;
  } else {
    const dir = new THREE.Vector3()
      .subVectors(worldPosition, firstPoint)
      .normalize();

    const angleWithAxis = (axis: THREE.Vector3) =>
      THREE.MathUtils.radToDeg(
        Math.acos(THREE.MathUtils.clamp(dir.dot(axis), -1, 1))
      );

    updateMeasurementUI(
      firstPoint.distanceTo(worldPosition),
      angleWithAxis(new THREE.Vector3(1, 0, 0)),
      angleWithAxis(new THREE.Vector3(0, 1, 0)),
      angleWithAxis(new THREE.Vector3(0, 0, 1))
    );

    firstPoint = null;
  }

  /* Three.js measurement logic */
  measurementSystem.handleEvent('MOUSE', {
    type: 'MOUSE_CLICK',
    worldPosition,
  });
});

/* =====================
   MOUSE MOVE → PREVIEW
===================== */
window.addEventListener('mousemove', (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length === 0) return;

  measurementSystem.handleEvent('MOUSE', {
    type: 'MOUSE_MOVE',
    worldPosition: intersects[0].point.clone(),
  });
});

/* =====================
   KEYBOARD
===================== */
window.addEventListener('keydown', (event: KeyboardEvent) => {
  // Pass Escape to measurement system
  measurementSystem.handleEvent('KEY', {
    key: event.key,
  });

  // -------- STEP 8: KEYBOARD SHORTCUTS --------

  // Ctrl + Z → Undo last measurement
  if (event.ctrlKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    measurementSystem.undoLastMeasurement();
  }

  // Delete or Backspace → Clear all measurements
  if (event.key === 'Delete' || event.key === 'Backspace') {
    measurementSystem.clearAllMeasurements();
  }

  // M → Toggle measurement mode
  if (event.key.toLowerCase() === 'm') {
    if (measurementSystem.isMeasurementActive()) {
      measurementSystem.deactivate();
      const btn = document.getElementById('btn-toggle');
      if (btn) btn.textContent = 'Enable';
    } else {
      measurementSystem.activate();
      const btn = document.getElementById('btn-toggle');
      if (btn) btn.textContent = 'Disable';
    }
  }
});

/* =====================
   RESIZE
===================== */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* =====================
   RENDER LOOP
===================== */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
