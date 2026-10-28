<!--
	One beat of recognition (north-client moment.Card): the mascot celebrating,
	a title, a line. No modal, no confetti, no sound.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import { Card, CardContent } from '#lib/components/ui/card/index.js';
	import Mascot from './Mascot.svelte';
	import type { MomentData } from './types.js';

	let { moment }: { moment: MomentData } = $props();

	const i18n = useI18n();
</script>

<Card class="border-signal/30 bg-signal/5" data-moment={moment.kind}>
	<CardContent class="flex items-center gap-4">
		<Mascot size="md" gesture="celebrate" />
		<div>
			<p class="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">{i18n.t('layout.moment.label')}</p>
			<p class="mt-1 text-lg font-medium tracking-tight">{moment.title}</p>
			<p class="text-muted-foreground mt-1 text-sm">{moment.body}</p>
		</div>
	</CardContent>
</Card>
