import { afterEach, describe, expect, it, vi } from 'vitest';
import { describedBy, focusFirstInvalid, withInvalidFocus } from './focus.js';

// CI runs the node project only, so these fakes stand in for the few DOM
// calls the helper makes (querySelectorAll, closest, matches, focus).
type Fake = {
	name: string;
	disabled?: boolean;
	hiddenAncestor?: boolean;
	focusable?: boolean;
	tabIndex: number;
	child?: Fake;
	refusesFocus?: boolean;
	closest: (sel: string) => unknown;
	matches: (sel: string) => boolean;
	querySelector: (sel: string) => Fake | null;
	focus: () => void;
};

const active: { el: Fake | null } = { el: null };

function fake(name: string, opts: Partial<Fake> = {}): Fake {
	const el: Fake = {
		name,
		tabIndex: opts.focusable === false ? -1 : 0,
		...opts,
		closest: () => (opts.hiddenAncestor ? {} : null),
		matches: () => opts.focusable !== false,
		querySelector: () => opts.child ?? null,
		focus: () => {
			if (!opts.refusesFocus) active.el = el;
		}
	};
	return el;
}

function root(...els: Fake[]) {
	return { querySelectorAll: () => els } as unknown as ParentNode;
}

const nameOf = (el: HTMLElement | null) => (el as unknown as Fake | null)?.name;

vi.stubGlobal('document', {
	get activeElement() {
		return active.el;
	}
});

afterEach(() => {
	active.el = null;
});

describe('describedBy', () => {
	it('points at the error first, then the hint, else nothing', () => {
		expect(describedBy('name', 'Required', 'Hint')).toBe('name-error');
		expect(describedBy('name', '', 'Hint')).toBe('name-hint');
		expect(describedBy('name', null, null)).toBeUndefined();
	});
});

describe('focusFirstInvalid', () => {
	it('focuses the first invalid control', () => {
		const a = fake('a');
		const b = fake('b');
		expect(nameOf(focusFirstInvalid(root(a, b)))).toBe('a');
		expect(active.el).toBe(a);
	});

	it('skips disabled, hidden and unfocusable controls', () => {
		const disabled = fake('disabled', { disabled: true });
		const hidden = fake('hidden', { hiddenAncestor: true });
		const refuses = fake('refuses', { refusesFocus: true });
		const ok = fake('ok');
		expect(nameOf(focusFirstInvalid(root(disabled, hidden, refuses, ok)))).toBe('ok');
	});

	it('hands focus from an invalid wrapper to its first focusable child', () => {
		const input = fake('input');
		const group = fake('group', { focusable: false, child: input });
		expect(nameOf(focusFirstInvalid(root(group)))).toBe('input');
	});

	it('returns null when nothing is invalid', () => {
		expect(focusFirstInvalid(root())).toBeNull();
	});
});

describe('withInvalidFocus', () => {
	const form = { querySelectorAll: () => [fake('field')] } as unknown as HTMLFormElement;
	const input = { formElement: form } as Parameters<ReturnType<typeof withInvalidFocus>>[0];

	async function run(type: 'failure' | 'success', inner?: Parameters<typeof withInvalidFocus>[0]) {
		const update = vi.fn(async () => {});
		const after = await withInvalidFocus(inner)(input);
		if (typeof after !== 'function') throw new Error('expected a callback');
		await after({ result: { type }, update } as unknown as Parameters<typeof after>[0]);
		return update;
	}

	it('runs the default update and focuses the invalid field on failure', async () => {
		const update = await run('failure');
		expect(update).toHaveBeenCalledOnce();
		expect(active.el?.name).toBe('field');
	});

	it('leaves focus alone on success', async () => {
		await run('success');
		expect(active.el).toBeNull();
	});

	it('runs the inner callback instead of the default update', async () => {
		const innerAfter = vi.fn(async () => {});
		const update = await run('failure', () => innerAfter);
		expect(innerAfter).toHaveBeenCalledOnce();
		expect(update).not.toHaveBeenCalled();
		expect(active.el?.name).toBe('field');
	});
});
