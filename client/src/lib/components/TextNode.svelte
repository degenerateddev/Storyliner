<script>
    // https://svelteflow.dev/examples/nodes/connection-limit
    // https://svelteflow.dev/examples/nodes/node-resizer
    // https://svelteflow.dev/examples/nodes/add-node-on-edge-drop
    // https://svelteflow.dev/examples/nodes/update-node
    // https://svelteflow.dev/examples/interaction/validation
    // https://svelteflow.dev/examples/interaction/computing-flows
    // https://svelteflow.dev/examples/interaction/drag-and-drop
</script>

<!-- <div class="container w-fit text-white rounded-md p-5 bg-black border-white border">
    {#if characters.find(character => character.id === text.character)}
        <div class="flex items-center justify-between">
            <div>
                {characters.find(character => character.id === text.character).name}
            </div>
            <div>
                <img src="{characters.find(character => character.id === text.character).avatar}" alt="avatar" />
            </div>
        </div>
    {/if}

    <div class="flex flex-col gap-2">
        {#if text.type === "dialogue"}
            {#each text.steps as step, stepIndex}
                <div class="flex items-center justify-between">
                    <p>{JSON.stringify(step.text)}</p>
                    <input type="text" class="text-black" bind:value={step.text} />
                    <button onclick={() => editNode(step.text, currentLevel, currentSection, textIndex, stepIndex)}>Edit</button>
                </div>
            {/each}
        {:else}
            <p>{JSON.stringify(text.text)}</p>
            <input type="text" class="text-black" bind:value={text.text} />
            <button onclick={() => editNode(text.text, currentLevel, currentSection, textIndex, null)}>Edit</button>   
        {/if}

        <p class="p-2 rounded-full border border-white w-fit">{text.type}</p>
    </div>
</div> -->