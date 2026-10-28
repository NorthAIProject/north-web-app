<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import EChart from '#lib/components/khepri/EChart.svelte';
	import KpiCell from '#lib/components/khepri/KpiCell.svelte';
	import KpiStrip from '#lib/components/khepri/KpiStrip.svelte';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import ApprovedCard from '#lib/features/memories/ApprovedCard.svelte';
	import CategoryField from '#lib/features/memories/CategoryField.svelte';
	import PendingCard from '#lib/features/memories/PendingCard.svelte';
	import { buildInstruments, categoryLabel, groupApprovedByCategory } from '#lib/features/memories/view.js';
	import DictateField from '#lib/features/voice/DictateField.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	// Go: web/memories/memories.templ (Page / Panel).
	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	const inst = $derived(buildInstruments(data.pending, data.approved));
	const groups = $derived(groupApprovedByCategory(data.approved));
	const create = $derived(form && 'create' in form ? form.create : undefined);
	const edit = $derived(form && 'edit' in form ? form.edit : undefined);
</script>

<svelte:head><title>{pageTitle(i18n.t('memories.title'))}</title></svelte:head>

<div id="memories-panel" class="mx-auto w-full max-w-6xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={i18n.t('memories.label')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('memories.title')}</h1>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">{i18n.t('memories.intro')}</p>
	</header>

	<KpiStrip>
		<KpiCell label={i18n.t('memories.kpi.pending')} value={String(inst.pendingCount)} />
		<KpiCell label={i18n.t('memories.kpi.approved')} value={String(inst.approvedCount)} />
		<KpiCell
			label={i18n.t('memories.kpi.pinned')}
			value={inst.pinnedCount === 0 ? i18n.t('memories.kpi.none') : String(inst.pinnedCount)}
		/>
	</KpiStrip>

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('memories.donut.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if inst.categoryDonut}
				<EChart id="memories-category-donut" option={inst.categoryDonut} class="min-h-48 w-full max-w-sm mx-auto" />
			{:else}
				<p class="text-muted-foreground text-sm">{i18n.t('memories.donut.empty')}</p>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.pending.length > 0}
		<section class="space-y-3">
			<h2 class="text-sm font-medium">{i18n.t('memories.proposed.title')}</h2>
			{#each data.pending as m (m.id)}
				<PendingCard memory={m} />
			{/each}
		</section>
	{/if}

	<Card.Root class="border-hairline bg-surface">
		<Card.Header>
			<Card.Title>{i18n.t('memories.add.title')}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				method="post"
				action="?/create"
				class="space-y-4"
				use:enhance={({ formElement }) =>
					async ({ result, update }) => {
						await update();
						if (result.type === 'redirect') formElement.reset();
					}}
			>
				<CategoryField id="category" selected={create?.category ?? ''} error={create?.errors?.category ?? ''} />
				<div class="space-y-2">
					<Label for="content" error={create?.errors?.content}>{i18n.t('memories.fact')}</Label>
					<DictateField target="content">
						<Textarea
							id="content"
							name="content"
							rows={3}
							placeholder={i18n.t('memories.add.ph')}
							value={create?.content ?? ''}
							aria-invalid={create?.errors?.content ? true : undefined}
						/>
					</DictateField>
					{#if create?.errors?.content}
						<p class="text-[0.8rem] font-medium text-red-500">{create.errors.content}</p>
					{/if}
				</div>
				<Button type="submit" class="bg-signal text-background hover:bg-signal/90">{i18n.t('memories.add.save')}</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<section class="space-y-6">
		<h2 class="text-sm font-medium">{i18n.t('memories.known.title')}</h2>
		{#if data.approved.length === 0}
			<p class="text-muted-foreground text-sm">{i18n.t('memories.known.empty')}</p>
		{/if}
		{#each groups as group (group.category)}
			<div class="space-y-3">
				<h3 class="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
					{categoryLabel(i18n, group.category)}
				</h3>
				{#each group.items as m (m.id)}
					<ApprovedCard memory={m} edit={edit?.id === m.id ? edit : undefined} />
				{/each}
			</div>
		{/each}
	</section>
</div>
