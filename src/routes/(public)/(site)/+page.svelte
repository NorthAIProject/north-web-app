<!--
	The marketing page (north-client web/landing/page.templ). Its argument is
	continuity rather than capability, so it is built around demonstrations a
	visitor can operate, laid out along a time axis — the bearing line.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import BearingRail from '#lib/features/landing/BearingRail.svelte';
	import ClosingSections from '#lib/features/landing/ClosingSections.svelte';
	import CoachBuildsDemo from '#lib/features/landing/CoachBuildsDemo.svelte';
	import DayDemo from '#lib/features/landing/DayDemo.svelte';
	import GoalDemo from '#lib/features/landing/GoalDemo.svelte';
	import Hero from '#lib/features/landing/Hero.svelte';
	import HeroProof from '#lib/features/landing/HeroProof.svelte';
	import IphoneSection from '#lib/features/landing/IphoneSection.svelte';
	import MuscleDemo from '#lib/features/landing/MuscleDemo.svelte';
	import PageTitle from '#lib/features/landing/PageTitle.svelte';
	import PlatformDemo from '#lib/features/landing/PlatformDemo.svelte';
	import SiteFooter from '#lib/features/landing/SiteFooter.svelte';
	import StatsDemo from '#lib/features/landing/StatsDemo.svelte';
	import ToolsDemo from '#lib/features/landing/ToolsDemo.svelte';
	import { cta as ctaFor } from '#lib/features/landing/cta.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const cta = $derived(ctaFor(Boolean(data.user), i18n.t));
</script>

<PageTitle />

<div data-landing class="relative">
	<BearingRail />
	<Hero {cta} />
	<div class="mx-auto w-full max-w-6xl px-6 lg:pl-28 lg:pr-8">
		<HeroProof />
		<DayDemo />
		<StatsDemo />
		<CoachBuildsDemo />
		<IphoneSection />
		<MuscleDemo />
		<GoalDemo />
		<PlatformDemo />
		<ToolsDemo {cta} />
		<ClosingSections {cta} />
	</div>
	<SiteFooter signedIn={cta.signedIn} />
</div>
