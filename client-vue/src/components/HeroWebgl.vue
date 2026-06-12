<script setup lang="ts">
import * as THREE from 'three'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { onBeforeUnmount, onMounted, ref } from 'vue'

type ViewMode = '2d' | '3d'
type MarkerTone = 'blue' | 'red' | 'gold' | 'green'
type LayerKey = 'creatures' | 'markers' | 'routes' | 'scan'

type Marker = {
  id: string
  label: string
  position: THREE.Vector3
  tone: MarkerTone
}

type RiftEntity = {
  id: string
  asset: string
  position: THREE.Vector3
  height: number
  rotationY?: number
  sceneRotationY?: number
  float?: number
  sway?: number
}

type CameraFlight = {
  start: number
  duration: number
  fromPosition: THREE.Vector3
  toPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  toTarget: THREE.Vector3
  fromZoom?: number
  toZoom?: number
}

const stageRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const isLoaded = ref(false)
const areEntitiesLoaded = ref(false)
const hasLoadError = ref(false)
const loadProgress = ref(0)
const loadStatus = ref('连接峡谷资源')
const viewMode = ref<ViewMode>('3d')
const layerToggles = ref<Record<LayerKey, boolean>>({
  creatures: true,
  markers: false,
  routes: false,
  scan: false,
})

const MAP_SIZE = 14800
const MAP_CENTER_X = 7400
const MAP_CENTER_Z = 7400
const MAP_SCENE_SIZE = 6.4
const MAP_UNIT_SCALE = MAP_SCENE_SIZE / MAP_SIZE
const RIFT_X_SIGN = -1
const RIFT_YAW_SIGN = RIFT_X_SIGN < 0 ? -1 : 1
const MAP_VIEW_PADDING = 0.36
const MAP_GROUND_Y = 0.02
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
const RIFT_BASE_ASSETS = [
  {
    url: publicAsset('assets/rift-base-webp.glb'),
    label: '高清峡谷地形',
  },
  {
    url: publicAsset('assets/rift-base-fast.glb'),
    label: '快速峡谷地形',
  },
  {
    url: publicAsset('assets/rift-base-preview.glb'),
    label: '轻量峡谷地形',
  },
]
const RIFT_ENTITY_PATH = publicAsset('assets/rift-entities-optimized')

function riftPoint(x: number, z: number, y = MAP_GROUND_Y) {
  return new THREE.Vector3((x - MAP_CENTER_X) * MAP_UNIT_SCALE * RIFT_X_SIGN, y, (z - MAP_CENTER_Z) * MAP_UNIT_SCALE)
}

function yaw(degrees: number) {
  return THREE.MathUtils.degToRad(degrees)
}

function faceRiftPoint(fromX: number, fromZ: number, toX: number, toZ: number, offsetDegrees = 0) {
  const from = riftPoint(fromX, fromZ)
  const to = riftPoint(toX, toZ)
  return Math.atan2(to.x - from.x, to.z - from.z) + yaw(offsetDegrees)
}

const markers: Marker[] = [
  { id: 'blue-base', label: '蓝方基地', position: riftPoint(1450, 1450, 0.34), tone: 'blue' },
  { id: 'red-base', label: '红方基地', position: riftPoint(13250, 13250, 0.34), tone: 'red' },
  { id: 'baron', label: '大龙坑', position: riftPoint(5007, 10471, 0.32), tone: 'gold' },
  { id: 'dragon', label: '小龙坑', position: riftPoint(9866, 4414, 0.32), tone: 'green' },
  { id: 'mid', label: '中路交汇', position: riftPoint(7400, 7400, 0.34), tone: 'gold' },
]

