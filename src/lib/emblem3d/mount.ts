/**
 * Mounts the 3D emblem into an element that already shows the flat emblem
 * (`.emblem-3d` in app.css paints it). Gated by its model URL; ADR 0005.
 *
 * AuthShell imports this module lazily and only when the root layout's
 * `emblem3dModel` is set, so production pages never load it. The flat emblem
 * stays under reduced motion, Save-Data, no WebGL, a model that fails to load,
 * or a lost context; the canvas shows only once a frame has been drawn.
 *
 * Returns a function that tears everything down.
 */
import type { EmblemHandle } from './scene.js';

export function mount(el: HTMLElement, modelUrl: string): () => void {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
	if (reduced || saveData || !modelUrl) return () => {};

	let alive = true;
	let emblem: EmblemHandle | null = null;
	const canvas = document.createElement('canvas');
	canvas.setAttribute('aria-hidden', 'true');
	el.append(canvas);

	function onPointer(event: PointerEvent) {
		const rect = el.getBoundingClientRect();
		const x = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
		const y = -(event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
		emblem?.setPointer(x, y);
	}
	function onRelease(event: PointerEvent) {
		if (event.pointerType !== 'mouse') emblem?.clearPointer();
	}
	const onLeave = () => emblem?.clearPointer();

	(async () => {
		try {
			const { createEmblem } = await import('./scene.js');
			if (!alive) return;
			const handle = await createEmblem(canvas, modelUrl, {
				onFirstFrame: () => el.setAttribute('data-live', ''),
				onLost: () => el.removeAttribute('data-live')
			});
			if (!handle) return;
			if (!alive) return handle.destroy();
			emblem = handle;
			window.addEventListener('pointermove', onPointer, { passive: true });
			window.addEventListener('pointerup', onRelease, { passive: true });
			window.addEventListener('pointercancel', onRelease, { passive: true });
			document.documentElement.addEventListener('pointerleave', onLeave);
		} catch {
			// No WebGL or no model: the flat emblem stays, which is the design.
			el.removeAttribute('data-live');
		}
	})();

	return () => {
		alive = false;
		window.removeEventListener('pointermove', onPointer);
		window.removeEventListener('pointerup', onRelease);
		window.removeEventListener('pointercancel', onRelease);
		document.documentElement.removeEventListener('pointerleave', onLeave);
		emblem?.destroy();
		el.removeAttribute('data-live');
		canvas.remove();
	};
}
