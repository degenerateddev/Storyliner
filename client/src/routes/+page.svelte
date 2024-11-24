<script>
    import { enhance } from "$app/forms";
	import Add from "$lib/components/Add.svelte";
	import Button from "$lib/components/Button.svelte";
	import Input from "$lib/components/Input.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import { onMount } from "svelte";
	import { preventDefault } from "svelte/legacy";

    export let data;
    var characters = data.characters || [];
    var json = data.json || {};
    
    /**
	 * @type {any[]}
	*/
    var levels = [];
    /**
	 * @type {any[]}
	*/
    var sections = [];
    /**
	 * @type {never[]}
	 */
    var dialogues = [];

    var showCharacterModal = false;
    var showDialogueModal = false;
    var newCharacter = { name: '', avatar: '', meta: '' };
    var newDialogue = { steps: [], meta: '' }

    var hoveringOverArea = null;

    onMount(() => {
        if (json) {
            if (json.levels) {
                json.levels = JSON.parse(json.levels);
            } else {
                json.levels = [];
            }

            if (json.sections) {
                json.sections = JSON.parse(json.sections);
            } else {
                json.sections = [];
            }

            buildNodes();
        }
    })

    function buildNodes() {
        
    }

    function addDialogue() {
        if (newDialogue.steps) {
            dialogues.push({ ...newDialogue });
            dialogues = dialogues;
            showDialogueModal = false;
            newDialogue = { name: '', avatar: '', meta: '' };
        }
    }

    function addCharacter() {
        if (newCharacter.name) {
            characters.push({ ...newCharacter });
            characters = characters;
            showCharacterModal = false;
            newCharacter = { name: '', avatar: '', meta: '' };
        }
    }

    function addLevel() {
        const name = prompt("Enter level name");

        if (name) {
            const description = prompt("Enter level description") || "";

            levels.push({ name, description, sections: [] });
            levels = levels;
        }
    }

    function addSection() {
        const name = prompt("Enter section name");

        if (name) {
            const description = prompt("Enter section description") || "";

            sections.push({ name, description, texts: [] });
            sections = sections;
        }
    }

    function exportJson() {
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);
    } 
</script>

<main>
    <button on:click={exportJson} class="fixed bottom-5 right-10 rounded-xl p-4 border-white border backdrop-blur-sm bg-white/30 hover:bg-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    </button>

    <div class="flex gap-5">
        <div class="flex flex-col">
            <h2 class="text-2xl font-semibold">Characters</h2>
            <div class="flex flex-col bg-blue-400 h-screen rounded-md">
                <Add event={() => showCharacterModal = true} />
                {#each characters as character}
                    <div class="flex items-center">
                        <span>{character.name}</span>
                    </div>
                {/each}

                <form method="POST" action="?/addCharacter">
                    <input type="hidden" name="json" value={JSON.stringify(json)} />
                </form>
            </div>
        </div>

        <div class="flex flex-col flex-grow">
            <h2 class="text-2xl font-semibold">Levels</h2>
            <div class="flex gap-5 justify-start bg-teal-400 h-[10vh] rounded-md">
                <Add event={() => addLevel()} />

                {#each levels as level}
                    <div>
                        <span>{level.name}</span>
                    </div>
                {/each}
            </div>

            <h2 class="text-2xl font-semibold">Sections</h2>
            <div class="flex gap-5 justify-start bg-red-400 h-[10vh] rounded-md">
                <Add event={() => addSection()} />

                {#each sections as section}
                    <div>
                        <span>{section.id}</span>
                    </div>
                {/each}
            </div>

            <h2 class="text-2xl font-semibold">Editor</h2>
            <div class="bg-stone-800 w-full h-full rounded-md" on:dragenter={() => hoveringOverArea = true} on:dragleave={() => hoveringOverArea = false} on:drop={event => drop(event, step)}>

            </div>
        </div>
    </div>

    <form method="POST" action="?/addDialogueData">
        <input type="hidden" name="json" value={JSON.stringify(json)} />
    </form>
</main>

<Modal title="Add Character" bind:showModal={showCharacterModal}>
    <form on:submit|preventDefault={addCharacter}>
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="name">Name</label>
            <input bind:value={newCharacter.name} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Character Name" required>
        </div>
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="avatar">Avatar</label>
            <input bind:value={newCharacter.avatar} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="avatar" type="file" accept="image/*">
        </div>
        <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="data">Metadata</label>
            <input bind:value={newCharacter.data} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="data" type="text" placeholder="Character Metadata">
        </div>
        <div class="flex items-center justify-end">
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">Add Character</button>
        </div>
    </form>
</Modal>

<Modal title="Add Dialogue Node" bind:showModal={showDialogueModal}>
    <form on:submit|preventDefault={addDialogue}>

    </form>
</Modal>