<!--
	The native-app row (north-client web/landing/apps.templ): in the hero, the
	iPhone section and the final call to action. Official badge artwork,
	unaltered — the store guidelines forbid restyling it, so this is not a
	Button. A muted badge is not a link at all: a disabled control reads as
	broken, and there is nowhere for it to go.

	Each language gets the stores' own localised artwork (Apple's marketing
	tools, Google's badge generator), downloaded 2026-10-31 and unaltered.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import { appleBadge, playBadge, type StoreBadge } from './cta.js';

	let { class: className = '' }: { class?: string } = $props();
	const i18n = useI18n();
	const apple = $derived(appleBadge(i18n.t));
	const play = $derived(playBadge(i18n.t));
	// English is the unsuffixed file; every other locale has its own.
	const suffix = $derived(i18n.locale === 'en' ? '' : `-${i18n.locale}`);
</script>

{#snippet slot(b: StoreBadge, artwork: Snippet)}
	<div class="flex flex-col items-center gap-1.5">
		{#if b.muted}
			<span role="img" aria-label={b.aria} class="block opacity-45 grayscale">
				{@render artwork()}
			</span>
		{:else}
			<a
				href={b.href}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={b.aria}
				class="block rounded-[9px] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal"
			>
				{@render artwork()}
			</a>
		{/if}
		{#if b.caption}
			<span aria-hidden="true" class="font-mono text-[11px] tracking-[0.06em] text-muted-foreground">{b.caption}</span>
		{/if}
	</div>
{/snippet}

<!-- Apple's badge: black on the light theme, the white variant on the dark one. 44px tall. -->
{#snippet appleArtwork()}
	<img
		src="/assets/brand/badges/download-on-the-app-store{suffix}.svg"
		alt=""
		width="132"
		height="44"
		class="block h-11 w-auto dark:hidden"
	/>
	<img
		src="/assets/brand/badges/download-on-the-app-store-white{suffix}.svg"
		alt=""
		width="132"
		height="44"
		class="hidden h-11 w-auto dark:block"
	/>
{/snippet}

<!-- Google's English PNG carries transparent padding, so it is scaled and
     clipped to read the same size as Apple's; the localised ones are drawn
     edge to edge and only need the height. -->
{#snippet playArtwork()}
	{#if suffix}
		<img src="/assets/brand/badges/google-play-badge{suffix}.png" alt="" width="114" height="44" class="block h-11 w-auto" />
	{:else}
		<span class="block h-11 w-[147.7px] overflow-hidden">
			<img
				src="/assets/brand/badges/google-play-badge.png"
				alt=""
				width="169"
				height="65"
				class="-m-[10.74px] block h-[65.48px] w-auto max-w-none"
			/>
		</span>
	{/if}
{/snippet}

<div class={['flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7', className]}>
	{@render slot(apple, appleArtwork)}
	{@render slot(play, playArtwork)}
</div>
