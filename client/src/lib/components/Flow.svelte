<script>
    // @ts-nocheck

	import { Background, BackgroundVariant, Controls, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
	import TextNode from "./TextNode.svelte";
	import ColorPickerNode from "./ColorPickerNode.svelte";
	import { writable } from "svelte/store";
	import Sidebar from "./Sidebar.svelte";
	import { useDnD } from "$lib/utils";

    const nodeTypes = {
        // @ts-ignore
        'text': TextNode,
        // @ts-ignore
        'color': ColorPickerNode
    }

    // @ts-ignore
    const nodes = writable([
        {
            id: '1',
            type: 'text',
            // @ts-ignore
            data: { color: writable('#00ff00') },
            position: { x: 0, y: 0 }
        },
        {
            id: '2',
            type: 'input',
            data: { label: 'Node' },
            position: { x: 0, y: 150 }
        },
        {
            id: '3',
            type: 'group',
            data: { label: 'Parent' },
            position: { x: 200, y: 0 },
            style: 'width: 200px; height: 200px;'
        },
        {
            id: '4',
            data: { label: 'child 1' },
            position: { x: 25, y: 5 },
            parentId: '3',
            extent: 'parent'
        },
        {
            id: '5',
            data: { label: 'child 2' },
            position: { x: 25, y: 100 },
            parentId: '3',
            extent: 'parent'
        },
    ]);
    // @ts-ignore
    const edges = writable([
        {
            id: '1-2',
            type: 'default',
            source: '4',
            target: '5',
            label: 'Edge Text'
        }
    ]);
    const snapGrid = [25, 25];
    // @ts-ignore
    const type = useDnD();
    // @ts-ignore
    const { screenToFlowPosition } = useSvelteFlow();
    
    // @ts-ignore
    function onNodeDrag({ detail: { targetNode } }) {
        console.log('on node drag', targetNode);
    }

    // @ts-ignore
    function onNodeClick({ detail: { node } }) {
        console.log('on node click', node);
    }

    /**
	 * @param {{ preventDefault: () => void; dataTransfer: { dropEffect: string; }; }} event
	 */
    function onDragOver(event) {
        event.preventDefault();
    
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    };

    // @ts-ignore
    function onDrop(event) {
        event.preventDefault();

        if (!$type) {
            return;
        }

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY
        })

        const newNode = {
            id: Math.random().toString(),
            type: $type,
            position,
            data: { label: `${type} node` },
            origin: [0.5, 0.0]
        }
        $nodes.push(newNode);
        $nodes = $nodes;

        const character = JSON.parse(event.dataTransfer.getData("character"));
        // @ts-ignore
        console.log(currentLevel)
        // @ts-ignore
        console.log(currentSection)
        // @ts-ignore
        console.log(json);
        console.log(character);
        // @ts-ignore
        console.log(json.levels[currentLevel].sections[currentSection]);
        // @ts-ignore
        json.levels[currentLevel].sections[currentSection].texts.push({ character, text: '', type: "jabbering" });
        // @ts-ignore
        json = json;
        // @ts-ignore
        console.log(json);
    }
</script>

<main class="h-full flex flex-col-reverse">
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