const riftEntities: RiftEntity[] = [
  { id: 'blue-nexus', asset: 'nexus-blue', position: riftPoint(1450, 1450, 0.18), height: 0.58, rotationY: yaw(45) },
  { id: 'red-nexus', asset: 'nexus-red', position: riftPoint(13250, 13250, 0.18), height: 0.58, rotationY: yaw(-135) },
  { id: 'blue-inhib-top', asset: 'inhibitor-blue', position: riftPoint(1171, 3571, 0.18), height: 0.28, rotationY: yaw(8) },
  { id: 'blue-inhib-mid', asset: 'inhibitor-blue', position: riftPoint(3203, 3208, 0.18), height: 0.3, rotationY: yaw(45) },
  { id: 'blue-inhib-bot', asset: 'inhibitor-blue', position: riftPoint(3452, 1236, 0.18), height: 0.28, rotationY: yaw(82) },
  { id: 'red-inhib-top', asset: 'inhibitor-red', position: riftPoint(11261, 13676, 0.18), height: 0.28, rotationY: yaw(-98) },
  { id: 'red-inhib-mid', asset: 'inhibitor-red', position: riftPoint(11598, 11667, 0.18), height: 0.3, rotationY: yaw(-135) },
  { id: 'red-inhib-bot', asset: 'inhibitor-red', position: riftPoint(13604, 11316, 0.18), height: 0.28, rotationY: yaw(188) },

  { id: 'blue-nexus-tower-a', asset: 'turret-blue', position: riftPoint(1748, 2270, 0.18), height: 0.32, rotationY: yaw(45) },
  { id: 'blue-nexus-tower-b', asset: 'turret-blue', position: riftPoint(2177, 1807, 0.18), height: 0.32, rotationY: yaw(45) },
  { id: 'blue-top-tower-outer', asset: 'turret-blue', position: riftPoint(981, 10441, 0.18), height: 0.3, rotationY: yaw(0) },
  { id: 'blue-top-tower-inner', asset: 'turret-blue', position: riftPoint(1512, 6699, 0.18), height: 0.3, rotationY: yaw(6) },
  { id: 'blue-top-tower-inhib', asset: 'turret-blue', position: riftPoint(1169, 4287, 0.18), height: 0.32, rotationY: yaw(8) },
  { id: 'blue-mid-tower-outer', asset: 'turret-blue', position: riftPoint(5846, 6396, 0.18), height: 0.3, rotationY: yaw(45) },
  { id: 'blue-mid-tower-inner', asset: 'turret-blue', position: riftPoint(5048, 4812, 0.18), height: 0.3, rotationY: yaw(45) },
  { id: 'blue-mid-tower-inhib', asset: 'turret-blue', position: riftPoint(3651, 3696, 0.18), height: 0.32, rotationY: yaw(45) },
  { id: 'blue-bot-tower-outer', asset: 'turret-blue', position: riftPoint(10504, 1029, 0.18), height: 0.3, rotationY: yaw(90) },
  { id: 'blue-bot-tower-inner', asset: 'turret-blue', position: riftPoint(6919, 1483, 0.18), height: 0.3, rotationY: yaw(82) },
  { id: 'blue-bot-tower-inhib', asset: 'turret-blue', position: riftPoint(4281, 1253, 0.18), height: 0.32, rotationY: yaw(82) },

  { id: 'red-nexus-tower-a', asset: 'turret-red', position: riftPoint(12611, 13084, 0.18), height: 0.32, rotationY: yaw(-135) },
  { id: 'red-nexus-tower-b', asset: 'turret-red', position: riftPoint(13052, 12612, 0.18), height: 0.32, rotationY: yaw(-135) },
  { id: 'red-top-tower-outer', asset: 'turret-red', position: riftPoint(4318, 13875, 0.18), height: 0.3, rotationY: yaw(-90) },
  { id: 'red-top-tower-inner', asset: 'turret-red', position: riftPoint(7943, 13411, 0.18), height: 0.3, rotationY: yaw(-98) },
  { id: 'red-top-tower-inhib', asset: 'turret-red', position: riftPoint(10481, 13650, 0.18), height: 0.32, rotationY: yaw(-98) },
  { id: 'red-mid-tower-outer', asset: 'turret-red', position: riftPoint(8955, 8510, 0.18), height: 0.3, rotationY: yaw(-135) },
  { id: 'red-mid-tower-inner', asset: 'turret-red', position: riftPoint(9767, 10113, 0.18), height: 0.3, rotationY: yaw(-135) },
  { id: 'red-mid-tower-inhib', asset: 'turret-red', position: riftPoint(11134, 11207, 0.18), height: 0.32, rotationY: yaw(-135) },
  { id: 'red-bot-tower-outer', asset: 'turret-red', position: riftPoint(13866, 4505, 0.18), height: 0.3, rotationY: yaw(180) },
  { id: 'red-bot-tower-inner', asset: 'turret-red', position: riftPoint(13327, 8226, 0.18), height: 0.3, rotationY: yaw(188) },
  { id: 'red-bot-tower-inhib', asset: 'turret-red', position: riftPoint(13624, 10572, 0.18), height: 0.32, rotationY: yaw(188) },

  { id: 'baron', asset: 'sru-baron', position: riftPoint(5007, 10471, 0.2), height: 0.44, sceneRotationY: faceRiftPoint(5007, 10471, 6500, 9000, 180), sway: 0.025 },
  { id: 'dragon', asset: 'sru-dragon-hextech', position: riftPoint(9866, 4414, 0.2), height: 0.38, sceneRotationY: faceRiftPoint(9866, 4414, 8400, 5800, 180), sway: 0.02 },
  { id: 'blue-blue-buff', asset: 'sru-blue', position: riftPoint(3860, 7900, 0.18), height: 0.21, rotationY: yaw(18) },
  { id: 'blue-blue-sentry-a', asset: 'sru-bluemini', position: riftPoint(3620, 7770, 0.18), height: 0.095, rotationY: yaw(42) },
  { id: 'blue-blue-sentry-b', asset: 'sru-bluemini2', position: riftPoint(4070, 7720, 0.18), height: 0.1, rotationY: yaw(-18) },
  { id: 'red-blue-buff', asset: 'sru-blue', position: riftPoint(11040, 6900, 0.18), height: 0.21, rotationY: yaw(198) },
  { id: 'red-blue-sentry-a', asset: 'sru-bluemini', position: riftPoint(11280, 7030, 0.18), height: 0.095, rotationY: yaw(222) },
  { id: 'red-blue-sentry-b', asset: 'sru-bluemini2', position: riftPoint(10830, 7080, 0.18), height: 0.1, rotationY: yaw(162) },
  { id: 'blue-red-buff', asset: 'sru-red', position: riftPoint(7800, 4120, 0.18), height: 0.21, rotationY: yaw(68) },
  { id: 'blue-red-cinderling-a', asset: 'sru-redmini', position: riftPoint(7560, 3950, 0.18), height: 0.1, rotationY: yaw(92) },
  { id: 'blue-red-cinderling-b', asset: 'sru-redmini', position: riftPoint(8040, 3980, 0.18), height: 0.1, rotationY: yaw(38) },
  { id: 'red-red-buff', asset: 'sru-red', position: riftPoint(7000, 10840, 0.18), height: 0.21, rotationY: yaw(-112) },
  { id: 'red-red-cinderling-a', asset: 'sru-redmini', position: riftPoint(7240, 11010, 0.18), height: 0.1, rotationY: yaw(-88) },
  { id: 'red-red-cinderling-b', asset: 'sru-redmini', position: riftPoint(6760, 10980, 0.18), height: 0.1, rotationY: yaw(-142) },
  { id: 'blue-gromp', asset: 'sru-gromp', position: riftPoint(2120, 8400, 0.18), height: 0.16, rotationY: yaw(20) },
  { id: 'red-gromp', asset: 'sru-gromp', position: riftPoint(12680, 6400, 0.18), height: 0.16, rotationY: yaw(200) },
  { id: 'blue-krug', asset: 'sru-krug', position: riftPoint(8120, 2520, 0.18), height: 0.15, rotationY: yaw(86) },
  { id: 'blue-krug-mini', asset: 'sru-krugmini', position: riftPoint(8380, 2400, 0.18), height: 0.095, rotationY: yaw(64) },
  { id: 'red-krug', asset: 'sru-krug', position: riftPoint(6480, 12280, 0.18), height: 0.15, rotationY: yaw(-94) },
  { id: 'red-krug-mini', asset: 'sru-krugmini', position: riftPoint(6220, 12400, 0.18), height: 0.095, rotationY: yaw(-116) },
  { id: 'blue-wolves', asset: 'sru-murkwolf', position: riftPoint(3860, 6500, 0.18), height: 0.135, rotationY: yaw(34) },
  { id: 'blue-wolf-mini-a', asset: 'sru-murkwolfmini', position: riftPoint(3660, 6330, 0.18), height: 0.082, rotationY: yaw(58) },
  { id: 'blue-wolf-mini-b', asset: 'sru-murkwolfmini', position: riftPoint(4080, 6360, 0.18), height: 0.082, rotationY: yaw(10) },
  { id: 'red-wolves', asset: 'sru-murkwolf', position: riftPoint(10940, 8300, 0.18), height: 0.135, rotationY: yaw(214) },
  { id: 'red-wolf-mini-a', asset: 'sru-murkwolfmini', position: riftPoint(11140, 8470, 0.18), height: 0.082, rotationY: yaw(238) },
  { id: 'red-wolf-mini-b', asset: 'sru-murkwolfmini', position: riftPoint(10720, 8440, 0.18), height: 0.082, rotationY: yaw(190) },
  { id: 'blue-raptor', asset: 'sru-razorbeak', position: riftPoint(7000, 5450, 0.18), height: 0.125, rotationY: yaw(52) },
  { id: 'blue-raptor-mini-a', asset: 'sru-razorbeakmini', position: riftPoint(6780, 5260, 0.18), height: 0.07, rotationY: yaw(86) },
  { id: 'blue-raptor-mini-b', asset: 'sru-razorbeakmini', position: riftPoint(7220, 5270, 0.18), height: 0.07, rotationY: yaw(20) },
  { id: 'blue-raptor-mini-c', asset: 'sru-razorbeakmini', position: riftPoint(6840, 5660, 0.18), height: 0.07, rotationY: yaw(126) },
  { id: 'red-raptor', asset: 'sru-razorbeak', position: riftPoint(7800, 9500, 0.18), height: 0.125, rotationY: yaw(-128) },
  { id: 'red-raptor-mini-a', asset: 'sru-razorbeakmini', position: riftPoint(8020, 9690, 0.18), height: 0.07, rotationY: yaw(-94) },
  { id: 'red-raptor-mini-b', asset: 'sru-razorbeakmini', position: riftPoint(7580, 9680, 0.18), height: 0.07, rotationY: yaw(-160) },
  { id: 'red-raptor-mini-c', asset: 'sru-razorbeakmini', position: riftPoint(7960, 9290, 0.18), height: 0.07, rotationY: yaw(-54) },
  { id: 'river-crab-top', asset: 'sru-crab', position: riftPoint(5000, 6100, 0.18), height: 0.105, rotationY: yaw(115) },
  { id: 'river-crab-bot', asset: 'sru-crab', position: riftPoint(9800, 8700, 0.18), height: 0.105, rotationY: yaw(-65) },
]

