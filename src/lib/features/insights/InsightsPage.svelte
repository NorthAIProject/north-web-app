<!--
	north-client web/insights/shell.templ page/pageAfter: the shell every
	insights view shares — title, sub-nav, range selector, and the panels the
	selector refreshes.

	Go swapped #insights-panels with an htmx GET of the page's /body fragment
	and pushed ?range=. Here RangeTabs links each option to ?range=: SvelteKit
	navigates client-side, the page's load refetches, and only the panels
	re-render (the shell stays mounted, scroll and focus are kept). Without
	JavaScript it is an ordinary link, as in Go.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import RangeTabs from '#lib/components/khepri/RangeTabs.svelte';
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
			<RangeTabs
				label={i18n.t('insights.nav.period')}
				value={range.key}
				options={range.options}
				hrefFor={optionHref}
				class="-mx-1"
			/>
		</div>
		<nav aria-label={i18n.t('insights.nav.sections')} class="-mx-1 flex gap-1 overflow-x-auto">
			{#each sections as s (s.key)}
				{@const Icon = s.icon}
				{#if s.key === active}
					<a
						href={s.href}
						aria-current="page"
						class="border-hairline bg-surface text-foreground focus-visible:ring-ring flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset pointer-coarse:min-h-11"
					>
						<Icon class="size-3.5" />
						{sectionTitle(i18n, s.key)}
					</a>
				{:else}
					<a
						href={s.href}
						class="text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset pointer-coarse:min-h-11"
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
