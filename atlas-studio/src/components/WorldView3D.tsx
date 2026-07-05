import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { StudioWorldState } from '../types/protocol'

interface Props {
  world: StudioWorldState
}

function hashColor(label: string): THREE.Color {
  let h = 0
  for (let i = 0; i < label.length; i++) {
    h = ((h << 5) - h + label.charCodeAt(i)) | 0
  }
  const hue = ((h & 0xffff) / 0xffff) * 0.6 + 0.5
  return new THREE.Color().setHSL(hue % 1, 0.8, 0.5)
}

export default function WorldView3D({ world }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    robot: THREE.Group
    objectMap: Map<string, THREE.Mesh>
    labelMap: Map<string, THREE.Sprite>
    animId: number
  } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a3e)

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200)
    camera.position.set(10, 8, 10)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.minDistance = 2
    controls.maxDistance = 50
    controls.maxPolarAngle = Math.PI / 2.1
    controls.target.set(0, 0, 0)

    const ambient = new THREE.AmbientLight(0x6688cc, 0.4)
    scene.add(ambient)

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a5f3a, 0.6)
    scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5)
    sun.position.set(30, 40, 20)
    sun.castShadow = true
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 80
    sun.shadow.camera.left = -40
    sun.shadow.camera.right = 40
    sun.shadow.camera.top = 40
    sun.shadow.camera.bottom = -40
    scene.add(sun)

    const groundGeo = new THREE.PlaneGeometry(120, 120)
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9, metalness: 0 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const grid = new THREE.GridHelper(120, 40, 0x88bb55, 0x669944)
    grid.position.y = 0.05
    scene.add(grid)

    const robot = new THREE.Group()
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 0.8)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, metalness: 0.6, roughness: 0.3 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.15
    robot.add(body)

    const armMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.5 })
    const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6)
    const offsets = [[-0.5, 0, -0.5], [0.5, 0, -0.5], [-0.5, 0, 0.5], [0.5, 0, 0.5]]
    for (const [dx, , dz] of offsets) {
      const arm = new THREE.Mesh(armGeo, armMat)
      const dir = new THREE.Vector3(dx, 0, dz).normalize()
      const mid = new THREE.Vector3(dx * 0.5, 0.15, dz * 0.5)
      arm.position.copy(mid)
      arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
      robot.add(arm)

      const rotorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16)
      const rotorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      const rotor = new THREE.Mesh(rotorGeo, rotorMat)
      rotor.position.set(dx, 0.3, dz)
      robot.add(rotor)
    }

    const lightMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222 })
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), lightMat)
    light.position.set(0, -0.05, 0.4)
    robot.add(light)

    robot.position.set(world.position.x, world.position.z, world.position.y)
    scene.add(robot)
    scene.fog = new THREE.Fog(0x1a1a3e, 30, 100)

    const objectMap = new Map<string, THREE.Mesh>()
    const labelMap = new Map<string, THREE.Sprite>()
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64

    function createLabel(text: string, color: THREE.Color): THREE.Sprite {
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, 128, 64)
      ctx.fillStyle = `rgba(0,0,0,0.6)`
      const rx = 60
      ctx.beginPath()
      ctx.roundRect(4, 4, 120, 56, rx)
      ctx.fill()
      ctx.fillStyle = `#${color.getHexString()}`
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, 64, 34)
      const tex = new THREE.CanvasTexture(canvas)
      const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })
      const sprite = new THREE.Sprite(mat)
      sprite.scale.set(2, 1, 1)
      return sprite
    }

    for (const obj of world.objects) {
      const color = hashColor(obj.label)
      const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(obj.x, 0.3, obj.y)
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)
      objectMap.set(obj.label, mesh)

      const label = createLabel(obj.label, color)
      label.position.set(obj.x, 1.2, obj.y)
      scene.add(label)
      labelMap.set(obj.label, label)
    }

    sceneRef.current = { scene, camera, renderer, controls, robot, objectMap, labelMap, animId: 0 }

    function animate() {
      const id = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
      sceneRef.current!.animId = id
    }
    animate()

    const c = container
    function onResize() {
      const w = c.clientWidth
      const h = c.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(sceneRef.current!.animId)
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ctx = sceneRef.current
    if (!ctx) return

    ctx.robot.position.set(world.position.x, world.position.z, world.position.y)

    const seen = new Set<string>()
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64

    for (const obj of world.objects) {
      seen.add(obj.label)
      let mesh = ctx.objectMap.get(obj.label)
      const color = hashColor(obj.label)
      if (!mesh) {
        const geo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2 })
        mesh = new THREE.Mesh(geo, mat)
        mesh.castShadow = true
        mesh.receiveShadow = true
        ctx.scene.add(mesh)
        ctx.objectMap.set(obj.label, mesh)
      }
      mesh.position.set(obj.x, 0.3, obj.y)
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat.color.equals(color)) {
        mat.color.copy(color)
      }

      let label = ctx.labelMap.get(obj.label)
      if (!label) {
        const spriteMat = new THREE.SpriteMaterial({ depthTest: false, transparent: true })
        label = new THREE.Sprite(spriteMat)
        label.scale.set(2, 1, 1)
        ctx.scene.add(label)
        ctx.labelMap.set(obj.label, label)
      }
      label.position.set(obj.x, 1.2, obj.y)
      const ctx2d = canvas.getContext('2d')!
      ctx2d.clearRect(0, 0, 128, 64)
      ctx2d.fillStyle = `rgba(0,0,0,0.6)`
      ctx2d.beginPath()
      ctx2d.roundRect(4, 4, 120, 56, 60)
      ctx2d.fill()
      ctx2d.fillStyle = `#${color.getHexString()}`
      ctx2d.font = 'bold 16px Arial'
      ctx2d.textAlign = 'center'
      ctx2d.textBaseline = 'middle'
      ctx2d.fillText(obj.label, 64, 34)
      if (label.material.map) label.material.map.dispose()
      const tex = new THREE.CanvasTexture(canvas)
      label.material.map = tex
      label.material.needsUpdate = true
    }

    for (const [key, mesh] of ctx.objectMap) {
      if (!seen.has(key)) {
        ctx.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
        ctx.objectMap.delete(key)
      }
    }
    for (const [key, sprite] of ctx.labelMap) {
      if (!seen.has(key)) {
        ctx.scene.remove(sprite)
        sprite.material.dispose()
        ctx.labelMap.delete(key)
      }
    }
  }, [world])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #30363d' }}
    />
  )
}
