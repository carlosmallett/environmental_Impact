
<script>
  import { onMount } from 'svelte';
  import { readEnergySnapshots, clearEnergySnapshots } from '$lib/energyTracker';

  const metrics = [
    {
      name: 'Estimated mWh',
      description: 'Synthetic estimate from script execution time, wakeups, re-renders, and interactions.'
    },
    {
      name: 'Script Time (ms)',
      description: 'Total JavaScript processing time measured around core cap-check logic and extra work.'
    },
    {
      name: 'Wakeups',
      description: 'Timer-driven callbacks. More wakeups generally mean higher CPU residency and energy use.'
    },
    {
      name: 'Re-renders',
      description: 'UI update count proxy. Excessive updates imply more rendering work and battery cost.'
    },
    {
      name: 'FPS (approx)',
      description: 'Animation frame activity sampled while page is active.'
    }
  ];

  let snapshots = $state([]);

  function refresh() {
    snapshots = readEnergySnapshots();
  }

  function clearAll() {
    clearEnergySnapshots();
    refresh();
  }

  function avgFor(variant, field) {
    const rows = snapshots.filter((item) => item.variant === variant);
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => sum + (row[field] ?? 0), 0) / rows.length;
  }

  onMount(refresh);
</script>

<section class="home">
  <header class="hero">
    <h1>NBA Financial Impact Lab</h1>
    <p>
      Compare two sites with identical NBA cap tools: one tuned to minimize energy and one intentionally
      energy-intensive.
    </p>
    <div class="actions">
      <a href="/efficient" class="card-link efficient">Open Website 1: Energy Efficient</a>
      <a href="/inefficient" class="card-link inefficient">Open Website 2: Energy Intensive</a>
    </div>
  </header>

  <div class="content-grid">
    <article class="panel">
      <h2>Energy Metrics To Measure</h2>
      <ul>
        {#each metrics as metric}
          <li>
            <strong>{metric.name}</strong><br />
            {metric.description}
          </li>
        {/each}
      </ul>
    </article>

    <article class="panel">
      <h2>Collected Data</h2>
      <p>Capture snapshots on each simulator page, then compare here.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Variant</th>
              <th>Estimated mWh</th>
              <th>Script ms</th>
              <th>Wakeups</th>
              <th>Re-renders</th>
              <th>FPS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Efficient Avg</td>
              <td>{avgFor('efficient', 'estimatedMwh').toFixed(4)}</td>
              <td>{avgFor('efficient', 'scriptMs').toFixed(1)}</td>
              <td>{avgFor('efficient', 'wakeups').toFixed(0)}</td>
              <td>{avgFor('efficient', 'reRenders').toFixed(0)}</td>
              <td>{avgFor('efficient', 'framesPerSecond').toFixed(1)}</td>
            </tr>
            <tr>
              <td>Inefficient Avg</td>
              <td>{avgFor('inefficient', 'estimatedMwh').toFixed(4)}</td>
              <td>{avgFor('inefficient', 'scriptMs').toFixed(1)}</td>
              <td>{avgFor('inefficient', 'wakeups').toFixed(0)}</td>
              <td>{avgFor('inefficient', 'reRenders').toFixed(0)}</td>
              <td>{avgFor('inefficient', 'framesPerSecond').toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="buttons">
        <button onclick={refresh}>Refresh Data</button>
        <button class="danger" onclick={clearAll}>Clear Saved Samples</button>
      </div>

      <h3>Recent Snapshots</h3>
      <ul class="history">
        {#if snapshots.length === 0}
          <li>No snapshots yet.</li>
        {:else}
          {#each snapshots.slice(0, 12) as shot (`${shot.timestamp}-${shot.variant}`)}
            <li>
              {shot.variant} | {shot.estimatedMwh.toFixed(4)} mWh | {shot.scriptMs.toFixed(1)} ms |
              {new Date(shot.timestamp).toLocaleString()}
            </li>
          {/each}
        {/if}
      </ul>
    </article>
  </div>
</section>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
    background:
      radial-gradient(circle at 20% 10%, #f4d35e 0%, transparent 40%),
      radial-gradient(circle at 90% 90%, #9ad1d4 0%, transparent 35%),
      #f8fafc;
    color: #111827;
  }

  .home {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.1rem;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(1.7rem, 3vw, 2.5rem);
  }

  .hero p {
    font-size: 1.05rem;
    max-width: 72ch;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
    margin-top: 1rem;
  }

  .card-link {
    display: block;
    padding: 1rem;
    border-radius: 0.8rem;
    text-decoration: none;
    font-weight: 700;
    transition: transform 150ms ease;
  }

  .card-link:hover {
    transform: translateY(-2px);
  }

  .card-link.efficient {
    background: #0f766e;
    color: white;
  }

  .card-link.inefficient {
    background: #b42318;
    color: white;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 0.9rem;
    margin-top: 1rem;
  }

  .panel {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #d0d5dd;
    border-radius: 0.8rem;
    padding: 1rem;
  }

  .panel ul {
    padding-left: 1.1rem;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border-bottom: 1px solid #e4e7ec;
    padding: 0.45rem;
    text-align: left;
    font-size: 0.92rem;
  }

  .buttons {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.8rem;
  }

  button {
    border: none;
    padding: 0.55rem 0.8rem;
    border-radius: 0.55rem;
    background: #334155;
    color: white;
    font: inherit;
    cursor: pointer;
  }

  button.danger {
    background: #b42318;
  }

  .history {
    max-height: 180px;
    overflow-y: auto;
    font-size: 0.9rem;
  }

  @media (max-width: 900px) {
    .actions,
    .content-grid {
      grid-template-columns: 1fr;
    }
  }
</style>