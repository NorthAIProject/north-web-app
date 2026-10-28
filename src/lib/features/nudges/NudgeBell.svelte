<!--
	The header's coach-notes bell (Go web/nudges Bell + the layout's
	hx-get="/app/nudges/bell" every 20 s). A dot when anything is unread; the
	dropdown lists the open notes. Opening one is a plain form post that marks
	it read and goes where it points; dismissing one refreshes the bell in
	place. When a poll finds more unread than the last one did, the toast below
	the header shows the newest title for five seconds (Go data-nudge-toast).
-->
<script lang="ts">
	import BellIcon from '@lucide/svelte/icons/bell';
	import XIcon from '@lucide/svelte/icons/x';
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bellQuery, dismissNudge, newestUnread, nudgeKeys } from './queries.js';

	const i18n = useI18n();
	const client = useQueryClient();
	const bell = createQuery(() => bellQuery());

	const list = $derived(bell.data?.nudges ?? []);
	const unread = $derived(bell.data?.unread ?? 0);

	let toast = $state<{ title: string; href: string } | null>(null);
	let seen = -1;
	let hide: ReturnType<typeof setTimeout> | undefined;

	// Go compared the unread count each swap: more than last time, with a
	// title to show, means a note arrived while the page was open.
	$effect(() => {
		const data = bell.data;
		if (!data) return;
		const n = data.unread;
		const newest = newestUnread(data.nudges);
		if (seen > 0 && n > seen && newest.title) {
			toast = newest;
			clearTimeout(hide);
			hide = setTimeout(() => (toast = null), 5000);
		}
		seen = n;
	});

	$effect(() => () => clearTimeout(hide));

	function unreadLabel(n: number): string {
		return n === 1 ? i18n.t('nudges.unread.one') : i18n.tf('nudges.unread.many', n);
	}

	async function dismiss(e: SubmitEvent, id: string) {
		e.preventDefault();
		try {
			await dismissNudge(id);
		} finally {
			await client.invalidateQueries({ queryKey: nudgeKeys.bell });
		}
	}
</script>

<div class="shrink-0">
	<div id="nudge-bell" data-unread={unread}>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						type="button"
						class="relative"
						aria-label={unread === 0 ? i18n.t('nudges.title') : i18n.t('nudges.bell.unread')}
					>
						<BellIcon class="size-4" />
						{#if unread > 0}
							<span class="bg-signal absolute top-1 right-1 size-2 rounded-full"></span>
						{/if}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-80 p-1">
				<DropdownMenu.Label>
					{i18n.t('nudges.title')}
					{#if unread > 0}
						<Badge variant="secondary" class="ml-2">{unreadLabel(unread)}</Badge>
					{/if}
				</DropdownMenu.Label>
				{#if list.length === 0}
					<p class="text-muted-foreground px-2 py-3 text-sm">{i18n.t('nudges.empty')}</p>
				{:else}
					{#each list as n (n.id)}
						<div class="flex items-start gap-2 rounded-md px-2 py-2" data-nudge={n.id}>
							<!-- A plain post: it marks the note read and the server sends the
							     browser where the note points (Go POST /app/nudges/{id}/read). -->
							<form method="post" action="/app/nudges/{n.id}/read" class="min-w-0 flex-1" data-sveltekit-reload>
								<button
									type="submit"
									class={['w-full text-left text-sm', n.unread ? 'text-foreground' : 'text-muted-foreground']}
								>
									<span class="block font-medium">{n.title}</span>
									<span class="text-muted-foreground mt-0.5 block">{n.body}</span>
								</button>
							</form>
							<form method="post" action="/app/nudges/{n.id}/dismiss" onsubmit={(e) => dismiss(e, n.id)}>
								<Button variant="ghost" size="icon" type="submit" aria-label={i18n.t('nudges.dismiss')}>
									<XIcon class="size-3.5" />
								</Button>
							</form>
						</div>
					{/each}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
<a
	data-nudge-toast
	hidden={!toast}
	href={toast?.href ?? '/app'}
	class="bg-signal text-background fixed right-4 bottom-4 z-50 max-w-xs rounded-lg px-4 py-3 text-sm shadow-lg"
>{toast?.title ?? ''}</a>
