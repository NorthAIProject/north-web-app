// Today's coach message: its query and the answer call (Go web/outreach).

import { browserApi } from '#lib/api/client.js';
import type { components } from '#lib/api/generated/schema.js';

export type OutreachToday = components['schemas']['OutreachToday'];
export type Outreach = components['schemas']['Outreach'];

export const outreachKeys = { today: ['outreach', 'today'] as const };

export function todayQuery() {
	return {
		queryKey: outreachKeys.today,
		queryFn: async ({ signal }: { signal: AbortSignal }): Promise<OutreachToday> => {
			try {
				const { data } = await browserApi().GET('/outreach/today', { signal });
				return data ?? {};
			} catch {
				// My Day must not lose anything over the coach's note.
				return {};
			}
		}
	};
}

export async function answerOutreach(id: string, action: string): Promise<Outreach> {
	const { data } = await browserApi().POST('/outreach/{id}/actions', { params: { path: { id } }, body: { action } });
	return data!;
}
