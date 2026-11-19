<!--
	The clip as a line, with a marker where each issue is visible.

	A marker's shape says how serious it is, so colour is never the only signal:
	a diamond to fix before adding load, a filled dot worth fixing, a ring for a
	minor one. The one gold thing on the page is the marker being looked at.
	The issue cards below stay the full keyboard and screen-reader path; each
	marker is also a button with the whole observation as its name.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { markerLeft, severityBadge, timestamp, type FormIssue } from './view.js';

	let {
		issues,
		durationSeconds,
		currentTime,
		selected,
		onselect
	}: {
		issues: FormIssue[];
		durationSeconds: number;
		currentTime: number;
		selected: number | null;
		onselect: (index: number) => void;
	} = $props();
	const i18n = useI18n();
</script>

<div class="mb-6" data-testid="form-timeline">
	<div class="relative h-8">
		<div class="bg-border absolute inset-x-0 top-1/2 h-px"></div>
		<div
			class="bg-muted-foreground/60 absolute top-1 bottom-1 w-px"
			style:left="{markerLeft(currentTime, durationSeconds)}%"
			aria-hidden="true"
		></div>
		{#each issues as issue, i (i)}
			{@const severity = severityBadge(i18n, issue.severity)}
			<button
				type="button"
				onclick={() => onselect(i)}
				aria-pressed={selected === i}
				aria-label="{timestamp(issue.at)} — {severity.label}: {issue.observation}"
				class="focus-visible:ring-ring absolute top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2"
				style:left="{markerLeft(issue.at, durationSeconds)}%"
			>
				<span
					class={[
						'block transition-transform duration-150 motion-reduce:transition-none',
						issue.severity === 'critical' && 'size-3 rotate-45',
						issue.severity === 'moderate' && 'size-3 rounded-full',
						issue.severity !== 'critical' && issue.severity !== 'moderate' && 'size-2.5 rounded-full border-2',
						selected === i ? 'scale-125' : '',
						issue.severity === 'critical' || issue.severity === 'moderate'
							? selected === i
								? 'bg-signal'
								: 'bg-foreground'
							: selected === i
								? 'border-signal bg-background'
								: 'border-foreground bg-background'
					]}
				></span>
			</button>
		{/each}
	</div>
	<div class="text-muted-foreground flex justify-between font-mono text-xs">
		<span>0:00</span>
		<span>{timestamp(durationSeconds)}</span>
	</div>
</div>
