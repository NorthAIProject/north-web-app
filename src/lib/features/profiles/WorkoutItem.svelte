<script lang="ts">
	// A workout card with its name and date above it: the card itself does not
	// name the activity (Go: web/profiles item).
	import WorkoutCard from '#lib/components/khepri/WorkoutCard.svelte';
	import { formatTime } from '#lib/components/khepri/dates.js';
	import { useI18n } from '#lib/i18n/index.js';
	import { toCardData, workoutHref, type WorkoutCardView } from './profile.js';

	let { handle, card, timeZone }: { handle: string; card: WorkoutCardView; timeZone: string } = $props();
	const i18n = useI18n();
</script>

<li class="mt-3 first:mt-0">
	<p class="text-sm">
		<span class="font-medium">{card.name}</span>
		<span class="text-muted-foreground">· {formatTime(i18n.locale, card.endedAt, '2 Jan', timeZone)}</span>
	</p>
	<WorkoutCard card={toCardData(card)} href={workoutHref(handle, card)} />
</li>
