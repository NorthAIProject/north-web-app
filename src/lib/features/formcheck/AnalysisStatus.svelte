<!--
	One description of each analysis state: watching, failed, or the result
	(north-client web/form StatusFragment + result + issueCard). The page polls
	and hands the latest check in; seek moves the clip to an issue's moment.
-->
<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import {
		confidenceBadge,
		inProgress,
		isFailed,
		issuesHeading,
		severityBadge,
		timestamp,
		trustworthy,
		type FormCheck
	} from './view.js';

	let { check, seek }: { check: FormCheck; seek: (seconds: number) => void } = $props();
	const i18n = useI18n();
</script>

<div id="analysis-status">
	{#if inProgress(check)}
		<Card.Root>
			<Card.Content>
				<div class="text-muted-foreground flex items-center gap-3 py-6 text-sm" role="status">
					<span
						class="border-muted-foreground/30 border-t-muted-foreground size-4 motion-safe:animate-spin rounded-full border-2"
					></span>
					{i18n.t('form.status.watching')}
				</div>
			</Card.Content>
		</Card.Root>
	{:else if isFailed(check)}
		<Alert.Root variant="destructive">
			<Alert.Title>{i18n.t('form.status.failed')}</Alert.Title>
			<Alert.Description>{check.error || i18n.t('form.status.failed.desc')}</Alert.Description>
		</Alert.Root>
	{:else if check.result}
		{@const a = check.result}
		{@const confidence = confidenceBadge(i18n, a.confidence)}
		<Card.Root class="mb-4">
			<Card.Header>
				<div class="flex items-center justify-between gap-3">
					<Card.Title class="text-base">{i18n.t('form.result.title')}</Card.Title>
					<Badge variant={confidence.variant}>{confidence.label}</Badge>
				</div>
			</Card.Header>
			<Card.Content>
				<p class="text-muted-foreground text-sm">{a.summary}</p>
			</Card.Content>
		</Card.Root>
		{#if !trustworthy(a)}
			<!-- Low confidence deliberately produces no findings; saying so is the point. -->
			<Alert.Root>
				<Alert.Description>{i18n.t('form.result.unclear')}</Alert.Description>
			</Alert.Root>
		{:else if a.issues.length === 0}
			<Alert.Root>
				<Alert.Description>{i18n.t('form.result.clean')}</Alert.Description>
			</Alert.Root>
		{:else}
			<h2 class="mb-3 text-sm font-medium">
				{issuesHeading(i18n, a.issues.length)}
				<span class="text-muted-foreground font-normal">— {i18n.t('form.result.tap')}</span>
			</h2>
			<div class="space-y-3">
				{#each a.issues as issue, i (i)}
					{@const severity = severityBadge(i18n, issue.severity)}
					<Card.Root>
						<Card.Content>
							<div class="flex items-start gap-3 pt-6">
								<button
									type="button"
									onclick={() => seek(issue.at)}
									class="border-border hover:bg-accent shrink-0 rounded-md border px-2 py-1 font-mono text-xs transition-colors"
								>
									{timestamp(issue.at)}
								</button>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center gap-2">
										<Badge variant={severity.variant}>{severity.label}</Badge>
									</div>
									<p class="text-sm">{issue.observation}</p>
									<p class="text-muted-foreground mt-1 text-sm">{issue.correction}</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	{/if}
</div>
