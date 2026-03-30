
<script>
// This is the inefficent webpage even though otherwise is stated
  import { fade } from 'svelte/transition';

  let currentWord = $state('');
  let placedWords = $state([]);

  const random = (min, max) => {
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result = Math.floor(Math.random() * (max - min + 1) + min);
    }
    return result;
  };

  function addWord(e) {
    e.preventDefault();
    const trimmed = currentWord.trim();
    if (!trimmed) return;
    
    // Look for the word in the existing list
    const existingWord = placedWords.find(w => w.text.toLowerCase() === trimmed.toLowerCase());

    if (existingWord) {
        // Just update the size - Svelte 5 handles this reactively!
        existingWord.size += 0.5; 
    } else {
        // Add ALL the properties the HTML template expects
        const newWord = {
          id: crypto.randomUUID(), // Gives every word a unique ID
          text: trimmed,
          size: 2,
          x: random(5, 85),
          y: random(10, 80),
          color: `hsl(${random(0, 360)}, 75%, 45%)`,
          rotation: random(-25, 25)
        };
        
        // Use assignment to trigger the proxy update
        placedWords = [...placedWords, newWord];
    }
    
    currentWord = '';
  }

  function clearCanvas() {
    placedWords = [];
  }
</script>

<div class="container">
  <header>
    <form onsubmit={addWord}>
      <input 
        bind:value={currentWord} 
        placeholder="Type a word..." 
        maxlength="20"
      />
      <button type="submit">Place Word</button>
      <button type="button" class="secondary" onclick={clearCanvas}>Clear</button>
    </form>
  </header>

  <main class="canvas">
    {#each placedWords as word (word.id)}
      <span 
        transition:fade
        class="word-art"
        style:left="{word.x}%"
        style:top="{word.y}%"
        style:color={word.color}
        style:font-size="{word.size}rem"
        style:transform="rotate({word.rotation}deg)"
      >
        {word.text}
      </span>
    {/each}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: #ffffff; /* White Background */
    color: #333; /* Darker text for readability */
    overflow: hidden;
  }

  .container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px); 
    width: 100vw;
  }

  header {
    padding: 1.5rem;
    z-index: 10;
    display: flex;
    justify-content: center;
  }

  form {
    display: flex;
    gap: 0.75rem;
  }

  input {
    padding: 0.6rem 1rem;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: white;
    color: #1a1a1a;
    outline: none;
  }
  
  input:focus {
    border-color: #ff3e00;
  }

  button {
    cursor: pointer;
    background: #ff3e00; 
    color: white;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    transition: filter 0.2s;
  }

  button:hover {
    filter: brightness(1.1);
  }

  button.secondary {
    background: #9d0e09; 
  }

  .canvas {
    flex-grow: 1;
    position: relative;
    width: 100%;
    background: white; /* Ensures canvas is clean white */
  }

  .word-art {
    position: absolute;
    font-weight: 800;
    pointer-events: none;
    white-space: nowrap;
    user-select: none;
    /* Soft shadow to help words pop on white */
    text-shadow: 1px 1px 4px rgba(0,0,0,0.1); 
  }
</style>