<!--
	north-client web/progress/progress.templ history + checkRow + deleteCheck:
	the checks so far, newest first, each number against the check before.
	Deleting asks first in a dialog, whose form posts ?/delete.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import EmptyState from '#lib/components/khepri/EmptyState.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { Check } from './view.js';

	let { checks }: { checks: Check[] } = $props();

	const i18n = useI18n();
	let openId = $state<string | null>(null);
</script>

<section class="space-y-3" aria-labelledby="progress-history" data-testid="progress-history">
	<h2 id="progress-history" class="text-lg font-medium">{i18n.t('progress.history')}</h2>
	{#if checks.length === 0}
		<EmptyState title={i18n.t('progress.history.empty')} body={i18n.t('progress.history.empty.help')} />
	{/if}
	{#each checks as c (c.id)}
		<Card.Root data-testid="progress-check">
			<Card.Content class="space-y-3 pt-6">
				<div class="flex items-center justify-between gap-2">
					<p class="font-medium">{c.date}</p>
					<div class="flex items-center gap-2">
						{#if c.assisted}
							<Badge variant="outline">{i18n.t('progress.assisted')}</Badge>
						{/if}
						<Dialog.Root open={openId === c.id} onOpenChange={(o) => (openId = o ? c.id : null)}>
							<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })} aria-label={i18n.t('progress.delete')}>
								<Trash2Icon class="size-4" />
							</Dialog.Trigger>
							<Dialog.Content class="sm:max-w-sm">
								<Dialog.Header>
									<Dialog.Title>{i18n.t('progress.delete.title')}</Dialog.Title>
									<Dialog.Description>{i18n.t('progress.delete.body')}</Dialog.Description>
								</Dialog.Header>
								<Dialog.Footer>
									<Dialog.Close class={buttonVariants({ variant: 'outline' })}>{i18n.t('progress.cancel')}</Dialog.Close>
									<form
										method="post"
										action="?/delete"
										use:enhance={() =>
											async ({ update }) => {
												openId = null;
												await update();
											}}
									>
										<input type="hidden" name="id" value={c.id} />
										<Button type="submit" variant="destructive">{i18n.t('progress.delete')}</Button>
									</form>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				{#if c.chips.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each c.chips as chip (chip.key)}
							<span class="border-hairline bg-surface rounded-lg border px-2 py-1 text-sm tabular-nums">
								<span class="text-muted-foreground mr-1 text-xs">{i18n.t(chip.key)}</span>{chip.value}
								{#if chip.delta}
									<span class="text-muted-foreground ml-1 text-xs">{chip.delta}</span>
								{/if}
								{#if chip.carried}
									<span class="text-muted-foreground ml-1 text-xs">· {i18n.t('progress.carried')}</span>
								{/if}
							</span>
						{/each}
					</div>
				{/if}
				{#if c.photos.length > 0}
					<div class="flex gap-2">
						{#each c.photos as p (p.pose)}
							<a href={p.url} target="_blank" rel="noopener" class="border-hairline block w-20 overflow-hidden rounded-md border">
								<img src={p.url} alt={i18n.t(`progress.pose.${p.pose}`)} class="aspect-[3/4] w-full object-cover" loading="lazy" />
							</a>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/each}
</section>
