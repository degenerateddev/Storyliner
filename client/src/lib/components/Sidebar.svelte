<script>
	import { exportJson, getCharacters, removeFromList, saveJSON, useDnD } from "$lib/utils";
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
            const newList = removeFromList(list, element)

            if (newList) {
                $characters = newList;
                saveJSON("characters", $characters);

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
                        <label class="block text-gray-700 text-sm font-bold">Avatar</label>
                        <input id="cAvatar" class="swal2-file shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="avatar" type="file" accept="image/*">
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
                    "avatar": document.getElementById("cAvatar").value,
                    // @ts-ignore
                    "meta": document.getElementById("cMeta").value
                };
            }
        });

        if (formValues) {
            const name = formValues.name;
            const avatar = formValues.avatar;
            const meta = formValues.meta;

            if (name) {
                const randID = Math.floor(Math.random() * 10000);
                
                $characters.push({ id: randID, name, avatar, meta });
                console.log($characters)
                characters.set($characters);
                saveJSON("characters", $characters);

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

<aside class="flex flex-col">
    <h2 class="text-2xl font-semibold">Characters</h2>
    <div class="flex w-full rounded-md items-center">
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button on:click={toggleCharacterModal} type="button" class="rounded-xl p-4 border-white border w-fit m-5 backdrop-blur-sm bg-black/30 hover:bg-black/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>

        {#each $characters as character}
            <button 
                title={character.description}
                on:click={() => { toggleRemovalModal($characters, character) }}
                class="flex items-center justify-center rounded-xl p-4 border-black border w-fit m-5 backdrop-blur-sm bg-black/30 hover:bg-black/50">
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="text-black font-semibold font-mono rounded-md p-3 cursor-pointer"
                    draggable={true}
                    on:dragstart={(event) => onDragStart(event, character, "text")}
                >
                    {character.name}
                </div>
            </button>
        {/each}

        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button on:click={() => exportJson("characters")} class="rounded-xl w-fit ml-auto p-4 m-5 border-white border backdrop-blur-sm bg-black/30 hover:bg-black/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        </button>
    </div>
</aside>