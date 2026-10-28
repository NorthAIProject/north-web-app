<!--
	The attribution CC BY-SA 4.0 requires on any page showing exercise artwork
	(north-client exerciseart.Credit). Rendering the frames without it is a
	licence breach.
-->
<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
</script>

<p class="text-muted-foreground text-xs">
	{i18n.t('layout.art.credit.by')}
	<a href="https://bryllim.com" class="underline underline-offset-2" target="_blank" rel="noopener noreferrer">Bryl Lim</a>
	{i18n.t('layout.art.credit.and')}
	<a href="https://github.com/everkinetic/data" class="underline underline-offset-2" target="_blank" rel="noopener noreferrer"
		>Everkinetic</a
	>,
	{i18n.t('layout.art.credit.licensed')}
	<a href="https://creativecommons.org/licenses/by-sa/4.0/" class="underline underline-offset-2" target="_blank" rel="noopener noreferrer"
		>CC BY-SA 4.0</a
	>.
</p>
