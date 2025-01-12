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

    /* async function toggleSectionModal() {
        const { value: formValues } = await Swal.fire({
            title: "Add Section",
            html: `
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Name</label>
                    <input id="sName" name="name" class="swal2-input shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold">Description</label>
                    <textarea id="sDesc" name="description" class="swal2-textarea shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
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
                    "name": document.getElementById("sName").value,
                    // @ts-ignore
                    "description": document.getElementById("sDesc").value
                };
            }
        });

        if (formValues) {
            Swal.fire(JSON.stringify(formValues));

            const name = formValues.name;
            const description = formValues.description;

            if (name) {
                const randID = Math.floor(Math.random() * 10000);

                sections.push({ id: randID, name, description, texts: [] });
                sections = sections;

                json.levels[currentLevel]["sections"] = sections;
                levels = json.levels;
                json = json;

                saveJSON("json", json);

                Swal.fire({
                    title: "Section Added",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        }
    } */

    import Swal from "sweetalert2";
    import { Handle, Position } from "@xyflow/svelte";
    import { saveJSON } from "$lib/utils";

    export let data = $$props.data;
    let { id, content, label } = data;

    let currentSection = 0;
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
            console.log(json)
            if (json) {
                // @ts-ignore
                json.sections[currentSection].texts.map((text, index) => {
                    if (text.meta.id === id) {
                        json.sections[currentSection].texts[index].data.content = content;
                    }
                });
                // @ts-ignore
                json = json;
                console.log(json)

                saveJSON("json", json);

                console.log(json);

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

<div class="border border-black rounded-md bg-black/10 p-3">
    <p>{data.label}</p>
    <textarea class="nodrag" type="text" value={content} on:input={(event) => {
        handleInput(event);
    }}></textarea>
    <Handle type="target" position={Position.Left} style="background: #555;" isConnectable={true} />
    <Handle type="source" position={Position.Right} style="background: #555;" isConnectable={true} />
</div>