const toneColors: Record<MarkerTone, string> = {
  blue: '#47e7ff',
  red: '#ff6464',
  gold: '#ffd77a',
  green: '#56e2a0',
}

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let activeCamera: THREE.Camera | null = null
let perspectiveCamera: THREE.PerspectiveCamera | null = null
let orthographicCamera: THREE.OrthographicCamera | null = null
let controls: OrbitControls | null = null
let mapRoot: THREE.Group | null = null
let resizeObserver: ResizeObserver | null = null
let animationFrame = 0
let startedAt = 0
let loadedAt = 0
let entityHydrateTimer = 0
let baseLoadTimeout = 0
let lastBaseProgressAt = 0
const markerRoots: THREE.Group[] = []
const entityRoots: THREE.Group[] = []
const routeRoots: THREE.Object3D[] = []
const terrainPickMeshes: THREE.Mesh[] = []
const entitySceneCache = new Map<string, Promise<THREE.Object3D>>()
const pointerStart = new THREE.Vector2()
const pointerEnd = new THREE.Vector2()
const focusRaycaster = new THREE.Raycaster()
const focusPointer = new THREE.Vector2()
let entityResponsiveScale = 1
let scanField: THREE.Object3D | null = null
let focusRipple: THREE.Mesh | null = null
let cameraFlight: CameraFlight | null = null
let pointerDownAt = 0
let pointerDownButton = -1

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function setLoadProgress(value: number) {
  loadProgress.value = clamp(Math.max(loadProgress.value, Math.round(value)), 0, 100)
}

function enterRiftStage(progress = 100) {
  setLoadProgress(progress)
  loadedAt = performance.now()
  isLoaded.value = true
}

function updateCameraProjection() {
  const stage = stageRef.value

  if (!stage || !perspectiveCamera || !orthographicCamera) {
    return
  }

  const rect = stage.getBoundingClientRect()
  const aspect = rect.width / Math.max(1, rect.height)
  perspectiveCamera.aspect = aspect
  perspectiveCamera.updateProjectionMatrix()

  const halfMap = MAP_SCENE_SIZE / 2 + MAP_VIEW_PADDING
  const halfWidth = aspect >= 1 ? halfMap * aspect : halfMap
  const halfHeight = aspect >= 1 ? halfMap : halfMap / aspect
  orthographicCamera.left = -halfWidth
  orthographicCamera.right = halfWidth
  orthographicCamera.top = halfHeight
  orthographicCamera.bottom = -halfHeight
  orthographicCamera.updateProjectionMatrix()
}

function getResponsiveEntityScale() {
  const width = stageRef.value?.getBoundingClientRect().width ?? window.innerWidth

  if (width < 560) {
    return 0.68
  }

  if (width < 820) {
    return 0.78
  }

  if (width < 1120) {
    return 0.9
  }

  return 1
}

function isResponsiveEntity(asset: string) {
  return /^sru-/i.test(asset)
}

function updateEntityResponsiveScale() {
  entityResponsiveScale = getResponsiveEntityScale()
  entityRoots.forEach((entity) => {
    const scale = entity.userData.isResponsiveEntity ? entityResponsiveScale : 1
    entity.scale.setScalar((entity.userData.baseScale ?? 1) * scale)
  })
}

function updateLayerVisibility() {
  entityRoots.forEach((entity) => {
    entity.visible = !entity.userData.isResponsiveEntity || layerToggles.value.creatures
  })
  markerRoots.forEach((marker) => {
    marker.visible = layerToggles.value.markers
  })
  routeRoots.forEach((route) => {
    route.visible = layerToggles.value.routes
  })

  if (scanField) {
    scanField.visible = layerToggles.value.scan
  }
}

function toggleLayer(layer: LayerKey) {
  layerToggles.value[layer] = !layerToggles.value[layer]
  updateLayerVisibility()
}

