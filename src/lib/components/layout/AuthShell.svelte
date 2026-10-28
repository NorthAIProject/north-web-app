<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import BrandLockup from '#lib/components/brand/BrandLockup.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import PageTitle from '#lib/features/landing/PageTitle.svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	// The signed-out pages: one centred card and nothing else to do. The short
	// signal tick beside the mark is a fragment of the landing bearing.
	let { title, wide = false, children }: { title: string; wide?: boolean; children: Snippet } = $props();
	const i18n = useI18n();
</script>

<!-- Title plus og:/twitter:title, so a shared /login or /signup link previews right. -->
<PageTitle {title} />

<div class="flex min-h-full flex-col items-center justify-center px-4 py-12">
	<div class={['w-full', wide ? 'max-w-lg' : 'max-w-sm']}>
		<div class="mb-8 flex flex-col items-center text-center">
			<div class="flex items-center gap-3">
				<span aria-hidden="true" class="h-8 w-px bg-signal/70"></span>
				<BrandLockup href="/" markSize="size-7" textClass="text-xl font-medium tracking-tight" />
			</div>
			<div class="mt-3">
				<MonoLabel text={i18n.t('layout.auth.tagline')} />
			</div>
		</div>
		{@render children()}
		<div class="mt-8 flex justify-center">
			<LanguageSwitcher />
		</div>
	</div>
</div>
