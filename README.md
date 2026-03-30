# NBA Financial Impact Lab

This project contains two Svelte websites that provide the same NBA contract/cap simulation features for 20 teams:

1. `Website 1` at `/efficient`: optimized for lower energy impact.
2. `Website 2` at `/inefficient`: intentionally energy-intensive.

Both versions let you:

1. Scroll and inspect each team's payroll, cap space, tax room, and cap status.
2. Simulate trades and check whether they are feasible under a simplified CBA model.
3. Simulate signing free agents and see if the team can absorb the salary.

## Run Locally

```sh
npm install
npm run dev
```

Production check:

```sh
npm run build
```

## Energy Metrics Used

The app tracks these metrics per session snapshot:

1. `Estimated mWh`: synthetic estimate from measured workload proxies.
2. `Script Time (ms)`: JavaScript processing around simulation and extra work.
3. `Wakeups`: timer callback frequency.
4. `Re-renders`: UI refresh proxy count.
5. `FPS (approx)`: animation frame activity while active.

Formula used in `src/lib/energyTracker.js`:

```txt
estimatedMwh =
	scriptMs * 0.00014 +
	wakeups * 0.00008 +
	reRenders * 0.00004 +
	interactions * 0.00002
```

## Data Collection Workflow

1. Open `/efficient` and run a fixed scenario (same number of trades/signings each run).
2. Click `Capture Energy Snapshot`.
3. Open `/inefficient` and repeat the same scenario.
4. Click `Capture Energy Snapshot`.
5. Return to `/` to view aggregated averages and recent samples.

Snapshots are persisted in browser local storage and can be reset via `Clear Saved Samples` on the home page.

## Bonus Feature

The websites self-report energy proxies via an embedded tracker and surface captured measurements directly in the UI.

This enables side-by-side comparison without external tooling, while still allowing external validation through browser profiling if needed.
