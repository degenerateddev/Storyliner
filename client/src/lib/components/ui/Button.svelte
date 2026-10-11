<script>
	/**
	 * @type {{
	 *   variant?: 'primary' | 'secondary' | 'ghost' | 'danger',
	 *   size?: 'sm' | 'md',
	 *   class?: string,
	 *   children: import('svelte').Snippet,
	 *   [key: string]: any
	 * }}
	 */
	let { variant = 'primary', size = 'md', class: className = '', children, ...rest } = $props();

	const variants = {
		primary: 'bg-stone-900 text-white hover:bg-accent-600 focus-visible:ring-accent-500',
		secondary:
			'bg-white text-stone-800 ring-1 ring-inset ring-stone-300 hover:bg-stone-50 focus-visible:ring-accent-500',
		ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-accent-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
	};
	const sizes = { sm: 'h-8 px-2.5 text-sm gap-1.5', md: 'h-10 px-4 text-sm gap-2' };
</script>

<button
	type="button"
	{...rest}
	class="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 {variants[
		variant
	]} {sizes[size]} {className}"
>
	{@render children()}
</button>
