<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import BellIcon from '@lucide/svelte/icons/bell';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import HashIcon from '@lucide/svelte/icons/hash';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PinIcon from '@lucide/svelte/icons/pin';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { createQuery } from '@tanstack/svelte-query';
	import { untrack } from 'svelte';
	import { pageTitle } from '#lib/brand.js';
	import { isApiError } from '#lib/api/errors.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { CopyButton } from '#lib/components/ui/copybutton/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import * as crewApi from './api.js';
	import ChallengePane from './ChallengePane.svelte';
	import ChatBody from './ChatBody.svelte';
	import {
		canManage,
		challengeURL,
		channelURL,
		crewURL,
		initials,
		membersLabel,
		muteChoices,
		notifyLevels,
		reportReasons,
		type Crew,
		type CrewBoard,
		type CrewChannel,
		type CrewLiveEvent,
		type CrewMessage,
		type CrewMessagePage,
		type CrewSpace,
		type Tab
	} from './crew.js';
	import { crewKeys, crewQueryClient, spaceQuery, unreadQuery } from './queries.js';
	import { radioClass } from './radio.js';

	// Go: web/crews/space.templ SpacePage — the crews rail, the channel list,
	// and the open channel's chat or the challenge tab, all fed by one live
	// stream for the whole page.
	type SpaceData = {
		tab: Tab;
		space: CrewSpace;
		mine: Crew[];
		channel: CrewChannel;
		board: CrewBoard | null;
		page: CrewMessagePage | null;
		user: { id: string; timezone?: string };
	};
	let { data, form }: { data: SpaceData; form?: { notifyError?: string } | null } = $props();

	const i18n = useI18n();
	const crewID = $derived(data.space.crew.id);

	// The space lives in the query cache: the route load seeds it, and the
	// live stream invalidates it when channels, members or unread counts move.
	const queryClient = crewQueryClient();
	const spaceQ = createQuery(() => ({ ...spaceQuery(crewID), initialData: data.space, staleTime: Infinity }));
	$effect(() => {
		// A fresh route load (navigation, invalidate) is newer than the cache.
		queryClient.setQueryData(crewKeys.space(data.space.crew.id), data.space);
	});
	const space = $derived(spaceQ.data ?? data.space);
	// The rail's dots: the route's counts, then the badge query's as it polls.
	const unreadQ = createQuery(unreadQuery);
	const channels = $derived(space.channels ?? []);
	const members = $derived(space.members ?? []);
	const manage = $derived(canManage(space.myRole));
	const open = $derived(channels.find((c) => c.id === data.channel.id) ?? data.channel);
	const pageURL = $derived(data.tab === 'challenge' ? challengeURL(crewID) : channelURL(crewID, open.id));

	let chat = $state<ReturnType<typeof ChatBody> | null>(null);

	function refreshSpace() {
		queryClient.invalidateQueries({ queryKey: crewKeys.space(crewID) });
	}

	function onLive(ev: CrewLiveEvent) {
		// Whatever arrived may change the unread badge.
		if (ev.type === 'message' || ev.type === 'resync') queryClient.invalidateQueries({ queryKey: crewKeys.unread() });
		switch (ev.type) {
			case 'message':
				if (data.tab === 'chat' && ev.channelId === open.id) chat?.loadNew();
				else refreshSpace();
				break;
			case 'update':
				if (ev.messageId) chat?.refreshMessage(ev.messageId);
				break;
			case 'channels':
				refreshSpace();
				break;
			case 'removed':
				// Only the viewer's own removal reaches here: the server ends the stream.
				window.location.assign('/app/crews');
				break;
			case 'resync':
				resync();
				break;
		}
	}

	/** Re-reads what may have changed while nothing was listening. */
	function resync() {
		refreshSpace();
		if (data.tab === 'chat') chat?.reload();
		else invalidate('north:crew');
	}

	$effect(() => {
		const id = crewID;
		return untrack(() => crewApi.connectLive(id, { event: onLive, reconnected: resync }));
	});

	// Dialogs and sheets.
	let channelsSheet = $state(false);
	let pinsSheet = $state(false);
	let pins = $state<CrewMessage[] | null>(null);
	let termsOpen = $state(false);
	let notifyOpen = $state(false);
	let reportOpen = $state(false);
	let reportID = $state('');
	let reportError = $state('');
	let newChannelOpen = $state(false);
	let editChannelOpen = $state(false);
	let channelError = $state('');

	async function openPins() {
		pins = null;
		pinsSheet = true;
		pins = await crewApi.getPins(crewID, open.id);
	}

	function report(id: string) {
		reportID = id;
		reportError = '';
		reportOpen = true;
	}

	function firstError(err: unknown): string {
		if (isApiError(err)) return Object.values(err.fields)[0] ?? err.message;
		return (err as Error).message;
	}

	async function sendReport(event: SubmitEvent) {
		event.preventDefault();
		const f = new FormData(event.currentTarget as HTMLFormElement);
		try {
			await crewApi.report(crewID, reportID, String(f.get('reason') ?? ''), String(f.get('note') ?? ''));
		} catch (err) {
			reportError = firstError(err);
			return;
		}
		// The message disappears for the reporter right away.
		chat?.drop(reportID);
		(event.currentTarget as HTMLFormElement).reset();
		reportOpen = false;
	}

	async function createChannel(event: SubmitEvent) {
		event.preventDefault();
		const f = new FormData(event.currentTarget as HTMLFormElement);
		try {
			const ch = await crewApi.createChannel(crewID, String(f.get('name') ?? ''), String(f.get('topic') ?? ''));
			newChannelOpen = false;
			await goto(channelURL(crewID, ch.id), { invalidate: ['north:crew'] });
		} catch (err) {
			channelError = firstError(err);
		}
	}

	async function saveChannel(event: SubmitEvent) {
		event.preventDefault();
		const f = new FormData(event.currentTarget as HTMLFormElement);
		try {
			await crewApi.updateChannel(crewID, open.id, String(f.get('name') ?? ''), String(f.get('topic') ?? ''));
			editChannelOpen = false;
			await invalidate('north:crew');
		} catch (err) {
			channelError = firstError(err);
		}
	}

	async function deleteChannel(event: SubmitEvent) {
		event.preventDefault();
		try {
			await crewApi.deleteChannel(crewID, open.id);
			editChannelOpen = false;
			await goto(crewURL(crewID), { invalidate: ['north:crew'] });
		} catch (err) {
			channelError = firstError(err);
		}
	}

	const unreadElsewhere = (c: Crew) => {
		const live = unreadQ.data?.crews.find((u) => u.crewId === c.id);
		return (unreadQ.data ? (live?.unread ?? 0) : (c.unread ?? 0)) > 0 && c.id !== crewID;
	};
