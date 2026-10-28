import { loadMessages } from '#lib/i18n/index.js';
import type { LayoutLoad } from './$types';

// Universal on purpose: the catalogue is imported here rather than returned
// from the server load, so it is never serialised into the HTML. The browser
// fetches its locale's chunk once and caches it.
export const load: LayoutLoad = async ({ data }) => {
	const { messages, fallback } = await loadMessages(data.locale);
	return { ...data, messages, fallback };
};
