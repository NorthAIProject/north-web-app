/**
 * Public state API for the Khepri companion (NOR-51): a port of north-client
 * web/assets/js/shared/mascot/alpine.js.
 *
 * The still is the mascot: Mascot.svelte only writes `data-state`, and CSS in
 * app.css (.north-mascot) is what moves it.
 *
 * The state lives on this module, not on the component, so a mascot that
 * mounts after a re-render adopts the sustained state and replays a gesture
 * asked for a moment ago (the chat "done" refresh case).
 *
 * Browser-only: nothing here runs during SSR except reading constants. The
 * document listeners install on the first mascot mount (or installMascotBridge()).
 *
 *	import { mascot } from '#lib/components/khepri/mascot.svelte.js';
 *	mascot.setState('thinking');           // every mounted mascot
 *	mascot.setState('nod', { id: 'chat' }); // one of them
 *
 * or a `north:mascot-state` CustomEvent on document with {state, id}.
 *
 * The htmx SSE bridge is replaced by explicit calls for the chat port:
 * mascot.streamOpened(), streamMessage(event, data), streamFailed(),
 * streamClosed(). mascotChat holds the Muse header's phase and status line.
 */

export const SUSTAINED = ['idle', 'thinking', 'listening', 'working'] as const;
export const GESTURES = ['celebrate', 'nod'] as const;

// Contract names (_reviews/muse-chat-contract.md) → poses.
const ALIASES: Record<string, string> = { celebrating: 'celebrate', failed: 'idle' };

// How long "celebrating" holds after a reply lands.
const CELEBRATE_MS = 1200;

// How recently a gesture must have been asked for to replay on a new mount.
const GESTURE_REPLAY_MS = 1000;

const isSustained = (name: string) => (SUSTAINED as readonly string[]).includes(name);
const isGesture = (name: string) => (GESTURES as readonly string[]).includes(name);

export function isKnown(name: string): boolean {
	return isSustained(name) || isGesture(name);
}

export function canonical(name: string | undefined | null): string {
	const n = name ?? '';
	return ALIASES[n] ?? n;
}

/** Server-side default pose (Go: stateOrDefault). */
export function stateOrDefault(s: string | undefined): string {
	return s === 'thinking' || s === 'listening' || s === 'working' ? s : 'idle';
}

/** Drops anything that is not a gesture (Go: gestureOrEmpty). */
export function gestureOrEmpty(s: string | undefined): string {
	return s === 'celebrate' || s === 'nod' ? s : '';
}

