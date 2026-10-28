import { describe, expect, it } from 'vitest';
import { anchor, draft, paragraphs } from './dailyposts';

// north-client web/dailyposts view.go, carried over.
describe('daily post', () => {
	it('splits a body on blank lines and drops empty paragraphs', () => {
		expect(paragraphs('One.\r\n\r\nTwo\nstill two.\n\n\n\n  Three.  ')).toEqual(['One.', 'Two\nstill two.', 'Three.']);
		expect(paragraphs('   ')).toEqual([]);
	});

	it('drafts the coach question about the post', () => {
		expect(draft({ title: 'Sleep debt' })).toBe('About today\'s post, "Sleep debt": ');
	});

	it('anchors a post by id', () => {
		expect(anchor('abc')).toBe('post-abc');
	});
});
