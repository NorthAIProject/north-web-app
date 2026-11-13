/**
 * The 3D mascot's renderer: the only module of the mascot that imports three.
 *
 * Loaded with a dynamic import from mount.ts after first paint, never on the
 * server. Motion comes from mascot-motion.ts (pure data and arithmetic); this
 * file only applies the values to the model's joint nodes (Mascot_body,
 * Mascot_core, Mascot_head, Mascot_eyes, Mascot_pupils; see
 * scripts/brand/mascot_3d.py). ADR 0006 has the rules.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { readCSSColor } from '#lib/components/khepri/css-color.js';
import { BLINK, ENTRANCE, IDLE, LOOK_AT, approach, blinkAt, entranceAt, look, sampleTrack, type Look } from './mascot-motion.js';

export interface MascotOptions {
	/** Called once, after the first frame has been drawn. */
	onFirstFrame: () => void;
	/** Called if the WebGL context is lost; the caller shows the flat mascot again. */
	onLost: () => void;
}

export interface MascotHandle {
	/** Pointer position relative to the mascot's centre, each axis in [-1, 1], +y up. */
	setPointer(x: number, y: number): void;
	/** Clears the pointer: the mascot looks back to rest. */
	clearPointer(): void;
	destroy(): void;
}

const FOV = 30;
const MARGIN = 1.12;
const ENVIRONMENT = 0.9;
// Neutral white is only what a token that fails to parse falls back to.
const FALLBACK = 0xffffff;
const REST: Look = { headYawDegrees: 0, headPitchDegrees: 0, pupilX: 0, pupilY: 0 };

// One WebGL context per page: a second mascot gets null and keeps its flat art.
let live = 0;

const HOVER = IDLE.find((t) => t.joint === 'body' && t.property === 'translateY');
const GLOW = IDLE.find((t) => t.joint === 'core' && t.property === 'emissiveScale');

export async function createMascot(
	canvas: HTMLCanvasElement,
	modelUrl: string,
	options: MascotOptions
): Promise<MascotHandle | null> {
	if (live > 0) return null;
	live++;
	let renderer: THREE.WebGLRenderer;
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
	key.position.set(-1.5, 2, 3);
	const rim = new THREE.DirectionalLight(readCSSColor(THREE, '--muted-foreground', FALLBACK), 1.2);
	rim.position.set(2, 1, -2);
	scene.add(key, rim);

	const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 20);

	// Time runs only while the mascot is drawn, so the entrance is seen in full.
	let seconds = 0;
	let last = 0;
	let frame = 0;
	let running = false;
	let drawn = false;
	let target = REST;
	const now = { ...REST };

	const loader = new GLTFLoader();
	loader.setMeshoptDecoder(MeshoptDecoder);
	let gltf;
	try {
		gltf = await loader.loadAsync(modelUrl);
	} catch (err) {
		dispose();
		throw err;
	}
	scene.add(gltf.scene);

	const joint = (name: string) => {
		const node = gltf.scene.getObjectByName(`Mascot_${name}`);
		if (!node) throw new Error(`mascot model has no joint ${name}`);
		return node;
	};
	let body: THREE.Object3D, head: THREE.Object3D, eyes: THREE.Object3D, pupils: THREE.Object3D, core: THREE.Object3D;
	try {
		[body, head, eyes, pupils, core] = ['body', 'head', 'eyes', 'pupils', 'core'].map(joint);
	} catch (err) {
		dispose();
		throw err;
	}
	head.rotation.order = 'YXZ';
	const bodyRest = body.position.clone();
	const pupilsRest = pupils.position.clone();

	// The core's glowing materials, cloned so the pulse leaves the same
	// material elsewhere on the body alone.
	const glows: { material: THREE.MeshStandardMaterial; base: number }[] = [];
	core.traverse((o) => {
		const mesh = o as THREE.Mesh;
		if (!mesh.isMesh) return;
		const material = mesh.material as THREE.MeshStandardMaterial;
		if (material.emissive && material.emissive.getHex() !== 0) {
			mesh.material = material.clone();
			glows.push({ material: mesh.material as THREE.MeshStandardMaterial, base: material.emissiveIntensity });
		}
	});

	const box = new THREE.Box3().setFromObject(gltf.scene);
	const size = box.getSize(new THREE.Vector3());
	const centre = box.getCenter(new THREE.Vector3());
	const fit = (Math.max(size.x, size.y) * MARGIN) / 2 / Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
	camera.position.set(centre.x, centre.y, centre.z + fit + size.z / 2);
	camera.lookAt(centre);

	function resize() {
		const width = canvas.clientWidth;
		const height = canvas.clientHeight;
		if (!width || !height) return;
		r.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}

	function step(time: number) {
		frame = requestAnimationFrame(step);
		const dt = last ? Math.min((time - last) / 1000, 0.1) : 0;
		last = time;
		seconds += dt;

		const entrance = entranceAt(ENTRANCE, seconds);
		body.position.y = bodyRest.y + entrance.translateY + (HOVER ? sampleTrack(HOVER, seconds) : 0);
		body.rotation.y = THREE.MathUtils.degToRad(entrance.rotateYDegrees);

		const tau = LOOK_AT.timeConstantSeconds;
		for (const k of Object.keys(now) as (keyof Look)[]) now[k] = approach(now[k], target[k], dt, tau);
		head.rotation.y = THREE.MathUtils.degToRad(now.headYawDegrees);
		head.rotation.x = THREE.MathUtils.degToRad(now.headPitchDegrees);
		pupils.position.set(pupilsRest.x + now.pupilX, pupilsRest.y + now.pupilY, pupilsRest.z);
		eyes.scale.y = blinkAt(BLINK, seconds);

		if (GLOW) {
			const scale = sampleTrack(GLOW, seconds);
			for (const g of glows) g.material.emissiveIntensity = g.base * scale;
		}

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
			target = look(LOOK_AT, x, y);
		},
		clearPointer() {
			target = REST;
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
