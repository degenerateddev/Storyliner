<script>
    import { Handle, Position } from '@xyflow/svelte';
   
    export let data;
   
    const { color } = data;
</script>

<div class="colorpicker">
    <Handle type="target" position={Position.Left} />
    <div>
        color: <strong>{$color}</strong>
    </div>
    <input
        class="nodrag"
        type="color"
        on:input={(evt) => data.color.set(evt.target?.value)}
        value={$color}
    />
    <Handle type="source" position={Position.Right} />
</div>