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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10 min-h-[35vh]">
        <form method="POST" action="?/register" class="col-span-1 flex flex-col justify-between">
            <div>
                <h2 class="text-5xl py-3">Register</h2>
                <div class="space-y-5">
                    <div class="flex flex-col gap-5">
                        <Input name="username" label="Username" />
                        <Input name="email" type="email" label="Email" />
                        <Input name="password" label="Password" type="password" />
                        <Input name="confirmPassword" label="Confirm password" type="password" />
                    </div>
                </div>
            </div>
            <div>
                <Button type="submit" label="Register" />
            </div>
        </form>

        <form method="POST" action="?/login" class="col-span-1 md:col-span-2 flex flex-col justify-between">
            <div>
                <h2 class="text-5xl py-3">Login</h2>
                <div class="space-y-5">
                    <div class="flex flex-col gap-5">
                        <Input name="username" label="Username" />
                        <Input name="password" label="Password" type="password" />
                    </div>
                </div>
            </div>
            <div>
                <Button type="submit" label="Login" />
            </div>
        </form>
    </div>
</main>