<script>
	import '../app.css';
	import "@fontsource/bungee-shade";
	import "@fontsource/poppins";

	let { children } = $props();
</script>

<main>
	<div class="flex p-5">
		<div class="flex-grow">
			<div class="flex flex-col justify-between">
				<div class="flex items-center justify-end gap-5">
					<a href="/" class="text-5xl font-light hover:scale-105 duration-100 ease-linear">Write</a>
					<a href="/auth" class="text-5xl font-light hover:scale-105 duration-100 ease-linear">Auth</a>
				</div>
				
				{@render children()}
			</div>
		</div>
	</div>
</main>

<style>
	:global(body, div, p, input, textarea, button) {
		font-family: 'Poppins', sans-serif;
		font-weight: 300;
	}

	:global(h1, h2, h3, h4, h5, h6, a) {
		font-family: 'Bungee Shade', cursive;
	}
</style>