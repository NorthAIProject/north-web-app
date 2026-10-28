<!-- north-client web/insights/training.templ lifting: what the logged sets add up to. -->
<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#lib/components/ui/card/index.js';
	import { SpecChart } from '#lib/components/ui/chart/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { bar } from '#lib/features/viz/chartjs.js';
	import PanelEmpty from '../PanelEmpty.svelte';
	import StatTile from '../StatTile.svelte';
	import { changeLabel, formatCount, type LiftingView } from '../domains.js';

	let { lifting }: { lifting: LiftingView } = $props();

	const i18n = useI18n();
</script>

<section class="space-y-4" data-testid="insights-lifting">
	<h2 class="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
		{i18n.t('insights.lifting.title')}
	</h2>
	{#if !lifting.hasSets}
		<Card class="border-hairline bg-surface">
			<CardContent>
				<PanelEmpty
					message={i18n.t('insights.lifting.empty')}
					cta={i18n.t('insights.lifting.cta')}
					href="/app/training"
				/>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-3 sm:grid-cols-3">
			<StatTile
				label={i18n.t('insights.lifting.volume')}
				value={lifting.volume}
				note={i18n.t('insights.lifting.volume.note')}
				delta={lifting.delta}
			/>
			<StatTile
				label={i18n.t('insights.lifting.sets')}
				value={formatCount(lifting.sets)}
				note={i18n.t('insights.lifting.sets.note')}
			/>
			<StatTile
				label={i18n.t('insights.lifting.workouts')}
				value={formatCount(lifting.workouts)}
				note={i18n.t('insights.lifting.workouts.note')}
			/>
		</div>
		<div class="grid gap-4 lg:grid-cols-3">
			<Card class="border-hairline bg-surface lg:col-span-2">
				<CardHeader>
					<CardTitle>{i18n.t('insights.lifting.exercises')}</CardTitle>
					<CardDescription>{i18n.t('insights.lifting.exercises.desc')}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="-mx-2 overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
								<tr>
									<th class="px-2 py-1 text-left font-normal">{i18n.t('insights.lifting.col.exercise')}</th>
									<th class="px-2 py-1 text-right font-normal">{i18n.t('insights.lifting.col.sets')}</th>
									<th class="px-2 py-1 text-right font-normal">{i18n.t('insights.lifting.col.best')}</th>
									<th class="px-2 py-1 text-right font-normal">{i18n.t('insights.lifting.col.e1rm')}</th>
									<th class="hidden px-2 py-1 text-right font-normal sm:table-cell">
										{i18n.t('insights.lifting.col.volume')}
									</th>
								</tr>
							</thead>
							<tbody class="divide-border divide-y">
								{#each lifting.exercises as e, i (i)}
									<tr>
										<td class="max-w-[12rem] truncate px-2 py-2 font-medium">{e.name}</td>
										<td class="px-2 py-2 text-right tabular-nums">{formatCount(e.sets)}</td>
										<td class="px-2 py-2 text-right tabular-nums">{e.best}</td>
										<td class="px-2 py-2 text-right tabular-nums">
											{e.e1rm}
											{#if e.changeKg > 0}
												<span class="text-signal ml-1 text-xs">{changeLabel(i18n, e.changeKg)}</span>
											{:else if e.changeKg < 0}
												<span class="text-muted-foreground ml-1 text-xs">{changeLabel(i18n, e.changeKg)}</span>
											{/if}
										</td>
										<td class="text-muted-foreground hidden px-2 py-2 text-right tabular-nums sm:table-cell">
											{e.volume}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
			<Card class="border-hairline bg-surface">
				<CardHeader>
					<CardTitle>{i18n.t('insights.lifting.records')}</CardTitle>
					<CardDescription>{i18n.t('insights.lifting.records.desc')}</CardDescription>
				</CardHeader>
				<CardContent>
					{#if lifting.records.length === 0}
						<PanelEmpty message={i18n.t('insights.lifting.records.empty')} />
					{:else}
						<ul class="divide-border -my-2 divide-y" data-testid="lifting-records">
							{#each lifting.records as r, i (i)}
								<li class="py-2">
									<div class="flex items-baseline justify-between gap-2">
										<span class="truncate text-sm font-medium">{r.exercise}</span>
										<span class="text-signal shrink-0 text-xs tabular-nums">+{r.gain}</span>
									</div>
									<p class="text-muted-foreground text-xs tabular-nums">
										{r.lift} · {i18n.tf('insights.lifting.records.est', r.e1rm)} · {r.on}
									</p>
								</li>
							{/each}
						</ul>
					{/if}
				</CardContent>
			</Card>
		</div>
		<div class="grid gap-4 lg:grid-cols-3">
			{#if lifting.hasWeekly}
				<Card class="border-hairline bg-surface lg:col-span-2">
					<CardHeader>
						<CardTitle>{i18n.t('insights.lifting.weekly')}</CardTitle>
					</CardHeader>
					<CardContent>
						<SpecChart
							{...bar(
								'insights-lifting-weekly',
								lifting.weekly.series[0]?.label ?? 'kg',
								lifting.weekly.labels,
								lifting.weekly.series[0]?.values ?? []
							)}
						/>
					</CardContent>
				</Card>
			{/if}
			{#if lifting.muscles.length > 0}
				<Card class="border-hairline bg-surface">
					<CardHeader>
						<CardTitle>{i18n.t('insights.lifting.muscles')}</CardTitle>
						<CardDescription>{i18n.t('insights.lifting.muscles.desc')}</CardDescription>
					</CardHeader>
					<CardContent>
						<ul class="space-y-2">
							{#each lifting.muscles as m, i (i)}
								<li class="text-sm">
									<div class="flex justify-between gap-2">
										<span>{m.name}</span>
										<span class="text-muted-foreground tabular-nums">{formatCount(m.sets)}</span>
									</div>
									<div class="bg-muted mt-1 h-1.5 rounded-full">
										<div class="bg-signal h-1.5 rounded-full" style="width:{formatCount(m.pct)}%"></div>
									</div>
								</li>
							{/each}
						</ul>
					</CardContent>
				</Card>
			{/if}
		</div>
	{/if}
</section>
