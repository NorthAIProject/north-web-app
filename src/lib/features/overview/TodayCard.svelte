<!--
	"What should I do now" (Go todayCard): one next step with the only filled
	button on the card, then the day's list. Once everything is done it offers
	the reflection instead, so the card never ends on nothing to do.
-->
<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { iconFor } from './icons.js';
	import ReflectForm from './ReflectForm.svelte';
	import { todayItems, type Overview } from './overview.js';

	let { overview, timezone }: { overview: Overview; timezone?: string } = $props();
	const i18n = useI18n();

	const items = $derived(todayItems(i18n, overview, timezone));
	const next = $derived(items.find((it) => !it.done));
	const done = $derived(items.filter((it) => it.done).length);
</script>

<Card.Root class="border-hairline bg-surface" data-today="true">
	<Card.Content>
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div class="min-w-0">
				<p class="text-muted-foreground text-[13px]">
					{i18n.t('dash.today.title')} · {i18n.tf('dash.today.progress', done, items.length)}
				</p>
				{#if next}
					<p class="mt-1 text-lg font-medium tracking-tight">{i18n.t('dash.today.next')} {next.label}</p>
					<p class="text-muted-foreground text-sm">{next.detail}</p>
				{:else}
					<p class="mt-1 text-lg font-medium tracking-tight">{i18n.t('dash.today.alldone')}</p>
					<p class="text-muted-foreground text-sm">{i18n.t('dash.today.alldone.body')}</p>
				{/if}
			</div>
			<div class="shrink-0">
				{#if next}
					<Button href={next.href}>{next.cta}</Button>
				{:else}
					<ReflectForm />
				{/if}
			</div>
		</div>
		<ul class="border-hairline mt-4 grid gap-2 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each items as item (item.key)}
				{@const isNext = next?.key === item.key}
				{@const Icon = iconFor(item.icon)}
				<li>
					<!-- Done is a mark as well as a colour, and the row stays a link:
					     a check-in can be edited, water topped up past the target. -->
					<a
						href={item.href}
						data-today-item={item.key}
						data-done={item.done ? 'true' : undefined}
						class={[
							'group flex items-start gap-3 rounded-md border px-3 py-2 transition-colors',
							isNext ? 'border-signal/40 bg-signal/5' : 'border-hairline hover:border-signal/40'
						]}
					>
						<span
							class={[
								'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border',
								item.done ? 'border-signal bg-signal text-signal-foreground' : 'border-hairline text-muted-foreground'
							]}
						>
							{#if item.done}
								<CheckIcon class="size-3" />
							{:else}
								<Icon class="size-3" />
							{/if}
						</span>
						<span class="min-w-0 flex-1">
							<span class={['block truncate text-sm font-medium', item.done && 'text-muted-foreground line-through']}>
								{item.label}
							</span>
							<span class="text-muted-foreground block truncate text-xs tabular-nums">{item.detail}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</Card.Content>
</Card.Root>
