<script>
  import { onDestroy, setContext } from 'svelte';
  import { writable } from 'svelte/store';
 
  const dndType = writable(null);
  const characters = writable(
      typeof localStorage !== 'undefined' && localStorage.getItem('characters') 
          ? JSON.parse(localStorage.getItem('characters')) 
          : []
  );

  setContext('dnd', dndType);
  setContext('characters', characters);
 
  onDestroy(() => {
    dndType.set(null);
    characters.set([]);
  });
</script>

<slot />