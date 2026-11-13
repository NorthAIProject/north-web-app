import { describe, expect, it } from 'vitest';
import fixtures from '../../../design/mascot-motion.fixtures.json';
import canonical from '../../../design/mascot-motion.json';
import copy from './mascot-motion.json';
import {
	BLINK,
	ENTRANCE,
	IDLE,
	LOOK_AT,
	approach,
	blinkAt,
	ease,
	entranceAt,
	look,
	sampleTrack,
	type Easing
} from './mascot-motion';

const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe('mascot motion (design/mascot-motion.fixtures.json)', () => {
	it('uses the same data as design/mascot-motion.json', () => {
		expect(copy).toEqual(canonical);
	});

	it.each(fixtures.ease)('ease $easing($x)', ({ easing, x, expect: want }) => {
		near(ease(easing as Easing, x), want);
	});

	it.each(fixtures.track)('track $track at $seconds s', ({ track, seconds, expect: want }) => {
		near(sampleTrack(IDLE[track], seconds), want);
	});

	it.each(fixtures.entrance)('entrance at $seconds s', ({ seconds, translateY, rotateYDegrees }) => {
		const got = entranceAt(ENTRANCE, seconds);
		near(got.translateY, translateY);
		near(got.rotateYDegrees, rotateYDegrees);
	});

	it.each(fixtures.blink)('blink at $seconds s', ({ seconds, scaleY }) => {
		near(blinkAt(BLINK, seconds), scaleY);
	});

	it.each(fixtures.look)('look toward ($x, $y)', ({ x, y, ...want }) => {
		const got = look(LOOK_AT, x, y);
		near(got.headYawDegrees, want.headYawDegrees);
		near(got.headPitchDegrees, want.headPitchDegrees);
		near(got.pupilX, want.pupilX);
		near(got.pupilY, want.pupilY);
	});

	it.each(fixtures.approach)('approach $current → $target', (c) => {
		near(approach(c.current, c.target, c.dt, c.tau), c.expect);
	});

	it('names the joints the model has', () => {
		expect(IDLE.map((t) => t.joint)).toEqual(['body', 'core']);
		expect(BLINK.joint).toBe('eyes');
	});
});
