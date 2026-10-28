// What the crew space does from the browser, through the same-origin /api
// proxy. Each is one of the htmx calls the Go page made (web/crews/*.templ).
import { browserApi } from '#lib/api/client.js';
import type { CrewChannel, CrewLiveEvent, CrewMessage, CrewMessagePage, CrewSpace } from './crew.js';

const api = () => browserApi();

/** Per crew, what the caller has not read (GET /crews/unread). */
export async function getUnread() {
	const { data } = await api().GET('/crews/unread');
	return data!;
}

export async function getSpace(crewID: string): Promise<CrewSpace> {
	const { data } = await api().GET('/crews/{crewID}/space', { params: { path: { crewID } } });
	return data!;
}

/** after: what is new since the cursor; before: the page older than it; neither: the latest page. */
export async function getMessages(
	crewID: string,
	channelID: string,
	query: { before?: number; after?: number } = {}
): Promise<CrewMessagePage> {
	const { data } = await api().GET('/crews/{crewID}/channels/{channelID}/messages', {
		params: { path: { crewID, channelID }, query }
	});
	return data!;
}

/** One message as the viewer sees it; null when they may no longer see it (Go: messageFragment's empty answer). */
export async function getMessage(crewID: string, messageID: string): Promise<CrewMessage | null> {
	try {
		const { data } = await api().GET('/crews/{crewID}/messages/{messageID}', {
			params: { path: { crewID, messageID } }
		});
		return data!;
	} catch (err) {
		if ((err as { status?: number }).status === 404) return null;
		throw err;
	}
}

export async function sendMessage(
	crewID: string,
	channelID: string,
	body: { body: string; replyToId?: string; clientId?: string }
): Promise<void> {
	await api().POST('/crews/{crewID}/channels/{channelID}/messages', { params: { path: { crewID, channelID } }, body });
}

export async function editMessage(crewID: string, messageID: string, body: string): Promise<CrewMessage> {
	const { data } = await api().PATCH('/crews/{crewID}/messages/{messageID}', {
		params: { path: { crewID, messageID } },
		body: { body }
	});
	return data!;
}

export async function deleteMessage(crewID: string, messageID: string): Promise<void> {
	await api().DELETE('/crews/{crewID}/messages/{messageID}', { params: { path: { crewID, messageID } } });
}

export async function react(crewID: string, messageID: string, emoji: string, on: boolean): Promise<void> {
	const params = { path: { crewID, messageID, emoji } };
	if (on) await api().PUT('/crews/{crewID}/messages/{messageID}/reactions/{emoji}', { params });
	else await api().DELETE('/crews/{crewID}/messages/{messageID}/reactions/{emoji}', { params });
}

export async function pin(crewID: string, messageID: string, on: boolean): Promise<void> {
	const params = { path: { crewID, messageID } };
	if (on) await api().PUT('/crews/{crewID}/messages/{messageID}/pin', { params });
	else await api().DELETE('/crews/{crewID}/messages/{messageID}/pin', { params });
}

export async function getPins(crewID: string, channelID: string): Promise<CrewMessage[]> {
	const { data } = await api().GET('/crews/{crewID}/channels/{channelID}/pins', {
		params: { path: { crewID, channelID } }
	});
	return data!.messages;
}

export async function report(crewID: string, messageID: string, reason: string, note: string): Promise<void> {
	await api().POST('/crews/{crewID}/messages/{messageID}/report', {
		params: { path: { crewID, messageID } },
		body: { reason, note }
	});
}

export async function markRead(crewID: string, channelID: string, seq: number): Promise<void> {
	await api().POST('/crews/{crewID}/channels/{channelID}/read', {
		params: { path: { crewID, channelID } },
		body: { seq }
	});
}

export async function createChannel(crewID: string, name: string, topic: string): Promise<CrewChannel> {
	const { data } = await api().POST('/crews/{crewID}/channels', {
		params: { path: { crewID } },
		body: { name, topic }
	});
	return data!;
}

export async function updateChannel(crewID: string, channelID: string, name: string, topic: string): Promise<void> {
	await api().PATCH('/crews/{crewID}/channels/{channelID}', {
		params: { path: { crewID, channelID } },
		body: { name, topic }
	});
}

export async function deleteChannel(crewID: string, channelID: string): Promise<void> {
	await api().DELETE('/crews/{crewID}/channels/{channelID}', { params: { path: { crewID, channelID } } });
}

/** The friends slice's block (Go posted to /app/friends/{id}/block). */
export async function block(userID: string): Promise<void> {
	await api().POST('/blocks/{userID}', { params: { path: { userID } } });
}

export type LiveHandlers = {
	event: (ev: CrewLiveEvent) => void;
	/** The stream came back after a drop: anything may have been missed. */
	reconnected: () => void;
};

const liveTypes = ['message', 'update', 'channels', 'removed', 'resync'];

/**
 * The crew's live stream (GET /api/crews/{id}/live). Each event is a signal,
 * never content. Returns the close function, so it fits an $effect.
 */
export function connectLive(crewID: string, on: LiveHandlers): () => void {
	const source = new EventSource(`/api/crews/${crewID}/live`);
	let connected = false;
	source.onopen = () => {
		// Not on the first connect, which the page itself just rendered.
		if (connected) on.reconnected();
		connected = true;
	};
	const handle = (e: MessageEvent) => {
		try {
			on.event(JSON.parse(e.data) as CrewLiveEvent);
		} catch {
			// A frame that is not JSON is not one of ours.
		}
	};
	for (const t of liveTypes) source.addEventListener(t, handle as EventListener);
	return () => source.close();
}
