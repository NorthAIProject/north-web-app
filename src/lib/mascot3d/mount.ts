/**
 * Mounts the 3D mascot into an element that already shows the flat mascot
 * (`.mascot-3d` in app.css paints it). Beta only; ADR 0006.
 *
 * The onboarding page imports this module lazily and only when its server
 * load's `mascot3dModel` is set, so production pages never load it. The flat mascot
 * stays under reduced motion, Save-Data, no WebGL, a model that fails to load,
 * or a lost context; the canvas shows only once a frame has been drawn.
 *
 * Returns a function that tears everything down.
 */
import type { MascotHandle } from './scene.js';

export function mount(el: HTMLElement, modelUrl: string): () => void {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
	if (reduced || saveData || !modelUrl) return () => {};

	let alive = true;
	let mascot: MascotHandle | null = null;
	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	el.append(canvas);

	function onPointer(event: PointerEvent) {
		const rect = el.getBoundingClientRect();
		const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
		const y = -(event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
		mascot?.setPointer(x, y);
	}
	function onRelease(event: PointerEvent) {
		if (event.pointerType !== 'mouse') mascot?.clearPointer();
	}
	const onLeave = () => mascot?.clearPointer();

	(async () => {
		try {
			const { createMascot } = await import('./scene.js');
			if (!alive) return;
			const handle = await createMascot(canvas, modelUrl, {
				onFirstFrame: () => el.setAttribute('data-live', ''),
				onLost: () => el.removeAttribute('data-live')
			});
			if (!handle) return;
			if (!alive) return handle.destroy();
			mascot = handle;
			window.addEventListener('pointermove', onPointer, { passive: true });
			window.addEventListener('pointerup', onRelease, { passive: true });
			window.addEventListener('pointercancel', onRelease, { passive: true });
			document.documentElement.addEventListener('pointerleave', onLeave);
		} catch {
			// No WebGL or no model: the flat mascot stays, which is the design.
			el.removeAttribute('data-live');
		}
	})();

	return () => {
		alive = false;
		window.removeEventListener('pointermove', onPointer);
		window.removeEventListener('pointerup', onRelease);
		window.removeEventListener('pointercancel', onRelease);
		document.documentElement.removeEventListener('pointerleave', onLeave);
		mascot?.destroy();
		el.removeAttribute('data-live');
		canvas.remove();
	};
}
