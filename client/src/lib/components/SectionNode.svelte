<script>
    import { Handle, NodeResizer, Position } from '@xyflow/svelte';
   
    export let data = $$props.data;
    export let selected = $$props.selected;

    let width = 500;
    let height = 500;
</script>
   
<NodeResizer bind:minWidth={width} bind:minHeight={height} isVisible={selected} color="rgb(255, 0, 0, 1)" />
<div class="p-5 border border-black" style={`background-color: rgba(255, 0, 0, 0.2); width: ${width}px; height: ${height}px; box-shadow: 4px 4px 0px 0px black;`}>
    <span class="font-semibold font-mono uppercase">{data.label}</span>
</div>