<script lang="ts">
	import { enhance } from '$app/forms';
	import { pageTitle } from '#lib/brand.js';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { actionVariant, reasonsText } from '#lib/features/moderation/moderation.js';
	import type { PageProps } from './$types';

	// Go: web/moderation/ops.templ OpsPage. English on purpose (an operator tool).
	let { data }: PageProps = $props();
	let busy = $state(false);
	const submit = () => {
		busy = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = false;
		};
	};
</script>

<svelte:head><title>{pageTitle('Moderation')}</title></svelte:head>

<div class="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
	<h1 class="text-2xl font-semibold">Reports</h1>
	<p class="text-muted-foreground text-sm">Open reports, oldest first. Aim to decide each within 24 hours.</p>
	{#if data.reports.length === 0}
		<p class="text-sm">Nothing to review.</p>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>What</Table.Head>
					<Table.Head>Reasons</Table.Head>
					<Table.Head>Since</Table.Head>
					<Table.Head>Decide</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.reports as g (g.kind + g.subjectId)}
					<Table.Row>
						<Table.Cell>
							<div class="max-w-md text-sm break-words whitespace-pre-wrap">{g.excerpt}</div>
							<div class="text-muted-foreground mt-1 flex gap-2 text-xs">
								<span>{g.kind}</span>
								{#if g.hidden}
									<Badge variant="secondary">hidden</Badge>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell>
							<span class="text-sm">{reasonsText(g)}</span>
						</Table.Cell>
						<Table.Cell>
							<span class="text-sm">{formatTime('en', g.firstAt, '2 Jan 15:04', data.user.timezone)}</span>
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap gap-2">
								{#each g.actions as action (action)}
									<form method="post" action="?/decide" use:enhance={submit}>
										<input type="hidden" name="kind" value={g.kind} />
										<input type="hidden" name="subject" value={g.subjectId} />
										<input type="hidden" name="action" value={action} />
										<Button type="submit" size="sm" variant={actionVariant(action)} disabled={busy}>{action}</Button>
									</form>
								{/each}
								{#if g.authorId}
									<form method="post" action="?/suspend" use:enhance={submit}>
										<input type="hidden" name="user" value={g.authorId} />
										<input type="hidden" name="hours" value="0" />
										<Button type="submit" size="sm" variant="destructive" disabled={busy}>suspend author</Button>
									</form>
								{/if}
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}
</div>
