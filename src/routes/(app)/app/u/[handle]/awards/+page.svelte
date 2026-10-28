<script lang="ts">
	import AwardsPage from '#lib/features/awards-page/AwardsPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const p = $derived(data.person);
</script>

<AwardsPage
	name={p.displayName}
	handle={p.handle}
	self={p.self}
	earned={p.earned}
	locked={p.locked}
	monthly={p.monthlyChallenge}
	timeZone={data.user.timezone}
/>
