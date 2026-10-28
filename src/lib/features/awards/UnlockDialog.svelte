<!--
	The celebration for badges not yet seen (Go web/awards Unlock). Dismissing
	it any way at all (Done, the cross, Escape, a click outside) calls onclose,
	which marks every shown badge seen; "View on profile" calls onprofile,
	which marks them and leaves the page.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import AwardCoin from '#lib/features/awards-page/AwardCoin.svelte';
	import type { AwardView } from '#lib/features/awards-page/awards.js';
	import { useI18n } from '#lib/i18n/index.js';

	let {
		awards,
		open = $bindable(false),
		onclose,
		onprofile
	}: { awards: AwardView[]; open?: boolean; onclose: () => void; onprofile: () => void } = $props();

	const i18n = useI18n();
	const timezone = $derived((page.data as { user?: { timezone?: string } }).user?.timezone);

	function earned(at: string): string {
		return i18n.tf('awards.unlock.earned', formatTime(i18n.locale, at, '2 Jan 2006', timezone));
	}

	function done() {
		open = false;
		onclose();
	}

	function onOpenChange(next: boolean) {
		if (!next) onclose();
	}
</script>

{#snippet rarity(a: AwardView)}
	{#if a.rarity}
		<span class="text-muted-foreground block text-xs">{i18n.tf('awards.unlock.rarity', a.rarity)}</span>
	{/if}
{/snippet}

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content id="awards-unlock-dialog" class="sm:max-w-sm" data-testid="awards-unlock">
		<Dialog.Header>
			<Dialog.Title>
				{#if awards.length === 1}
					{i18n.t('awards.unlock.title.one')}
				{:else}
					{i18n.tf('awards.unlock.title.many', awards.length)}
				{/if}
			</Dialog.Title>
		</Dialog.Header>
		{#if awards.length === 1}
			{@const a = awards[0]}
			<div class="flex flex-col items-center gap-3 py-2 text-center">
				<span class="awards-coin-turn">
					<AwardCoin award={a} size={128} />
				</span>
				<p class="text-lg font-medium">{a.name}</p>
				<p class="text-muted-foreground text-sm">{a.description}</p>
				{#if a.earnedAt}
					<p class="text-muted-foreground text-xs">{earned(a.earnedAt)}</p>
				{/if}
				{@render rarity(a)}
			</div>
		{:else}
			<!-- Padded because the coin overshoots its box while it springs in and a
			     scrolling list clips whatever leaves it. -->
			<ul class="max-h-[50vh] space-y-4 overflow-y-auto p-3">
				{#each awards as a (a.id)}
					<li class="flex items-center gap-4">
						<span class="awards-coin-turn shrink-0">
							<AwardCoin award={a} size={56} />
						</span>
						<span class="min-w-0">
							<span class="block text-sm font-medium">{a.name}</span>
							<span class="text-muted-foreground block text-xs">{a.description}</span>
							{@render rarity(a)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={onprofile}>{i18n.t('awards.unlock.view')}</Button>
			<Button type="button" onclick={done}>{i18n.t('awards.unlock.done')}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
