<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { CopyButton } from '#lib/components/ui/copybutton/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import FacebookCard from '#lib/features/social/FacebookCard.svelte';
	import FeedCard from '#lib/features/social/FeedCard.svelte';
	import FieldError from '#lib/features/social/FieldError.svelte';
	import PersonRow from '#lib/features/social/PersonRow.svelte';
	import PhoneCard from '#lib/features/social/PhoneCard.svelte';
	import PostForm from '#lib/features/social/PostForm.svelte';
	import type { FriendsForm } from '#lib/features/social/types.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: FriendsPage (web/social/social.templ).
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const o = $derived(data.overview);
	const f = $derived<FriendsForm>(form ?? {});
	const err = (name: string) => f.errors?.[name] ?? '';
	// The handle field shows what is saved unless a refused one is coming back.
	const handleValue = $derived(f.handle || (err('handle') ? '' : o.handle));

	const sharing = $derived([
		{ id: 'share_training', key: 'social.sharing.training', on: data.sharing.training },
		{ id: 'share_streaks', key: 'social.sharing.streaks', on: data.sharing.streaks },
		{ id: 'share_goals', key: 'social.sharing.goals', on: data.sharing.goals },
		{ id: 'share_xp', key: 'social.sharing.xp', on: data.sharing.xp },
		{ id: 'share_awards', key: 'social.sharing.awards', on: data.sharing.awards }
	]);

	let busy = $state('');
	const submit = (name: string) => () => {
		busy = name;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = '';
		};
	};
</script>

<svelte:head><title>{pageTitle(i18n.t('social.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('social.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('social.title')}</h1>
		<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{i18n.t('social.intro')}</p>
	</header>

	<FeedCard items={data.feed} now={data.now} timeZone={data.user.timezone} />

	<!-- Go: inviteCard -->
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('social.invite.title')}</Card.Title>
			<Card.Description>{i18n.t('social.invite.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-2">
				<Input id="invite-url" value={o.invite.url} readonly class="font-mono text-sm" />
				<CopyButton targetId="invite-url" />
			</div>
			<div class="mt-3 flex flex-wrap gap-2">
				<Button href={data.share.x} target="_blank" variant="outline" size="sm">
					{i18n.t('social.invite.share.x')}
				</Button>
				<Button href={data.share.facebook} target="_blank" variant="outline" size="sm">
					{i18n.t('social.invite.share.facebook')}
				</Button>
			</div>
			{#if o.joined > 0}
				<p class="mt-3 text-sm text-muted-foreground">
					{o.joined === 1
						? i18n.t('social.invite.joined.one')
						: i18n.tf('social.invite.joined.many', o.joined)}
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Go: handleCard -->
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('social.handle.title')}</Card.Title>
			<Card.Description>{i18n.t('social.handle.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action="/app/friends?/handle"
				class="flex items-end gap-2"
				use:enhance={submit('handle')}
			>
				<div class="flex-1 space-y-2">
					<Label for="handle" error={err('handle')}>{i18n.t('social.handle.label')}</Label>
					<Input
						id="handle"
						name="handle"
						value={handleValue}
						placeholder={i18n.t('social.handle.placeholder')}
						aria-invalid={err('handle') ? 'true' : undefined}
					/>
					<FieldError message={err('handle')} />
				</div>
				<Button type="submit" disabled={busy === 'handle'}>{i18n.t('social.save')}</Button>
			</form>
			{#if o.handle}
				<p class="mt-3 text-sm">
					<Button href="/app/u/{encodeURIComponent(o.handle)}" variant="link" size="sm">
						{i18n.t('profile.yours')}
					</Button>
				</p>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.phone.configured || data.phone.number}
		<PhoneCard phone={data.phone} countries={data.countries} form={f} />
	{/if}

	{#if data.facebook.configured || data.facebook.connected}
		<FacebookCard facebook={data.facebook} result={data.facebookResult} />
	{/if}

	<!-- Go: sharingCard -->
	<Card.Root id="sharing" class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('social.sharing.title')}</Card.Title>
			<Card.Description>{i18n.t('social.sharing.desc')}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action="/app/friends?/sharing"
				class="space-y-4"
				use:enhance={submit('sharing')}
			>
				{#each sharing as s (s.id)}
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<Switch id={s.id} name={s.id} checked={s.on} />
							<Label for={s.id}>{i18n.t(s.key)}</Label>
						</div>
					</div>
				{/each}
				<Button type="submit" variant="secondary" disabled={busy === 'sharing'}
					>{i18n.t('social.save')}</Button
				>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Go: followCard -->
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('social.follow.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action="/app/friends?/follow"
				class="flex items-end gap-2"
				use:enhance={submit('follow')}
			>
				<div class="flex-1 space-y-2">
					<Label for="follow" error={err('follow')}>{i18n.t('social.follow.label')}</Label>
					<Input
						id="follow"
						name="follow"
						value={f.follow ?? ''}
						placeholder="@handle"
						aria-invalid={err('follow') ? 'true' : undefined}
					/>
					<FieldError message={err('follow')} />
				</div>
				<Button type="submit" variant="secondary" disabled={busy === 'follow'}
					>{i18n.t('social.follow.ask')}</Button
				>
			</form>
		</Card.Content>
	</Card.Root>

	{#each [{ title: 'social.following.title', empty: 'social.following.empty', list: o.following, following: true }, { title: 'social.followers.title', empty: 'social.followers.empty', list: o.followers, following: false }] as section (section.title)}
		<!-- Go: listCard -->
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t(section.title)}</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if section.list.length === 0}
					<p class="text-sm text-muted-foreground">{i18n.t(section.empty)}</p>
				{:else}
					<ul class="divide-y divide-hairline">
						{#each section.list as c (c.id)}
							<PersonRow person={c}>
								{#if section.following}
									<PostForm action="/app/friends?/unfollow" fields={{ id: c.id }}>
										<Button type="submit" variant="ghost" size="sm"
											>{i18n.t('social.unfollow')}</Button
										>
									</PostForm>
								{:else}
									<PostForm action="/app/friends?/remove" fields={{ id: c.id }}>
										<Button type="submit" variant="ghost" size="sm"
											>{i18n.t('social.remove')}</Button
										>
									</PostForm>
								{/if}
								<PostForm action="/app/friends?/block" fields={{ id: c.id }}>
									<Button type="submit" variant="ghost" size="sm">{i18n.t('social.block')}</Button>
								</PostForm>
							</PersonRow>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>
	{/each}

	{#if o.blocked.length > 0}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('social.blocked.title')}</Card.Title>
			</Card.Header>
			<Card.Content>
				<ul class="divide-y divide-hairline">
					{#each o.blocked as p (p.id)}
						<PersonRow person={p}>
							<PostForm action="/app/friends?/unblock" fields={{ id: p.id }}>
								<Button type="submit" variant="ghost" size="sm">{i18n.t('social.unblock')}</Button>
							</PostForm>
						</PersonRow>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