function getDefaultCameraPose() {
  return {
    position: new THREE.Vector3(0, 6.2, -5.85),
    target: new THREE.Vector3(0, 0.18, -0.18),
  }
}

function startCameraFlight(toTarget: THREE.Vector3, distance = 3.55, duration = 820) {
  if (!activeCamera || !controls) {
    return
  }

  const target = toTarget.clone()
  const offset = activeCamera.position.clone().sub(controls.target)

  if (offset.lengthSq() < 0.001) {
    offset.copy(getDefaultCameraPose().position.sub(getDefaultCameraPose().target))
  }

  const direction = offset.normalize()
  const toPosition = target.clone().add(direction.multiplyScalar(distance))
  toPosition.y = Math.max(toPosition.y, 1.65)

  cameraFlight = {
    start: performance.now(),
    duration,
    fromPosition: activeCamera.position.clone(),
    toPosition,
    fromTarget: controls.target.clone(),
    toTarget: target,
    fromZoom: orthographicCamera?.zoom,
    toZoom: viewMode.value === '2d' ? 2.25 : undefined,
  }
}

function resetRiftCamera() {
  if (!activeCamera || !controls) {
    return
  }

  const pose = getDefaultCameraPose()

  if (viewMode.value === '2d' && orthographicCamera) {
    cameraFlight = {
      start: performance.now(),
      duration: 720,
      fromPosition: orthographicCamera.position.clone(),
      toPosition: new THREE.Vector3(0, 12, 0),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(0, 0.16, 0),
      fromZoom: orthographicCamera.zoom,
      toZoom: 1,
    }
    return
  }

  cameraFlight = {
    start: performance.now(),
    duration: 780,
    fromPosition: activeCamera.position.clone(),
    toPosition: pose.position,
    fromTarget: controls.target.clone(),
    toTarget: pose.target,
  }
}

function updateCameraFlight(time: number) {
  if (!cameraFlight || !activeCamera || !controls) {
    return
  }

  const progress = clamp((time - cameraFlight.start) / cameraFlight.duration, 0, 1)
  const eased = easeOutCubic(progress)
  activeCamera.position.lerpVectors(cameraFlight.fromPosition, cameraFlight.toPosition, eased)
  controls.target.lerpVectors(cameraFlight.fromTarget, cameraFlight.toTarget, eased)

  if (viewMode.value === '2d' && orthographicCamera && cameraFlight.fromZoom && cameraFlight.toZoom) {
    orthographicCamera.zoom = THREE.MathUtils.lerp(cameraFlight.fromZoom, cameraFlight.toZoom, eased)
    orthographicCamera.updateProjectionMatrix()
  }

  if (progress >= 1) {
    cameraFlight = null
  }
}

function focusAtClientPoint(clientX: number, clientY: number) {
  const canvas = canvasRef.value

  if (!canvas || !activeCamera || !controls || !isLoaded.value || terrainPickMeshes.length === 0) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  focusPointer.set(
    ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
    -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1),
  )
  focusRaycaster.setFromCamera(focusPointer, activeCamera)

  const hits = focusRaycaster.intersectObjects(terrainPickMeshes, false)
  const hit = hits.find((item) => item.object.visible)

  if (!hit) {
    return
  }

  const target = hit.point.clone()
  target.y = Math.max(0.12, target.y + 0.18)

  if (focusRipple) {
    focusRipple.position.copy(target)
    focusRipple.position.y = Math.max(0.18, target.y - 0.12)
    focusRipple.scale.setScalar(0.6)
    focusRipple.visible = true
    focusRipple.userData.startedAt = performance.now()
  }

  if (viewMode.value === '2d' && orthographicCamera) {
    startCameraFlight(new THREE.Vector3(target.x, 0.16, target.z), 12, 620)
    return
  }

  startCameraFlight(target, 3.35, 820)
}

function onCanvasPointerDown(event: PointerEvent) {
  pointerStart.set(event.clientX, event.clientY)
  pointerDownAt = performance.now()
  pointerDownButton = event.button
  cameraFlight = null
}

function onCanvasPointerUp(event: PointerEvent) {
  pointerEnd.set(event.clientX, event.clientY)
  const moved = pointerStart.distanceTo(pointerEnd)
  const elapsed = performance.now() - pointerDownAt

  if ((pointerDownButton === 0 || event.pointerType === 'touch') && moved < 7 && elapsed < 520) {
    focusAtClientPoint(event.clientX, event.clientY)
  }
}

function createControls(cameraObject: THREE.Camera, canvas: HTMLCanvasElement, mode: ViewMode) {
  controls?.dispose()

  const nextControls = new OrbitControls(cameraObject, canvas)
  nextControls.enableDamping = true
  nextControls.dampingFactor = 0.075
  nextControls.enablePan = true
  nextControls.enableZoom = true
  nextControls.screenSpacePanning = true
  nextControls.target.set(0, 0.16, mode === '3d' ? -0.24 : 0)

  if (mode === '2d') {
    nextControls.enableRotate = false
    nextControls.autoRotate = false
    nextControls.minZoom = 0.78
    nextControls.maxZoom = 3.2
    nextControls.mouseButtons.LEFT = THREE.MOUSE.PAN
    nextControls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY
    nextControls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    nextControls.touches.ONE = THREE.TOUCH.PAN
    nextControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
  } else {
    nextControls.enableRotate = true
    nextControls.autoRotate = false
    nextControls.autoRotateSpeed = 0.08
    nextControls.minDistance = 3.1
    nextControls.maxDistance = 9.6
    nextControls.minPolarAngle = 0.48
    nextControls.maxPolarAngle = 1.18
    nextControls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
    nextControls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY
    nextControls.mouseButtons.RIGHT = THREE.MOUSE.PAN
    nextControls.touches.ONE = THREE.TOUCH.ROTATE
    nextControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
  }

  nextControls.update()
  controls = nextControls
}

