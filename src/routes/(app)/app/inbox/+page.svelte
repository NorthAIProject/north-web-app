<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { FieldMessage, describedBy, withInvalidFocus } from '#lib/components/ui/field-message/index.js';
	import SearchSelect from '#lib/components/khepri/SearchSelect.svelte';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { suggestionLabel } from '#lib/features/inbox/inbox.js';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const items = $derived(data.inbox.items);
	const goalItems = $derived(data.goals.map((g) => ({ value: g.id, label: g.title })));
	// The goal picked per item, until the page reloads.
	let picked = $state<Record<string, string>>({});
</script>

<svelte:head><title>{pageTitle(i18n.t('inbox.title'))}</title></svelte:head>

<!-- Each filing choice is its own small form with hidden fields, as in Go. -->
<div class="mx-auto w-full max-w-3xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('inbox.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('inbox.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('inbox.intro')}</p>
	</header>

	<Card.Root class="border-hairline bg-surface">
		<Card.Content class="pt-6">
			<form method="post" action="?/add" class="space-y-3" use:enhance={withInvalidFocus()}>
				<div class="space-y-2">
					<Textarea
						id="text"
						name="text"
						rows={3}
						value={form?.text ?? ''}
						placeholder={i18n.t('inbox.ph')}
						aria-label={i18n.t('inbox.text.label')}
						aria-invalid={form?.error ? true : undefined}
						aria-describedby={describedBy('text', form?.error)}
					/>
					<FieldMessage id="text" error={form?.error} />
				</div>
				<Button type="submit">{i18n.t('inbox.save')}</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#if items.length === 0}
		<p class="text-muted-foreground text-sm">{i18n.t('inbox.empty')}</p>
	{:else}
		<p class="text-muted-foreground text-sm">{i18n.tf('inbox.waiting', data.inbox.open)}</p>
	{/if}

	{#each items as it (it.id)}
		<Card.Root class="border-hairline bg-surface" data-inbox-item={it.id}>
			<Card.Content class="space-y-3 pt-6">
				<p class="text-sm whitespace-pre-line">{it.text}</p>
				{#if it.suggestion}
					<p class="text-muted-foreground text-xs">
						{i18n.tf('inbox.suggested', suggestionLabel(i18n, it.suggestion), it.suggestion.why)}
					</p>
					<form method="post" action="?/file" use:enhance>
						<input type="hidden" name="item" value={it.id} />
						<input type="hidden" name="destination" value={it.suggestion.destination} />
						<input type="hidden" name="goal_id" value={it.suggestion.goalId ?? ''} />
						<input type="hidden" name="title" value={it.suggestion.title ?? ''} />
						<Button type="submit" size="sm">{i18n.t('inbox.file_suggested')}</Button>
					</form>
				{:else}
					<p class="text-muted-foreground text-xs">{i18n.t('inbox.pending')}</p>
				{/if}
				<div class="flex flex-wrap items-end gap-2">
					<form method="post" action="?/file" use:enhance>
						<input type="hidden" name="item" value={it.id} />
						<input type="hidden" name="destination" value="journal" />
						<Button type="submit" variant="outline" size="sm">{i18n.t('inbox.dest.journal')}</Button>
					</form>
					<form method="post" action="?/file" use:enhance>
						<input type="hidden" name="item" value={it.id} />
						<input type="hidden" name="destination" value="knowledge" />
						<Button type="submit" variant="outline" size="sm">{i18n.t('inbox.dest.knowledge')}</Button>
					</form>
					{#if data.goals.length > 0}
						<form method="post" action="?/file" class="flex items-end gap-2" use:enhance>
							<input type="hidden" name="item" value={it.id} />
							<input type="hidden" name="destination" value="goal_note" />
							<SearchSelect
								id="goal-{it.id}"
								name="goal_id"
								items={goalItems}
								value={picked[it.id] ?? ''}
								placeholder={i18n.t('inbox.goal_ph')}
								aria-label={i18n.t('inbox.goal_ph')}
								onValueChange={(v) => (picked[it.id] = v)}
							/>
							<Button type="submit" variant="outline" size="sm">{i18n.t('inbox.dest.goal')}</Button>
						</form>
					{/if}
					<form method="post" action="?/dismiss" use:enhance>
						<input type="hidden" name="item" value={it.id} />
						<Button type="submit" variant="ghost" size="sm">{i18n.t('inbox.dismiss')}</Button>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
