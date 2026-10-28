<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import WorkoutItem from '#lib/features/profiles/WorkoutItem.svelte';
	import { profileBase } from '#lib/features/profiles/profile.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/profiles/profile.templ WorkoutsPage.
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const handle = $derived(data.profile.handle);
</script>

<svelte:head><title>{pageTitle(i18n.t('profile.workouts'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<Button href={profileBase(handle)} variant="ghost" size="sm">{'← ' + i18n.t('profile.back')}</Button>
	<h1 class="text-2xl font-medium tracking-tight">{data.profile.displayName} · {i18n.t('profile.workouts')}</h1>
	{#if !data.page.shared}
		<p class="text-muted-foreground text-sm">{i18n.t('profile.hidden')}</p>
	{:else if data.page.items.length === 0}
		<p class="text-muted-foreground text-sm">{i18n.t('profile.empty')}</p>
	{:else}
		<ul>
			{#each data.page.items as c (c.sessionId)}
				<WorkoutItem {handle} card={c} timeZone={data.user.timezone} />
			{/each}
		</ul>
		{#if data.more}
			<Button href="{profileBase(handle)}/workouts{data.more}" variant="outline">{i18n.t('profile.more')}</Button>
		{/if}
	{/if}
</div>