function activateViewMode(mode: ViewMode) {
  const canvas = canvasRef.value

  if (!canvas || !perspectiveCamera || !orthographicCamera) {
    return
  }

  updateCameraProjection()

  if (mode === '2d') {
    orthographicCamera.position.set(0, 12, 0)
    orthographicCamera.up.set(0, 0, 1)
    orthographicCamera.lookAt(0, 0, 0)
    orthographicCamera.zoom = 1
    orthographicCamera.updateProjectionMatrix()
    activeCamera = orthographicCamera
  } else {
    const pose = getDefaultCameraPose()
    perspectiveCamera.position.copy(pose.position)
    perspectiveCamera.up.set(0, 1, 0)
    perspectiveCamera.lookAt(pose.target)
    activeCamera = perspectiveCamera
  }

  cameraFlight = null
  createControls(activeCamera, canvas, mode)
}

function setViewMode(mode: ViewMode) {
  if (viewMode.value === mode) {
    return
  }

  viewMode.value = mode
  activateViewMode(mode)
}

function createLabelTexture(text: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(2, 8, 14, 0.62)'
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.roundRect(20, 24, 472, 80, 16)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(60, 64, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f5fbff'
  ctx.font = '700 30px Microsoft YaHei, sans-serif'
  ctx.fillText(text, 86, 75)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createMarker(marker: Marker) {
  const color = toneColors[marker.tone]
  const group = new THREE.Group()
  group.position.copy(marker.position)

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.016, 0.26, 10),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78 }),
  )
  pole.position.y = 0.12
  group.add(pole)

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 18, 18),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
    }),
  )
  dot.position.y = 0.27
  group.add(dot)

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.105, 0.006, 8, 48),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  ring.rotation.x = Math.PI / 2
  group.add(ring)

  const texture = createLabelTexture(marker.label, color)
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.86,
      depthTest: false,
      depthWrite: false,
    }),
  )
  label.position.set(0.18, 0.34, 0)
  label.scale.set(0.32, 0.08, 1)
  label.renderOrder = 30
  group.add(label)

  group.userData.baseY = marker.position.y
  markerRoots.push(group)
  return group
}

function createLaneLine(points: THREE.Vector3[], color: string, opacity = 0.42) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80))
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
}

function addTacticalOverlay(root: THREE.Group) {
  const y = 0.2
  const lines = [
    createLaneLine(
      [riftPoint(1450, 1450, y), riftPoint(5048, 4812, y), riftPoint(7400, 7400, y), riftPoint(9767, 10113, y), riftPoint(13250, 13250, y)],
      '#ffd77a',
      0.46,
    ),
    createLaneLine(
      [riftPoint(1450, 1450, y), riftPoint(1169, 4287, y), riftPoint(1512, 6699, y), riftPoint(981, 10441, y), riftPoint(4318, 13875, y), riftPoint(13250, 13250, y)],
      '#47e7ff',
      0.26,
    ),
    createLaneLine(
      [riftPoint(1450, 1450, y), riftPoint(4281, 1253, y), riftPoint(6919, 1483, y), riftPoint(10504, 1029, y), riftPoint(13866, 4505, y), riftPoint(13250, 13250, y)],
      '#56e2a0',
      0.24,
    ),
  ]

  lines.forEach((line) => {
    routeRoots.push(line)
    root.add(line)
  })
}

function addFocusRipple(root: THREE.Group) {
  const geometry = new THREE.RingGeometry(0.12, 0.128, 72)
  const material = new THREE.MeshBasicMaterial(
    {
      color: '#ffd77a',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    },
  )
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.visible = false
  mesh.renderOrder = 20
  mesh.userData.focusRipple = true
  root.add(mesh)
  return mesh
}

