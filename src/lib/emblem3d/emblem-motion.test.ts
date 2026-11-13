import { describe, expect, it } from 'vitest';
import fixtures from '../../../design/emblem-motion.fixtures.json';
import canonical from '../../../design/emblem-motion.json';
import copy from './emblem-motion.json';
import {
	ENTRANCE,
	IDLE,
	POINTER,
	approach,
	ease,
	entranceAt,
	sampleTrack,
	tilt,
	type Easing
} from './emblem-motion';

const near = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 6);

describe('emblem motion (design/emblem-motion.fixtures.json)', () => {
	it('uses the same data as design/emblem-motion.json', () => {
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

	it.each(fixtures.tilt)('tilt toward ($x, $y)', ({ x, y, yawDegrees, pitchDegrees }) => {
		const got = tilt(POINTER, x, y);
		near(got.yawDegrees, yawDegrees);
		near(got.pitchDegrees, pitchDegrees);
	});

	it.each(fixtures.approach)('approach $current → $target', (c) => {
		near(approach(c.current, c.target, c.dt, c.tau), c.expect);
	});
});
