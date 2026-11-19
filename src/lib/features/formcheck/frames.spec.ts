import { describe, expect, it } from 'vitest';
import { FRAME_EDGE, MAX_FRAMES, TARGET_FRAMES, fitWithin, frameTimes } from './frames.js';
import { formCheckBody } from './upload.js';
import { markerLeft, readFromStills } from './view.js';

describe('frameTimes', () => {
	it('spreads the target count through a working set', () => {
		const times = frameTimes(16);
		expect(times).toHaveLength(TARGET_FRAMES);
		expect(times[0]).toBe(0.5);
		expect(times.at(-1)).toBe(15.5);
	});

	it('is strictly increasing and inside the clip, which the server requires', () => {
		for (const duration of [0.3, 0.9, 1, 2.37, 7.5, 44.91, 600]) {
			const times = frameTimes(duration);
			expect(times.length).toBeGreaterThan(0);
			expect(times.length).toBeLessThanOrEqual(MAX_FRAMES);
			let previous = 0;
			for (const at of times) {
				expect(at).toBeGreaterThan(previous);
				expect(at).toBeLessThanOrEqual(duration);
				previous = at;
			}
		}
	});

	it('cuts fewer stills from a clip too short to show sixteen positions', () => {
		expect(frameTimes(2)).toHaveLength(8);
		expect(frameTimes(0.5)).toHaveLength(4);
	});

	it('cuts nothing from a clip with no length', () => {
		expect(frameTimes(0)).toEqual([]);
		expect(frameTimes(Number.NaN)).toEqual([]);
		expect(frameTimes(Number.POSITIVE_INFINITY)).toEqual([]);
	});
});

describe('fitWithin', () => {
	it('shrinks the longer side to the edge and keeps the shape', () => {
		expect(fitWithin(1920, 1080)).toEqual({ width: FRAME_EDGE, height: 432 });
		expect(fitWithin(1080, 1920)).toEqual({ width: 432, height: FRAME_EDGE });
	});

	it('never enlarges a small clip', () => {
		expect(fitWithin(320, 240)).toEqual({ width: 320, height: 240 });
	});

	it('answers nothing for a clip with no picture', () => {
		expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
	});
});

describe('formCheckBody', () => {
	it('sends the clip, each still in order, and one time per still', () => {
		const video = new File(['clip'], 'squat.mp4', { type: 'video/mp4' });
		const frames = [new Blob(['a'], { type: 'image/jpeg' }), new Blob(['b'], { type: 'image/jpeg' })];
		const body = formCheckBody(video, { frames, times: [0.5, 1.5], durationSeconds: 2 });

		expect((body.get('video') as File).name).toBe('squat.mp4');
		expect(body.getAll('frames').map((f) => (f as File).name)).toEqual(['frame-01.jpg', 'frame-02.jpg']);
		expect(body.get('frameTimes')).toBe('0.5,1.5');
		expect(body.get('durationSeconds')).toBe('2');
	});
});

describe('markerLeft', () => {
	it('places a moment along the clip', () => {
		expect(markerLeft(4, 8)).toBe(50);
	});

	it('keeps a marker on the line when the numbers are wrong', () => {
		expect(markerLeft(12, 8)).toBe(100);
		expect(markerLeft(-1, 8)).toBe(0);
		expect(markerLeft(3, 0)).toBe(0);
		expect(markerLeft(Number.NaN, 8)).toBe(0);
	});
});

describe('readFromStills', () => {
	it('is true only for a check read from stills', () => {
		expect(readFromStills({ method: 'stills' })).toBe(true);
		expect(readFromStills({ method: 'video' })).toBe(false);
		expect(readFromStills({})).toBe(false);
	});
});
