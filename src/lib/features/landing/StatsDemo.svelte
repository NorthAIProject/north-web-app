<!-- What a month looks like: patterns and numbers (north-client web/landing/product.templ statsDemo). -->
<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';

	const i18n = useI18n();
	const t = i18n.t;

	type Bar = { label: string; value: string; pct: number; color: string };
	const patterns = $derived([
		{
			title: t('land.stats.p1.title'),
			detail: t('land.stats.p1.detail'),
			bars: [
				{ label: t('land.stats.p1.a'), value: '6h 38m', pct: 90, color: 'var(--north-signal)' },
				{ label: t('land.stats.p1.b'), value: '7h 20m', pct: 100, color: 'var(--muted-foreground)' }
			] as Bar[]
		},
		{
			title: t('land.stats.p2.title'),
			detail: t('land.stats.p2.detail'),
			bars: [
				{ label: t('land.stats.p2.a'), value: t('land.stats.p2.a.value'), pct: 100, color: 'var(--north-signal)' },
				{ label: t('land.stats.p2.b'), value: t('land.stats.p2.b.value'), pct: 79, color: 'var(--muted-foreground)' }
			] as Bar[]
		}
	]);

	const stats = $derived([
		{ label: t('land.lift.backsquat'), value: '127 kg', note: t('land.stats.squat.note') },
		{ label: t('land.stats.5k'), value: '24:12', note: t('land.stats.5k.note') },
		{ label: t('land.stats.protein'), value: t('land.stats.protein.value'), note: t('land.stats.protein.note') },
		{ label: t('land.stats.sleep'), value: '2h 10m', note: t('land.stats.sleep.note') }
	]);
</script>

<section id="patterns" class="border-hairline relative scroll-mt-20 border-t py-24">
	<SectionHeading eyebrow={t('land.stats.eyebrow')} title={t('land.stats.title')} body={t('land.stats.body')} />
	<div class="mt-10 grid gap-4 md:grid-cols-2">
		{#each patterns as p (p.title)}
			<Card.Root class="border-hairline bg-surface">
				<Card.Content class="space-y-4 py-5">
					<div>
						<h3 class="text-base font-medium">{p.title}</h3>
						<p class="text-muted-foreground mt-1 text-sm">{p.detail}</p>
					</div>
					{#each p.bars as b (b.label)}
						<div class="text-sm">
							<div class="flex justify-between gap-2">
								<span>{b.label}</span>
								<span class="text-muted-foreground tabular-nums">{b.value}</span>
							</div>
							<div class="bg-muted mt-1 h-1.5 rounded-full">
								<div class="h-1.5 rounded-full" style:width="{b.pct}%" style:background={b.color}></div>
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
	<div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#each stats as s (s.label)}
			<div class="border-hairline bg-surface/60 rounded-lg border p-4">
				<p class="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">{s.label}</p>
				<p class="mt-1 text-xl font-medium tabular-nums">{s.value}</p>
				<p class="text-muted-foreground text-xs">{s.note}</p>
			</div>
		{/each}
	</div>
</section>
