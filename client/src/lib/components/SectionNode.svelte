<script>
    import { Handle, NodeResizer, Position } from '@xyflow/svelte';
   
    export let data = $$props.data;
    export let selected = $$props.selected;
</script>
   
<NodeResizer minWidth={100} minHeight={30} isVisible={selected} color="rgb(255, 64, 0)" />
<Handle type="target" position={Position.Left} />
<div style="padding: 10px">{data.label}</div>
<Handle type="source" position={Position.Right} />