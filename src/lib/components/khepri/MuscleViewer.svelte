<!--
	The body figure (NOR-8): port of north-client web/shared/muscleviewer
	(muscleviewer.templ + muscle-viewer/alpine.js). A 3D body whose muscles
	are coloured from untrained grey-blue to ember, with the same regions as a
	flat front/back SVG when the browser has no WebGL.

	<MuscleViewer id="exercise-42" primary={ex.primary} secondary={ex.secondary} />
	<MuscleViewer id="day-body" map={bodyMap} hideLegend />

	Loading is driven by an IntersectionObserver on the root, so a figure in a
	closed <dialog> loads on first open and frees its WebGL context on close.
-->
<script lang="ts">
	import { fade } from 'svelte/transition';
	import { useI18n } from '#lib/i18n/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import AspectRatio from '#lib/components/ui/aspectratio/aspectratio.svelte';
	import { detailsOf, heatOf, regionStyle, summaryOf } from './bodymap.js';
	import { figureBack, figureFront } from './muscle-figure-data.js';
	import type { MuscleViewerHandle } from './muscle-viewer.js';
	import type { MuscleDetail, MuscleViewerProps } from './types.js';

	let props: MuscleViewerProps = $props();

	const i18n = useI18n();

	const heat = $derived(heatOf(props));
	const details = $derived(detailsOf(i18n, props));
	const inspect = $derived(Boolean(props.map));
	const summary = $derived(summaryOf(i18n, props.map));

	let root: HTMLDivElement | undefined = $state();
	let canvas: HTMLCanvasElement | undefined = $state();

	let ready = $state(false);
	let failed = $state(false);
	let selected: (MuscleDetail & { key: string }) | null = $state(null);

	// Not reactive: the WebGL handle is driven imperatively.
	let viewer: MuscleViewerHandle | null = null;
	let loading = false;
	let generation = 0;
	let onTheme: (() => void) | null = null;

	const isDark = () => document.documentElement.classList.contains('dark');

	async function load() {
		if (viewer || ready || loading || !canvas) return;
		loading = true;
		const mine = ++generation;
		try {
			const module = await import('./muscle-viewer.js');
			const created = await module.createViewer(canvas, {
				reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
				dark: isDark(),
				onMuscleClick: (key) => select(key)
			});
			if (mine !== generation) {
				created.destroy();
				return;
			}
			viewer = created;
			viewer.setHeat(heat);
			if (props.shape) viewer.setShape(props.shape);
			// Any appearance change (the switcher, or the OS flipping while the
			// setting is "system") re-reads the figure's tokens. Read from the
			// class rather than the event detail so every source is honoured.
			onTheme = () => viewer?.setTheme(isDark());
			document.addEventListener('theme-changed', onTheme);
		} catch {
			if (mine !== generation) return;
			failed = true;
		} finally {
			loading = false;
		}
		if (mine === generation) ready = true;
	}

	// A tap on a region, from the canvas or the flat figure. On a figure that
	// only shows what an exercise works, the callout is just the name.
	function select(key: string | null) {
		const detail = key ? details[key] : undefined;
		if (!key || !detail) {
			clear();
			return;
		}
		selected = inspect ? { key, ...detail } : { key, name: detail.name };
		viewer?.select(key);
	}

	function clear() {
		selected = null;
		viewer?.select(null);
	}

	// Frees the WebGL context but keeps the props, so scrolling back or
	// reopening the dialog reloads clean.
	function teardown() {
		generation++;
		loading = false;
		if (onTheme) document.removeEventListener('theme-changed', onTheme);
		onTheme = null;
		viewer?.destroy();
		viewer = null;
		ready = false;
		selected = null;
	}

	$effect(() => {
		if (!root) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) void load();
				else teardown();
			},
			{ rootMargin: '300px' }
		);
		observer.observe(root);
		return () => {
			observer.disconnect();
			teardown();
		};
	});

	// New props repaint a live figure without reloading it.
	$effect(() => {
		const h = heat;
		const shape = props.shape;
		if (!viewer) return;
		viewer.setHeat(h);
		if (shape) viewer.setShape(shape);
	});
</script>

<div id={props.id || undefined} bind:this={root}>
	<div class="relative">
		<AspectRatio ratio="square" class="rounded-lg border border-hairline bg-background/60">
			<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
			<canvas
				bind:this={canvas}
				style:display={failed ? 'none' : undefined}
				role="img"
				aria-label={summary}
				class="size-full cursor-grab touch-none rounded-lg active:cursor-grabbing"
			></canvas>
			<div
				style:display={failed ? undefined : 'none'}
				class="absolute inset-0 grid grid-cols-2 gap-1 p-2"
				role="img"
				aria-label={summary}
			>
				{#each [figureFront, figureBack] as view, side (side)}
					<svg viewBox={view.viewBox} class="size-full" aria-hidden="true">
						<path d={view.silhouette} fill-rule="evenodd" style="fill: var(--north-body-core)"></path>
						{#each view.regions as r (r.region)}
							<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
							<path
								d={r.d}
								fill-rule="evenodd"
								style={regionStyle(heat, r.region)}
								data-muscle={r.region}
								class="cursor-pointer"
								onclick={() => select(r.region)}
							></path>
						{/each}
					</svg>
				{/each}
			</div>
			<div
				style:display={ready ? 'none' : undefined}
				class="pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center"
			>
				<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{i18n.t('bodymap.loading')}</span>
			</div>
		</AspectRatio>
		{#if selected}
			<div
				transition:fade={{ duration: 150 }}
				class="bg-surface/95 border-hairline absolute inset-x-2 bottom-2 flex flex-wrap items-start gap-x-2 gap-y-1.5 rounded-xl border p-2 pl-3 shadow-lg backdrop-blur"
				data-testid="muscle-callout"
			>
				<div class="min-w-0 flex-1 pt-0.5">
					<p class="text-sm font-medium">{selected.name}</p>
					{#if selected.last}
						<p class="text-muted-foreground text-xs">{selected.last}</p>
					{/if}
				</div>
				<Button variant="ghost" size="sm" onclick={clear} aria-label={i18n.t('bodymap.close')}>×</Button>
				{#if selected.href}
					<Button variant="outline" size="sm" class="w-full" href={selected.href}>{i18n.t('bodymap.open')}</Button>
				{/if}
			</div>
		{/if}
	</div>
	<div class={['mt-3 flex flex-wrap items-center gap-3', props.hideLegend && 'hidden']}>
		<span class="flex items-center gap-1.5">
			<span class="size-2 rounded-[2px] bg-ember"></span>
			<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{i18n.t('layout.muscle.primary')}</span>
		</span>
		<span class="flex items-center gap-1.5">
			<span class="size-2 rounded-[2px] bg-ember/55"></span>
			<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{i18n.t('layout.muscle.secondary')}</span>
		</span>
		<span class="flex items-center gap-1.5">
			<span class="size-2 rounded-[2px] bg-ember/25"></span>
			<span class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{i18n.t('layout.muscle.stabiliser')}</span>
		</span>
	</div>
</div>
