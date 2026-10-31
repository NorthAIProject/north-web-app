/**
 * The body figure (NOR-8): a port of north-client
 * web/assets/js/shared/muscle-viewer/viewer.js.
 *
 * The figure is body-map.glb, built by north-client's scripts/bodymap from the anatomical
 * atlas: the muscles themselves, one mesh per muscle key, inside the body's
 * skin. The skin is drawn as an outline only, clear facing the camera and firm
 * at the silhouette; its shape keys (setShape) widen that edge to a person's
 * measurements. Colouring a muscle is setting one colour — no geometry is
 * reloaded — and a tap resolves to a key by the mesh's name.
 *
 * Untrained muscle is a cool grey-blue; trained muscle ramps from a pale amber
 * to ember.
 *
 * This module imports three.js statically. MuscleViewer.svelte imports *this
 * module* lazily inside an effect, so three never loads during SSR or on a page
 * without a figure.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { MUSCLE_INFO, type MuscleInfo } from './muscles.js';
import { readCSSColor } from './css-color.js';

// body-map.glb packed with meshopt (EXT_meshopt_compression, ~1.5 MB → 0.57 MB);
// the suffix is the source file's hash, so the URL is cached as immutable.
// static/assets/models/README.md has the command.
const MODEL_PATH = '/assets/models/body-map-83dd70bd.glb';
const SHELL_REGION = 'shell'; // the skin; every other mesh is a muscle
const SHELL_EDGE_ALPHA = 0.9;
const SHELL_EDGE_POWER = 4; // higher is a thinner edge

// Fallbacks for the colour tokens in app.css, used only when a page has not
// loaded the stylesheet.
const FALLBACK = {
	idle: 0x7d8ca1,
	shell: 0xc9d3df,
	heatLow: 0xf0d6a0,
	ember: 0xe8973c
};

const THEME = {
	dark: { exposure: 0.95, rim: 0x8ec6ff, rimStrength: 0.3 },
	light: { exposure: 0.9, rim: 0x2b3a52, rimStrength: 0.15 }
};

// Muscles mostly seen from behind. When the hottest of these outweighs the
// front, the figure faces away by default, so a back day is not hidden.
const BACK_REGIONS = new Set(['traps', 'lats', 'erectors', 'glutes', 'hamstrings', 'calves', 'triceps', 'neck']);

const FRONT_YAW = 0.45; // front three-quarter, radians
const SWAY = 0.35; // idle sway either side of the facing, radians
const SWAY_PERIOD = 8; // seconds

export type ViewerOptions = {
	reduced?: boolean;
	dark?: boolean;
	/** Lets a preview compare asset builds. */
	model?: string;
	onMuscleClick?: (key: string | null, info: MuscleInfo | null, at: { x: number; y: number }) => void;
};

export type MuscleViewerHandle = {
	setHeat(next?: Record<string, number>): void;
	setMuscleGroups(groups?: { primary?: string[]; secondary?: string[]; stabilizers?: string[] }): void;
	setShape(shape?: Partial<Record<string, number>>): void;
	setLoads(loads?: { key: string; share: number }[]): void;
	select(key: string | null): void;
	face(side: 'front' | 'back' | 'side'): void;
	setTheme(isDark: boolean): void;
	destroy(): void;
};

type Colours = { idle: THREE.Color; shell: THREE.Color; heatLow: THREE.Color; ember: THREE.Color };
type Rim = { color: { value: THREE.Color }; strength: { value: number } };
type RegionEntry = { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial };
type Shell = {
	geometry: THREE.BufferGeometry;
	ghost: THREE.MeshStandardMaterial;
	meshes: THREE.Mesh[];
	targets: Record<string, number>;
};

