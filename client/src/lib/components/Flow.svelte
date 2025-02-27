<script>
    import { Background, BackgroundVariant, Controls, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
    import TextNode from "./TextNode.svelte";
    import { writable } from "svelte/store";
    import Sidebar from "./Sidebar.svelte";
    import { exportJson, saveJSON, saveToDB, useDnD } from "$lib/utils";
    import { onMount } from "svelte";
	import SectionNode from "./SectionNode.svelte";
	import Swal from "sweetalert2";

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
    const sectionNodeStyle = 'background-color: rgba(216, 30, 91, 0.5); width: 800px; height: 800px; box-shadow: 4px 4px 0px 0px black; border: 1px solid black;';
    const { screenToFlowPosition } = useSvelteFlow();

    onMount(() => {
        const getNodes = () => {
            let json = JSON.parse(localStorage.getItem('json'));
            /**
			 * @type {{ id: any; type: string; data: { id: any; content: any; character: any } | { id: any; label: any; }; position: { x: number; y: number; } | { x: number; y: number; }; }[]}
			 */
            let extractedNodeInformation = [];

            if ((!json) || (json.sections === undefined)) {
                json = {
                    sections: []
                }
                saveJSON("json", json);
                saveToDB("actions/json/", "POST", json);
            }
            
            json.sections = json.sections || [];
            json.sections.map((/** @type {{ texts: any[]; meta: { id: any; }; label: any; }} */ section, /** @type {any} */ index) => {
                const position = section.meta.position.split(',');
                
                // adding section node
                extractedNodeInformation.push({
                    id: section.meta.id,
                    type: 'section',
                    data: { id: section.meta.id, label: section.label },
                    position: { x: parseFloat(position[0]), y: parseFloat(position[1]) },
                    style: sectionNodeStyle
                })
                
                section.texts.map((text, index) => {
                    // adding text nodes
                    const position = text.meta.position.split(',');
                    
                    extractedNodeInformation.push({
                        id: text.meta.id,
                        type: 'text',
                        data: { id: text.meta.id, character: text.data.character, content: text.data.content },
                        position: { x: parseFloat(position[0]), y: parseFloat(position[1]) },
                        parentId: text.meta.parentId
                    });
                });
            });

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

            json.sections = json.sections || [];
            json.sections.map((/** @type {{ texts: any[]; }} */ section, /** @type {any} */ index) => {
                section.texts.map((text, index) => {
                    if (typeof text.data.next === 'string' || typeof text.data.next === 'undefined') {
                        extractedEdgeInformation.push({
                            id: `${text.meta.id}-${text.data.next}`,
                            type: 'default',
                            source: text.meta.id,
                            target: text.data.next,
                            label: 'Next'
                        });
                    } else {
                        text.data.next.map((next, index) => {
                            extractedEdgeInformation.push({
                                id: `${text.meta.id}-${next}`,
                                type: 'default',
                                source: text.meta.id,
                                target: next,
                                label: 'Next'
                            });
                        });
                    }
                })
            });

            return extractedEdgeInformation;
        }
        nodes.set(getNodes());
        edges.set(getEdges());
    })

    function onNodeDrag({ detail: { targetNode } }) {
    }

    function onNodeClick({ detail: { node } }) {
        // make remove button appear right above the node
    }

    function onDragOver(event) {
        event.preventDefault();

        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    };

    function onDrop(event) {
        event.preventDefault();

        let json = JSON.parse(localStorage.getItem('json'));
        /**
         * @type {string}
         */
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

        let selectedSection = null;
        let groupNodes = $nodes.find(node => node.type === 'section');

        // Check if there is a "group" node at the drop position (group nodes have a size of 800x800)
        let groupNode = $nodes.find(node => node.type === 'section' && position.x >= node.position.x && position.x <= node.position.x + 800 && position.y >= node.position.y && position.y <= node.position.y + 800); 

        if (!groupNode) {
            groupId = `section-${Math.floor(Math.random() * 10000)}`;
            groupNode = {
                id: groupId,
                type: 'section',
                position,
                data: { id: groupId, label: `Section ${$nodes.filter(node => node.type === 'section').length + 1}` },
                style: sectionNodeStyle
            };
            // @ts-ignore
            nodes.update(n => [...n, groupNode]);

            json.sections = json.sections || [];
            json.sections.push({
                meta: {
                    id: groupId,
                    position: `${position.x},${position.y}`,
                    type: "section"
                },
                label: `Section ${$nodes.filter(node => node.type === 'section').length}`,
                texts: []
            });
            selectedSection = groupId;
        } else {
            groupId = groupNode.id;
            selectedSection = groupId;
        }

        const randID = Math.floor(Math.random() * 10000);

        // recalculate position relative to group node
        position.x -= groupNode.position.x;
        position.y -= groupNode.position.y;

        const newNode = {
            id: randID.toString(),
            type: "text",
            position,
            parentId: groupId,
            data: { id: randID.toString(), character: character, content: "" }
        };

        json.sections = json.sections || [];
        json.sections.map((/** @type {{ id: any; }} */ section, /** @type {any} */ index) => {
            // @ts-ignore
            let findSection = section.meta.id === selectedSection;

            if (!findSection) {
                return;
            }

            // @ts-ignore
            section.texts.push({
                meta: {
                    id: randID.toString(),
                    position: `${position.x},${position.y}`,
                    type: "text",
                    parentId: groupId
                },
                data: {
                    character: character,
                    content: ""
                },
            });
        });

        json = json;

        nodes.update(n => [...n, newNode]);
        saveJSON("json", json);
        saveToDB("actions/json/", "POST", json);
    }

    function handleConnectEnd(event, connectionState) {
        if (connectionState.isValid) return;

        let json = JSON.parse(localStorage.getItem('json'));

        const sourceNodeId = connectionState.fromNode?.id ?? '1';
        const id = `${Math.floor(Math.random() * 10000)}`;
        const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
        });

        // Check if there is a "group" node at the drop position (group nodes have a size of 800x800)
        let groupId;
        let groupNode = $nodes.find(node => node.type === 'section' && position.x >= node.position.x && position.x <= node.position.x + 800 && position.y >= node.position.y && position.y <= node.position.y + 800); 

        if (!groupNode) {
            groupId = `section-${Math.floor(Math.random() * 10000)}`;
            groupNode = {
                id: groupId,
                type: 'section',
                position,
                data: { id: groupId, label: `Section ${$nodes.filter(node => node.type === 'section').length + 1}` },
                style: sectionNodeStyle
            };
            nodes.update(n => [...n, groupNode]);

            json.sections = json.sections || [];
            json.sections.push({
                meta: {
                    id: groupId,
                    position: `${position.x},${position.y}`,
                    type: "section"
                },
                label: `Section ${$nodes.filter(node => node.type === 'section').length}`,
                texts: []
            });
        } else {
            groupId = groupNode.id;
        }

        // add new text node
        const newNode = {
            id,
            type: "text",
            data: { id, character: connectionState.fromNode.data.character, content: "" },
            position: screenToFlowPosition({
                x: clientX,
                y: clientY
            }),
            parentId: groupId,
            // set the origin of the new node so it is centered
            origin: [0.5, 0.0]
        }

        json.sections.map((section, index) => {
            let findSection = section.meta.id === groupId;

            if (!findSection) {
                return;
            }

            // get edge source node and add edge target node id to data.next property
            const sourceNode = connectionState.fromNode;

            section.texts.push({
                meta: {
                    id,
                    position: `${position.x},${position.y}`,
                    type: "text",
                    parentId: groupId
                },
                data: {
                    character: sourceNode.data.character,
                    content: ""
                },
            });

            json.sections.forEach((sec, secIndex) => {
                sec.texts.forEach((text, textIndex) => {
                    if (text.meta.id === sourceNodeId) {
                        json.sections[secIndex].texts[textIndex].data.next = id;
                    }
                });
            });
        });

        json = json;

        nodes.update(n => [...n, newNode]);
        // @ts-ignore
        edges.update(e => [...e, {
            source: sourceNodeId,
            target: id,
            id: `${sourceNodeId}--${id}`
        }]);

        saveJSON("json", json);
        saveToDB("actions/json/", "POST", json);
    }

    /**
	 * @param {{ source: any; target: any; }} connection
	 */
    function handleConnect(connection) {
        let json = JSON.parse(localStorage.getItem('json'));

        const sourceNodeId = connection.source;
        const targetNodeId = connection.target;

        json.sections.forEach((section, secIndex) => {
            section.texts.forEach((text, textIndex) => {
                if (text.meta.id === sourceNodeId) {
                    // check if data.next is a string or already an array
                    let next = json.sections[secIndex].texts[textIndex].data.next;

                    if (next === undefined || next === null || next === "") {
                        json.sections[secIndex].texts[textIndex].data.next = targetNodeId;

                    } else {
                        json.sections[secIndex].texts[textIndex].data.next = [next, targetNodeId];

                        // @ts-ignore
                        edges.update(e => [...e, {
                            source: sourceNodeId,
                            target: targetNodeId,
                            id: `${sourceNodeId}--${targetNodeId}`
                        }]);
                    }
                }
            });
        });

        json = json;

        saveJSON("json", json);
        saveToDB("actions/json/", "POST", json);
    }

    /**
	 * @param {{ nodes: any[]; }} event
	 */
    function handleDelete(event) {
        let json = JSON.parse(localStorage.getItem('json'));

        event.nodes.forEach(node => {
            json.sections = json.sections || [];

            if (node.type === 'section') {

                json.sections = json.sections.filter(section => section.meta.id !== node.id);
            } else {

                json.sections.map((section, index) => {
                    section.texts = section.texts.filter(text => text.meta.id !== node.id);
                });
            }
        });

        json = json;

        saveJSON("json", json);
        saveToDB("actions/json/", "POST", json);

        Swal.fire({
            title: "Deleted",
            icon: "success",
            showConfirmButton: false,
            timer: 1000
        });
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
        on:drag={onNodeDrag}
        ondelete={handleDelete}
        onconnectend={handleConnectEnd}
        onconnect={handleConnect}
    >
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
        <MiniMap />
    </SvelteFlow>
    <Sidebar />
    
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button on:click={() => exportJson("json")} class="fixed bottom-10 left-10 p-5 bg-black border-white text-white rounded-md hover:bg-accent focus:outline-none focus:ring-0 duration-100 ease-in-out">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="text-white size-12 rotate-180">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    </button>
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