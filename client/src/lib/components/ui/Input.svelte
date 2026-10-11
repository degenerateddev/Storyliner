<script>
	/** @type {{ label?: string, value?: string, multiline?: boolean, class?: string, [key: string]: any }} */
	let {
		label,
		value = $bindable(''),
		multiline = false,
		class: className = '',
		...rest
	} = $props();

	const id = $props.id();
	const field =
		'block w-full rounded-lg border border-stone-300 px-3 py-2 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:border-accent-500 focus:ring-accent-500';
</script>

<div class={className}>
	{#if label}
		<label for={id} class="mb-1 block text-sm font-medium text-stone-700">{label}</label>
	{/if}
	{#if multiline}
		<textarea {id} bind:value rows="2" class="{field} resize-none" {...rest}></textarea>
	{:else}
		<input {id} type="text" bind:value class={field} {...rest} />
	{/if}
</div>
