<script lang="ts">
	import CrewSpace from '#lib/features/crews/CrewSpace.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<CrewSpace {data} {form} />