function createScanField() {
  const geometry = new THREE.RingGeometry(3.12, 3.15, 160)
  const material = new THREE.MeshBasicMaterial({
    color: '#47e7ff',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.16
  mesh.userData.spin = true
  return mesh
}

function createFallbackMapTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  const gradient = ctx.createRadialGradient(512, 512, 80, 512, 512, 560)
  gradient.addColorStop(0, '#173528')
  gradient.addColorStop(0.52, '#0d241c')
  gradient.addColorStop(1, '#071119')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1024, 1024)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const drawLane = (points: Array<[number, number]>, color: string, width: number) => {
    ctx.beginPath()
    points.forEach(([x, y], index) => {
      if (index === 0) {
        ctx.moveTo(x, y)
        return
      }

      ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.shadowColor = color
    ctx.shadowBlur = 16
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  drawLane([[118, 905], [292, 714], [512, 512], [713, 308], [906, 118]], 'rgba(255, 215, 122, 0.56)', 18)
  drawLane([[122, 900], [108, 704], [138, 456], [180, 254], [320, 120], [906, 118]], 'rgba(71, 231, 255, 0.32)', 15)
  drawLane([[118, 905], [300, 900], [542, 878], [755, 820], [906, 680], [906, 118]], 'rgba(86, 226, 160, 0.28)', 15)

  ctx.fillStyle = 'rgba(71, 231, 255, 0.14)'
  ctx.beginPath()
  ctx.ellipse(345, 655, 116, 68, -0.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(185, 139, 255, 0.14)'
  ctx.beginPath()
  ctx.ellipse(682, 358, 118, 68, -0.7, 0, Math.PI * 2)
  ctx.fill()

  const drawBase = (x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 22
    ctx.beginPath()
    ctx.arc(x, y, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)'
    ctx.lineWidth = 5
    ctx.stroke()
  }

  drawBase(118, 906, 'rgba(71, 231, 255, 0.74)')
  drawBase(906, 118, 'rgba(255, 98, 98, 0.72)')

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.lineWidth = 2
  for (let index = 96; index < 1024; index += 96) {
    ctx.beginPath()
    ctx.moveTo(index, 0)
    ctx.lineTo(index, 1024)
    ctx.moveTo(0, index)
    ctx.lineTo(1024, index)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function createFallbackRiftMap(root: THREE.Group) {
  const mapGroup = new THREE.Group()
  mapGroup.name = 'fallback-rift-map'

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SCENE_SIZE, MAP_SCENE_SIZE, 64, 64),
    new THREE.MeshStandardMaterial({
      color: '#123024',
      map: createFallbackMapTexture(),
      roughness: 0.86,
      metalness: 0.02,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.035
  ground.receiveShadow = true
  mapGroup.add(ground)

  const border = new THREE.Mesh(
    new THREE.TorusGeometry(MAP_SCENE_SIZE / 2, 0.012, 10, 160),
    new THREE.MeshBasicMaterial({
      color: '#ffd77a',
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  border.rotation.x = -Math.PI / 2
  border.position.y = 0.01
  mapGroup.add(border)

  const addBeacon = (position: THREE.Vector3, color: string) => {
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.28, 6),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.32,
        roughness: 0.62,
      }),
    )
    beacon.position.copy(position)
    beacon.position.y = 0.12
    mapGroup.add(beacon)
  }

  addBeacon(riftPoint(1450, 1450), '#47e7ff')
  addBeacon(riftPoint(13250, 13250), '#ff6464')
  addBeacon(riftPoint(5007, 10471), '#b98bff')
  addBeacon(riftPoint(9866, 4414), '#56e2a0')

  root.add(mapGroup)
  terrainPickMeshes.push(ground)
  return [ground]
}

function attachRiftStage(root: THREE.Group, terrainMeshes: THREE.Mesh[], loader: GLTFLoader) {
  root.updateMatrixWorld(true)
  addTacticalOverlay(root)
  scanField = createScanField()
  root.add(scanField)
  focusRipple = addFocusRipple(root)
  markers.forEach((marker) => root.add(createMarker(marker)))
  updateLayerVisibility()

  enterRiftStage(100)

  entityHydrateTimer = window.setTimeout(async () => {
    try {
      loadStatus.value = '同步野区实体'
      await addRiftEntities(loader, root)
      updateEntityResponsiveScale()
      root.updateMatrixWorld(true)
      groundEntitiesToTerrain(terrainMeshes, root)
      updateLayerVisibility()
      areEntitiesLoaded.value = true
      loadStatus.value = '实体资源已就绪'
    } catch (error) {
      console.warn('Rift entity hydrate failed', error)
      areEntitiesLoaded.value = true
      loadStatus.value = '部分实体加载失败'
    }
  }, 120)
}

function disposeSceneObject(object: THREE.Object3D) {
  object.traverse((item) => {
    if (item instanceof THREE.Mesh || item instanceof THREE.Line || item instanceof THREE.Points || item instanceof THREE.Sprite) {
      item.geometry?.dispose()

      const materials = Array.isArray(item.material) ? item.material : [item.material]
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) {
            value.dispose()
          }
        })
        material.dispose()
      })
    }
  })
}

function tuneModelMaterial(material: THREE.Material) {
  if (material instanceof THREE.MeshStandardMaterial) {
    material.roughness = Math.min(1, Math.max(material.roughness, 0.72))
    material.metalness = Math.min(material.metalness, 0.08)

    if (material.map) {
      material.map.colorSpace = THREE.SRGBColorSpace
      material.map.anisotropy = 8
      material.map.needsUpdate = true
    }

    if (/(alpha|foliage|leaf|leaves|grass|bush|tree|fern|frond|vine|periph|chunk|canopy|decal)/i.test(material.name)) {
      material.alphaTest = 0.42
      material.depthWrite = true
      material.side = THREE.DoubleSide
      material.transparent = false
    }

    material.needsUpdate = true
  }
}

function isInactiveMapVariant(name: string) {
  return (
    /DragonPit_(Fire|Hextech|Cloud|Chemtech|Earth|Ocean)_/i.test(name) ||
    /Order_Dragon_(Fire|Hextech|Chemtech|Earth|Ocean)_/i.test(name) ||
    /Earth_Order_Dragon_/i.test(name) ||
    /Baron_(Tunnel|Walled|Upgraded)_/i.test(name) ||
    /Chemtech_(Brazier|Canister|ChemtechDecal|Chemlily|Chempuddle|Dragonwing|IvySkirt)/i.test(name) ||
    /(Ocean_(Puddle|WaterLily)|WaterLily)/i.test(name)
  )
}

function isUnsupportedMapEffect(name: string) {
  return (
    /(FaeLights_Prototype_Mat|distant[_-]?horizon|bk_distant|background|skybox|sky_plane)/i.test(name) ||
    isInactiveMapVariant(name)
  )
}

function shouldHideBrokenMaterial(entity: RiftEntity, material: THREE.Material) {
  if (/^(nexus|inhibitor|turret)/i.test(entity.asset)) {
    return false
  }

  return /(Rubble|Broken|Destroyed)/i.test(material.name)
}

function findGroundY(position: THREE.Vector3, terrainMeshes: THREE.Mesh[], root: THREE.Group) {
  root.updateMatrixWorld(true)
  const rayOrigin = root.localToWorld(new THREE.Vector3(position.x, 3.2, position.z))
  const raycaster = new THREE.Raycaster(
    rayOrigin,
    new THREE.Vector3(0, -1, 0),
    0,
    8,
  )
  const hits = raycaster.intersectObjects(terrainMeshes, false)
  const hit = hits.find((item) => item.object.visible && item.point.y > -1.4 && item.point.y < 1.2)

  if (!hit) {
    return MAP_GROUND_Y
  }

  return root.worldToLocal(hit.point.clone()).y + 0.006
}

function groundEntitiesToTerrain(terrainMeshes: THREE.Mesh[], root: THREE.Group) {
  entityRoots.forEach((entity) => {
    const groundY = findGroundY(entity.position, terrainMeshes, root)
    entity.position.y = groundY
    entity.userData.baseY = groundY
  })
}

function loadGltfScene(loader: GLTFLoader, asset: string) {
  if (!entitySceneCache.has(asset)) {
    entitySceneCache.set(
      asset,
      new Promise((resolve, reject) => {
        loader.load(`${RIFT_ENTITY_PATH}/${asset}.glb`, (gltf) => resolve(gltf.scene), undefined, reject)
      }),
    )
  }

  return entitySceneCache.get(asset) as Promise<THREE.Object3D>
}

function normalizeEntity(entity: RiftEntity, source: THREE.Object3D) {
  const object = cloneSkeleton(source) as THREE.Object3D

  object.traverse((item) => {
    if (item instanceof THREE.Mesh) {
      const materials = Array.isArray(item.material) ? item.material : [item.material]
      materials.forEach((material) => {
        tuneModelMaterial(material)

        if (shouldHideBrokenMaterial(entity, material)) {
          material.visible = false
          material.needsUpdate = true
        }
      })
      item.frustumCulled = true
    }
  })

  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  const heightScale = entity.height / Math.max(size.y, 0.001)

  object.position.set(-center.x, 0, -center.z)

  const group = new THREE.Group()
  const rotationY = entity.sceneRotationY ?? (entity.rotationY ?? 0) * RIFT_YAW_SIGN
  group.name = entity.id
  group.position.copy(entity.position)
  group.rotation.y = rotationY
  group.scale.setScalar(heightScale * (isResponsiveEntity(entity.asset) ? entityResponsiveScale : 1))
  group.userData.baseY = entity.position.y
  group.userData.baseRotationY = rotationY
  group.userData.baseScale = heightScale
  group.userData.isResponsiveEntity = isResponsiveEntity(entity.asset)
  group.userData.float = entity.float ?? 0
  group.userData.sway = entity.sway ?? 0
  group.add(object)
  entityRoots.push(group)
  return group
}

async function addRiftEntities(loader: GLTFLoader, root: THREE.Group) {
  const loaded = await Promise.allSettled(
    riftEntities.map(async (entity) => {
      const source = await loadGltfScene(loader, entity.asset)
      return normalizeEntity(entity, source)
    }),
  )

  loaded.forEach((result) => {
    if (result.status === 'fulfilled') {
      root.add(result.value)
    } else {
      console.warn('Rift entity load failed', result.reason)
    }
  })
}

function loadBaseAsset(loader: GLTFLoader, asset: { url: string; label: string }, attemptIndex: number) {
  return new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      asset.url,
      (gltf) => resolve(gltf.scene),
      (event) => {
        lastBaseProgressAt = performance.now()
        const attemptBase = attemptIndex * 18

        if (event.total > 0) {
          const progress = clamp(attemptBase + (event.loaded / event.total) * 72, 4, 96)
          loadStatus.value = progress >= 92 ? `解压${asset.label}` : `下载${asset.label}`
          setLoadProgress(progress)
          return
        }

        loadStatus.value = `下载${asset.label}`
        setLoadProgress(Math.min(92, loadProgress.value + 1))
      },
      reject,
    )
  })
}

