<!--
	The capture box (north-client web/capture capture.templ Panel). One region
	for the whole flow: the box becomes the preview, the preview becomes the
	receipt. Forms post to /app/capture's actions, so it works without
	JavaScript; enhanced, each answer replaces the panel's state in place, as
	the htmx swap of #capture-panel did.

	Embedded (returnTo set: My Day's "+" dialog, the food log) it drops its
	heading, does not grab focus, and a clean save reloads the page it sits on
	and calls onSaved.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '$app/forms';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Card } from '#lib/components/ui/card/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import Dictate from '#lib/features/voice/Dictate.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import {
		MAX_TEXT,
		foodName,
		kindLabel,
		sleepDate,
		tryAgain,
		writable,
		writtenLine,
		type CaptureState
	} from './capture.js';

	let { initial, onSaved }: { initial: CaptureState; onSaved?: () => void } = $props();
	const i18n = useI18n();

	// svelte-ignore state_referenced_locally
	let cap = $state<CaptureState>(initial);
	$effect(() => {
		cap = initial;
	});

	const embedded = $derived(cap.returnTo !== '');
	const textId = 'capture-text';

	let included = $state<boolean[]>([]);
	$effect(() => {
		included = (cap.draft?.items ?? []).map((it) => writable(it));
	});
	const count = $derived(included.filter(Boolean).length);
	const anyWritable = $derived((cap.draft?.items ?? []).some(writable));

	const submit: SubmitFunction = () => {
		return async ({ result, update }) => {
			if (result.type === 'success' || result.type === 'failure') {
				const next = (result.data as { capture?: CaptureState } | undefined)?.capture;
				if (next) cap = next;
				return;
			}
			if (result.type === 'redirect') {
				await update();
				onSaved?.();
				return;
			}
			cap = { ...cap, error: tryAgain };
		};
	};

	function startOver(e: MouseEvent) {
		e.preventDefault();
		cap = { text: '', returnTo: cap.returnTo };
	}
</script>