// A soft radial-gradient disc under the figure. Cheaper than a shadow map.
function createShadowTexture(): THREE.CanvasTexture {
	const size = 128;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
	gradient.addColorStop(1, 'rgba(0,0,0,0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	return texture;
}

// A studio softbox rig baked into an environment map by PMREMGenerator.
// Colours exceed 1.0 deliberately — PMREM renders to a half-float target.
function createStudioEnvironment(): THREE.Scene {
	const env = new THREE.Scene();
	const geometry = new THREE.PlaneGeometry(1, 1);
	const panel = (hex: number, intensity: number, scale: [number, number], position: [number, number, number]) => {
		const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
		material.color.setHex(hex).multiplyScalar(intensity);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.scale.set(scale[0], scale[1], 1);
		mesh.position.set(position[0], position[1], position[2]);
		mesh.lookAt(0, 0, 0);
		env.add(mesh);
	};
	panel(0xfff4e6, 6.5, [9, 12], [5, 5, 7]); // key, warm, front-right
	panel(0xdce8ff, 2.4, [8, 10], [-6, 2, 3]); // fill, cool, front-left
	panel(0xffffff, 3.5, [10, 4], [0, 9, -1]); // overhead strip
	panel(0x6b6257, 0.8, [12, 12], [0, -6, 2]); // floor bounce
	panel(0xa8c4e8, 1.4, [7, 10], [0, 1, -9]); // back separation
	return env;
}

// Cheap to check before the download and the WebGLRenderer constructor. A
// thrown createViewer() means "no 3D here": callers show the flat figure.
function hasWebGL(): boolean {
	try {
		const probe = document.createElement('canvas');
		return Boolean(window.WebGLRenderingContext && (probe.getContext('webgl2') || probe.getContext('webgl')));
	} catch {
		return false;
	}
}

function readColours(): Colours {
	return {
		idle: readCSSColor(THREE, '--north-body-idle', FALLBACK.idle),
		shell: readCSSColor(THREE, '--north-body-shell', FALLBACK.shell),
		heatLow: readCSSColor(THREE, '--north-heat-low', FALLBACK.heatLow),
		ember: readCSSColor(THREE, '--north-ember', FALLBACK.ember)
	};
}

// A fresnel rim injected into the standard material. The colour uniforms are
// shared, so a theme change is one assignment. rimAlpha also firms a
// translucent material up at the silhouette (the shell's outline).
function addRim(material: THREE.Material, rim: Rim, rimAlpha = 0, rimPower = 2.5) {
	material.onBeforeCompile = (shader) => {
		shader.uniforms.uRimColor = rim.color;
		shader.uniforms.uRimStrength = rim.strength;
		shader.uniforms.uRimAlpha = { value: rimAlpha };
		shader.uniforms.uRimPower = { value: rimPower };
		shader.fragmentShader = shader.fragmentShader
			.replace(
				'#include <common>',
				'#include <common>\nuniform vec3 uRimColor;\nuniform float uRimStrength;\nuniform float uRimAlpha;\nuniform float uRimPower;'
			)
			.replace(
				'#include <opaque_fragment>',
				`{
          float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), uRimPower);
          outgoingLight += uRimColor * rim * uRimStrength;
          diffuseColor.a = min(1.0, diffuseColor.a + rim * uRimAlpha);
        }
        #include <opaque_fragment>`
			);
	};
	material.customProgramCacheKey = () => 'north-body-rim';
}

export async function createViewer(canvas: HTMLCanvasElement, options: ViewerOptions = {}): Promise<MuscleViewerHandle> {
	if (!hasWebGL()) throw new Error('WebGL unavailable');

	const reduced = Boolean(options.reduced);
	let palette = options.dark !== false ? THEME.dark : THEME.light;
	let colours = readColours();

	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = palette.exposure;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

	const pmrem = new THREE.PMREMGenerator(renderer);
	const studio = createStudioEnvironment();
	const envTexture = pmrem.fromScene(studio, 0.03).texture;
	studio.traverse((obj) => {
		if (obj instanceof THREE.Mesh) {
			obj.geometry.dispose();
			(obj.material as THREE.Material).dispose();
		}
	});
	pmrem.dispose();
	scene.environment = envTexture;
	// Enough to model the form; more washes the region colours out.
	scene.environmentIntensity = 0.65;

	// Shaping only; the environment does most of the lighting.
	const key = new THREE.DirectionalLight(0xfff1e0, 0.9);
	key.position.set(2, 3, 3);
	scene.add(key);
	const rimLight = new THREE.DirectionalLight(palette.rim, 0.5);
	rimLight.position.set(-2, 1, -3);
	scene.add(rimLight);

	const rim: Rim = {
		color: { value: new THREE.Color(palette.rim) },
		strength: { value: palette.rimStrength }
	};

	let loaded: Awaited<ReturnType<typeof loadFigure>>;
	try {
		loaded = await loadFigure(colours, rim, options.model);
	} catch (err) {
		envTexture.dispose();
		renderer.dispose();
		renderer.forceContextLoss();
		throw err;
	}
	const { figure, regions, shell, height } = loaded;
	const group = new THREE.Group();
	group.add(figure);
	scene.add(group);

	const shadowTexture = createShadowTexture();
	const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false });
	const shadowGeometry = new THREE.CircleGeometry(height * 0.3, 32);
	const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
	shadow.rotation.x = -Math.PI / 2;
	shadow.position.y = 0.001;
	scene.add(shadow);

	// Frame the standing figure: aim at its middle from far enough back that
	// head and feet fit at any aspect the card gives us.
	function frame() {
		const fov = THREE.MathUtils.degToRad(camera.fov);
		const fitHeight = (height * 1.04) / 2 / Math.tan(fov / 2);
		const fitWidth = fitHeight / Math.min(1, camera.aspect * 1.6);
		camera.position.set(0, height * 0.52, Math.max(fitHeight, fitWidth));
		camera.lookAt(0, height * 0.5, 0);
	}

	// ---------------------------------------------------------------------
	// Interaction: drag turns the figure; a short, still press is a tap.
	// ---------------------------------------------------------------------
	let facing = FRONT_YAW;
	let dragOffset = 0;
	let dragging = false;
	let lastX = 0;
	let down = { x: 0, y: 0, at: 0 };
	let lastDragAt = -Infinity;
	// Render-loop state (see wake() below), declared before anything can call it.
	let destroyed = false;
	let visible = true;
	let raf = 0;

	const onPointerDown = (e: PointerEvent) => {
		dragging = true;
		lastX = e.clientX;
		down = { x: e.clientX, y: e.clientY, at: performance.now() };
		canvas.setPointerCapture(e.pointerId);
		wake();
	};
	const onPointerMove = (e: PointerEvent) => {
		if (!dragging) return;
		dragOffset += (e.clientX - lastX) * 0.012;
		lastX = e.clientX;
		lastDragAt = performance.now();
		wake();
	};
	const onPointerUp = (e: PointerEvent) => {
		dragging = false;
		if (e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
			canvas.releasePointerCapture(e.pointerId);
		}
		const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
		if (e.type === 'pointerup' && moved <= 6 && performance.now() - down.at <= 500) tap(e);
	};
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointercancel', onPointerUp);

	// Only the muscles answer a tap: the skin is a body, not a thing to ask about.
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	const meshes = Object.values(regions).map((r) => r.mesh);
	let selected: string | null = null;

	function tap(e: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const hit = raycaster.intersectObjects(meshes, false)[0];
		const key = hit ? hit.object.name : null;
		select(key);
		options.onMuscleClick?.(key, key ? (MUSCLE_INFO[key] ?? null) : null, {
			x: (e.clientX - rect.left) / rect.width,
			y: (e.clientY - rect.top) / rect.height
		});
	}

	// The selected muscle glows in its own colour, so a tap is seen to land.
	function highlight(region: RegionEntry, on: boolean) {
		if (on) region.material.emissive.copy(region.material.color).multiplyScalar(0.45);
		else region.material.emissive.setScalar(0);
	}

	function select(key: string | null) {
		if (selected && regions[selected]) highlight(regions[selected], false);
		selected = key;
		if (selected && regions[selected]) highlight(regions[selected], true);
		wake();
	}

	// ---------------------------------------------------------------------
	// Sizing, and a render loop paused whenever the canvas is off screen
	// ---------------------------------------------------------------------
	function resize() {
		const width = canvas.clientWidth;
		const h = canvas.clientHeight;
		if (!width || !h) return;
		renderer.setSize(width, h, false);
		camera.aspect = width / h;
		camera.updateProjectionMatrix();
		frame();
		wake();
	}
	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(canvas);
	resize();

	// Frames are drawn on demand: wake() asks for one, and tick keeps asking
	// only while something moves — the idle sway (never under reduced motion),
	// a drag, or the figure easing to a new facing. A still figure (reduced
	// motion, a settled turn) costs nothing between changes.
	const start = performance.now();
	let yaw = facing;

	function wake() {
		if (visible && !raf && !destroyed) raf = requestAnimationFrame(tick);
	}

	const visibility = new IntersectionObserver((entries) => {
		visible = entries.some((e) => e.isIntersecting);
		if (visible) wake();
	});
	visibility.observe(canvas);

	function tick(now: number) {
		raf = 0;
		if (!visible || destroyed) return;
		// A slow sway around the facing, paused for a few seconds after a drag;
		// none at all for reduced motion.
		const idle = !reduced && !dragging && now - lastDragAt > 4000;
		const sway = idle ? Math.sin(((now - start) / 1000 / SWAY_PERIOD) * Math.PI * 2) * SWAY : 0;
		const target = facing + dragOffset + sway;
		yaw += (target - yaw) * (reduced ? 1 : 0.08);
		group.rotation.y = yaw;
		renderer.render(scene, camera);
		if (!reduced || dragging || Math.abs(target - yaw) > 1e-4) wake();
	}
	wake();

	// ---------------------------------------------------------------------
	// Colour
	// ---------------------------------------------------------------------
	let heat: Record<string, number> = {};
	const scratch = new THREE.Color();

	function colourFor(intensity: number): THREE.Color {
		if (!(intensity > 0)) return colours.idle;
		// Even a light touch reads as warm: start a little way up the ramp.
		const t = 0.15 + 0.85 * Math.min(1, intensity);
		return scratch.copy(colours.heatLow).lerp(colours.ember, t);
	}

	function paintSkin() {
		shell.ghost.color.copy(colours.shell);
	}

	function setHeat(next: Record<string, number> = {}) {
		heat = { ...next };
		for (const [k, region] of Object.entries(regions)) {
			region.material.color.copy(colourFor(heat[k] || 0));
			if (k === selected) highlight(region, true);
		}
		let front = 0;
		let back = 0;
		for (const [k, value] of Object.entries(heat)) {
			if (BACK_REGIONS.has(k)) back = Math.max(back, value);
			else front = Math.max(front, value);
		}
		facing = back > front ? Math.PI + FRONT_YAW : FRONT_YAW;
		wake();
	}

	function setMuscleGroups({
		primary = [],
		secondary = [],
		stabilizers = []
	}: { primary?: string[]; secondary?: string[]; stabilizers?: string[] } = {}) {
		const next: Record<string, number> = {};
		const put = (keys: string[], value: number) => {
			for (const k of keys) next[k] = Math.max(next[k] || 0, value);
		};
		put(stabilizers, 0.25);
		put(secondary, 0.55);
		put(primary, 1);
		setHeat(next);
	}

	function setLoads(loads: { key: string; share: number }[] = []) {
		const peak = loads.reduce((m, l) => Math.max(m, l.share), 0) || 1;
		const next: Record<string, number> = {};
		for (const load of loads) next[load.key] = Math.max(next[load.key] || 0, load.share / peak);
		setHeat(next);
	}

	paintSkin();
	setHeat({});

	// Shapes the skin to a person's measurements ({waist, hips, chest,
	// overall}, each 0..1, from the server). Unknown keys stay at 0.
	function setShape(shape: Partial<Record<string, number>> = {}) {
		for (const [name, index] of Object.entries(shell.targets)) {
			const value = Math.min(1, Math.max(0, Number(shape[name]) || 0));
			for (const mesh of shell.meshes) {
				if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[index] = value;
			}
		}
		wake();
	}

	return {
		setHeat,
		setMuscleGroups,
		setShape,
		setLoads,
		select,
		// Turn to show the front, the back or the profile.
		face(side) {
			facing = ({ back: Math.PI + FRONT_YAW, side: Math.PI / 2 } as Record<string, number>)[side] ?? FRONT_YAW;
			dragOffset = 0;
			wake();
		},
		setTheme(isDark) {
			palette = isDark ? THEME.dark : THEME.light;
			renderer.toneMappingExposure = palette.exposure;
			rimLight.color.set(palette.rim);
			rim.color.value.set(palette.rim);
			rim.strength.value = palette.rimStrength;
			colours = readColours();
			paintSkin();
			setHeat(heat);
		},
		destroy() {
			cancelAnimationFrame(raf);
			destroyed = true;
			resizeObserver.disconnect();
			visibility.disconnect();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerUp);
			for (const region of Object.values(regions)) {
				region.mesh.geometry.dispose();
				region.material.dispose();
			}
			shell.geometry.dispose();
			shell.ghost.dispose();
			shadowGeometry.dispose();
			shadowMaterial.dispose();
			shadowTexture.dispose();
			envTexture.dispose();
			scene.clear();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	};
}

