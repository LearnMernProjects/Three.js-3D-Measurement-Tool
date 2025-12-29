import * as THREE from 'three';
import System from './baseClasses/System';

export class MeasurementSystem extends System {
  private scene: THREE.Scene | null = null;

  private isActive = false;
  private isMeasuring = false;
  private startPoint: THREE.Vector3 | null = null;

  // Preview
  private previewLine: THREE.Line | null = null;
  private previewMaterial: THREE.LineDashedMaterial | null = null;

  // Final measurements
  private measurements: THREE.Group[] = [];
  private finalLineMaterial: THREE.LineBasicMaterial | null = null;
  public clearAllMeasurements() {
  for (const group of this.measurements) {
    this.scene!.remove(group);
  }
  this.measurements = [];
}

public undoLastMeasurement() {
  const last = this.measurements.pop();
  if (!last) return;

  this.scene!.remove(last);
}

public isMeasurementActive(): boolean {
  return this.isActive;
}


  /*
     INIT
  */
  init(dependencies: { scene: THREE.Scene; camera: THREE.Camera }) {
    this.scene = dependencies.scene;
    // camera parameter is not currently used but kept for future extensibility

    this.previewMaterial = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.5,
      gapSize: 0.3,
    });
    this.previewMaterial.transparent = true;
    this.previewMaterial.depthTest = false;

    this.finalLineMaterial = new THREE.LineBasicMaterial({
      color: 0x2563eb,
    });
  }

  /*
     TOOL LIFECYCLE
  */
  activate() {
    this.isActive = true;
    this.isMeasuring = false;
    this.startPoint = null;
  }

  deactivate() {
    this.cancelMeasurement();
    this.isActive = false;
  }

  /*
     EVENT ENTRY POINT
  */
  handleEvent(category: string, eventData: any): boolean {
    if (!this.isActive) return false;

    if (category === 'MOUSE' && eventData.type === 'MOUSE_MOVE') {
      this.updatePreviewLine(eventData.worldPosition);
      return true;
    }

    if (category === 'MOUSE' && eventData.type === 'MOUSE_CLICK') {
      this.handleClick(eventData.worldPosition);
      return true;
    }

    if (category === 'KEY' && eventData.key === 'Escape') {
      this.cancelMeasurement();
      return true;
    }

    return false;
  }

  /*
     CLICK LOGIC
  */
  private handleClick(worldPosition: THREE.Vector3) {
    // First click
    if (!this.isMeasuring) {
      this.startPoint = worldPosition.clone();
      this.isMeasuring = true;

      const geom = new THREE.BufferGeometry().setFromPoints([
        this.startPoint,
        this.startPoint,
      ]);

      this.previewLine = new THREE.Line(geom, this.previewMaterial!);
      this.previewLine.computeLineDistances();
      this.scene!.add(this.previewLine);
      return;
    }

    // Second click
    if (this.previewLine) {
      this.scene!.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      this.previewLine = null;
    }

    const endPoint = worldPosition.clone();
    const group = this.createMeasurementGroup(this.startPoint!, endPoint);

    this.scene!.add(group);
    this.measurements.push(group);

    this.isMeasuring = false;
    this.startPoint = null;
  }

  /*
     PREVIEW UPDATE
  */
  private updatePreviewLine(worldPosition: THREE.Vector3) {
    if (!this.isMeasuring || !this.previewLine || !this.startPoint) return;

    this.previewLine.geometry.setFromPoints([
      this.startPoint,
      worldPosition,
    ]);
    this.previewLine.computeLineDistances();
  }

  /*
     FINAL MEASUREMENT GROUP
  */
  private createMeasurementGroup(
    start: THREE.Vector3,
    end: THREE.Vector3
  ): THREE.Group {
    const group = new THREE.Group();

    // Main line
    const lineGeom = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(lineGeom, this.finalLineMaterial!);
    group.add(line);

    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const arrowSize = 0.4;

    // Arrowheads
    group.add(this.createArrow(end, dir.clone().negate(), arrowSize));
    group.add(this.createArrow(start, dir, arrowSize));

    // Extension lines
    group.add(this.createExtensionLine(start, dir));
    group.add(this.createExtensionLine(end, dir));

    /*DISTANCE LABEL (FIXED & PARALLEL)*/

    const distance = start.distanceTo(end);
    const label = `${distance.toFixed(2)} m`;
    const textSprite = this.createTextSprite(label);

    const midPoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);

    // Perpendicular normal in XZ plane
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

    // Place BELOW the line
    textSprite.position
      .copy(midPoint)
      .add(normal.multiplyScalar(-0.4));

    // Rotate EXACTLY parallel to line
    textSprite.material.rotation = Math.atan2(dir.z, dir.x);

    group.add(textSprite);
    return group;
  }

  /*
     ARROW
  */
  private createArrow(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    size: number
  ): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(size * 0.4, size, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x2563eb });

    const cone = new THREE.Mesh(geometry, material);

    const offset = direction.clone().multiplyScalar(size * 0.5);
    cone.position.copy(position).add(offset);

    const up = new THREE.Vector3(0, 1, 0);
    cone.quaternion.setFromUnitVectors(up, direction.clone().negate());

    return cone;
  }

  /*
     EXTENSION LINE
  */
  private createExtensionLine(
    point: THREE.Vector3,
    direction: THREE.Vector3
  ): THREE.Line {
    const normal = new THREE.Vector3(-direction.z, 0, direction.x).normalize();

    const gap = 0.2;
    const overshoot = 0.3;

    const p1 = point.clone().add(normal.clone().multiplyScalar(gap));
    const p2 = point.clone().add(normal.clone().multiplyScalar(gap + overshoot));

    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    return new THREE.Line(geom, this.finalLineMaterial!);
  }

  /*
     TEXT SPRITE (HIGH RES)
  */
  private createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // High resolution text
    const fontSize = 64;
    const padding = 20;

    ctx.font = `bold ${fontSize}px monospace`;
    const width = ctx.measureText(text).width;

    canvas.width = width + padding * 2;
    canvas.height = fontSize + padding * 2;

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2563eb';
    ctx.textBaseline = 'top';
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillText(text, padding, padding);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);

    // Downscale in world units
    const scale = 0.01;
    sprite.scale.set(
      canvas.width * scale,
      canvas.height * scale,
      1
    );

    return sprite;
  }

  /*
     CANCEL
  */
  private cancelMeasurement() {
    if (this.previewLine) {
      this.scene!.remove(this.previewLine);
      this.previewLine.geometry.dispose();
      this.previewLine = null;
    }
    this.isMeasuring = false;
    this.startPoint = null;
  }
}

export default MeasurementSystem;