function reducedMotion(): boolean {
	return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type Instance = { id: string; apply(name: string): void };

const instances = new Set<Instance>();
let sustained = 'idle';
let lastGesture: string | null = null;
let lastGestureAt = 0;

/** Drives every mounted mascot, or one by id. */
function setState(name: string, options: { id?: string } = {}) {
	name = canonical(name);
	if (!isKnown(name)) return;
	if (isGesture(name)) {
		lastGesture = name;
		lastGestureAt = Date.now();
	} else {
		sustained = name;
	}
	for (const instance of instances) {
		if (options.id && instance.id !== options.id) continue;
		instance.apply(name);
	}
}

// --- chat status line -------------------------------------------------------
//
// The Muse header shows a phase (drives the ring) and a status line. Copy comes
// from the page (bindChatCopy); a tool line arrives already translated.

export type ChatPhase = 'idle' | 'listening' | 'working' | 'celebrating' | 'failed';
export type ChatStatusKey = 'ready' | 'listening' | 'thinking' | 'writing' | 'snag' | 'tool';
export type ChatCopy = { ready: string; listening: string; thinking: string; writing: string; snag: string };

/** The chat header's phase and status line, reactive. */
export const mascotChat = $state({ phase: 'idle' as ChatPhase, status: '' });

let statusKey: ChatStatusKey = 'ready';
let statusLine = '';
let copy: ChatCopy | null = null;
let celebrateTimer: ReturnType<typeof setTimeout> | null = null;

function lineFor(key: ChatStatusKey): string {
	if (key === 'tool') return statusLine;
	const c: Partial<ChatCopy> = copy ?? {};
	return c[key] || c.ready || '';
}

function render() {
	if (!copy) return;
	mascotChat.status = lineFor(statusKey);
}

/** Moves the chat header to a phase and status line. */
function setChat(next: ChatPhase, key: ChatStatusKey, line?: string) {
	if (celebrateTimer && next !== 'celebrating') {
		clearTimeout(celebrateTimer);
		celebrateTimer = null;
	}
	mascotChat.phase = next;
	statusKey = key;
	statusLine = line || '';
	render();
}

/** The chat page hands over its translated status copy (Go: data-status-*). */
function bindChatCopy(next: Partial<ChatCopy>) {
	copy = {
		ready: next.ready || '',
		listening: next.listening || '',
		thinking: next.thinking || '',
		writing: next.writing || '',
		snag: next.snag || ''
	};
	render();
}

// --- coach stream bridge (was htmx SSE events) ------------------------------
//
//   connection open        → working, "is thinking"
//   unnamed frame (token)  → working, "is writing"
//   status                 → working, "is {tool}"
//   failed / stream error  → failed, "hit a snag"
//   close after working    → celebrating for 1.2s, then idle

function streamOpened() {
	setState('working');
	setChat('working', 'thinking');
}

/** One SSE frame: event "" is a content token, "status" a tool line, "failed" a failure. */
function streamMessage(event: string, data?: string) {
	switch (event || '') {
		case '':
			if (mascotChat.phase === 'working') setChat('working', 'writing');
			break;
		case 'status':
			if (mascotChat.phase === 'working' && data) setChat('working', 'tool', data.trim());
			break;
		case 'failed':
			streamFailed();
			break;
	}
}

function streamFailed() {
	setState('failed');
	setChat('failed', 'snag');
}

function streamClosed() {
	// A failed turn keeps saying so; it clears on the next action.
	if (mascotChat.phase !== 'working') return;
	setState('idle');
	setState('celebrating');
	setChat('celebrating', 'ready');
	celebrateTimer = setTimeout(() => {
		celebrateTimer = null;
		if (mascotChat.phase === 'celebrating') setChat('idle', 'ready');
	}, CELEBRATE_MS);
}

// --- document listeners -----------------------------------------------------

let installed = false;

function isComposer(target: EventTarget | null): boolean {
	return Boolean(target && (target as Element).closest && (target as Element).closest('[data-muse-listen]'));
}

/** Installs the document listeners once (browser only). Called by Mascot on mount. */
export function installMascotBridge() {
	if (installed || typeof document === 'undefined') return;
	installed = true;

	// Lets a server-rendered response drive the mascot without inline JS.
	document.addEventListener('north:mascot-state', (event) => {
		const detail = ((event as CustomEvent).detail ?? {}) as { state?: string; id?: string };
		if (detail.state) setState(detail.state, { id: detail.id });
	});

	// Listening is the composer having focus; the textarea opts in with data-muse-listen.
	document.addEventListener('focusin', (event) => {
		if (!isComposer(event.target)) return;
		if (mascotChat.phase === 'working') return;
		setState('listening');
		setChat('listening', 'listening');
	});
	document.addEventListener('focusout', (event) => {
		if (!isComposer(event.target)) return;
		if (mascotChat.phase !== 'listening') return;
		setState('idle');
		setChat('idle', 'ready');
	});

	(window as unknown as { NorthMascot: unknown }).NorthMascot = {
		setState,
		get phase() {
			return mascotChat.phase;
		},
		get state() {
			return sustained;
		}
	};
}

/**
 * Registers one mounted mascot and returns its starting pose and an
 * unregister function (the Alpine component's init/destroy).
 */
export function registerMascot(opts: {
	id: string;
	initial: string;
	gesture: string;
	set: (state: string) => void;
}): { state: string; destroy: () => void } {
	installMascotBridge();
	const reduced = reducedMotion();
	const initial = isKnown(canonical(opts.initial)) ? canonical(opts.initial) : 'idle';
	const gesture = isGesture(canonical(opts.gesture)) ? canonical(opts.gesture) : '';

	// A mascot that declares a sustained state also says what the page means,
	// so it sets the module state rather than diverging from it.
	let state: string;
	if (isSustained(initial)) {
		sustained = initial;
		state = initial;
	} else {
		state = sustained;
	}

	const instance: Instance = {
		id: opts.id,
		apply(name) {
			name = canonical(name);
			if (!isKnown(name)) return;
			if (reduced && isGesture(name)) return;
			opts.set(name);
		}
	};
	instances.add(instance);

	if (!reduced) {
		// A greeting belongs to the page that rendered it: this mascot alone.
		if (gesture) state = gesture;
		else if (lastGesture && Date.now() - lastGestureAt < GESTURE_REPLAY_MS) state = lastGesture;
	}

	return { state, destroy: () => instances.delete(instance) };
}

/** The sustained pose a gesture hands back to. */
export function sustainedState(): string {
	return sustained;
}

export function isGestureState(name: string): boolean {
	return isGesture(name);
}

export const mascot = {
	setState,
	setChat,
	bindChatCopy,
	streamOpened,
	streamMessage,
	streamFailed,
	streamClosed,
	get state() {
		return sustained;
	}
};
