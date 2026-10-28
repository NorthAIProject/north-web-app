// The coach's reply stream (north-client internal/coach/api.go, relay).
//
// POST /conversations/{id}/reply and POST /conversations/{id}/resume answer
// with Server-Sent Events, one line of JSON per event:
//
//	token     {"text": "..."}                    append to the reply
//	status    {"line": "is checking your goals"} tools are running
//	error     {"message": "..."}                 the reply failed; show this
//	exercises {"slugs": ["push-up"]}             the reply drew on these
//	approval  Approval                           ask before the coach writes
//	done      {"messageId": "..."}               always last
//
// The Go web page streamed HTML fragments over a GET instead; this app reads
// the API's typed frames through the /api proxy and renders them itself.
//
// EventSource cannot POST, so the stream is read off fetch's body.

import { apiErrorFrom, ApiError } from '#lib/api/errors.js';
import type { components } from '#lib/api/generated/schema.js';

export type Approval = components['schemas']['Approval'];

export type StreamEvent =
	| { type: 'token'; text: string }
	| { type: 'status'; line: string }
	| { type: 'error'; message: string }
	| { type: 'exercises'; slugs: string[] }
	| { type: 'approval'; approval: Approval }
	| { type: 'done'; messageId?: string };

export type RawFrame = { event: string; data: string };

/**
 * Splits an SSE byte stream into frames. Pure over its input chunks so it can
 * be tested without a network.
 */
export function createFrameParser(onFrame: (frame: RawFrame) => void) {
	let buffer = '';
	let event = '';
	let data: string[] = [];

	function dispatch() {
		if (data.length > 0 || event) onFrame({ event: event || 'message', data: data.join('\n') });
		event = '';
		data = [];
	}

	function line(text: string) {
		if (text === '') return dispatch();
		if (text.startsWith(':')) return;
		const colon = text.indexOf(':');
		const field = colon === -1 ? text : text.slice(0, colon);
		let value = colon === -1 ? '' : text.slice(colon + 1);
		if (value.startsWith(' ')) value = value.slice(1);
		if (field === 'event') event = value;
		else if (field === 'data') data.push(value);
	}

	return {
		push(chunk: string) {
			buffer += chunk;
			let index: number;
			while ((index = buffer.search(/\r\n|\r|\n/)) !== -1) {
				const newline = buffer[index] === '\r' && buffer[index + 1] === '\n' ? 2 : 1;
				line(buffer.slice(0, index));
				buffer = buffer.slice(index + newline);
			}
		},
		end() {
			if (buffer) line(buffer);
			buffer = '';
			dispatch();
		}
	};
}

/** Maps one frame onto a typed event; unknown names are skipped, as on iOS. */
export function toEvent(frame: RawFrame): StreamEvent | null {
	let payload: Record<string, unknown> = {};
	try {
		payload = frame.data ? JSON.parse(frame.data) : {};
	} catch {
		return null;
	}
	switch (frame.event) {
		case 'token':
			return { type: 'token', text: String(payload.text ?? '') };
		case 'status':
			return { type: 'status', line: String(payload.line ?? '') };
		case 'error':
			return { type: 'error', message: String(payload.message ?? '') };
		case 'exercises':
			return { type: 'exercises', slugs: (payload.slugs as string[]) ?? [] };
		case 'approval':
			return { type: 'approval', approval: payload as unknown as Approval };
		case 'done':
			return { type: 'done', messageId: payload.messageId as string | undefined };
		default:
			return null;
	}
}

/**
 * Opens a reply or resume stream and hands each event over until it closes.
 * A refusal before the stream starts (422, 409, 429, 503) throws ApiError.
 */
export async function openStream(
	url: string,
	body: unknown,
	onEvent: (event: StreamEvent) => void,
	signal?: AbortSignal,
	fetchImpl: typeof fetch = fetch
): Promise<void> {
	const response = await fetchImpl(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
		body: body === undefined ? undefined : JSON.stringify(body),
		signal
	});
	if (!response.ok) throw await apiErrorFrom(response);
	if (!response.body) throw new ApiError({ status: 0, message: 'No stream.' });

	const parser = createFrameParser((frame) => {
		const event = toEvent(frame);
		if (event) onEvent(event);
	});
	const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		parser.push(value);
	}
	parser.end();
}
