import * as THREE from 'three';

export class Terrain {
  public mesh: THREE.Mesh;
  public group: THREE.Group = new THREE.Group();

  constructor(size: number = 60, segments: number = 80) {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.attributes.position;
    const vertCount = posAttr.count;
    const colors = new Float32Array(vertCount * 3);

    for (let i = 0; i < vertCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5
        + Math.sin(x * 0.7 + z * 0.5) * 0.25
        + Math.cos(z * 0.9 - x * 0.4) * 0.15;
      posAttr.setY(i, y);

      const h = (y + 1) / 2;
      const r = 0.2 + h * 0.5;
      const g = 0.3 + h * 0.5;
      const b = 0.1 + h * 0.2;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.0,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.position.y = 0;
    this.group.add(this.mesh);
  }

  getHeightAt(x: number, z: number): number {
    const y = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5
      + Math.sin(x * 0.7 + z * 0.5) * 0.25
      + Math.cos(z * 0.9 - x * 0.4) * 0.15;
    return y;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(m => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
