/**
 * The 3D emblem's renderer: the only module of the emblem that imports three.
 *
 * Loaded with a dynamic import from mount.ts after first paint, never on
 * the server. Motion comes from emblem-motion.ts (pure data and arithmetic);
 * this file only applies the values. ADR 0005 has the rules.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { readCSSColor } from '#lib/components/khepri/css-color.js';
import { ENTRANCE, IDLE, POINTER, approach, entranceAt, sampleTrack, tilt } from './emblem-motion.js';

export interface EmblemOptions {
	/** Called once, after the first frame has been drawn. */
	onFirstFrame: () => void;
	/** Called if the WebGL context is lost; the caller shows the flat emblem again. */
	onLost: () => void;
}

export interface EmblemHandle {
	/** Pointer position relative to the emblem's centre, each axis in [-1, 1], +y up. */
	setPointer(x: number, y: number): void;
	/** Clears the pointer: the emblem settles back to rest. */
	clearPointer(): void;
	destroy(): void;
}

const FOV = 30;
const MARGIN = 1.08;
const ENVIRONMENT = 0.9;
const KEY_ELEVATION = 0.6;
const KEY_RADIUS = 3;
// Neutral white is only what a token that fails to parse falls back to.
const FALLBACK = 0xffffff;

// One WebGL context per page: a second emblem gets null and keeps its flat image.
let live = 0;

const SUN = IDLE.find((t) => t.material === 'sun_face');
const SWEEP = IDLE.find((t) => t.light === 'key');

export async function createEmblem(
	canvas: HTMLCanvasElement,
	modelUrl: string,
	options: EmblemOptions
): Promise<EmblemHandle | null> {
	if (live > 0) return null;
	live++;
	let renderer: THREE.WebGLRenderer | null = null;
	try {
		renderer = new THREE.WebGLRenderer({
			canvas,
			alpha: true,
			antialias: true,
			powerPreference: 'low-power'
		});
	} catch (err) {
		live--;
		throw err;
	}
	const r = renderer;
	r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	r.toneMapping = THREE.ACESFilmicToneMapping;
	r.outputColorSpace = THREE.SRGBColorSpace;

	const scene = new THREE.Scene();
	const pmrem = new THREE.PMREMGenerator(r);
	const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environment = environment;
	scene.environmentIntensity = ENVIRONMENT;
	pmrem.dispose();

	const key = new THREE.DirectionalLight(readCSSColor(THREE, '--north-signal', FALLBACK), 2.2);
	const rim = new THREE.DirectionalLight(readCSSColor(THREE, '--muted-foreground', FALLBACK), 1.2);
	rim.position.set(2, 1, -2);
	scene.add(key, rim);

	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);
	const pivot = new THREE.Group();
	pivot.rotation.order = 'YXZ';
	scene.add(pivot);

	// Time runs only while the emblem is drawn, so the entrance is seen in full.
	let seconds = 0;
	let last = 0;
	let frame = 0;
	let running = false;
	let drawn = false;
	let target = { yawDegrees: 0, pitchDegrees: 0 };
	let yaw = 0;
	let pitch = 0;

	const loader = new GLTFLoader();
	loader.setMeshoptDecoder(MeshoptDecoder);
	let gltf;
	try {
		gltf = await loader.loadAsync(modelUrl);
	} catch (err) {
		dispose();
		throw err;
	}
	pivot.add(gltf.scene);

	const box = new THREE.Box3().setFromObject(gltf.scene);
	const size = box.getSize(new THREE.Vector3());
	const fit = (Math.max(size.x, size.y) * MARGIN) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
	camera.position.set(0, 0, fit + size.z / 2);
	camera.lookAt(0, 0, 0);

	let sun: THREE.MeshStandardMaterial | null = null;
	let sunBase = 1;
	gltf.scene.traverse((o) => {
		const mesh = o as THREE.Mesh;
		const material = mesh.material as THREE.MeshStandardMaterial | undefined;
		if (mesh.isMesh && material?.name === 'sun_face') {
			sun = material;
			sunBase = material.emissiveIntensity;
		}
	});

	function resize() {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		if (!width || !height) return;
		r.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}

	function step(now: number) {
		frame = requestAnimationFrame(step);
		const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
		last = now;
		seconds += dt;

		const entrance = entranceAt(ENTRANCE, seconds);
		yaw = approach(yaw, target.yawDegrees, dt, POINTER.timeConstantSeconds);
		pitch = approach(pitch, target.pitchDegrees, dt, POINTER.timeConstantSeconds);
		pivot.position.y = entrance.translateY;
		pivot.rotation.y = THREE.MathUtils.degToRad(entrance.rotateYDegrees + yaw);
		pivot.rotation.x = THREE.MathUtils.degToRad(pitch);

		if (sun && SUN) (sun as THREE.MeshStandardMaterial).emissiveIntensity = sunBase * sampleTrack(SUN, seconds);
		const azimuth = THREE.MathUtils.degToRad(SWEEP ? sampleTrack(SWEEP, seconds) : 0);
		key.position.set(Math.sin(azimuth) * KEY_RADIUS, KEY_ELEVATION * KEY_RADIUS, Math.cos(azimuth) * KEY_RADIUS);

		r.render(scene, camera);
		if (!drawn) {
			drawn = true;
			options.onFirstFrame();
		}
	}

	function setRunning(next: boolean) {
		if (next === running) return;
		running = next;
		if (running) {
			last = 0;
			frame = requestAnimationFrame(step);
		} else {
			cancelAnimationFrame(frame);
		}
	}

	let onScreen = true;
	const sync = () => setRunning(onScreen && document.visibilityState === 'visible');
	const intersection = new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
		sync();
	});
	intersection.observe(canvas);
	const resizer = new ResizeObserver(resize);
	resizer.observe(canvas);
	document.addEventListener('visibilitychange', sync);

	function lost(event: Event) {
		event.preventDefault();
		setRunning(false);
		options.onLost();
	}
	canvas.addEventListener('webglcontextlost', lost);

	function dispose() {
		cancelAnimationFrame(frame);
		running = false;
		scene.traverse((o) => {
			const mesh = o as THREE.Mesh;
			if (!mesh.isMesh) return;
			mesh.geometry.dispose();
			for (const m of [mesh.material].flat()) m.dispose();
		});
		environment.dispose();
		r.dispose();
		r.forceContextLoss();
		live--;
	}

	resize();
	sync();

	return {
		setPointer(x, y) {
			target = tilt(POINTER, x, y);
		},
		clearPointer() {
			target = { yawDegrees: 0, pitchDegrees: 0 };
		},
		destroy() {
			intersection.disconnect();
			resizer.disconnect();
			document.removeEventListener('visibilitychange', sync);
			canvas.removeEventListener('webglcontextlost', lost);
			dispose();
		}
	};
}
