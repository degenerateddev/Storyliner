<script>
    // https://svelteflow.dev/examples/nodes/connection-limit
    // https://svelteflow.dev/examples/nodes/node-resizer
    // https://svelteflow.dev/examples/nodes/add-node-on-edge-drop
    // https://svelteflow.dev/examples/nodes/update-node
    // https://svelteflow.dev/examples/interaction/validation
    // https://svelteflow.dev/examples/interaction/computing-flows
    // https://svelteflow.dev/examples/interaction/drag-and-drop
    // https://svelteflow.dev/examples/nodes/custom-node
    // https://svelteflow.dev/examples/layout/subflows

    import Swal from "sweetalert2";
    import { Handle, Position } from "@xyflow/svelte";
    import { saveJSON } from "$lib/utils";

    export let data = $$props.data;
    export let selected = $$props.selected;
    export let parentId = $$props.parentId;

    let { id, content, character } = data;
    /**
	 * @type {number | undefined}
	 */
    let timeout;

    /**
     * @param {{ target: { value: string; }; }} event
     */
    function handleInput(event) {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            let text = event.target.value;
            content = text;

            // @ts-ignore
            let json = JSON.parse(localStorage.getItem('json'));
            if (json) {
                // @ts-ignore

                json.sections = json.sections || [];
                json.sections.find((/** @type {{ id: any; }} */ section) => section.meta.id === parentId).texts.map((text, index) => {
                    if (text.meta.id === id) {
                        json.sections.find((/** @type {{ id: any; }} */ section) => section.meta.id === parentId).texts[index].data.content = content;
                    }
                });
                // @ts-ignore
                json = json;

                saveJSON("json", json);

                Swal.fire({
                    title: "Saved",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1000
                });
            }
        }, 1000); // Adjusted to 1 second
    }
</script>

<div class="rounded-md p-3 bg-black/10 border {selected ? 'border-red-500' : 'border-black'}">
    <p>
        <span class="font-semibold font-mono uppercase">Text</span>
    </p>
    <textarea rows="5" type="text" value={content} on:input={(event) => {
        handleInput(event);
    }}></textarea>
    <Handle type="target" position={Position.Left} style="background: #555;" isConnectable={true} />
    <Handle type="source" position={Position.Right} style="background: #555;" isConnectable={true} />
</div>