<script>
	import { exportJson, getCharacters, removeFromList, saveJSON, saveToDB, useDnD } from "$lib/utils";
	import Swal from "sweetalert2";

    var characters = getCharacters();
    const type = useDnD();

    // @ts-ignore
    function onDragStart(event, nodeData, nodeType) {
        if (!event.dataTransfer) {
            return;
        }

        event.dataTransfer.setData("character", JSON.stringify(nodeData));
        type.set(nodeType);
        event.dataTransfer.effectAllowed = "move";
    }

    /**
	 * @param {any} element
	 * @param {any} list
	 */
     async function toggleRemovalModal(list, element) {
        const { value: formValues } = await Swal.fire({
            title: "Remove",
            text: 'Are you sure you want to remove this character?',
            icon: 'warning',
            focusConfirm: false,
            showCancelButton: true,
            showCloseButton: true,
            showConfirmButton: true
        });

        if (formValues) {
            const characterId = element.id;
            const newList = removeFromList(list, element)

            if (newList) {
                $characters = newList;
                saveJSON("characters", $characters);
                saveToDB("actions/characters/", "DELETE", { id: characterId });

                const removed = await saveToDB('actions/characters/', 'DELETE', { id: characterId });

                Swal.fire({
                    title: "Removed",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }

    async function toggleCharacterModal() {
        const { value: formValues } = await Swal.fire({
            title: "Add Character",
            html: `
                <div class="">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold">Name</label>
                        <input id="cName" name="name" class="swal2-input shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold">Meta</label>
                        <textarea id="cMeta" name="meta" class="swal2-textarea shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
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
                    "name": document.getElementById("cName").value,
                    // @ts-ignore
                    "meta": document.getElementById("cMeta").value
                };
            }
        });

        if (formValues) {
            const name = formValues.name;
            const meta = formValues.meta;

            if (name) {
                const randID = Math.floor(Math.random() * 10000);
                
                $characters.push({ id: randID, name, meta });
                
                characters.set($characters);
                saveJSON("characters", $characters);
                saveToDB("actions/characters/", "POST", { id: randID, name, meta });

                Swal.fire({
                    title: "Character Added",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    }
</script>

<aside class="flex flex-col rounded-md p-5">
    <h2 class="text-3xl font-semibold">Characters</h2>
    <hr class="my-5" />
    <div class="flex w-full rounded-md items-center gap-5">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button on:click={toggleCharacterModal} type="button" class="p-5 bg-black border-white text-white rounded-md hover:bg-accent focus:outline-none focus:ring-0 duration-100 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>

        {#each $characters as character}
            <button 
                title={character.description}
                on:click={() => { toggleRemovalModal($characters, character) }}
                class="flex items-center justify-center p-5 w-fit bg-black border-white text-white rounded-md hover:bg-accent focus:outline-none focus:ring-0 duration-100 ease-in-out h-full">
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="font-semibold font-mono rounded-md cursor-pointer"
                    draggable={true}
                    on:dragstart={(event) => onDragStart(event, character, "text")}
                >
                    {character.name}
                </div>
            </button>
        {/each}

        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button on:click={() => exportJson("characters")} class="w-fit ml-auto p-5 bg-black border-white text-white rounded-md hover:bg-accent focus:outline-none focus:ring-0 duration-100 ease-in-out">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        </button>
    </div>
</aside>