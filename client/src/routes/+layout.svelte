<script>
	import '../app.css';
	let { children } = $props();
</script>

<main>
	<div class="flex">
		<div class="flex flex-col">
			<a href="/" class="text-2xl font-bold">New</a>
		</div>

		<div class="flex-grow">
			<div class="flex flex-col justify-between">
				<div class="flex items-center justify-center gap-5">
					<a href="/" class="text-2xl font-bold">Write</a>
					<a href="/auth" class="text-2xl font-bold">Auth</a>
				</div>
				
				{@render children()}
			</div>
		</div>
	</div>
</main>