<script>
    import { Background, BackgroundVariant, Controls, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
    import TextNode from "./TextNode.svelte";
    import { writable } from "svelte/store";
    import Sidebar from "./Sidebar.svelte";
    import { saveJSON, useDnD } from "$lib/utils";
    import { onMount } from "svelte";
	import Swal from "sweetalert2";
	import SectionNode from "./SectionNode.svelte";

    /* {
        id: '2',
        data: { label: 'Group A' },
        position: { x: 100, y: 100 },
        class: 'light',
        style: 'background-color: rgba(255, 0, 0, 0.2); width: 200px; height: 200px;'
    },
    {
        id: '2a',
        data: { label: 'Node A.1' },
        position: { x: 10, y: 50 },
        parentId: '2'
    }, */

    const nodeTypes = {
        'text': TextNode,
        'section': SectionNode
    }

    const nodes = writable([]);
    const edges = writable([]);
    const snapGrid = [25, 25];
    const type = useDnD();
    const { screenToFlowPosition } = useSvelteFlow();

    onMount(() => {
        const getNodes = () => {
            let json = JSON.parse(localStorage.getItem('json'));
            /**
			 * @type {{ id: any; type: string; data: { id: any; label: string; content: any; } | { id: any; label: any; }; position: { x: number; y: number; } | { x: number; y: number; }; }[]}
			 */
            let extractedNodeInformation = [];

            if (!json) {
                json = {
                    sections: []
                }
                saveJSON("json", json);
            }
            console.log(json);

            json.sections.map((/** @type {{ texts: any[]; meta: { id: any; }; label: any; }} */ section, /** @type {any} */ index) => {
                section.texts.map((text, index) => {
                    const position = text.meta.position.split(',');
                    extractedNodeInformation.push({
                        id: text.meta.id,
                        type: 'text', // text.meta.type
                        data: { id: text.meta.id, label: "Text", content: text.data.content },
                        position: { x: parseFloat(position[0]), y: parseFloat(position[1]) }
                    });
                });
                extractedNodeInformation.push({
                    id: section.meta.id,
                    type: 'section',
                    data: { id: section.meta.id, label: section.label },
                    position: { x: 100, y: 100 }
                })
            });

            console.log(extractedNodeInformation);

            return extractedNodeInformation;
        }

        const getEdges = () => {
            let json = JSON.parse(localStorage.getItem('json'));
            /**
			 * @type {{ id: string; type: string; source: any; target: any; label: string; }[]}
			 */
            let extractedEdgeInformation = [];

            if (json === null) {
                return [];
            }

            json.sections.map((/** @type {{ texts: any[]; }} */ section, /** @type {any} */ index) => {
                section.texts.map((text, index) => {
                    if (text.data.next !== null) {
                        extractedEdgeInformation.push({
                            id: `${text.meta.id}-${text.data.next}`,
                            type: 'default',
                            source: text.meta.id,
                            target: text.data.next,
                            label: 'Next'
                        });
                    }
                })
            });

            return extractedEdgeInformation;
        }
        nodes.set(getNodes());
        edges.set(getEdges());
        console.log($nodes);
        console.log($edges);
    })

    function onNodeDrag({ detail: { targetNode } }) {
        console.log('on node drag', targetNode);
    }

    function onNodeClick({ detail: { node } }) {
        console.log('on node click', node);
    }

    function onDragOver(event) {
        event.preventDefault();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    };

    function onDrop(event, selectedSection) {
        event.preventDefault();
        console.log(selectedSection);

        let json = JSON.parse(localStorage.getItem('json'));
        var groupId;

        const characterData = event.dataTransfer.getData("character");
        if (!characterData) {
            return;
        }

        const character = JSON.parse(characterData);

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
        });

        // Check if there is a "group" node at the drop position
        let groupNode = $nodes.find(node => node.type === 'section' && node.position.x === position.x && node.position.y === position.y);
        console.log(groupNode);
        if (!groupNode) {
            groupId = `section-${$nodes.filter(node => node.type === 'section').length + 1}`;
            groupNode = {
                id: groupId,
                type: 'section',
                position,
                style: 'background-color: rgba(255, 0, 0, 0.2); width: 500px; height: 500px;',
                data: { id: groupId, label: `Section ${$nodes.filter(node => node.type === 'section').length + 1}` }
            };
            nodes.update(n => [...n, groupNode]);

            json.sections.push({
                meta: {
                    id: groupId,
                    position: `${position.x},${position.y}`,
                    type: "section"
                },
                label: `Section ${$nodes.filter(node => node.type === 'section').length}`,
                texts: []
            });
            selectedSection = json.sections.length - 1;
        }

        const randID = Math.floor(Math.random() * 10000);

        const newNode = {
            id: randID.toString(),
            type: "text",
            position,
            parentId: groupId,
            data: { id: randID.toString(), label: "Text", content: "" }
        };

        json.sections.map((/** @type {{ id: any; }} */ section, /** @type {any} */ index) => {
            console.log("Adding text")
            json.sections[selectedSection].texts.push({
                meta: {
                    id: randID.toString(),
                    position: `${position.x},${position.y}`,
                    type: "text"
                },
                data: {
                    character: character.id,
                    content: ""
                },
            });
        });

        json = json;

        nodes.update(n => [...n, newNode]);
        localStorage.setItem('json', JSON.stringify(json));
    }
</script>

<main class="min-h-[100vh] h-full flex flex-col-reverse">
    <SvelteFlow
        {nodeTypes}
        {nodes}
        {edges}
        {snapGrid}
        fitView
        on:nodeclick={onNodeClick}
        on:dragover={onDragOver}
        on:drop={onDrop}
    >
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap />
    </SvelteFlow>
    <Sidebar />
</main>

<style>
    :global(.svelte-flow.intersection-flow .svelte-flow__node.highlight) {
      background-color: #ff0072 !important;
      color: white;
    }

    :global(.svelte-flow.intersection-flow .svelte-flow__node) {
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: 700;
      border-radius: 1px;
      border-width: 2px;
      box-shadow: 6px 6px 0 1px rgba(0, 0, 0, 0.7);
    }

    :global(
        .svelte-flow.intersection-flow .svelte-flow__node.selected,
        .svelte-flow.intersection-flow .svelte-flow__node:hover,
        .svelte-flow.intersection-flow .svelte-flow__node:focus
      ) {
      box-shadow: 6px 6px 0 1px rgba(0, 0, 0, 0.7);
      background-color: #eee;
    }

    :global(.svelte-flow.intersection-flow .svelte-flow__handle) {
      display: none;
    }
</style>