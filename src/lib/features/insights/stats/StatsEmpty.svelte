<!-- north-client web/insights/stats.templ statsEmpty: the empty state inside a card. -->
<script lang="ts">
	import { Card, CardContent } from '#lib/components/ui/card/index.js';
	import PanelEmpty from '../PanelEmpty.svelte';

	let { message }: { message: string } = $props();
</script>

<Card class="border-hairline bg-surface">
	<CardContent>
		<PanelEmpty {message} />
	</CardContent>
</Card>
