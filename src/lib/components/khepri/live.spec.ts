import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announceCheckInSaved, onCheckInSaved } from './live.js';

// A document stand-in: an event target whose visibility the test flips.
class FakeDocument extends EventTarget {
	hidden = false;
	setHidden(hidden: boolean) {
		this.hidden = hidden;
		this.dispatchEvent(new Event('visibilitychange'));
	}
}

describe('onCheckInSaved', () => {
	let doc: FakeDocument;

	beforeEach(() => {
		vi.useFakeTimers();
		doc = new FakeDocument();
		vi.stubGlobal('document', doc);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('refreshes on a save and on every poll while visible', () => {
		const refresh = vi.fn();
		const stop = onCheckInSaved(refresh, 1000);
		announceCheckInSaved();
		expect(refresh).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(2000);
		expect(refresh).toHaveBeenCalledTimes(3);
		stop();
		vi.advanceTimersByTime(5000);
		announceCheckInSaved();
		expect(refresh).toHaveBeenCalledTimes(3);
	});

	it('skips polls while hidden and catches up once on return', () => {
		const refresh = vi.fn();
		const stop = onCheckInSaved(refresh, 1000);
		doc.setHidden(true);
		vi.advanceTimersByTime(5000);
		expect(refresh).not.toHaveBeenCalled();
		doc.setHidden(false);
		expect(refresh).toHaveBeenCalledTimes(1);
		stop();
	});

	it('does not refresh on return when no poll was missed', () => {
		const refresh = vi.fn();
		const stop = onCheckInSaved(refresh, 1000);
		vi.advanceTimersByTime(300);
		doc.setHidden(true);
		vi.advanceTimersByTime(300);
		doc.setHidden(false);
		expect(refresh).not.toHaveBeenCalled();
		stop();
	});
});