// One download and parse per model per page: the landing's figure, or a
// training dialog opened twice, is torn down off screen and rebuilt on the way
// back, and each rebuild clones the parsed scene instead of fetching again.
// Geometry is shared between clones; a viewer's destroy() releases only its
// own renderer's copy on the GPU, so a later viewer uploads it again.
const models = new Map<string, Promise<GLTF>>();

function loadModel(url: string): Promise<GLTF> {
	let pending = models.get(url);
	if (!pending) {
		const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
		pending = loader.loadAsync(url);
		pending.catch(() => models.delete(url));
		models.set(url, pending);
	}
	return pending;
}

/**
 * Loads body-map.glb: the skin becomes the shell, every other mesh a muscle
 * region with its own material, keyed by the mesh's name. The file stands on
 * the origin (soles at y = 0, centred).
 */
async function loadFigure(colours: Colours, rim: Rim, model?: string) {
	const gltf = await loadModel(model || MODEL_PATH);
	const figure = gltf.scene.clone(true);

	const meshes: THREE.Mesh[] = [];
	figure.traverse((obj) => {
		if (obj instanceof THREE.Mesh) meshes.push(obj);
	});
	// gltfpack moves each mesh onto an unnamed child of the named node (shell,
	// quads, …), which GLTFLoader calls mesh_<n>; the key is then the parent's
	// name. Copied onto the mesh, so a tap resolves by hit.object.name.
	const isKey = (name?: string) => name === SHELL_REGION || (!!name && name in MUSCLE_INFO);
	for (const obj of meshes) {
		if (!isKey(obj.name) && isKey(obj.parent?.name)) obj.name = obj.parent!.name;
	}

	const regions: Record<string, RegionEntry> = {};
	let shell: Shell | null = null;
	for (const obj of meshes) {
		// The file's own materials stay with the cached scene (they hold no GPU
		// state until drawn, and these meshes never draw them).
		if (obj.name === SHELL_REGION) {
			shell = skinLayers(obj, colours, rim);
			continue;
		}
		const material = new THREE.MeshStandardMaterial({
			color: colours.idle,
			roughness: 0.55,
			metalness: 0,
			emissive: 0x000000
		});
		addRim(material, rim);
		obj.material = material;
		regions[obj.name] = { mesh: obj, material };
	}
	if (!shell) throw new Error('body-map.glb has no shell mesh');
	const box = new THREE.Box3().setFromObject(figure);
	return { figure, regions, shell, height: box.max.y - box.min.y };
}

/**
 * The skin, drawn as the body's outline: clear where it faces the camera,
 * firming up only at the silhouette. The only mesh the shape keys move.
 */
function skinLayers(obj: THREE.Mesh, colours: Colours, rim: Rim): Shell {
	const ghost = new THREE.MeshStandardMaterial({
		color: colours.shell,
		roughness: 0.4,
		metalness: 0,
		transparent: true,
		opacity: 0,
		depthWrite: false
	});
	addRim(ghost, rim, SHELL_EDGE_ALPHA, SHELL_EDGE_POWER);
	obj.material = ghost;
	obj.renderOrder = 1;
	return { geometry: obj.geometry, ghost, meshes: [obj], targets: obj.morphTargetDictionary || {} };
}