function mountLoadedRiftBase(root: THREE.Group, model: THREE.Group) {
  const modelGroup = new THREE.Group()
  model.position.set(-MAP_CENTER_X, 0, -MAP_CENTER_Z)
  modelGroup.scale.set(RIFT_X_SIGN * MAP_UNIT_SCALE, MAP_UNIT_SCALE, MAP_UNIT_SCALE)
  const terrainMeshes: THREE.Mesh[] = []
  terrainPickMeshes.length = 0

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    const searchableName = [object.name, ...materials.map((material) => material.name)].join(' ')
    if (isUnsupportedMapEffect(searchableName)) {
      object.visible = false
      object.raycast = () => {}
      return
    }

    materials.forEach(tuneModelMaterial)
    object.frustumCulled = true
    terrainMeshes.push(object)
    terrainPickMeshes.push(object)
  })

  modelGroup.add(model)
  root.add(modelGroup)
  return terrainMeshes
}

async function loadRiftBaseWithFallback(loader: GLTFLoader, root: THREE.Group) {
  for (let index = 0; index < RIFT_BASE_ASSETS.length; index += 1) {
    const asset = RIFT_BASE_ASSETS[index]

    try {
      hasLoadError.value = false
      loadStatus.value = `连接${asset.label}`
      const model = await loadBaseAsset(loader, asset, index)
      loadStatus.value = '解析峡谷地形'
      return mountLoadedRiftBase(root, model)
    } catch (error) {
      console.warn(`Rift base load failed: ${asset.label}`, error)
      loadStatus.value = index < RIFT_BASE_ASSETS.length - 1 ? '切换轻量峡谷地形' : '启用备用战术沙盘'
    }
  }

  return createFallbackRiftMap(root)
}

function setupScene(canvas: HTMLCanvasElement) {
  const nextRenderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7))
  nextRenderer.outputColorSpace = THREE.SRGBColorSpace
  nextRenderer.toneMapping = THREE.ACESFilmicToneMapping
  nextRenderer.toneMappingExposure = 1.36

  const nextScene = new THREE.Scene()
  nextScene.background = new THREE.Color('#041018')
  nextScene.fog = new THREE.FogExp2('#041018', 0.052)

  const nextPerspectiveCamera = new THREE.PerspectiveCamera(34, 1, 0.05, 90)
  const nextOrthographicCamera = new THREE.OrthographicCamera(-3.6, 3.6, 3.6, -3.6, 0.05, 40)

  const root = new THREE.Group()
  root.scale.setScalar(0.96)
  root.position.y = -0.16
  nextScene.add(root)

  nextScene.add(new THREE.HemisphereLight('#f5f1d6', '#182017', 2.75))
  nextScene.add(new THREE.AmbientLight('#b7d7c6', 0.32))

  const key = new THREE.DirectionalLight('#fff0bd', 2.35)
  key.position.set(-3.8, 5.8, 4.2)
  nextScene.add(key)

  const rim = new THREE.DirectionalLight('#47e7ff', 1.05)
  rim.position.set(4.2, 2.4, -3.5)
  nextScene.add(rim)

  const dragonLight = new THREE.PointLight('#56e2a0', 1.8, 5.4)
  dragonLight.position.copy(riftPoint(9866, 4414, 0.72))
  nextScene.add(dragonLight)

  const baronLight = new THREE.PointLight('#b98bff', 1.4, 5.2)
  baronLight.position.copy(riftPoint(5007, 10471, 0.72))
  nextScene.add(baronLight)

  const stars = new THREE.BufferGeometry()
  const starPositions = new Float32Array(320 * 3)
  for (let i = 0; i < 320; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 11
    starPositions[i * 3 + 1] = Math.random() * 3.6 + 0.35
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 9
  }
  stars.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  nextScene.add(
    new THREE.Points(
      stars,
      new THREE.PointsMaterial({
        color: '#c4f2ff',
        size: 0.011,
        transparent: true,
        opacity: 0.48,
      }),
    ),
  )

  const gltfLoader = new GLTFLoader()
  gltfLoader.setMeshoptDecoder(MeshoptDecoder)
  lastBaseProgressAt = performance.now()
  baseLoadTimeout = window.setInterval(() => {
    if (!isLoaded.value) {
      const idleMs = performance.now() - lastBaseProgressAt

      if (loadProgress.value >= 96) {
        loadStatus.value = '解压峡谷地形'
        return
      }

      if (idleMs > 45000) {
        loadStatus.value = '加载较慢，准备备用沙盘'
        window.clearInterval(baseLoadTimeout)
      }
    }
  }, 3000)

  void loadRiftBaseWithFallback(gltfLoader, root)
    .then((terrainMeshes) => {
      window.clearInterval(baseLoadTimeout)
      hasLoadError.value = false
      loadStatus.value = terrainMeshes.length > 1 ? '峡谷沙盘已就绪' : '备用战术沙盘已就绪'
      attachRiftStage(root, terrainMeshes, gltfLoader)
    })
    .catch((error) => {
      window.clearInterval(baseLoadTimeout)
      console.warn('Rift fallback stage failed', error)
      hasLoadError.value = true
      loadProgress.value = 0
      loadStatus.value = '峡谷沙盘初始化失败'
    })

  renderer = nextRenderer
  scene = nextScene
  perspectiveCamera = nextPerspectiveCamera
  orthographicCamera = nextOrthographicCamera
  activateViewMode(viewMode.value)
  mapRoot = root
}

