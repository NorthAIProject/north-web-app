<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import Markdown from '#lib/components/khepri/Markdown.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { prioritySlots, rankValue, volumes } from '#lib/features/weekly/form.js';
	import { radioClass } from '#lib/features/weekly/radio.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const review = $derived(data.review);
	// A failed save keeps what was typed; otherwise the form starts from the
	// focus already set (Go: FormFrom / Form on 422).
	const priorities = $derived(prioritySlots(form?.values?.priorities ?? review.current?.priorities));
	const volume = $derived(form?.values?.volume ?? review.current?.volume ?? 'hold');
	const errors = $derived<Record<string, string>>(form?.errors ?? {});
	// Week starts are dates; formatting them in UTC keeps the calendar day.
	const day = (d: string) => formatTime(i18n.locale, d, '2 Jan', 'UTC');
	let submitting = $state(false);
</script>

<svelte:head><title>{pageTitle(i18n.t('weekly.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('weekly.title')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.tf('weekly.h1', day(review.planning))}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
			{i18n.tf('weekly.lede', day(review.reviewing))}
		</p>
	</header>
	{#if data.saved && !form}
		<p class="text-sm" role="status">{i18n.t('weekly.saved')}</p>
	{/if}
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('weekly.happened')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if review.last && review.last.priorities.length > 0}
				<p class="text-muted-foreground mb-3 text-sm">{i18n.tf('weekly.chose', review.last.priorities.join('; '))}</p>
			{/if}
			{#if review.report?.ready}
				<Markdown source={review.report.body} class="prose prose-sm max-w-none" />
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('weekly.writing')}</p>
			{/if}
		</Card.Content>
	</Card.Root>
	<form
		method="post"
		action="/app/weekly"
		class="space-y-6"
		use:enhance={withInvalidFocus(() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		})}
	>
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('weekly.priorities')}</Card.Title>
				<Card.Description>{i18n.t('weekly.priorities.desc')}</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#each priorities as p, i (i)}
					<Input
						id="priority-{i}"
						name="priority"
						value={p}
						placeholder={i18n.tf('weekly.priority', i + 1)}
						aria-label={i18n.tf('weekly.priority', i + 1)}
						aria-invalid={errors.priorities ? 'true' : undefined}
						aria-describedby={describedBy('priorities', errors.priorities)}
					/>
				{/each}
				<FieldMessage id="priorities" error={errors.priorities} />
			</Card.Content>
		</Card.Root>
		{#if review.goals.length > 0}
			<Card.Root class="border-hairline bg-surface">
				<Card.Header>
					<Card.Title>{i18n.t('weekly.goals')}</Card.Title>
					<Card.Description>{i18n.t('weekly.goals.desc')}</Card.Description>
				</Card.Header>
				<Card.Content>
					<ul class="divide-hairline divide-y">
						{#each review.goals as g, i (g.id)}
							<li class="flex items-center gap-3 py-2">
								<Input
									id="rank-{g.id}"
									name="rank_{g.id}"
									type="number"
									value={rankValue(g.priority, i)}
									class="w-16"
									min="1"
									aria-label={i18n.tf('weekly.goals.order', g.title)}
									aria-invalid={errors.goals ? 'true' : undefined}
									aria-describedby={describedBy('goal-ranks', errors.goals)}
								/>
								<span class="text-sm">{g.title}</span>
							</li>
						{/each}
					</ul>
					<FieldMessage id="goal-ranks" error={errors.goals} />
				</Card.Content>
			</Card.Root>
		{/if}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('weekly.training')}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#each volumes as v (v.value)}
					<div class="flex items-start gap-3">
						<input
							type="radio"
							id="volume-{v.value}"
							name="volume"
							value={v.value}
							checked={volume === v.value}
							class={radioClass}
						/>
						<Label for="volume-{v.value}">
							<span class="font-medium">{i18n.t(v.title)}</span>
							<span class="text-muted-foreground block text-xs">{i18n.t(v.hint)}</span>
						</Label>
					</div>
				{/each}
				<FieldMessage id="volume" error={errors.volume} />
			</Card.Content>
		</Card.Root>
		<Button type="submit" disabled={submitting}>{i18n.t('weekly.save')}</Button>
	</form>
</div>
