<script>
	import Swal from "sweetalert2";

    // https://svelteflow.dev/examples/nodes/connection-limit
    // https://svelteflow.dev/examples/nodes/node-resizer
    // https://svelteflow.dev/examples/nodes/add-node-on-edge-drop
    // https://svelteflow.dev/examples/nodes/update-node
    // https://svelteflow.dev/examples/interaction/validation
    // https://svelteflow.dev/examples/interaction/computing-flows
    // https://svelteflow.dev/examples/interaction/drag-and-drop

    async function toggleTextModal() {
        /* {#each newDialogue.steps as step}
            <div class="mb-4">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="block text-gray-700 text-sm font-bold  ">Meta</label>
                <textarea bind:value={newDialogue.meta} name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
            </div>

            <div class="mb-4">
                <!-- svelte-ignore a11y_label_has_associated_control -->
                <label class="block text-gray-700 text-sm font-bold  ">Step</label>
                <input bind:value={step} name="step" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
        {/each}
        
        <div class="flex items-center justify-end">
            <button 
                on:click={() => addText(json.currentLevel["sections"]["section_" + currentSection]["texts"])} 
                type="button"
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Add Character
            </button>
        </div> */
        const { value: formValues } = await Swal.fire({
            title: "Add Text",
            html: `
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Meta</label>
                    <textarea id="tMeta" name="meta" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Step</label>
                    <input name="tText" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Type</label>
                    <select id="type" name="type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <option value="dialogue">Dialogue</option>
                        <option value="jabbering">Jabbering</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            showCloseButton: true,
            showLoaderOnConfirm: true,
            showConfirmButton: true,
            preConfirm: () => {
                return {
                    // @ts-ignore
                    "type": document.getElementById("type").value,
                    // @ts-ignore
                    "text": document.getElementById("tText").value,
                    // @ts-ignore
                    "meta": document.getElementById("tMeta").value
                };
            }
        });

        if (formValues) {
            const type = formValues.type;
            const text = formValues.text;
            const meta = formValues.meta;

            if (type) {
                json.levels[currentLevel].sections[currentSection].texts.push({ character: characters[0], text, type });
                json = json;

                saveJSON("json", json);

                Swal.fire({
                    title: "Text Added",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }
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