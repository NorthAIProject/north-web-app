<script lang="ts">
	import AwardsPage from '#lib/features/awards-page/AwardsPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<AwardsPage
	name={data.user.displayName}
	handle={data.awards.handle ?? ''}
	self
	earned={data.awards.earned}
	locked={data.awards.locked}
	monthly={data.awards.monthlyChallenge}
	timeZone={data.user.timezone}
/>
