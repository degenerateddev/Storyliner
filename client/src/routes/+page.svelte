<script>
    import { enhance } from "$app/forms";
	import { onMount } from "svelte";

    export let data;
    const characters = data.characters;
    const json = data.json;
    
    /**
	 * @type {any[]}
	 */
    var levels = [];
    /**
	 * @type {any[]}
	 */
    var sections = [];

    onMount(() => {
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
    })

    function buildNodes() {
        
    }

    let hoveringOverArea = null;

    function dragStart(event, level, section, step) {
        event.dataTransfer.setData("text/plain", JSON.stringify({ level, section, step }));
    }

    function drop(event, level, section, step) {
        event.preventDefault();
        const json = event.dataTransfer.getData("text/plain");
        const data = JSON.parse(json);

        const [item] = levels[level].sections[section].steps.splice(data.step, 1);

        levels[level].sections[section].steps.push(step);

        hoveringOverArea = null;
    }
</script>

<main>
    <div class="flex">
        <div class="flex flex-col bg-blue-400 h-screen">
            <h2>Characters</h2>

            {#each characters as character}
                <div class="flex items-center">
                    <span>{character.name}</span>
                </div>
            {/each}

            <form method="POST" action="?/addCharacter">
                <input type="hidden" name="json" value={JSON.stringify(json)} />
            </form>
        </div>

        <div class="flex flex-col flex-grow">
            <h2>Levels</h2>
            <div class="flex gap-5 justify-start bg-red-400 min-w-full">
                {#each levels as level}
                    <div>
                        <span>{level.name}</span>
                    </div>
                {/each}
            </div>

            <h2>Sections</h2>
            <div class="flex gap-5 justify-start bg-red-400 min-w-full">
                {#each sections as section}
                    <div>
                        <span>{section.id}</span>
                    </div>
                {/each}
            </div>

            <h2>Editor</h2>
            <div class="bg-stone-900" on:dragenter={() => hoveringOverArea = true} on:dragleave={() => hoveringOverArea = false} on:drop={event => drop(event, step)}>

            </div>
        </div>
    </div>

    <form method="POST" action="?/addDialogueData">
        <input type="hidden" name="json" value={JSON.stringify(json)} />
    </form>
</main>