<!--
	The landing footer (north-client web/landing/sections.templ siteFooter).
	The language switcher is only for visitors: a signed-in user's language
	lives on their account, and a second control here would write a cookie the
	account ignores — a switch that visibly does nothing.
-->
<script lang="ts">
	import LanguageSwitcher from '#lib/components/layout/LanguageSwitcher.svelte';
	import { discordUrl } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { capture } from '#lib/features/analytics/analytics.js';

	let { signedIn = false }: { signedIn?: boolean } = $props();
	const i18n = useI18n();
	const t = i18n.t;
	// Sentence case at 14 px, each at least 24 px tall (44 px on touch).
	const link =
		'inline-flex min-h-6 items-center rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal pointer-coarse:min-h-11';
	const credit = 'underline underline-offset-2 hover:text-foreground';
</script>

<footer class="border-t border-hairline">
	<div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 lg:pl-28 lg:pr-8">
		<p class="text-sm text-muted-foreground">{t('land.footer.tagline')}</p>
		<div class="flex flex-wrap items-center gap-x-5 gap-y-1">
			<a href="/privacy" class={link}>{t('land.footer.privacy')}</a>
			<a href="/terms" class={link}>{t('land.footer.terms')}</a>
			<a href="https://github.com/NorthAIProject/north-client" class={['gap-2', link]}>
				<!-- Lucide's github mark; @lucide/svelte no longer ships brand icons. -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-3.5"
					aria-hidden="true"
				>
					<path
						d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
					/>
					<path d="M9 18c-4.51 2-5-2-7-2" />
				</svg>
				{t('land.footer.source')}
			</a>
			<a
				href={discordUrl}
				target="_blank"
				rel="noopener noreferrer"
				onclick={() => capture('discord_link_clicked', { surface: 'footer' })}
				class={link}
			>
				{t('land.footer.discord')}
			</a>
			{#if !signedIn}
				<LanguageSwitcher />
			{/if}
		</div>
	</div>
	<div class="mx-auto w-full max-w-6xl px-6 pb-8 lg:pl-28 lg:pr-8">
		<p class="max-w-[90ch] text-xs leading-relaxed text-muted-foreground">
			3D muscle model built on anatomical data from
			<a href="https://www.z-anatomy.com/" class={credit}>Z-Anatomy</a>
			via
			<a href="https://github.com/hpfrei/body-anatomy-3d-viewer" class={credit}>hpfrei/body-anatomy-3d-viewer</a>, licensed
			<a href="https://creativecommons.org/licenses/by-sa/4.0/" class={credit}>CC BY-SA 4.0</a>
			(pruned to named muscle groups, regrouped by muscle). Base body mesh by
			<a href="https://sketchfab.com/ferrumiron6" class={credit}>ferrumiron6</a>, licensed
			<a href="https://creativecommons.org/licenses/by/4.0/" class={credit}>CC BY 4.0</a>
			(arms folded, drawn as a translucent outer body). The combined asset is CC BY-SA 4.0.
		</p>
	</div>
</footer>
