<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import ActivitySelect from '#lib/features/activity/ActivitySelect.svelte';
	import { activityName, metName, sessionSummary } from '#lib/features/activity/format.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/activity/activity.templ (Page). Every button is a plain form post
	// that comes back to this page, as in Go; enhance only keeps the scroll.

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const overview = $derived(data.overview);
	const active = $derived(overview.active);
	const timeZone = $derived(data.user.timezone || 'UTC');
	const options = $derived(
		overview.kinds.map((k) => ({ value: k.code, label: metName(i18n, k.code, k.name) }))
	);
	const errMsg = $derived((form as { error?: string } | null)?.error ?? '');
	const signal = 'bg-signal text-background hover:bg-signal/90';
</script>

<svelte:head><title>{pageTitle(i18n.t('activity.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('nav.fitness')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('activity.title')}</h1>
		<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
			{i18n.t('activity.intro')}
		</p>
		{#if overview.todayCalories > 0}
			<p class="mt-3 text-sm font-medium text-signal">
				{i18n.tf('activity.today.burned', overview.todayCalories)}
			</p>
		{/if}
	</header>
	{#if errMsg}
		<p
			class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
			role="alert"
		>
			{errMsg}
		</p>
	{/if}
	{#if active}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{activityName(i18n, active)}</Card.Title>
				<Card.Description>
					{active.status === 'paused'
						? i18n.t('activity.status.paused')
						: i18n.t('activity.status.running')}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex gap-2">
					{#if active.status === 'paused'}
						<form method="post" action="?/resume" use:enhance>
							<input type="hidden" name="id" value={active.id} />
							<Button type="submit">{i18n.t('activity.resume')}</Button>
						</form>
					{:else}
						<form method="post" action="?/pause" use:enhance>
							<input type="hidden" name="id" value={active.id} />
							<Button type="submit" variant="outline">{i18n.t('activity.pause')}</Button>
						</form>
					{/if}
					<form method="post" action="?/stop" use:enhance>
						<input type="hidden" name="id" value={active.id} />
						<Button type="submit" class={signal}>{i18n.t('activity.stop')}</Button>
					</form>
					<form method="post" action="?/cancel" use:enhance>
						<input type="hidden" name="id" value={active.id} />
						<Button type="submit" variant="ghost">{i18n.t('activity.cancel')}</Button>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('activity.start.title')}</Card.Title>
			</Card.Header>
			<Card.Content>
				<form method="post" action="?/start" class="space-y-4" use:enhance>
					<div class="space-y-2">
						<Label for="activity_code">{i18n.t('activity.field.activity')}</Label>
						<ActivitySelect
							id="activity_code"
							name="activity_code"
							placeholder={i18n.t('activity.choose')}
							{options}
						/>
					</div>
					<Button type="submit" class={signal}>{i18n.t('activity.start')}</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
	<!--
		Records a session that already happened: the run someone did this
		morning without opening the timer. Distance is optional because a yoga
		session has none; start time is optional because "just now" is the
		common case and a blank field means exactly that.
	-->
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('activity.log.title')}</Card.Title>
			<Card.Description>{i18n.t('activity.log.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" action="?/log" class="space-y-4" use:enhance>
				<div class="space-y-2">
					<Label for="log_activity_code">{i18n.t('activity.field.activity')}</Label>
					<ActivitySelect
						id="log_activity_code"
						name="activity_code"
						placeholder={i18n.t('activity.choose')}
						{options}
					/>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="log_minutes">{i18n.t('activity.field.minutes')}</Label>
						<Input
							id="log_minutes"
							name="minutes"
							type="number"
							required
							min="1"
							max="1440"
							step="1"
						/>
					</div>
					<div class="space-y-2">
						<Label for="log_distance_km">{i18n.t('activity.field.distance')}</Label>
						<Input id="log_distance_km" name="distance_km" type="number" min="0" step="0.01" />
					</div>
				</div>
				<div class="space-y-2">
					<Label for="log_started_at">{i18n.t('activity.field.started')}</Label>
					<Input id="log_started_at" name="started_at" type="datetime-local" />
				</div>
				<Button type="submit" variant="outline">{i18n.t('activity.log.submit')}</Button>
			</form>
		</Card.Content>
	</Card.Root>
	{#if overview.recent.length > 0}
		<section class="space-y-3">
			<h2 class="text-sm font-medium">{i18n.t('activity.recent')}</h2>
			{#each overview.recent as s (s.id)}
				<Card.Root class="border-hairline">
					<Card.Content class="py-4">
						<div class="flex items-center justify-between text-sm">
							<span>{activityName(i18n, s)}</span>
							<span class="text-muted-foreground">
								{sessionSummary(i18n, s, timeZone)}
							</span>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</section>
	{/if}
</div>
