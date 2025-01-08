<script>
    import { onDestroy, setContext } from 'svelte';
    import { writable } from 'svelte/store';
   
    const dndType = writable(null);
    const characters = writable(localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')) : []);
   
    setContext('dnd', dndType);
    // @ts-ignore
    setContext('characters', characters);
   
    onDestroy(() => {
      dndType.set(null);
      // @ts-ignore
      //characters.set(localStorage.getItem('characters') ? JSON.parse(localStorage.getItem('characters')) : []);
      characters.set([]);
      console.log(dndType);
      console.log(characters);
    });
</script>

<slot />