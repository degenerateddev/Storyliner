<script>
    export let title = "Modal";
    export let showModal = false;

    function toggleModal() {
        console.log(showModal);
        showModal = !showModal;
    }
</script>

{#if showModal}
    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold mb-4">{title}</h2>
                <button class="text-black text-xl font-semibold rounded-full focus:outline-none focus:shadow-outline" type="button" on:click={toggleModal}>X</button>
            </div>
            
            <slot />
        </div>
    </div>
{/if}