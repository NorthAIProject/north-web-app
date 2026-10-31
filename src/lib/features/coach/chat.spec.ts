import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const invalidate = vi.fn(async () => {});
vi.mock('$app/navigation', () => ({ invalidate }));
vi.mock('#lib/components/khepri/mascot.svelte.js', () => ({
	mascot: new Proxy({}, { get: () => () => {} })
}));

const { ChatStream } = await import('./chat.svelte.js');

/** A reply stream answering with these SSE frames. */
function sse(frames: [string, unknown][]) {
	const body = frames.map(([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`).join('');
	return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

describe('ChatStream announcement', () => {
	beforeEach(() => invalidate.mockClear());
	afterEach(() => vi.unstubAllGlobals());

	it('announces the finished reply once, as plain words', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				sse([
					['token', { text: '**Good** ' }],
					['token', { text: 'question.' }],
					['done', { messageId: 'm1' }]
				])
			)
		);
		const chat = new ChatStream(() => 'c1');
		const result = await chat.send('How do I start?', null);
		expect(result).toEqual({ sent: true });
		expect(chat.announced).toBe('Good question.');
		expect(invalidate).toHaveBeenCalledTimes(1);
		expect(chat.exchange).toBeNull();
	});

	it('says nothing politely when the stream fails (the bubble alerts instead)', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () =>
				sse([
					['token', { text: 'Half a' }],
					['error', { message: 'The coach is busy.' }],
					['done', {}]
				])
			)
		);
		const chat = new ChatStream(() => 'c1');
		await chat.send('Hi', null);
		expect(chat.announced).toBe('');
		expect(chat.exchange?.error).toBe('The coach is busy.');
	});
});
