<script>
    // @ts-nocheck

	import { getContext, onMount } from "svelte";
	import { writable } from "svelte/store";
	import Swal from "sweetalert2";
    import { Handle, Position } from "@xyflow/svelte";

    // https://svelteflow.dev/examples/nodes/connection-limit
    // https://svelteflow.dev/examples/nodes/node-resizer
    // https://svelteflow.dev/examples/nodes/add-node-on-edge-drop
    // https://svelteflow.dev/examples/nodes/update-node
    // https://svelteflow.dev/examples/interaction/validation
    // https://svelteflow.dev/examples/interaction/computing-flows
    // https://svelteflow.dev/examples/interaction/drag-and-drop
    // https://svelteflow.dev/examples/nodes/custom-node

    export let data = $$props.data;
    let { id, content, label } = data;

    let level_section = JSON.parse(localStorage.getItem('level_section'));
    let currentLevel = level_section.level;
    let currentSection = level_section.section;

    /**
	 * @param {{ target: { value: string; }; }} event
	 */
    function handleInput(event) {
        let text = event.currentTarget.value;
        content = text;

        // @ts-ignore
        let json = JSON.parse(localStorage.getItem('json'));
        console.log(json)
        if (json) {
            // @ts-ignore
            json.levels[currentLevel].sections[currentSection].texts.map((text, index) => {
                if (text.meta.id === $id) {
                    json.levels[currentLevel].sections[currentSection].texts[index].data.content = text;
                }
            });
            // @ts-ignore
            json = json;
            console.log(json)

            localStorage.setItem('json', JSON.stringify(json));
        }
    }
</script>

<div>
    <p>{data.label}</p>
    <textarea class="nodrag" type="text" value={content} on:input={(event) => {
        handleInput(event);
    }}></textarea>
    <Handle type="target" position={Position.Left} style="background: #555;" isConnectable={true} />
    <Handle type="source" position={Position.Right} style="background: #555;" isConnectable={true} />
</div>