<script>
    import { onDestroy, setContext } from 'svelte';
    import { writable } from 'svelte/store';
   
    const dndType = writable(null);
    const characters = writable([]);
   
    setContext('type', dndType);
    setContext('characters', localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')) : []);
   
    onDestroy(() => {
      dndType.set(null);
      characters.set(localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')) : []);
    });
</script>

<slot />