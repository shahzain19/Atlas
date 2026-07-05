import * as THREE from 'three';

export class Environment {
  public group: THREE.Group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.createSky(scene);
    this.createGround(scene);
    this.createLighting(scene);
    this.createFog(scene);
  }

  private createSky(scene: THREE.Scene): void {
    scene.background = new THREE.Color(0x87ceeb);

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(0.4, '#4a90d9');
    grad.addColorStop(0.7, '#87ceeb');
    grad.addColorStop(1, '#c8e6c9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
  }

  private createGround(scene: THREE.Scene): void {
    const geo = new THREE.PlaneGeometry(120, 120, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a7c3f,
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.group.add(ground);

    const gridHelper = new THREE.GridHelper(120, 40, 0x88bb55, 0x669944);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);
    this.group.add(gridHelper);
  }

  private createLighting(scene: THREE.Scene): void {
    const ambient = new THREE.AmbientLight(0x6688cc, 0.4);
    scene.add(ambient);
    this.group.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a5f3a, 0.6);
    scene.add(hemi);
    this.group.add(hemi);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(30, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);
    this.group.add(sun);
  }

  private createFog(scene: THREE.Scene): void {
    scene.fog = new THREE.Fog(0x87ceeb, 30, 100);
  }
}
