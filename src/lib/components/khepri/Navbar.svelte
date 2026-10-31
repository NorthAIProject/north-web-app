<!--
	The marketing header (north-client ui.Navbar). `/` is public and renders for
	everyone, so signedIn swaps "Sign in / Get started" for "Open Khepri".
	max-w-6xl matches the landing content column. Below sm the X link and the
	ghost Sign in drop out so the primary call to action fits at 320 px in every
	language ("Iniciar sesión" alone is 110 px); /signup links to sign-in.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { xProfileUrl } from '#lib/brand.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import BrandLockup from '#lib/components/brand/BrandLockup.svelte';
	import ThemeSwitcher from './ThemeSwitcher.svelte';

	let { signedIn = false }: { signedIn?: boolean } = $props();

	const i18n = useI18n();
</script>

<nav class="border-hairline/80 sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
	<div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 lg:pl-28 lg:pr-8">
		<BrandLockup href="/" markSize="size-6" textClass="text-base font-medium tracking-tight" />
		<div class="flex min-w-0 items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				href={xProfileUrl}
				target="_blank"
				class="hidden px-2.5 text-muted-foreground hover:text-foreground sm:inline-flex"
				rel="noopener noreferrer"
				aria-label={i18n.t('land.nav.x')}
			>
				X
			</Button>
			<ThemeSwitcher />
			{#if signedIn}
				<Button size="sm" href="/app">{i18n.t('land.cta.open')}</Button>
			{:else}
				<Button variant="ghost" size="sm" href="/login" class="hidden sm:inline-flex">{i18n.t('land.cta.signin')}</Button>
				<Button size="sm" href="/signup">{i18n.t('land.nav.started')}</Button>
			{/if}
		</div>
	</div>
</nav>
