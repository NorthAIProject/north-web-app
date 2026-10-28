<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import AwardsStrip from '#lib/features/awards-page/AwardsStrip.svelte';
	import MonthlyCard from '#lib/features/awards-page/MonthlyCard.svelte';
	import { newestAwards } from '#lib/features/awards-page/awards.js';
	import ProfileHeader from '#lib/features/profiles/ProfileHeader.svelte';
	import WorkoutItem from '#lib/features/profiles/WorkoutItem.svelte';
	import { profileBase } from '#lib/features/profiles/profile.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/profiles/profile.templ ProfilePage.
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const p = $derived(data.profile);
	const shared = $derived(p.shares?.training ?? false);
	const recent = $derived(p.recentWorkouts ?? []);
</script>

<svelte:head><title>{pageTitle('@' + p.handle)}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<ProfileHeader profile={p} />
	{#if p.monthlyChallenge}
		<MonthlyCard challenge={p.monthlyChallenge} />
	{/if}
	<AwardsStrip handle={p.handle} awards={newestAwards(p.awards)} />
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('profile.workouts')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if !shared}
				<p class="text-muted-foreground text-sm">{i18n.t('profile.hidden')}</p>
			{:else if recent.length === 0}
				<p class="text-muted-foreground text-sm">{i18n.t('profile.empty')}</p>
			{:else}
				<ul>
					{#each recent as c (c.sessionId)}
						<WorkoutItem handle={p.handle} card={c} timeZone={data.user.timezone} />
					{/each}
				</ul>
				<div class="mt-3">
					<Button href="{profileBase(p.handle)}/workouts" variant="ghost" size="sm">{i18n.t('profile.seeall')}</Button>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
