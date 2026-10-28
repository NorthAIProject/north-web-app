<!--
	north-client web/insights/shell.templ page/pageAfter: the shell every
	insights view shares — title, sub-nav, range selector, and the panels the
	selector refreshes.

	Go swapped #insights-panels with an htmx GET of the page's /body fragment
	and pushed ?range=. Here each option is a plain link to ?range=: SvelteKit
	navigates client-side, the page's load refetches, and only the panels
	re-render (the shell stays mounted, scroll and focus are kept). Without
	JavaScript it is an ordinary link, as in Go.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { pageTitle } from '#lib/brand.js';
	import { sections, sectionTitle, type SectionKey } from './sections.js';
	import type { RangeView } from './types.js';

	let {
		title,
		active,
		range,
		hrefFor,
		children,
		after
	}: {
		title: string;
		active: SectionKey;
		range: RangeView;
		/** The page URL for a range option; defaults to this path + ?range=. */
		hrefFor?: (key: string) => string;
		children: Snippet;
		/** Below the panels, not refreshed by the range (Go pageAfter). */
		after?: Snippet;
	} = $props();

	const i18n = useI18n();
	const optionHref = (key: string) => (hrefFor ? hrefFor(key) : `${page.url.pathname}?range=${encodeURIComponent(key)}`);
</script>

<svelte:head><title>{pageTitle(title)}</title></svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8" data-testid="insights-page">
	<header class="space-y-4">
		<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<MonoLabel text={i18n.t('insights.label')} />
				<h1 class="mt-2 text-2xl font-medium tracking-tight">{title}</h1>
				<p class="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
					{i18n.tf('insights.intro', range.label)}
				</p>
			</div>
			<nav
				aria-label={i18n.t('insights.nav.period')}
				class="border-hairline bg-surface/60 -mx-1 flex shrink-0 gap-1 overflow-x-auto rounded-lg border p-1"
			>
				{#each range.options as opt (opt.key)}
					{#if opt.key === range.key}
						<a
							href={optionHref(opt.key)}
							data-sveltekit-reset="false"
							aria-current="true"
							class="bg-signal text-background rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap"
						>
							{opt.label}
						</a>
					{:else}
						<a
							href={optionHref(opt.key)}
							data-sveltekit-reset="false"
							class="text-muted-foreground hover:bg-accent/60 hover:text-foreground rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
						>
							{opt.label}
						</a>
					{/if}
				{/each}
			</nav>
		</div>
		<nav aria-label={i18n.t('insights.nav.sections')} class="-mx-1 flex gap-1 overflow-x-auto">
			{#each sections as s (s.key)}
				{@const Icon = s.icon}
				{#if s.key === active}
					<a
						href={s.href}
						aria-current="page"
						class="border-hairline bg-surface text-foreground flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap"
					>
						<Icon class="size-3.5" />
						{sectionTitle(i18n, s.key)}
					</a>
				{:else}
					<a
						href={s.href}
						class="text-muted-foreground hover:bg-accent/60 hover:text-foreground flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors"
					>
						<Icon class="size-3.5" />
						{sectionTitle(i18n, s.key)}
					</a>
				{/if}
			{/each}
		</nav>
	</header>
	<div id="insights-panels">
		{@render children()}
	</div>
	{@render after?.()}
</div>
