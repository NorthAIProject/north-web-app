<script lang="ts">
	// The month's challenge: the coin (locked until met), what to do, and how
	// far along (Go: web/awards MonthlyCard).
	import MonthlyMedal from '#lib/components/khepri/MonthlyMedal.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { coinMonth, type MonthlyChallengeView } from './awards.js';

	let { challenge }: { challenge: MonthlyChallengeView } = $props();
	const i18n = useI18n();
</script>

<Card.Root class="border-hairline bg-surface" id="monthly-challenge">
	<Card.Content class="flex items-center gap-4 pt-6">
		<span class="shrink-0" data-monthly-coin>
			<MonthlyMedal
				month={coinMonth(i18n.locale, challenge.month)}
				target={challenge.target}
				size={64}
				locked={!challenge.met}
				label={challenge.title}
			/>
		</span>
		<div class="min-w-0 flex-1 space-y-2">
			<p class="text-sm font-medium">{challenge.title}</p>
			<p class="text-muted-foreground text-sm">{challenge.goal}</p>
			<Progress value={challenge.progress} max={challenge.target} aria-label={challenge.title} />
			<p class="text-muted-foreground text-xs tabular-nums" data-monthly-progress>
				{challenge.met ? i18n.t('monthly.met') : challenge.progressText}
			</p>
		</div>
	</Card.Content>
</Card.Root>
