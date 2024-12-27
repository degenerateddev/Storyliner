<script>
    // @ts-nocheck
    
	import { onMount } from "svelte";

    export let characters;
    export let text;
    export let position = "0,0";

    /**
	 * @type {HTMLDivElement}
	 */
    let elem;

    onMount(() => {
        elem.style.position = "absolute";
        elem.style.left = `${position.split(",")[0]}px`;
        elem.style.top = `${position.split(",")[1]}px`;
    });
</script>

<div bind:this={elem} class="container w-fit text-white rounded-md p-5 bg-black border-white border">
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
</div>