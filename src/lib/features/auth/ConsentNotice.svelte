<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';

	// The notice under the signup button (Go: consent() in signup.templ).
	// Weight, sleep, biometrics and journal text are special-category data, so
	// consent is stated where the account is made, not left to a footer link.
	const i18n = useI18n();
</script>

<p class="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
	{i18n.t('auth.consent.agree')}
	<a href="/terms" class="underline underline-offset-4 hover:text-foreground">{i18n.t('auth.consent.terms')}</a>
	{i18n.t('auth.consent.and')}
	<a href="/privacy" class="underline underline-offset-4 hover:text-foreground">{i18n.t('auth.consent.privacy')}</a>
	{i18n.t('auth.consent.health')}
</p>
