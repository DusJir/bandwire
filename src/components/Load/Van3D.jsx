import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { topLevel, footprint, colorFor, supportHeight, snapPosition } from '../../utils/load'

/**
 * 3D cargo view.
 * Mapping of our cargo axes to three.js:  x (length) → X,  z (height) → Y (up),  y (width) → Z.
 * So looking from behind the van, +Z is to the right, which matches y = 0 being the left wall.
 */

const CAM_DIRS = {
  iso:  [-0.8, 0.7, 1.0],
  top:  [-0.001, 1, 0.0],
  side: [0, 0.12, 1],
  rear: [-1, 0.12, 0],
}

const cssColor = (el, name, fallback) => {
  try {
    const v = getComputedStyle(el).getPropertyValue(name).trim()
    return new THREE.Color(v || fallback)
  } catch { return new THREE.Color(fallback) }
}

function labelSprite(text, scaleK, { fg = '#ffffff', bg = 'rgba(0,0,0,0.55)' } = {}) {
  const H = 96
  const probe = document.createElement('canvas').getContext('2d')
  probe.font = '600 46px sans-serif'
  const cw = Math.min(900, Math.ceil(probe.measureText(text).width) + 44)   // canvas fits the text → no stretching
  const canvas = document.createElement('canvas')
  canvas.width = cw; canvas.height = H
  const g = canvas.getContext('2d')
  g.font = '600 46px sans-serif'
  g.fillStyle = bg
  g.beginPath()
  if (g.roundRect) g.roundRect(2, 8, cw - 4, H - 16, 14); else g.rect(2, 8, cw - 4, H - 16)
  g.fill()
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(text, cw / 2, H / 2 + 1)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const spr = new THREE.Sprite(mat)
  const h = 16 * scaleK                       // world height in cm
  spr.scale.set(h * cw / H, h, 1)
  spr.userData.dispose = () => { tex.dispose(); mat.dispose() }
  return spr
}

function disposeGroup(group) {
  group.traverse(o => {
    o.geometry?.dispose?.()
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose?.())
    o.userData?.dispose?.()
  })
  group.clear()
}

