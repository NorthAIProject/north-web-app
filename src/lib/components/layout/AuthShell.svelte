<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import BrandLockup from '#lib/components/brand/BrandLockup.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import PageTitle from '#lib/features/landing/PageTitle.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	// The signed-out pages: one centred card and nothing else to do. The short
	// signal tick beside the mark is a fragment of the landing bearing.
	// The title is the page's h1 (sr-only: the card's own title, an h2, is the
	// visible heading), and everything sits in the one <main>. No skip link:
	// the brand link is the only stop before the content.
	let {
		title,
		wide = false,
		children
	}: { title: string; wide?: boolean; children: Snippet } = $props();
	const i18n = useI18n();
</script>

<!-- Title plus og:/twitter:title, so a shared /login or /signup link previews right. -->
<PageTitle {title} />

<main id="main" class="flex min-h-full flex-col items-center justify-center px-4 py-12">
	<h1 class="sr-only">{title}</h1>
	<div class={['w-full', wide ? 'max-w-lg' : 'max-w-sm']}>
		<div class="mb-8 flex flex-col items-center text-center">
			<!-- No gold rule beside the lockup: the emblem already carries the gold. -->
			<BrandLockup href="/" markSize="size-7" textClass="text-xl font-medium tracking-tight" />
			<div class="mt-3">
				<MonoLabel text={i18n.t('layout.auth.tagline')} />
			</div>
		</div>
		{@render children()}
		<div class="mt-8 flex justify-center">
			<LanguageSwitcher />
		</div>
	</div>
</main>
