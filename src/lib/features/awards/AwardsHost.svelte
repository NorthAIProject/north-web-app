<!--
	Where the badge celebration lands (Go layout awardsHost). It asks for
	unseen badges after every navigation (Go: on page load, which also covered
	plain form posts that redirect), after every successful browserApi() write
	(announced by its middleware) and after every enhanced form action result
	that is not an error (page.form changes) — Go: after every successful
	non-GET htmx request. Pages need do nothing. It holds
	back while the dialog is open, so a write behind it cannot replace what the
	person is reading; closing the dialog marks its badges seen and checks again.
-->
<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { browserApi } from '#lib/api/client.js';
	import type { AwardView } from '#lib/features/awards-page/awards.js';
	import UnlockDialog from './UnlockDialog.svelte';
	import { onWrite } from './writes.js';

	let awards = $state<AwardView[]>([]);
	let open = $state(false);
	let checking = false;
	// The ids already shown on this page, so a check that races the "seen"
	// posts never opens the same celebration twice (Go: data-shown).
	const shown = new Set<string>();

	async function check() {
		if (open || checking) return;
		checking = true;
		try {
			const { data } = await browserApi().GET('/awards/unseen');
			const fresh = (data?.awards ?? []).filter((a) => !shown.has(a.id));
			if (fresh.length === 0) return;
			for (const a of fresh) shown.add(a.id);
			awards = fresh;
			open = true;
		} catch {
			// The celebration is ambient: a failed check shows nothing.
		} finally {
			checking = false;
		}
	}

	async function markSeen(list: AwardView[]) {
		const api = browserApi();
		await Promise.allSettled(
			list.map((a) => api.POST('/awards/{badgeID}/seen', { params: { path: { badgeID: a.id } } }))
		);
	}

	async function onclose() {
		const list = awards;
		await markSeen(list);
		void check();
	}

	// "View on profile": mark them, then the caller's profile (their awards
	// page when they have no handle).
	async function onprofile() {
		const list = awards;
		open = false;
		await markSeen(list);
		let to = '/app/awards';
		try {
			const { data } = await browserApi().GET('/social');
			if (data?.handle) to = '/app/u/' + encodeURIComponent(data.handle);
		} catch {
			// The awards page is the answer without a handle.
		}
		await goto(to);
	}

	afterNavigate(() => void check());
	$effect(() => onWrite(() => void check()));

	// An enhanced action's result lands in page.form, including successes that
	// stay on the page. A change with a status below 400 is a write.
	let lastForm: unknown = page.form;
	$effect(() => {
		const form = page.form;
		if (form === lastForm) return;
		lastForm = form;
		if (page.status < 400) void check();
	});
</script>

{#if awards.length > 0}
	<UnlockDialog {awards} bind:open {onclose} {onprofile} />
{/if}
