<script lang="ts">
	import { enhance } from '$app/forms';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { CopyButton } from '#lib/components/ui/copybutton/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import {
		canManage,
		canRemove,
		challengeLabel,
		MAX_MEMBERS,
		memberRole,
		percent,
		toggledRole,
		type CrewBoard
	} from './crew.js';

	// Go: web/crews/crews.templ ChallengePane + challengeCard.
	let { b }: { b: CrewBoard } = $props();
	const i18n = useI18n();

	const kinds = $derived([
		{ value: 'checkins', label: i18n.t('crews.challenge.opt.checkins') },
		{ value: 'workouts', label: i18n.t('crews.challenge.opt.workouts') },
		{ value: 'none', label: i18n.t('crews.challenge.opt.none') }
	]);
	// svelte-ignore state_referenced_locally
	let kind = $state(b.challenge?.kind ?? 'none');
	const kindLabel = $derived(kinds.find((k) => k.value === kind)?.label ?? i18n.t('crews.challenge.choose'));
</script>

<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('crews.board.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{b.name}</h1>
		<p class="text-muted-foreground mt-1 text-sm">{challengeLabel(i18n, b.challenge)}</p>
	</header>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('crews.today')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<ul class="divide-hairline divide-y">
				{#each b.members as m (m.id)}
					<li class="py-3" data-member={m.id}>
						<div class="flex items-center gap-3">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">
									{m.me ? i18n.t('crews.you') : m.displayName}
									{#if m.owner}
										<span class="text-muted-foreground text-xs">· {i18n.t('crews.owner')}</span>
									{:else if memberRole(m) === 'admin'}
										<span class="text-muted-foreground text-xs">· {i18n.t('crews.admin')}</span>
									{/if}
								</p>
								<p class="text-muted-foreground text-xs">{i18n.tf('crews.streak', m.streak)}</p>
							</div>
							{#if m.checkedIn}
								<Badge variant="secondary">{i18n.t('crews.checkedin')}</Badge>
							{:else}
								<Badge variant="outline">{i18n.t('crews.notyet')}</Badge>
							{/if}
							{#if m.workedOut}
								<Badge variant="secondary">{i18n.t('crews.trained')}</Badge>
							{/if}
							{#if b.isOwner && !m.me}
								<form method="post" action="?/role" use:enhance>
									<input type="hidden" name="member" value={m.id} />
									<input type="hidden" name="role" value={toggledRole(memberRole(m))} />
									<Button type="submit" variant="ghost" size="sm">
										{memberRole(m) === 'admin' ? i18n.t('crews.role.remove-admin') : i18n.t('crews.role.make-admin')}
									</Button>
								</form>
							{/if}
							{#if canRemove(b.myRole ?? "", m)}
								<form method="post" action="?/remove" use:enhance>
									<input type="hidden" name="member" value={m.id} />
									<Button type="submit" variant="ghost" size="sm">{i18n.t('crews.remove')}</Button>
								</form>
							{/if}
						</div>
						{#if b.challenge}
							<div class="mt-2 flex items-center gap-3">
								<Progress value={percent(m.weekProgress, b.challenge.target)} class="h-1.5 flex-1" />
								<span class="text-muted-foreground text-xs tabular-nums">{m.weekProgress}/{b.challenge.target}</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</Card.Content>
	</Card.Root>
	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('crews.invite.title')}</Card.Title>
			<Card.Description>{i18n.tf('crews.invite.desc', b.members.length, MAX_MEMBERS)}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-2">
				<Input id="crew-board-url" value={b.joinUrl} readonly class="font-mono text-sm" />
				<CopyButton targetId="crew-board-url" />
			</div>
		</Card.Content>
	</Card.Root>
	{#if canManage(b.myRole)}
		<Card.Root class="border-hairline bg-surface">
			<Card.Header>
				<Card.Title>{i18n.t('crews.challenge.title')}</Card.Title>
			</Card.Header>
			<Card.Content>
				<form method="post" action="?/challenge" class="flex flex-wrap items-end gap-2" use:enhance>
					<div class="space-y-2">
						<Label for="kind">{i18n.t('crews.challenge.what')}</Label>
						<Select.Root type="single" name="kind" bind:value={kind}>
							<Select.Trigger id="kind" class="min-w-40">{kindLabel}</Select.Trigger>
							<Select.Content>
								{#each kinds as k (k.value)}
									<Select.Item value={k.value} label={k.label}>{k.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="space-y-2">
						<Label for="target">{i18n.t('crews.challenge.times')}</Label>
						<Input id="target" name="target" type="number" value={String(b.challenge?.target ?? 3)} min="1" max="7" />
					</div>
					<Button type="submit" variant="secondary">{i18n.t('crews.challenge.set')}</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
	<form method="post" action="?/leave">
		<Button type="submit" variant="ghost">
			{i18n.t('crews.leave')}
		</Button>
	</form>
</div>