<div class={cn(!embedded && 'mx-auto w-full max-w-2xl space-y-6 px-4 py-6', embedded && 'space-y-3')}>
	{#if !embedded}
		<header class="space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight">{i18n.t('capture.heading')}</h1>
			<p class="text-muted-foreground text-sm">{i18n.t('capture.intro')}</p>
		</header>
	{/if}
	{#if cap.error}
		<Alert.Root variant="destructive">
			<Alert.Description>{cap.error}</Alert.Description>
		</Alert.Root>
	{/if}
	{#if cap.receipt}
		<Alert.Root>
			<Alert.Title>{writtenLine(i18n, cap.receipt)}</Alert.Title>
			<Alert.Description>
				<ul class="mt-1 space-y-1">
					{#each cap.receipt.outcomes as o, i (i)}
						<li class="text-sm">
							{#if !o.error}{o.summary}{:else}<span class="text-destructive">{o.error}</span>{/if}
						</li>
					{/each}
				</ul>
			</Alert.Description>
		</Alert.Root>
	{/if}
	{#if cap.draft}
		<form method="post" action="/app/capture?/commit" class="space-y-4" use:enhance={submit} data-testid="capture-preview">
			{#if embedded}<input type="hidden" name="return_to" value={cap.returnTo} />{/if}
			<input type="hidden" name="text" value={cap.text} />
			{#if cap.draft.items.length > 0}
				<div class="space-y-2">
					{#each cap.draft.items as item, index (index)}
						{@const ok = writable(item)}
						<Card class="p-3">
							<div class="flex items-start gap-3">
								{#if ok}
									<Checkbox name="items[{index}].include" value="1" bind:checked={included[index]} class="mt-1" data-include="true" />
								{:else}
									<span class="mt-1 inline-block size-4 shrink-0 rounded border border-dashed" aria-hidden="true"></span>
								{/if}
								<div class="min-w-0 flex-1 space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<Badge variant="secondary">{kindLabel(i18n, item.kind)}</Badge>
										{#if item.uncertain}<Badge variant="outline">{i18n.t('capture.estimated')}</Badge>{/if}
									</div>
									{#if item.kind === 'water'}
										<div class="flex items-center gap-2">
											{@render numberInput(`items[${index}].amount_ml`, String(item.water?.amount_ml ?? 0))}
											<span class="text-muted-foreground text-sm">{i18n.t('capture.unit.water')}</span>
										</div>
									{:else if item.kind === 'sleep'}
										<div class="flex items-center gap-2">
											{@render numberInput(`items[${index}].minutes`, String(item.sleep?.minutes ?? 0))}
											<span class="text-muted-foreground text-sm">{i18n.t('capture.unit.sleep')}</span>
										</div>
									{:else if item.kind === 'weight'}
										<div class="flex items-center gap-2">
											{@render numberInput(`items[${index}].kg`, String(item.weight?.kg ?? 0))}
											<span class="text-muted-foreground text-sm">kg</span>
										</div>
									{:else if item.kind === 'check_in'}
										<div class="flex flex-wrap items-center gap-2">
											{@render numberInput(`items[${index}].mood`, String(item.check_in?.mood ?? 0))}
											<span class="text-muted-foreground text-sm">{i18n.t('capture.unit.mood')}</span>
											{@render numberInput(`items[${index}].energy`, String(item.check_in?.energy ?? 0))}
											<span class="text-muted-foreground text-sm">{i18n.t('capture.unit.energy')}</span>
										</div>
									{:else if item.kind === 'food'}
										<div class="flex items-center gap-2">
											{@render numberInput(`items[${index}].grams`, String(item.food?.grams ?? 0))}
											<span class="text-muted-foreground text-sm">{i18n.tf('capture.unit.food', foodName(item))}</span>
										</div>
									{:else if item.kind === 'habit'}
										<p class="text-sm">{item.habit?.name}</p>
									{/if}
									{#if item.source}
										<p class="text-muted-foreground truncate text-xs">&ldquo;{item.source}&rdquo;</p>
									{/if}
									{#if item.problem}
										<p class="text-destructive text-xs">{item.problem}</p>
									{/if}
								</div>
							</div>
							<!-- Round-trips what the person cannot edit; the server re-validates all of it. -->
							<input type="hidden" name="items[{index}].kind" value={item.kind} />
							<input type="hidden" name="items[{index}].source" value={item.source} />
							{#if item.kind === 'habit'}
								<input type="hidden" name="items[{index}].habit_id" value={item.habit?.id ?? ''} />
								<input type="hidden" name="items[{index}].habit_name" value={item.habit?.name ?? ''} />
							{/if}
							{#if item.kind === 'food'}
								<input type="hidden" name="items[{index}].ingredient_id" value={item.food?.ingredient_id ?? ''} />
								<input type="hidden" name="items[{index}].food" value={item.food?.query ?? ''} />
								<input type="hidden" name="items[{index}].matched_name" value={item.food?.matched_name ?? ''} />
							{/if}
							{#if item.kind === 'sleep'}
								<input type="hidden" name="items[{index}].quality" value={String(item.sleep?.quality ?? 0)} />
								<input type="hidden" name="items[{index}].date" value={sleepDate(item)} />
							{/if}
							{#if item.kind === 'check_in'}
								<input type="hidden" name="items[{index}].notes" value={item.check_in?.notes ?? ''} />
							{/if}
							{#if item.problem}
								<input type="hidden" name="items[{index}].problem" value={item.problem} />
							{/if}
						</Card>
					{/each}
				</div>
			{/if}
			{#if cap.draft.unparsed.length > 0}
				<Card class="border-dashed p-3">
					<p class="text-sm font-medium">{i18n.t('capture.left.title')}</p>
					<p class="text-muted-foreground mt-1 text-xs">{i18n.t('capture.left.body')}</p>
					<ul class="mt-2 space-y-1">
						{#each cap.draft.unparsed as text, i (i)}<li class="text-sm">&ldquo;{text}&rdquo;</li>{/each}
					</ul>
					<div class="mt-3 flex flex-wrap gap-2">
						<Button variant="outline" size="sm" href="/app/chat">{i18n.t('capture.left.ask')}</Button>
						<Button variant="outline" size="sm" href="/app/mind">{i18n.t('capture.left.note')}</Button>
					</div>
				</Card>
			{/if}
			<div class="bg-background sticky bottom-0 flex items-center justify-between gap-3 border-t py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
				<Button variant="ghost" type="submit" class="min-h-11" formaction="/app/capture" formmethod="get" onclick={startOver}>
					{i18n.t('capture.start_over')}
				</Button>
				{#if anyWritable}
					<Button type="submit" class="min-h-11">
						{i18n.t('capture.save')} <span class="ml-1 tabular-nums">{count}</span>
					</Button>
				{/if}
			</div>
		</form>
	{:else}
		<form method="post" action="/app/capture?/parse" class="space-y-3" use:enhance={submit} data-testid="capture-composer">
			{#if embedded}<input type="hidden" name="return_to" value={cap.returnTo} />{/if}
			<!-- svelte-ignore a11y_autofocus -->
			<Textarea
				id={textId}
				name="text"
				value={cap.text}
				rows={4}
				placeholder={i18n.t('capture.ph')}
				class="text-base"
				maxlength={MAX_TEXT}
				autofocus={!embedded}
			/>
			<div class="flex items-center justify-between gap-3">
				<p class="text-muted-foreground text-xs">{i18n.t('capture.cost')}</p>
				<div class="flex items-center gap-2">
					<!-- The transcript lands in the box: the person reads what was heard before anything is parsed. -->
					<Dictate target={textId} surface="capture" showLabel variant="outline" />
					<Button type="submit" class="min-h-11">{i18n.t('capture.read')}</Button>
				</div>
			</div>
		</form>
	{/if}
</div>

{#snippet numberInput(name: string, value: string)}
	<Input {name} {value} type="number" class="h-10 w-24" inputmode="decimal" step="any" />
{/snippet}
