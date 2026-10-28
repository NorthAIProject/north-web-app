<!--
	The muscle viewer demo (north-client web/landing/demos.templ muscleDemo +
	landing.js northMuscle). The 3D figure is imported the first time the
	section comes within 300px of the viewport, so a visitor who never scrolls
	that far never pays for three.js.

	The canvas is decorative — every fact it shows is also in the readout
	beside it — so it is hidden from assistive technology rather than described
	twice. The figure and the readout are painted from the same exercise data,
	so the numbers a visitor reads and the colours they see cannot drift apart.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import type { MuscleViewerHandle } from '#lib/components/khepri/muscle-viewer.js';
	import { AspectRatio } from '#lib/components/ui/aspectratio/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import SectionHeading from './SectionHeading.svelte';
	import Waypoint from './Waypoint.svelte';
	import { barWidth, exercises, figureLoads, figureRegion, roleShade } from './content.js';

	const i18n = useI18n();
	const t = i18n.t;

	const list = $derived(exercises(t));
	let active = $state('squat');
	const current = $derived(list.find((ex) => ex.key === active) ?? list[0]);

	let root: HTMLElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();
	let ready = $state(false);
	let failed = $state(false);
	let viewer: MuscleViewerHandle | null = $state.raw(null);

	const isDark = () => document.documentElement.classList.contains('dark');

	onMount(() => {
		let alive = true;
		let onTheme: (() => void) | null = null;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		async function load() {
			try {
				const { createViewer } = await import('#lib/components/khepri/muscle-viewer.js');
				if (!alive || !canvas) return;
				const v = await createViewer(canvas, { reduced, dark: isDark() });
				if (!alive) return v.destroy();
				viewer = v;
				ready = true;
				// The theme switcher announces itself; the figure has to follow or it
				// turns into a silhouette on a light panel.
				onTheme = () => v.setTheme(isDark());
				document.addEventListener('theme-changed', onTheme);
			} catch (err) {
				// The readout carries every fact the model shows, so a failure here
				// costs presentation rather than information.
				console.error('[landing] muscle viewer failed to load', err);
				failed = true;
				ready = true;
			}
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((e) => e.isIntersecting)) return;
				observer.disconnect();
				load();
			},
			{ rootMargin: '300px' }
		);
		if (root) observer.observe(root);

		return () => {
			alive = false;
			observer.disconnect();
			if (onTheme) document.removeEventListener('theme-changed', onTheme);
			viewer?.destroy();
			viewer = null;
		};
	});

	$effect(() => {
		viewer?.setLoads(figureLoads(current));
	});
</script>

{#snippet heatKey(name: string, swatch: string)}
	<span class="flex items-center gap-1.5">
		<span class={['size-2 rounded-[2px]', swatch]}></span>
		<MonoLabel text={name} />
	</span>
{/snippet}

<section id="muscle" class="relative border-t border-hairline py-24" bind:this={root}>
	<Waypoint distance={t('land.waypoint.week3')} />
	<SectionHeading eyebrow={t('land.muscle.eyebrow')} title={t('land.muscle.title')} body={t('land.muscle.body')} />
	<Card.Root class="mt-10 overflow-hidden border-hairline bg-surface p-0">
		<Card.Content class="grid gap-0 p-0 lg:grid-cols-[1.1fr_1fr]">
			<!-- One tab state across both columns: display:contents keeps the grid. -->
			<Tabs.Root bind:value={active} class="contents">
				<div class="relative border-b border-hairline p-5 lg:border-b-0 lg:border-r">
					<Tabs.List
						class="grid h-auto w-full grid-cols-2 gap-1 bg-transparent p-0 sm:grid-cols-4"
						aria-label={t('land.muscle.tabs.aria')}
					>
						{#each list as ex (ex.key)}
							<Tabs.Trigger
								value={ex.key}
								class="h-auto rounded-md border border-hairline bg-background/40 px-2 py-2 text-xs data-[state=active]:border-signal/50 data-[state=active]:text-signal"
							>
								{ex.name}
							</Tabs.Trigger>
						{/each}
					</Tabs.List>
					<div class="mt-5">
						<AspectRatio ratio="square" class="rounded-lg border border-hairline bg-background/40">
							<canvas
								bind:this={canvas}
								aria-hidden="true"
								class="size-full cursor-grab touch-none rounded-lg active:cursor-grabbing"
							></canvas>
							{#if !ready || failed}
								<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
									<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
										{#if failed}{t('land.muscle.failed')}{:else}{t('land.muscle.loading')}{/if}
									</span>
								</div>
							{/if}
						</AspectRatio>
						<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								{@render heatKey(t('land.muscle.role.primary'), 'bg-ember')}
								{@render heatKey(t('land.muscle.role.secondary'), 'bg-ember/55')}
								{@render heatKey(t('land.muscle.role.stabiliser'), 'bg-ember/25')}
							</div>
							<MonoLabel text={t('land.muscle.drag')} />
						</div>
					</div>
				</div>
				<div class="p-5">
					{#each list as ex (ex.key)}
						<Tabs.Content value={ex.key} data-north-lift={ex.key}>
							<MonoLabel text={t('land.muscle.load')} />
							<h3 class="mt-2 text-xl font-medium tracking-[-0.02em]">{ex.name}</h3>
							<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{ex.cue}</p>
							<ul class="mt-5 space-y-3">
								{#each ex.loads as m (m.key)}
									<li data-north-muscle={figureRegion(m.key)} data-north-share={m.share} data-north-role={m.role}>
										<div class="flex items-baseline justify-between gap-4">
											<span class="text-sm">{m.group}</span>
											<span class="font-mono text-[11px] tabular-nums text-muted-foreground">{m.share}%</span>
										</div>
										<div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-foreground/8">
											<div class={['h-full rounded-full', roleShade(m.role)]} style:width={barWidth(m.share)}></div>
										</div>
									</li>
								{/each}
							</ul>
						</Tabs.Content>
					{/each}
				</div>
			</Tabs.Root>
		</Card.Content>
	</Card.Root>
</section>
