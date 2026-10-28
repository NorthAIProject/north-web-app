<script lang="ts">
	// The "or" rule between alternative sign-in methods and the password form
	// (Go: the divider inside altAuthButtons and SignupPage).
	let { label }: { label: string } = $props();
</script>

<div class="relative py-1">
	<div class="absolute inset-0 flex items-center" aria-hidden="true">
		<div class="w-full border-t border-border"></div>
	</div>
	<div class="relative flex justify-center text-xs uppercase">
		<span class="bg-card px-2 text-muted-foreground">{label}</span>
	</div>
</div>
