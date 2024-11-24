<script>
	import Button from "$lib/components/Button.svelte";
	import Input from "$lib/components/Input.svelte";

    export let form;
</script>
<main class="container mx-auto">
    {#if form}
        <div class="font-semibold flex justify-center my-10">
            {#if form.success}
                <div class="bg-green-500 text-center w-fit p-5">
                    Successfully logged in!
                </div>
            {/if}
            {#if form.error}
                <div class="bg-rose-500 text-center w-fit p-5">
                    <p>{form.error}</p>
                </div>
            {/if}
        </div>
    {/if}

    <h2 class="text-5xl py-3">Register</h2>
    <form method="POST" action="?/register" class="space-y-5">
        <Input name="username" label="Username" />
        <Input name="email" type="email" label="Email" />
        <Input name="password" label="Password" type="password" />
        <Input name="confirmPassword" label="Confirm password" type="password" />

        <div class="flex justify-end">
            <Button type="submit" label="Register" />
        </div>
    </form>

    <hr class="my-10" />

    <h2 class="text-5xl py-3">Login</h2>
    <form method="POST" action="?/login" class="space-y-5">
        <Input name="username" label="Username" />
        <Input name="password" label="Password" type="password" />

        <div class="flex justify-end">
            <Button type="submit" label="Login" />
        </div>
    </form>
</main>