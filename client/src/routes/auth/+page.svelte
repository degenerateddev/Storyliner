<script>
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();

	// svelte-ignore state_referenced_locally
	let mode = $state(form?.mode === 'register' ? 'register' : 'login');
	let pending = $state(false);

	/** @type {import('@sveltejs/kit').SubmitFunction} */
	const submit = () => {
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	};

	const tabs = /** @type {const} */ ([
		['login', 'Log in'],
		['register', 'Create account']
	]);
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Log in' : 'Create account'} · Storyliner</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-stone-100 p-4">
	<div class="w-full max-w-sm">
		<h1 class="mb-1 text-center font-display text-4xl text-accent-600">Storyliner</h1>
		<p class="mb-8 text-center text-sm text-stone-500">Write branching dialogue for your game.</p>

		<div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
			<div class="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1" role="tablist">
				{#each tabs as [value, label] (value)}
					<button
						type="button"
						role="tab"
						aria-selected={mode === value}
						onclick={() => (mode = value)}
						class="rounded-md py-1.5 text-sm font-medium transition-colors {mode === value
							? 'bg-white text-stone-900 shadow-sm'
							: 'text-stone-500 hover:text-stone-800'}"
					>
						{label}
					</button>
				{/each}
			</div>

			{#if form?.error && form.mode === mode}
				<p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{form.error}
				</p>
			{/if}

			{#if mode === 'login'}
				<form method="POST" action="?/login" use:enhance={submit} class="space-y-4">
					<Input
						name="username"
						label="Username"
						value={form?.username ?? ''}
						autocomplete="username"
						required
					/>
					<Input
						name="password"
						label="Password"
						type="password"
						autocomplete="current-password"
						required
					/>
					<Button type="submit" class="w-full" disabled={pending}
						>{pending ? 'Logging in…' : 'Log in'}</Button
					>
				</form>
			{:else}
				<form method="POST" action="?/register" use:enhance={submit} class="space-y-4">
					<Input
						name="username"
						label="Username"
						value={form?.username ?? ''}
						autocomplete="username"
						required
					/>
					<Input
						name="email"
						label="Email"
						type="email"
						value={form?.email ?? ''}
						autocomplete="email"
						required
					/>
					<Input
						name="password"
						label="Password"
						type="password"
						autocomplete="new-password"
						required
					/>
					<Input
						name="confirmPassword"
						label="Confirm password"
						type="password"
						autocomplete="new-password"
						required
					/>
					<Button type="submit" class="w-full" disabled={pending}>
						{pending ? 'Creating account…' : 'Create account'}
					</Button>
				</form>
			{/if}
		</div>
	</div>
</main>