</script>

<svelte:head><title>{pageTitle(space.crew.name)}</title></svelte:head>

<div id="crew-live" class="flex h-full min-h-0">
	<!-- rail: every crew the viewer is in, the open one ringed -->
	<nav
		class="border-border hidden w-16 shrink-0 flex-col items-center gap-2 border-r py-3 lg:flex"
		aria-label={i18n.t('crews.title')}
	>
		{#each data.mine as c (c.id)}
			<a href={crewURL(c.id)} class="relative" title={c.name} aria-label={c.name}>
				<Avatar.Root
					class={cn('size-10', c.id === crewID && 'ring-primary ring-offset-background ring-2 ring-offset-2')}
				>
					<Avatar.Fallback>{initials(c.name)}</Avatar.Fallback>
				</Avatar.Root>
				{#if unreadElsewhere(c)}
					<Badge class="absolute -top-0.5 -right-0.5 size-3 rounded-full p-0" />
				{/if}
			</a>
		{/each}
		<Button
			href="/app/crews"
			variant="ghost"
			size="icon"
			class="size-10 rounded-full"
			aria-label={i18n.t('crews.start.title')}
		>
			<PlusIcon class="size-4" />
		</Button>
	</nav>
	<aside class="border-border hidden w-60 shrink-0 flex-col border-r lg:flex">
		{@render channelColumn(true)}
	</aside>
	<section id="crew-pane" class="flex min-w-0 flex-1 flex-col">
		<header class="border-border flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				class="size-9 lg:hidden"
				aria-label={i18n.t('crews.channels')}
				onclick={() => (channelsSheet = true)}
			>
				<MenuIcon class="size-4" />
			</Button>
			<div class="min-w-0 flex-[1_1_8rem]">
				{#if data.tab === 'chat'}
					<h1 class="flex items-center gap-1 truncate text-sm font-medium">
						<HashIcon class="size-4 opacity-60" />
						{open.name}
					</h1>
					{#if open.topic}
						<p class="text-muted-foreground truncate text-xs">{open.topic}</p>
					{/if}
				{:else}
					<h1 class="truncate text-sm font-medium">{space.crew.name}</h1>
				{/if}
			</div>
			<!-- The chat and the challenge are separate pages, so these are links styled as tab triggers. -->
			<nav class="bg-muted text-muted-foreground inline-flex h-9 items-center rounded-lg p-1 text-sm">
				<a
					href={channelURL(crewID, open.id)}
					class={cn('rounded-md px-3 py-1', data.tab === 'chat' && 'bg-background text-foreground shadow-sm')}
					aria-current={data.tab === 'chat' ? 'page' : undefined}>{i18n.t('crews.tab.chat')}</a
				>
				<a
					href={challengeURL(crewID)}
					class={cn('rounded-md px-3 py-1', data.tab === 'challenge' && 'bg-background text-foreground shadow-sm')}
					aria-current={data.tab === 'challenge' ? 'page' : undefined}>{i18n.t('crews.tab.challenge')}</a
				>
			</nav>
			{#if data.tab === 'chat'}
				<Button type="button" variant="ghost" size="icon" class="size-9" aria-label={i18n.t('crews.pins')} onclick={openPins}>
					<PinIcon class="size-4" />
				</Button>
				{#if manage}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						class="size-9"
						aria-label={i18n.t('crews.channel.edit')}
						onclick={() => {
							channelError = '';
							editChannelOpen = true;
						}}
					>
						<PencilIcon class="size-4" />
					</Button>
				{/if}
			{/if}
			<span class="text-muted-foreground hidden items-center gap-1 text-xs sm:inline-flex">
				<UsersIcon class="size-3.5" />
				{membersLabel(i18n, members.length)}
			</span>
		</header>
		{#if data.tab === 'chat' && data.page}
			{#key open.id}
				<ChatBody
					bind:this={chat}
					{crewID}
					channel={open}
					initial={data.page}
					me={data.user.id}
					{manage}
					timeZone={data.user.timezone}
					onreport={report}
					onterms={() => (termsOpen = true)}
				/>
			{/key}
		{:else if data.board}
			<div class="min-h-0 flex-1 overflow-y-auto">
				<ChallengePane b={data.board} />
			</div>
		{/if}
	</section>
</div>

<Sheet.Root bind:open={channelsSheet}>
	<Sheet.Content side="left" class="flex w-72 flex-col gap-0">
		{@render channelColumn(false)}
	</Sheet.Content>
</Sheet.Root>

<Sheet.Root bind:open={pinsSheet}>
	<Sheet.Content side="right" class="flex w-80 flex-col">
		<Sheet.Header>
			<Sheet.Title>{i18n.t('crews.pins')}</Sheet.Title>
		</Sheet.Header>
		<div id="crew-pins-body" class="min-h-0 flex-1 overflow-y-auto">
			{#if pins && pins.length === 0}
				<p class="text-muted-foreground p-4 text-sm">{i18n.t('crews.pins.none')}</p>
			{:else if pins}
				{#each pins as m (m.id)}
					<div class="border-border border-b px-4 py-3">
						{#if m.author}<p class="text-sm font-medium">{m.author.name}</p>{/if}
						<p class="text-sm break-words whitespace-pre-wrap">{m.body}</p>
					</div>
				{/each}
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- The crew rules, asked for before a first post. Accepting returns to this page. -->
<Dialog.Root bind:open={termsOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{i18n.t('moderation.terms.title')}</Dialog.Title>
			<Dialog.Description>{i18n.t('moderation.terms.body')}</Dialog.Description>
		</Dialog.Header>
		<form method="post" action="?/terms">
			<Dialog.Footer>
				<Button type="submit">{i18n.t('moderation.terms.agree')}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- One dialog for every message: a row's Report hands it the id. -->
<Dialog.Root bind:open={reportOpen}>
	<Dialog.Content>
		<form class="flex flex-col gap-4" onsubmit={sendReport}>
			<Dialog.Header>
				<Dialog.Title>{i18n.t('crews.report.title')}</Dialog.Title>
				<Dialog.Description>{i18n.t('crews.report.desc')}</Dialog.Description>
			</Dialog.Header>
			<fieldset class="flex flex-col gap-2">
				{#each reportReasons as reason, i (reason)}
					<div class="flex items-center gap-2">
						<input
							type="radio"
							id="crew-report-{reason}"
							name="reason"
							value={reason}
							checked={i === 0}
							class={radioClass}
						/>
						<Label for="crew-report-{reason}">{i18n.t('crews.report.reason.' + reason)}</Label>
					</div>
				{/each}
			</fieldset>
			<div class="space-y-2">
				<Label for="crew-report-note">{i18n.t('crews.report.note')}</Label>
				<Textarea id="crew-report-note" name="note" rows={2} />
			</div>
			<div id="crew-report-error" class="text-destructive text-xs" role="alert">
				{#if reportError}<p>{reportError}</p>{/if}
			</div>
			<Dialog.Footer>
				<Button type="submit" variant="destructive">{i18n.t('crews.report.send')}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={notifyOpen}>
	<Dialog.Content>
		<form
			method="post"
			action="?/notify"
			class="flex flex-col gap-4"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'redirect') notifyOpen = false;
					await update();
				}}
		>
			<Dialog.Header>
				<Dialog.Title>{i18n.t('crews.notify.title')}</Dialog.Title>
			</Dialog.Header>
			<fieldset class="flex flex-col gap-2">
				{#each notifyLevels as n (n)}
					<div class="flex items-center gap-2">
						<input
							type="radio"
							id="crew-notify-{n}"
							name="notify"
							value={n}
							checked={space.notify === n}
							class={radioClass}
						/>
						<Label for="crew-notify-{n}">{i18n.t('crews.notify.' + n)}</Label>
					</div>
				{/each}
			</fieldset>
			<fieldset class="flex flex-col gap-2">
				<legend class="mb-1 text-sm font-medium">{i18n.t('crews.notify.mute')}</legend>
				{#each muteChoices as m (m)}
					<div class="flex items-center gap-2">
						<input type="radio" id="crew-mute-{m}" name="mute" value={m} checked={m === 'off'} class={radioClass} />
						<Label for="crew-mute-{m}">{i18n.t('crews.notify.mute.' + m)}</Label>
					</div>
				{/each}
			</fieldset>
			{#if form?.notifyError}
				<p class="text-destructive text-xs" role="alert">{form.notifyError}</p>
			{/if}
			<Dialog.Footer>
				<Button type="submit">{i18n.t('crews.notify.save')}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

{#if manage}
	<Dialog.Root bind:open={newChannelOpen}>
		<Dialog.Content>
			<form class="flex flex-col gap-4" onsubmit={createChannel}>
				<Dialog.Header>
					<Dialog.Title>{i18n.t('crews.channel.new')}</Dialog.Title>
				</Dialog.Header>
				{@render channelFields('crew-new-channel', '', '', false)}
				<div id="crew-new-channel-error" class="text-destructive text-xs" role="alert">
					{#if channelError}<p>{channelError}</p>{/if}
				</div>
				<Dialog.Footer>
					<Button type="submit">{i18n.t('crews.channel.create')}</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
	{#if data.tab === 'chat'}
		<Dialog.Root bind:open={editChannelOpen}>
			<Dialog.Content>
				<form class="flex flex-col gap-4" onsubmit={saveChannel}>
					<Dialog.Header>
						<Dialog.Title>{i18n.t('crews.channel.edit')}</Dialog.Title>
					</Dialog.Header>
					{@render channelFields('crew-edit-channel', open.name ?? '', open.topic ?? '', !!open.default)}
					<div id="crew-edit-channel-error" class="text-destructive text-xs" role="alert">
						{#if channelError}<p>{channelError}</p>{/if}
					</div>
					<Dialog.Footer>
						<Button type="submit">{i18n.t('crews.channel.save')}</Button>
					</Dialog.Footer>
				</form>
				{#if !open.default}
					<form class="mt-2" onsubmit={deleteChannel}>
						<Button type="submit" variant="ghost" class="text-destructive">{i18n.t('crews.channel.delete')}</Button>
					</form>
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{/if}

{#snippet channelFields(prefix: string, name: string, topic: string, fixedName: boolean)}
	<div class="space-y-2">
		<Label for="{prefix}-name">{i18n.t('crews.channel.name')}</Label>
		<Input id="{prefix}-name" name="name" value={name} readonly={fixedName} maxlength={30} required />
	</div>
	<div class="space-y-2">
		<Label for="{prefix}-topic">{i18n.t('crews.channel.topic')}</Label>
		<Input id="{prefix}-topic" name="topic" value={topic} maxlength={120} />
	</div>
{/snippet}

<!-- The crew's name and menu over its channels. The sheet's copy (live = false) is plain links. -->
{#snippet channelColumn(live: boolean)}
	<div class="border-border flex h-14 shrink-0 items-center gap-1 border-b px-3">
		<p class="min-w-0 flex-1 truncate text-sm font-medium">{space.crew.name}</p>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size="icon" class="size-8" aria-label={i18n.t('crews.menu')}>
						<EllipsisIcon class="size-4" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-72">
				<DropdownMenu.Item onSelect={() => (notifyOpen = true)}>
					<span class="flex items-center gap-2">
						<BellIcon class="size-4" />
						{i18n.t('crews.notify.title')}
					</span>
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Label>{i18n.t('crews.invite.link')}</DropdownMenu.Label>
				<div class="flex items-center gap-1 px-2 pb-2">
					<Input id={live ? 'crew-url' : 'crew-url-sheet'} value={space.crew.joinUrl} readonly class="h-8 font-mono text-xs" />
					<CopyButton targetId={live ? 'crew-url' : 'crew-url-sheet'} />
				</div>
				<DropdownMenu.Separator />
				<form method="post" action="?/leave">
					<DropdownMenu.Item class="text-destructive">
						{#snippet child({ props })}
							<button {...props} type="submit">
								<span class="flex items-center gap-2">
									<LogOutIcon class="size-4" />
									{i18n.t('crews.leave')}
								</span>
							</button>
						{/snippet}
					</DropdownMenu.Item>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="min-h-0 flex-1 overflow-y-auto">
		<div class="text-muted-foreground flex items-center justify-between px-4 pt-3 text-xs font-medium tracking-wide uppercase">
			<span>{i18n.t('crews.channels')}</span>
			{#if manage}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					class="size-6"
					aria-label={i18n.t('crews.channel.new')}
					onclick={() => {
						channelError = '';
						channelsSheet = false;
						newChannelOpen = true;
					}}
				>
					<PlusIcon class="size-3.5" />
				</Button>
			{/if}
		</div>
		<nav
			id={live ? 'crew-channels' : undefined}
			class="flex flex-col gap-0.5 px-2 py-2"
			aria-label={i18n.t('crews.channels')}
		>
			{#each channels as ch (ch.id)}
				{@const current = ch.id === open.id}
				{#if live}
					<a
						href={channelURL(crewID, ch.id)}
						class={cn(
							'hover:bg-accent/60 flex min-h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors',
							current && 'bg-accent text-foreground font-medium',
							!current && !ch.unread && 'text-muted-foreground',
							!current && !!ch.unread && 'text-foreground font-medium'
						)}
						aria-current={current ? 'page' : undefined}
					>
						<HashIcon class="size-4 shrink-0 opacity-60" />
						<span class="min-w-0 flex-1 truncate">{ch.name}</span>
						{#if (ch.mentions ?? 0) > 0}
							<Badge variant="destructive" class="h-5 min-w-5 justify-center px-1 tabular-nums">@{ch.mentions}</Badge>
						{:else if (ch.unread ?? 0) > 0 && !current}
							<Badge variant="secondary" class="h-5 min-w-5 justify-center px-1 tabular-nums">{ch.unread}</Badge>
						{/if}
					</a>
				{:else}
					<a
						href={channelURL(crewID, ch.id)}
						class={cn('hover:bg-accent/60 flex min-h-11 items-center gap-2 rounded-md px-2 text-sm', current && 'bg-accent font-medium')}
						onclick={() => (channelsSheet = false)}
					>
						<HashIcon class="size-4 shrink-0 opacity-60" />
						<span class="min-w-0 flex-1 truncate">{ch.name}</span>
					</a>
				{/if}
			{/each}
		</nav>
	</div>
{/snippet}
