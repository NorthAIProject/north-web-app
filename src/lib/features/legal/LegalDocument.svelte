<!--
	The shared shell for the policies (north-client web/legal/document.templ).
	Hand-rolled prose styling: these are the only pages built from running
	text, and a policy nobody can read is a policy nobody read.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { defaultLocale, useI18n } from '#lib/i18n/index.js';
	import { lastUpdated } from './legal.js';

	let { title, children }: { title: string; children: Snippet } = $props();
	const i18n = useI18n();
</script>

<article class="mx-auto w-full max-w-2xl px-6 py-16">
	<header class="mb-10">
		<h1 class="text-3xl font-medium tracking-tight text-balance">{title}</h1>
		<p class="text-muted-foreground mt-2 font-mono text-xs">
			Last updated {lastUpdated}
		</p>
		<!-- Translated, because somebody reading Khepri in Portuguese should be told why this page is not. -->
		{#if i18n.locale !== defaultLocale}
			<p class="border-hairline text-muted-foreground mt-4 border-l-2 pl-3 text-xs leading-relaxed">
				{i18n.t('legal.english')}
			</p>
		{/if}
	</header>
	<div
		class="[&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-foreground [&_em]:text-foreground space-y-6 text-sm leading-relaxed [&_a]:underline [&_a:hover]:text-foreground [&_li]:leading-relaxed [&_p.lead]:text-base [&_p.lead]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
	>
		{@render children()}
	</div>
	<footer class="border-hairline text-muted-foreground mt-12 border-t pt-6 font-mono text-[10px]">
		<a href="/privacy" class="hover:text-foreground">Privacy</a>
		<span class="px-2">·</span>
		<a href="/terms" class="hover:text-foreground">Terms</a>
		<span class="px-2">·</span>
		<a href="/" class="hover:text-foreground">Home</a>
	</footer>
</article>
