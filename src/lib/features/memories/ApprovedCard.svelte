<!--
	One fact the coach uses, with edit / pin / hide / delete (Go:
	memories.approvedCard, and approvedCardEdit when a save came back with
	field errors). Every control is a form posting to a named action on
	/app/memories, so the page works without JavaScript.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import CategoryField from './CategoryField.svelte';
	import { isSuperseded, type Memory } from './view.js';

	type EditForm = { category: string; content: string; errors?: Record<string, string> };

	let { memory: m, edit }: { memory: Memory; edit?: EditForm } = $props();

	const i18n = useI18n();
	let editing = $state(false);
	let deleteOpen = $state(false);
	const superseded = $derived(isSuperseded(m));
	const contentId = $derived(`content-${m.id}`);
</script>

{#snippet hidden()}
	<input type="hidden" name="id" value={m.id} />
{/snippet}

{#snippet action(name: string, label: string)}
	<form method="post" action="?/{name}" use:enhance>
		{@render hidden()}
		<Button type="submit" size="sm" variant="outline">{label}</Button>
	</form>
{/snippet}

{#if edit}
	<Card.Root class="border-hairline border-destructive/40">
		<Card.Content class="space-y-3 py-4">
			<p class="text-sm font-medium">{i18n.t('memories.fix.title')}</p>
			<form method="post" action="?/update" class="space-y-3" use:enhance>
				{@render hidden()}
				<CategoryField id="category-{m.id}" selected={edit.category} error={edit.errors?.category ?? ''} />
				<div class="space-y-2">
					<Label for={contentId} error={edit.errors?.content}>{i18n.t('memories.fact')}</Label>
					<DictateField target={contentId}>
						<Textarea
							id={contentId}
							name="content"
							rows={3}
							value={edit.content}
							aria-invalid={edit.errors?.content ? true : undefined}
						/>
					</DictateField>
					{#if edit.errors?.content}
						<p class="text-[0.8rem] font-medium text-red-500">{edit.errors.content}</p>
					{/if}
				</div>
				<Button type="submit" size="sm" class="bg-signal text-background hover:bg-signal/90">
					{i18n.t('memories.save')}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="border-hairline" data-memory={m.id}>
		<Card.Content class="space-y-3 py-4">
			<div class="flex flex-wrap items-center gap-2">
				{#if m.pinned}
					<Badge variant="outline" class="border-signal/40 bg-signal/12 text-signal">{i18n.t('memories.badge.pinned')}</Badge>
				{/if}
				{#if m.excluded}
					<Badge variant="secondary">{i18n.t('memories.badge.hidden')}</Badge>
				{/if}
				{#if superseded}
					<Badge variant="secondary">{i18n.t('memories.badge.superseded')}</Badge>
				{/if}
			</div>
			{#if superseded}
				<p class="text-xs text-muted-foreground">{i18n.t('memories.superseded.body')}</p>
			{/if}
			<p class="text-sm">{m.content}</p>
			<div class="flex flex-wrap gap-2">
				{#if editing}
					<div class="w-full space-y-3">
						<form
							method="post"
							action="?/update"
							class="space-y-3"
							use:enhance={() =>
								async ({ result, update }) => {
									await update();
									if (result.type === 'redirect') editing = false;
								}}
						>
							{@render hidden()}
							<CategoryField id="category-{m.id}" selected={m.category} />
							<DictateField target={contentId}>
								<Textarea id={contentId} name="content" rows={3} value={m.content} />
							</DictateField>
							<div class="flex flex-wrap gap-2">
								<Button type="submit" size="sm" class="bg-signal text-background hover:bg-signal/90">
									{i18n.t('memories.save')}
								</Button>
								<Button type="button" size="sm" variant="outline" onclick={() => (editing = false)}>
									{i18n.t('memories.cancel')}
								</Button>
							</div>
						</form>
					</div>
				{:else}
					<button
						type="button"
						class="inline-flex min-h-9 items-center rounded-md border border-hairline px-3 text-sm font-medium transition-colors hover:bg-muted"
						onclick={() => (editing = true)}
					>
						{i18n.t('memories.edit')}
					</button>
					<div class="flex flex-wrap gap-2">
						{#if superseded}
							<!-- No pin or hide controls on a retired fact: the context queries filter on
							     validity before they ever look at pinned or excluded. -->
						{:else if !m.excluded}
							{#if m.pinned}
								{@render action('unpin', i18n.t('memories.unpin'))}
							{:else}
								{@render action('pin', i18n.t('memories.pin'))}
							{/if}
							{@render action('exclude', i18n.t('memories.hide'))}
						{:else}
							{@render action('include', i18n.t('memories.include'))}
						{/if}
						<Dialog.Root bind:open={deleteOpen}>
							<Dialog.Trigger class={buttonVariants({ variant: 'ghost', size: 'sm' })}>
								{i18n.t('memories.delete')}
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>{i18n.t('memories.delete.title')}</Dialog.Title>
									<Dialog.Description>{i18n.t('memories.delete.body')}</Dialog.Description>
								</Dialog.Header>
								<Dialog.Footer>
									<Dialog.Close class={buttonVariants({ variant: 'outline' })}>
										{i18n.t('memories.delete.keep')}
									</Dialog.Close>
									<form
										method="post"
										action="?/delete"
										use:enhance={() =>
											async ({ update }) => {
												deleteOpen = false;
												await update();
											}}
									>
										{@render hidden()}
										<Button type="submit" variant="destructive">{i18n.t('memories.delete')}</Button>
									</form>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{/if}
