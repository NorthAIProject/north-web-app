<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PinIcon from '@lucide/svelte/icons/pin';
	import ReplyIcon from '@lucide/svelte/icons/reply';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { cn } from '#lib/utils.js';
	import { glyph, initials, reactionEmoji, segments, type CrewMessage } from './crew.js';

	// Go: web/crews/messages.templ messageRow, messageActions, MessageEdit.
	// The row is redrawn from the API when the live stream says it changed;
	// the actions only post, as the Go forms did with hx-swap="none".
	let {
		m,
		compact = false,
		me,
		manage,
		timeZone,
		onreact,
		onpin,
		ondelete,
		onreply,
		onreport,
		onblock,
		onsave
	}: {
		m: CrewMessage;
		compact?: boolean;
		me: string;
		manage: boolean;
		timeZone?: string;
		onreact: (emoji: string, on: boolean) => void;
		onpin: (on: boolean) => void;
		ondelete: () => void;
		onreply: () => void;
		onreport: () => void;
		onblock: () => void;
		/** Saves an edit; resolves to the refusal's words, or "" when it was saved. */
		onsave: (body: string) => Promise<string>;
	} = $props();

	const i18n = useI18n();
	const mine = $derived(!!m.author && m.author.id === me);
	const canDelete = $derived(mine || manage);

	let editing = $state(false);
	let draft = $state('');
	let problem = $state('');
	let saving = $state(false);

	function startEdit() {
		draft = m.body ?? '';
		problem = '';
		editing = true;
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		problem = await onsave(draft);
		saving = false;
		if (!problem) editing = false;
	}
</script>

{#if m.kind === 'system'}
	<article id="m-{m.id}" class="text-muted-foreground px-4 py-2 text-center text-xs">{m.body}</article>
{:else if editing}
	<article id="m-{m.id}" class="px-4 py-2">
		<form class="flex flex-col gap-2 pl-12" onsubmit={save}>
			<Textarea
				name="body"
				bind:value={draft}
				rows={2}
				autoResize
				aria-invalid={problem ? 'true' : undefined}
				aria-label={i18n.t('crews.msg.edit')}
			/>
			{#if problem}
				<p class="text-destructive text-xs">{problem}</p>
			{/if}
			<div class="flex gap-2">
				<Button type="submit" size="sm" disabled={saving}>{i18n.t('crews.msg.save')}</Button>
				<Button type="button" variant="ghost" size="sm" onclick={() => (editing = false)}>
					{i18n.t('crews.msg.cancel')}
				</Button>
			</div>
		</form>
	</article>
{:else}
	<article
		id="m-{m.id}"
		class={cn(
			// Touch has no hover, so the actions button always shows there:
			// the row keeps it clear of the text and tall enough for a thumb.
			'group hover:bg-accent/40 relative flex gap-3 px-4 pointer-coarse:min-h-11 pointer-coarse:pr-14',
			compact ? 'pt-0.5' : 'pt-3',
			m.mentionsMe && 'bg-signal/5'
		)}
	>
		<div class="w-9 shrink-0">
			{#if !compact && m.author}
				<Avatar.Root class="size-9">
					<Avatar.Fallback>{initials(m.author.name)}</Avatar.Fallback>
				</Avatar.Root>
			{/if}
		</div>
		<div class="min-w-0 flex-1 pb-1">
			{#if m.replyTo}
				<p class="text-muted-foreground mb-0.5 flex items-center gap-1 truncate text-xs">
					<ReplyIcon class="size-3 shrink-0" />
					{#if m.replyTo.unavailable}
						<span class="italic">{i18n.t('crews.msg.unavailable')}</span>
					{:else}
						<span class="font-medium">{m.replyTo.authorName}</span>
						<span class="truncate">{m.replyTo.excerpt}</span>
					{/if}
				</p>
			{/if}
			{#if !compact && m.author}
				<p class="flex items-baseline gap-2 text-sm">
					<span class="font-medium">{m.author.name}</span>
					<time class="text-muted-foreground text-xs" datetime={m.createdAt}>
						{m.createdAt ? formatTime(i18n.locale, m.createdAt, '15:04', timeZone) : ''}
					</time>
					{#if m.pinned}
						<span class="text-muted-foreground inline-flex items-center gap-1 text-xs">
							<PinIcon class="size-3" />
							{i18n.t('crews.msg.pinned')}
						</span>
					{/if}
				</p>
			{/if}
			{#if m.deleted}
				<p class="text-muted-foreground text-sm italic">{i18n.t('crews.msg.deleted')}</p>
			{:else}
				<p class="text-sm leading-relaxed break-words whitespace-pre-wrap">
					{#each segments(m.body ?? '') as s, i (i)}{#if s.mention}<span class="text-signal font-medium"
								>{s.text}</span
							>{:else}{s.text}{/if}{/each}{#if m.edited}<span class="text-muted-foreground text-xs"
							>{' ' + i18n.t('crews.msg.edited')}</span
						>{/if}
				</p>
				{#if m.reactions && m.reactions.length > 0}
					<div class="mt-1 flex flex-wrap gap-1">
						{#each m.reactions as r (r.emoji)}
							<Button
								type="button"
								variant={r.mine ? 'secondary' : 'outline'}
								size="sm"
								class="h-8 gap-1 rounded-full px-2.5 text-xs pointer-coarse:h-11"
								aria-pressed={r.mine}
								onclick={() => onreact(r.emoji, !r.mine)}
							>
								<span>{glyph(r.emoji)}</span>
								<span class="tabular-nums">{r.count}</span>
							</Button>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
		{#if !m.deleted}
			<!-- Hover reveals it where there is hover; touch sees it at rest, dimmed. -->
			<div
				class="absolute top-1 right-2 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 pointer-coarse:top-0 pointer-coarse:right-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
			>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="size-8 pointer-coarse:size-11"
								aria-label={i18n.t('crews.msg.actions')}
							>
								<EllipsisIcon class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-56">
						<div class="flex flex-wrap gap-0.5 p-1">
							{#each reactionEmoji as e (e.key)}
								<DropdownMenu.Item
									class="size-8 justify-center p-0 text-base"
									aria-label={i18n.tf('crews.react.add', e.glyph)}
									onSelect={() => onreact(e.key, true)}>{e.glyph}</DropdownMenu.Item
								>
							{/each}
						</div>
						<DropdownMenu.Separator />
						{#if m.author}
							<DropdownMenu.Item onSelect={onreply}>{i18n.t('crews.msg.reply')}</DropdownMenu.Item>
						{/if}
						{#if mine}
							<DropdownMenu.Item onSelect={startEdit}>{i18n.t('crews.msg.edit')}</DropdownMenu.Item>
						{/if}
						{#if manage}
							<DropdownMenu.Item onSelect={() => onpin(!m.pinned)}>
								{m.pinned ? i18n.t('crews.msg.unpin') : i18n.t('crews.msg.pin')}
							</DropdownMenu.Item>
						{/if}
						{#if canDelete}
							<DropdownMenu.Item class="text-destructive" onSelect={ondelete}>{i18n.t('crews.msg.delete')}</DropdownMenu.Item>
						{/if}
						{#if !mine && m.author}
							<DropdownMenu.Separator />
							<DropdownMenu.Item onSelect={onreport}>{i18n.t('crews.msg.report')}</DropdownMenu.Item>
							<DropdownMenu.Item class="text-destructive" onSelect={onblock}>
								{i18n.tf('crews.msg.block', m.author.name ?? '')}
							</DropdownMenu.Item>
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/if}
	</article>
{/if}
