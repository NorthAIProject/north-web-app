<!--
	The monthly challenge coin (north-client medal.MonthlyCoin): gold scalloped
	rim, deep face, the month above centre and the target number centred.
-->
<script lang="ts">
	import Medal from './Medal.svelte';
	import { medalSet, type MedalSet } from './medal.js';
	import type { MonthlyMedalProps } from './types.js';

	let { set = medalSet, month, target, size, locked = false, label }: MonthlyMedalProps & { set?: MedalSet } =
		$props();
</script>

<Medal {set} monthly {month} {target} {size} {locked} {label} />
