<!--
	Go: web/capture/foods.templ (MealVoice) — one meal's "say what's in it"
	box. Go swapped the box over htmx (POST /app/capture/foods); here the
	words are read through the API proxy and the review renders in place. The
	review posts straight to the meal as a plain form (?/addPortions): adding
	is a write to a page that then needs its totals redrawn.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { browserApi } from '#lib/api/client.js';
	import { isApiError } from '#lib/api/errors.js';
	import type { components } from '#lib/api/generated/schema.js';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import Dictate from '#lib/features/voice/Dictate.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { tf } from './view.js';

	type FoodDraft = components['schemas']['FoodDraft'];

	let { mealId }: { mealId: string } = $props();
	const i18n = useI18n();

	/** captured.MaxText */
	const MAX_TEXT = 2000;
	const textId = $derived(`meal-voice-text-${mealId}`);

	// Kept across reads, so a mis-heard word is corrected and read again.
	let text = $state('');
	let draft = $state<FoodDraft | null>(null);
	let problem = $state('');
	let busy = $state(false);
	// Each line's chosen ingredient and whether it is ticked: ticked only when
	// the name resolved on its own.
	let chosen = $state<string[]>([]);
	let ticked = $state<boolean[]>([]);

	async function find(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		problem = '';
		try {
			const { data } = await browserApi().POST('/capture/foods', { body: { text: text.trim() } });
			draft = data!;
			chosen = draft.lines.map((l) => l.ingredient_id ?? '');
			ticked = draft.lines.map((l) => !!l.ingredient_id);
		} catch (err) {
			draft = null;
			problem = isApiError(err) ? err.message : i18n.t('nutrition.err.generic');
		} finally {
			busy = false;
		}
	}
</script>

<div id="meal-voice-{mealId}" class="space-y-3">
	<form method="post" class="space-y-2" onsubmit={find}>
		<Textarea id={textId} name="text" bind:value={text} rows={2} placeholder={i18n.t('capture.foods.ph')} maxlength={MAX_TEXT} />
		<div class="flex items-center justify-end gap-2">
			<!-- Metered as a voice capture, not dictation: the words have a parse behind them. -->
			<Dictate target={textId} surface="capture" variant="outline" />
			<Button type="submit" variant="outline" disabled={busy}>{i18n.t('capture.foods.find')}</Button>
		</div>
	</form>
	{#if problem}
		<Alert.Root variant="destructive">
			<Alert.Description>{problem}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if draft}
		{#if draft.lines.length === 0}
			<p class="text-muted-foreground text-sm">{i18n.t('capture.foods.none')}</p>
		{:else}
			<form method="post" action="?/addPortions" class="space-y-2" use:enhance>
				<input type="hidden" name="meal_id" value={mealId} />
				{#each draft.lines as line, n (n)}
					<!-- Fields carry the line's index and the checkbox posts it, so an unticked line drops out whole. -->
					<Card.Root class="p-3">
						<div class="flex items-start gap-3">
							{#if line.candidates.length > 0}
								<Checkbox name="line" value={String(n)} bind:checked={ticked[n]} class="mt-2.5" aria-label={line.query} />
							{:else}
								<span class="mt-2.5 inline-block size-4 shrink-0 rounded border border-dashed" aria-hidden="true"></span>
							{/if}
							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									{#if line.candidates.length > 0}
										<div class="min-w-0 flex-1">
											<Select.Root
												type="single"
												name="ingredient_id_{n}"
												bind:value={chosen[n]}
												items={line.candidates.map((c) => ({ value: c.id, label: c.name }))}
											>
												<Select.Trigger>
													<Select.Value placeholder={tf(i18n, 'capture.foods.which', line.query)} />
												</Select.Trigger>
												<Select.Content>
													{#each line.candidates as c (c.id)}
														<Select.Item value={c.id} label={c.name}>{c.name}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>
										<div class="flex items-center gap-1">
											<input
												type="number"
												name="quantity_grams_{n}"
												value={String(line.grams)}
												step="any"
												min="0"
												class="border-input dark:bg-input/30 flex h-9 w-20 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm"
											/>
											<span class="text-muted-foreground text-sm">g</span>
										</div>
									{:else}
										<p class="text-sm">{line.grams} g {line.query}</p>
									{/if}
									{#if line.uncertain}
										<Badge variant="outline">{i18n.t('capture.estimated')}</Badge>
									{/if}
								</div>
								{#if line.source}
									<p class="text-muted-foreground truncate text-xs">&ldquo;{line.source}&rdquo;</p>
								{/if}
								{#if line.problem}
									<p class="text-destructive text-xs">{line.problem}</p>
								{:else if !line.ingredient_id}
									<p class="text-muted-foreground text-xs">{i18n.t('capture.foods.ambiguous')}</p>
								{/if}
							</div>
						</div>
					</Card.Root>
				{/each}
				{#if draft.lines.some((l) => l.candidates.length > 0)}
					<div class="flex justify-end">
						<Button type="submit">{i18n.t('capture.foods.add')}</Button>
					</div>
				{/if}
			</form>
		{/if}
		{#if draft.unparsed.length > 0}
			<div class="text-muted-foreground text-xs">
				<p>{i18n.t('capture.foods.not_added')}</p>
				<ul class="mt-1 space-y-0.5">
					{#each draft.unparsed as t, i (i)}
						<li>&ldquo;{t}&rdquo;</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>