onMounted(() => {
  const canvas = canvasRef.value
  const stage = stageRef.value

  if (!canvas || !stage) {
    return
  }

  startedAt = performance.now()
  setupScene(canvas)

  const resize = () => {
    if (!renderer) {
      return
    }

    const rect = stage.getBoundingClientRect()
    renderer.setSize(rect.width, rect.height, false)
    updateCameraProjection()
    updateEntityResponsiveScale()
  }

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(stage)
  resize()

  const render = (time: number) => {
    const elapsed = (time - startedAt) / 1000
    const intro = isLoaded.value ? easeOutCubic(clamp((time - loadedAt) / 2400, 0, 1)) : 0

    if (mapRoot) {
      mapRoot.scale.setScalar(0.96 + intro * 0.04)
      mapRoot.position.y = -0.16 + intro * 0.16 + Math.sin(elapsed * 0.8) * 0.008

      mapRoot.children.forEach((child) => {
        if (child.userData.spin) {
          child.rotation.z = elapsed * 0.32
        }
      })
    }

    markerRoots.forEach((marker, index) => {
      marker.position.y = marker.userData.baseY + Math.sin(elapsed * 1.8 + index) * 0.018
    })

    entityRoots.forEach((entity, index) => {
      const float = entity.userData.float ?? 0
      const sway = entity.userData.sway ?? 0
      entity.position.y = entity.userData.baseY + (float > 0 ? Math.sin(elapsed * 1.4 + index * 0.37) * float : 0)
      entity.rotation.y = entity.userData.baseRotationY + Math.sin(elapsed * 0.72 + index) * sway
    })

    if (focusRipple) {
      const rippleAge = focusRipple.userData.startedAt ? (time - focusRipple.userData.startedAt) / 620 : 1
      if (rippleAge >= 1) {
        focusRipple.visible = false
      } else {
        focusRipple.visible = true
        focusRipple.scale.setScalar(0.55 + rippleAge * 2.2)
        const material = focusRipple.material
        if (!Array.isArray(material) && material instanceof THREE.MeshBasicMaterial) {
          material.opacity = (1 - rippleAge) * 0.78
        }
      }
    }

    updateCameraFlight(time)
    controls?.update()
    if (scene && activeCamera) {
      renderer?.render(scene, activeCamera)
    }
    animationFrame = requestAnimationFrame(render)
  }

  animationFrame = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  window.clearTimeout(entityHydrateTimer)
  window.clearInterval(baseLoadTimeout)
  resizeObserver?.disconnect()
  controls?.dispose()

  if (scene) {
    disposeSceneObject(scene)
  }

  markerRoots.length = 0
  entityRoots.length = 0
  routeRoots.length = 0
  terrainPickMeshes.length = 0
  entitySceneCache.clear()
  renderer?.dispose()
  renderer = null
  scene = null
  activeCamera = null
  perspectiveCamera = null
  orthographicCamera = null
  controls = null
  mapRoot = null
  scanField = null
  focusRipple = null
  cameraFlight = null
})
</script>

<template>
  <div
    ref="stageRef"
    class="rift-stage rift-three-stage"
    :class="[`mode-${viewMode}`, { 'is-loaded': isLoaded, 'has-load-error': hasLoadError, 'hide-energy': !layerToggles.scan }]"
  >
    <canvas
      ref="canvasRef"
      class="rift-canvas"
      @pointerdown="onCanvasPointerDown"
      @pointerup="onCanvasPointerUp"
    ></canvas>

    <div class="rift-loader">
      <div class="rift-loader-scan"></div>
      <div class="rift-loader-core">
        <strong>{{ hasLoadError ? 'ERR' : `${loadProgress}%` }}</strong>
        <span>{{ loadStatus }}</span>
      </div>
    </div>

    <div v-if="isLoaded && !areEntitiesLoaded" class="rift-asset-status" aria-live="polite">
      <span></span>
      <strong>实体资源同步中</strong>
    </div>

    <div class="rift-map-frame"></div>
    <div class="rift-energy"></div>

    <div class="rift-view-toggle" role="group" aria-label="地图视角">
      <button type="button" :class="{ active: viewMode === '2d' }" @click="setViewMode('2d')">2D</button>
      <button type="button" :class="{ active: viewMode === '3d' }" @click="setViewMode('3d')">3D</button>
    </div>

    <div class="rift-layer-panel" aria-label="地图图层控制">
      <button type="button" :class="{ active: layerToggles.creatures }" @click="toggleLayer('creatures')">野怪</button>
      <button type="button" :class="{ active: layerToggles.markers }" @click="toggleLayer('markers')">标点</button>
      <button type="button" :class="{ active: layerToggles.routes }" @click="toggleLayer('routes')">路线</button>
      <button type="button" :class="{ active: layerToggles.scan }" @click="toggleLayer('scan')">扫描</button>
      <button type="button" class="rift-reset-view" @click="resetRiftCamera">总览</button>
    </div>

    <div class="rift-command-bar">
      <span>{{ viewMode === '2d' ? '2D 战术沙盘' : '3D 峡谷沙盘' }}</span>
      <strong>{{ viewMode === '2d' ? '点击聚焦 · 拖动平移 · 滚轮缩放' : '点击聚焦 · 拖动旋转 · 滚轮缩放' }}</strong>
    </div>
  </div>
</template>
