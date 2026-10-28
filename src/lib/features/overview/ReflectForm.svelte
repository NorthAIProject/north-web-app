<!-- Go startReflectionForm: a new reflection thread in the coach (POST /app/chat, kind=reflection). -->
<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
</script>

<form method="post" action="/app/chat?/start">
	<input type="hidden" name="kind" value="reflection" />
	<Button type="submit" variant="outline">{i18n.t('dash.reflect')}</Button>
</form>
