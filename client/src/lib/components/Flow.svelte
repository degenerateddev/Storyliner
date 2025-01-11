<script>
    // @ts-nocheck

    import { Background, BackgroundVariant, Controls, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
    import TextNode from "./TextNode.svelte";
    import ColorPickerNode from "./ColorPickerNode.svelte";
    import { writable } from "svelte/store";
    import Sidebar from "./Sidebar.svelte";
    import { useDnD, getLevelAndSection } from "$lib/utils";
    import { getContext, onMount } from "svelte";
	import Swal from "sweetalert2";

    let level_section = JSON.parse(localStorage.getItem('level_section'));
    let currentLevel = level_section.level;
    let currentSection = level_section.section;

    const nodeTypes = {
        'text': TextNode,
        'color': ColorPickerNode
    }

    const nodes = writable([]);
    const edges = writable([]);
    const snapGrid = [25, 25];
    const type = useDnD();
    const { screenToFlowPosition } = useSvelteFlow();

    onMount(() => {
        const getNodes = () => {
            let json = JSON.parse(localStorage.getItem('json'));
            let extractedNodeInformation = [];

            json.levels.map((level, index) => {
                if (level.id === currentLevel) {
                    level.sections.map((section, index) => {
                        if (section.id === currentSection) {
                            section.texts.map((text, index) => {
                                const position = text.meta.position.split(',');
                                extractedNodeInformation.push({
                                    id: text.meta.id,
                                    type: 'text', // text.meta.type
                                    data: { id: text.meta.id, label: "Text", content: text.data.content },
                                    position: { x: parseFloat(position[0]), y: parseFloat(position[1]) }
                                });
                            });
                        }
                    });
                }
            });

            return extractedNodeInformation;
        }

        const getEdges = () => {
            let json = JSON.parse(localStorage.getItem('json'));
            let extractedEdgeInformation = [];

            json.levels.map((level, index) => {
                if (level.id === currentLevel) {
                    level.sections.map((section, index) => {
                        if (section.id === currentSection) {
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
                        }
                    })
                }
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

    function onDrop(event) {
        event.preventDefault();

        let json = JSON.parse(localStorage.getItem('json'));
        let canAdd = false;

        // check if currentLevel and currentSection exist in json.levels
        json.levels.filter((level, index) => {
            if (level.id === currentLevel) {
                level.sections.filter((section, index) => {
                    if (section.id === currentSection) {
                        canAdd = true;
                    }
                });
            }
        });

        if (!canAdd) {
            Swal.fire({
                title: "Select a level and section first",
                icon: "error",
                showConfirmButton: false,
                timer: 1000
            });

            return;
        }

        const characterData = event.dataTransfer.getData("character");
        if (!characterData) {
            return;
        }

        const character = JSON.parse(characterData);

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
        });
        const randID = Math.floor(Math.random() * 10000);

        const newNode = {
            id: randID.toString(),
            type: "text",
            position,
            data: { id: randID.toString(), label: "Text", content: "" }
        };

        json.levels.map((level, index) => {
            console.log(level.id)
            console.log(currentLevel)
            if (level.id === currentLevel) {
                json.levels[currentLevel].sections.map((section, index) => {
                    console.log(section.id)
                    console.log(currentSection)
                    if (section.id === currentSection) {
                        console.log("Adding text")
                        json.levels[currentLevel].sections[currentSection].texts.push({
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
                    }
                });
            }
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