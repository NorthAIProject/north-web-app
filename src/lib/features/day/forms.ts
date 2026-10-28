import type { SubmitFunction } from '$app/forms';
import { toast } from 'svelte-sonner';
import type { Translator } from '#lib/i18n/index.js';

/**
 * My Day's quick-add forms post to the page's named actions (Go posted each
 * to its own /app/<tracker> handler, which redirected back to /app). With
 * JavaScript, a save reloads the page's data and runs done — usually closing
 * the dialog the form sat in, as Go's full-page redirect did. A rejected
 * value keeps the form as typed and says so, where Go showed its 422 text.
 */
export function quickSubmit(i18n: Translator, done?: () => void): SubmitFunction {
	return () =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				const key = (result.data as { error?: string } | undefined)?.error ?? 'day.log.invalid';
				toast.error(i18n.t(key));
				await update({ reset: false, refreshAll: false });
				return;
			}
			if (result.type === 'error') {
				toast.error(i18n.t('day.error'));
				return;
			}
			await update();
			done?.();
		};
}
