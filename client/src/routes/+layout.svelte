<script>
	import '../app.css';
	let { children } = $props();
</script>

<main>
	<div class="flex p-5">
		<div class="flex-grow">
			<div class="flex flex-col justify-between">
				<div class="flex items-center justify-end gap-5">
					<a href="/" class="text-5xl font-light hover:font-normal">Write</a>
					<a href="/auth" class="text-5xl font-light hover:font-normal">Auth</a>
				</div>
				
				{@render children()}
			</div>
		</div>
	</div>
</main>