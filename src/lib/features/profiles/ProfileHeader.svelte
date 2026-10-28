<script lang="ts">
	// Who the person is, their counts, and the follow button (Go: web/profiles header).
	import { enhance } from '$app/forms';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { countLabel, initials, profileBase, type ProfileView } from './profile.js';

	let { profile }: { profile: ProfileView } = $props();
	const i18n = useI18n();
	const follows = $derived(profile.relationship.following !== '');
	let busy = $state(false);
</script>

<header class="flex items-start gap-4">
	<Avatar.Root>
		<Avatar.Fallback>{initials(profile.displayName)}</Avatar.Fallback>
	</Avatar.Root>
	<div class="min-w-0 flex-1">
		<h1 class="truncate text-2xl font-medium tracking-tight">{profile.displayName}</h1>
		<p class="text-muted-foreground text-sm">{'@' + profile.handle}</p>
		{#if profile.level}
			<p class="mt-1 text-sm">{i18n.tf('profile.level', profile.level.number, profile.level.title)}</p>
		{/if}
		<p class="text-muted-foreground mt-2 flex flex-wrap gap-x-4 text-sm">
			{#if profile.workouts != null}
				<span
					><span class="text-foreground tabular-nums">{i18n.thousands(profile.workouts)}</span>
					{countLabel(i18n, profile.workouts, 'profile.workout', 'profile.workouts')}</span
				>
			{/if}
			<span
				><span class="text-foreground tabular-nums">{i18n.thousands(profile.followers)}</span>
				{countLabel(i18n, profile.followers, 'profile.follower', 'profile.followers')}</span
			>
			<span
				><span class="text-foreground tabular-nums">{i18n.thousands(profile.following)}</span>
				{i18n.t('profile.following')}</span
			>
		</p>
	</div>
	{#if !profile.relationship.self}
		<form
			method="post"
			action="{profileBase(profile.handle)}?/{follows ? 'unfollow' : 'follow'}"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			{#if follows}
				<Button type="submit" variant="outline" disabled={busy}>{i18n.t('social.unfollow')}</Button>
			{:else}
				<Button type="submit" disabled={busy}>{i18n.t('social.follow.ask')}</Button>
			{/if}
		</form>
	{/if}
</header>
