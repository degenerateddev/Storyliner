<script>
    import { NodeResizer } from '@xyflow/svelte';
   
    export let data = $$props.data;
    export let selected = $$props.selected;

    const { id, label } = data;
</script>
   
<NodeResizer minWidth={100} minHeight={30} isVisible={selected} color="rgb(255, 64, 0)" />
<div style="padding: 10px">
    <span class="font-semibold font-mono uppercase">{label}</span>
</div>