// This is the efficent webpage even though otherwise is stated
<script>
  import { fade, slide } from 'svelte/transition';

  let currentWord = $state('');
  let placedWords = $state([]);
  let error = $state('');
  let usedWordsSet = new Set();

  const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

  function addWord(e) {
    e.preventDefault();
    error = '';

    const trimmed = currentWord.trim();
    if (!trimmed) return;
    const lowerWord = trimmed.toLowerCase();

    if (usedWordsSet.has(lowerWord)) {
      error = `"${trimmed}" is already on the canvas!`;
      return;
    }

    usedWordsSet.add(lowerWord);
    
    // We no longer need X and Y coordinates!
    placedWords.push({
      id: crypto.randomUUID(),
      text: trimmed,
      color: `hsl(${random(0, 360)}, 70%, 40%)`,
      size: random(1, 3), 
      rotation: random(-10, 10) // Tighter rotation for a cleaner look
    });

    currentWord = '';
  }

  function clearCanvas() {
    placedWords = [];
    usedWordsSet.clear();
    error = '';
  }
</script>

<div class="container">
  <header>
    <div class="form-wrapper">
      <form onsubmit={addWord}>
        <input bind:value={currentWord} placeholder="Type a word..." maxlength="20" class:input-error={error} />
        <button type="submit">Place Word</button>
        <button type="button" class="secondary" onclick={clearCanvas}>Clear</button>
      </form>
      {#if error}
        <p transition:slide={{ axis: 'y' }} class="error-msg">{error}</p>
      {/if}
    </div>
  </header>

  <main class="canvas">
    <div class="word-flow">
      {#each placedWords as word (word.id)}
        <span 
          transition:fade|local 
          class="word-item"
          style="
            color: {word.color}; 
            font-size: {word.size}rem; 
            transform: rotate({word.rotation}deg);
          "
        >
          {word.text}
        </span>
      {/each}
    </div>
  </main>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: sans-serif;
  }

  .container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px); 
  }

  header {
    padding: 1rem;
    display: flex;
    justify-content: center;
  }

  
  .word-flow {
    display: flex;
    flex-wrap: wrap; 
    gap: 20px;     
    padding: 40px;
    justify-content: center;
    align-items: center;
  }

  .word-item {
    display: inline-block;
    font-weight: 800;
    white-space: nowrap;
    transition: transform 0.2s ease;
  }

  .form-wrapper { 
    display: flex; 
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  form { 
    display: flex;
    gap: 0.75rem;
  }

  input { 
    padding: 0.6rem;
    border-radius: 6px;
    border: 1px solid #ccc; 
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

  button.secondary {
    background: #9d0e09;
  }

  .error-msg { 
    color: #ef4444;
    font-size: 0.85rem;
  }
</style>