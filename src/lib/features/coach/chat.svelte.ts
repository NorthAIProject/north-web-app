// The live half of a chat page: the exchange in flight while the coach writes
// (Go: PendingExchange / ResumeExchange / beginReflectionExchange, the SSE
// bubble and the "done" refresh that swapped #chat-root).
//
// One instance per page. Each turn streams through openStream; when it closes
// the page re-reads the conversation (invalidate('north:chat')), which is the
// Go page's hx-get of /app/chat/{id} after the "done" frame. The mascot is
// driven exactly as the htmx bridge drove it.

import { invalidate } from '$app/navigation';
import { isApiError } from '#lib/api/errors.js';
import { mascot } from '#lib/components/khepri/mascot.svelte.js';
import { openStream, type StreamEvent } from './stream.js';

// Go friendly(): the default when a stream breaks without saying why.
const BROKEN = 'Something went wrong while writing that reply.';

export type PendingAttachment = { kind: 'image' | 'file'; name: string; preview: string };

export type Exchange = {
	kind: 'reply' | 'resume' | 'begin';
	/** The person's words, echoed until the stored turn replaces them. */
	userText?: string;
	attachment?: PendingAttachment;
	/** Tokens so far, as plain text: markdown waits for the stored reply. */
	text: string;
	error: string;
	streaming: boolean;
};

export class ChatStream {
	exchange: Exchange | null = $state(null);
	/** A refusal before anything was sent, shown above the composer. */
	composerError = $state('');

	#abort: AbortController | null = null;

	constructor(private conversationId: () => string) {}

	get busy() {
		return Boolean(this.exchange?.streaming);
	}

	/** Uploads the file (if any), then sends the turn. False when nothing was sent. */
	async send(text: string, file: File | null): Promise<{ sent: boolean; draft?: string }> {
		const id = this.conversationId();
		this.composerError = '';
		// conversations.ValidateTurn, before a byte is stored.
		if (!text.trim() && !file) {
			this.composerError = 'Type something first.';
			return { sent: false };
		}

		let mediaId: string | undefined;
		let attachment: PendingAttachment | undefined;
		if (file) {
			const form = new FormData();
			form.append('file', file);
			try {
				const response = await fetch(`/api/conversations/${id}/attachments`, { method: 'POST', body: form });
				const body = await response.json().catch(() => ({}));
				if (!response.ok) {
					this.composerError = body?.error?.message || 'could not store that file';
					return { sent: false };
				}
				mediaId = body.mediaId;
			} catch {
				this.composerError = 'could not store that file';
				return { sent: false };
			}
			const photo = file.type.startsWith('image/');
			attachment = { kind: photo ? 'image' : 'file', name: file.name, preview: photo ? URL.createObjectURL(file) : '' };
		}

		const result = await this.#run({ kind: 'reply', userText: text.trim(), attachment }, `/api/conversations/${id}/reply`, {
			text: text.trim(),
			...(mediaId ? { mediaId } : {})
		});
		return result === 'refused' ? { sent: false, draft: text } : { sent: true };
	}

	/** Finishes a reply interrupted by an approval (Go: ResumeExchange). */
	resume() {
		return this.#run({ kind: 'resume' }, `/api/conversations/${this.conversationId()}/resume`, undefined);
	}

	/** Opens a new reflection with the coach's first question. */
	begin() {
		return this.#run({ kind: 'begin' }, `/api/conversations/${this.conversationId()}/reply`, { begin: true });
	}

	/** Stops listening (the page is going away); the server finishes the reply. */
	close() {
		this.#abort?.abort();
		this.#abort = null;
	}

	async #run(
		start: Pick<Exchange, 'kind' | 'userText' | 'attachment'>,
		url: string,
		body: unknown
	): Promise<'done' | 'refused' | 'failed'> {
		this.close();
		const abort = new AbortController();
		this.#abort = abort;
		this.exchange = { ...start, text: '', error: '', streaming: true };
		const exchange = this.exchange;

		mascot.streamOpened();
		let failed = false;
		// Refused with a status before streaming: nothing was stored, so the
		// words go back into the composer.
		let refused = false;
		try {
			await openStream(url, body, (event) => this.#on(exchange, event, () => (failed = true)), abort.signal);
		} catch (err) {
			if (abort.signal.aborted) return 'failed';
			// Turned away before the stream started. "Type something first"
			// goes back to the composer, as Go's ComposerError did.
			if (isApiError(err) && err.status === 422 && start.kind === 'reply') {
				this.exchange = null;
				this.composerError = err.message;
				mascot.setChat('idle', 'ready');
				mascot.setState('idle');
				return 'refused';
			}
			failed = true;
			refused = isApiError(err) && start.kind === 'reply';
			exchange.error = isApiError(err) ? err.message : BROKEN;
			mascot.streamFailed();
		}
		if (abort.signal.aborted) return 'failed';
		exchange.streaming = false;
		mascot.streamClosed();

		await invalidate('north:chat');
		const outcome = refused ? 'refused' : failed ? 'failed' : 'done';
		if (this.exchange !== exchange) return outcome;
		if (failed) {
			// The stored turn (if any) is on the page now; keep only the error,
			// so the person sees what went wrong until their next action.
			exchange.userText = undefined;
			exchange.attachment = undefined;
			exchange.text = '';
		} else {
			this.exchange = null;
		}
		return outcome;
	}

	#on(exchange: Exchange, event: StreamEvent, onFail: () => void) {
		switch (event.type) {
			case 'token':
				exchange.text += event.text;
				mascot.streamMessage('');
				break;
			case 'status':
				mascot.streamMessage('status', event.line);
				break;
			case 'error':
				exchange.error = event.message;
				onFail();
				mascot.streamMessage('failed');
				break;
			// exercises and approval are on the stored conversation the
			// refresh brings back; nothing to do with them mid-stream.
		}
	}
}