export default function Van3D({ items, vehicle, problems, selectedId, gravity, preset, labels, onSelect, onDrag, onDragEnd, onUnsupported }) {
  const hostRef = useRef(null)
  const S = useRef({})                       // three.js objects
  const P = useRef({})                       // latest props for event handlers
  P.current = { items, vehicle, gravity, onSelect, onDrag, onDragEnd }

  // ── mount: renderer, camera, controls, pointer handling ──────────
  useEffect(() => {
    const host = hostRef.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch (e) {
      onUnsupported?.(e)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    host.appendChild(renderer.domElement)
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;'

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 5000)
    scene.add(new THREE.AmbientLight(0xffffff, 1.1))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(-200, 400, 250)
    scene.add(sun)

    const vanGroup = new THREE.Group()
    const itemsGroup = new THREE.Group()
    scene.add(vanGroup, itemsGroup)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    controls.screenSpacePanning = true

    let raf = 0
    const render = () => { raf = 0; renderer.render(scene, camera) }
    const requestRender = () => { if (!raf) raf = requestAnimationFrame(render) }
    controls.addEventListener('change', requestRender)

    const resize = () => {
      const w = host.clientWidth || 1, h = host.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      requestRender()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // ── picking + dragging ─────────────────────────────────────────
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const setRay = (e) => {
      const r = renderer.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
    }
    const pick = (e) => {
      setRay(e)
      const hits = ray.intersectObjects(itemsGroup.children.filter(o => o.userData.pickId), false)
      return hits[0] || null
    }

    let drag = null
    let click = null
    const dom = renderer.domElement

    const onDown = (e) => {
      if (e.button !== 0) return
      const hit = pick(e)
      if (!hit) { click = { x: e.clientX, y: e.clientY }; return }
      const id = hit.object.userData.pickId
      const it = P.current.items.find(i => i.id === id)
      if (!it?.pos) return
      controls.enabled = false
      P.current.onSelect?.(id)
      drag = {
        id,
        plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -hit.point.y),
        start: hit.point.clone(),
        pos: { ...it.pos },
      }
      dom.setPointerCapture?.(e.pointerId)
      dom.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!drag) {
        dom.style.cursor = pick(e) ? 'grab' : 'default'
        return
      }
      setRay(e)
      const pt = new THREE.Vector3()
      if (!ray.ray.intersectPlane(drag.plane, pt)) return
      const { items: its, vehicle: veh, gravity: grav } = P.current
      const it = its.find(i => i.id === drag.id)
      if (!it) return
      const cand = { x: drag.pos.x + (pt.x - drag.start.x), y: drag.pos.y + (pt.z - drag.start.z), rot: drag.pos.rot }
      const f = footprint({ ...it, pos: { ...drag.pos } })
      cand.x = Math.min(Math.max(0, cand.x), Math.max(0, veh.length - f.l))
      cand.y = Math.min(Math.max(0, cand.y), Math.max(0, veh.width - f.w))
      const snapped = snapPosition(it, cand, its, veh, 8)
      const x = Math.round(snapped.x), y = Math.round(snapped.y)
      const z = grav ? supportHeight(its, drag.id, x, y, drag.pos.rot) : drag.pos.z
      P.current.onDrag?.(drag.id, { x, y, z })
    }
    const onUp = (e) => {
      if (drag) {
        dom.releasePointerCapture?.(e.pointerId)
        drag = null
        controls.enabled = true
        dom.style.cursor = 'default'
        P.current.onDragEnd?.()
      } else if (click && Math.hypot(e.clientX - click.x, e.clientY - click.y) < 4) {
        P.current.onSelect?.(null)      // plain click on empty space
      }
      click = null
    }
    // capture phase: must run before OrbitControls so it can be disabled for item drags
    dom.addEventListener('pointerdown', onDown, true)
    dom.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    Object.assign(S.current, { renderer, scene, camera, controls, vanGroup, itemsGroup, requestRender, fitted: false })
    resize()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      dom.removeEventListener('pointerdown', onDown, true)
      dom.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      controls.dispose()
      disposeGroup(vanGroup); disposeGroup(itemsGroup)
      renderer.dispose()
      dom.remove()
      S.current = {}
    }
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── cargo area / van body (rebuilt when dimensions change) ───────
  useEffect(() => {
    const s = S.current
    if (!s.vanGroup) return
    disposeGroup(s.vanGroup)
    const L = vehicle.length, W = vehicle.width, H = vehicle.height
    const k = Math.max(L, W, H) / 300
    const line  = cssColor(hostRef.current, '--text-secondary', '#8888aa')
    const faint = line.clone()

    // cargo box (translucent) + edges
    const box = new THREE.BoxGeometry(L, H, W)
    const body = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: line, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide }))
    body.position.set(L / 2, H / 2, W / 2)
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: line }))
    edges.position.copy(body.position)
    s.vanGroup.add(body, edges)

    // floor + 50 cm grid
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), new THREE.MeshBasicMaterial({ color: line, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }))
    floor.rotation.x = -Math.PI / 2
    floor.position.set(L / 2, 0.05, W / 2)
    const pts = []
    for (let a = 50; a < L; a += 50) pts.push(a, 0.1, 0, a, 0.1, W)
    for (let b = 50; b < W; b += 50) pts.push(0, 0.1, b, L, 0.1, b)
    const gg = new THREE.BufferGeometry()
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const grid = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: faint, transparent: true, opacity: 0.25 }))
    s.vanGroup.add(floor, grid)

    // cab + wheels: just enough to see where the front is
    const cabL = Math.min(130, Math.max(60, L * 0.3))
    const cabH = Math.max(H, 90) * 0.85
    const cab = new THREE.BoxGeometry(cabL, cabH, W)
    const cabMesh = new THREE.Mesh(cab, new THREE.MeshBasicMaterial({ color: line, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide }))
    cabMesh.position.set(L + cabL / 2, cabH / 2, W / 2)
    const cabEdges = new THREE.LineSegments(new THREE.EdgesGeometry(cab), new THREE.LineBasicMaterial({ color: line, transparent: true, opacity: 0.5 }))
    cabEdges.position.copy(cabMesh.position)
    s.vanGroup.add(cabMesh, cabEdges)

    const r = Math.min(38, Math.max(22, H * 0.28))
    for (const wx of [L * 0.15, L + cabL * 0.55]) {
      for (const wz of [-6, W + 6]) {
        const geo = new THREE.CylinderGeometry(r, r, 20, 28)
        geo.rotateX(Math.PI / 2)
        const wheel = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: line, transparent: true, opacity: 0.22, depthWrite: false }))
        wheel.position.set(wx, -r * 0.55, wz)
        s.vanGroup.add(wheel)
      }
    }

    const rear = labelSprite(labels.rear, k, { fg: '#ffffff', bg: 'rgba(80,80,110,0.8)' })
    rear.position.set(-34 * k, 12 * k, W / 2)
    const cabLab = labelSprite(labels.cab, k, { fg: '#ffffff', bg: 'rgba(80,80,110,0.8)' })
    cabLab.position.set(L + cabL / 2, cabH + 14 * k, W / 2)
    s.vanGroup.add(rear, cabLab)

    // frame the van the first time, and whenever its size changes
    const span = Math.max(L + cabL, W, H)
    const center = new THREE.Vector3((L + cabL * 0.3) / 2 + 0, H / 3, W / 2)
    s.controls.target.copy(center)
    s.controls.maxDistance = span * 5
    s.controls.minDistance = span * 0.3
    s.span = span; s.center = center
    if (!s.fitted) { applyPreset(s, 'iso'); s.fitted = true }
    s.requestRender()
  }, [vehicle.length, vehicle.width, vehicle.height, labels.rear, labels.cab])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── cargo units ──────────────────────────────────────────────────
  useEffect(() => {
    const s = S.current
    if (!s.itemsGroup) return
    disposeGroup(s.itemsGroup)
    const k = Math.max(vehicle.length, vehicle.width, vehicle.height) / 300
    const edgeDefault = cssColor(hostRef.current, '--text-primary', '#e0e0f0')

    for (const it of topLevel(items).filter(i => i.pos)) {
      const f = footprint(it)
      const bad = problems.overlapping.has(it.id) || problems.outside.has(it.id)
      const sel = it.id === selectedId
      const col = new THREE.Color(colorFor(it))
      const geo = it.shape === 'circle'
        ? new THREE.CylinderGeometry(f.l / 2, f.l / 2, it.h, 36)
        : new THREE.BoxGeometry(f.l, it.h, f.w)
      const mat = new THREE.MeshStandardMaterial({
        color: col, roughness: 0.65, metalness: 0.05, transparent: true, opacity: sel ? 0.97 : 0.88,
        emissive: bad ? new THREE.Color(0xef4444) : new THREE.Color(0x000000), emissiveIntensity: bad ? 0.35 : 0,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(it.pos.x + f.l / 2, it.pos.z + it.h / 2, it.pos.y + f.w / 2)
      mesh.userData.pickId = it.id
      s.itemsGroup.add(mesh)

      const edgeCol = bad ? new THREE.Color(0xef4444) : sel ? new THREE.Color(0xf59e0b) : edgeDefault
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: edgeCol, transparent: true, opacity: sel || bad ? 1 : 0.55 }))
      edges.position.copy(mesh.position)
      s.itemsGroup.add(edges)

      const text = `${it.loadOrder ? it.loadOrder + '. ' : ''}${it.name || '—'}`
      const spr = labelSprite(text.length > 24 ? text.slice(0, 23) + '…' : text, k)
      spr.position.set(mesh.position.x, it.pos.z + it.h + 6 * k, mesh.position.z)
      s.itemsGroup.add(spr)
    }
    s.requestRender?.()
  }, [items, vehicle.length, vehicle.width, vehicle.height, problems, selectedId])

  // ── camera presets ───────────────────────────────────────────────
  useEffect(() => {
    if (preset?.name && S.current.camera && S.current.span) applyPreset(S.current, preset.name)
  }, [preset])

  return <div ref={hostRef} className="van-3d-host" />
}

function applyPreset(s, name) {
  const d = new THREE.Vector3(...(CAM_DIRS[name] || CAM_DIRS.iso)).normalize()
  const dist = (s.span || 300) * (name === 'top' ? 1.9 : 1.75)
  s.camera.position.copy(s.center).addScaledVector(d, dist)
  s.controls.target.copy(s.center)
  s.controls.update()
  s.requestRender?.()
}
