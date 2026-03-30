<script>
	import { onDestroy, onMount } from 'svelte';
	import {
		NBA_TEAMS_20,
		FREE_AGENTS,
		normalizeLeague,
		buildTeamSnapshot,
		checkFreeAgentSigning,
		checkTrade,
		SALARY_CAP_M,
		LUXURY_TAX_LINE_M,
		FIRST_APRON_M,
		SECOND_APRON_M
	} from '$lib/nbaData';
	import { createEnergyTracker, persistEnergySnapshot } from '$lib/energyTracker';

	let { mode = 'efficient' } = $props();

	// mode is a static prop — no reactive derivation needed (efficient: plain const)
	const isInefficient = mode === 'inefficient';
	const tracker = createEnergyTracker(mode);
	const initialLeague = normalizeLeague(NBA_TEAMS_20);

	let league = $state(initialLeague);
	let selectedTeamId = $state(initialLeague[0].id);
	let partnerTeamId = $state(initialLeague[1].id);
	let tradeOutgoingFromSelected = $state(15);
	let tradeOutgoingFromPartner = $state(12);
	let freeAgentSalary = $state(FREE_AGENTS[0].salaryM);
	let lastResult = $state('Try a move to see if it works under the cap.');
	let transactions = $state([]);
	let energySnapshot = $state(null);
	let backgroundNodes = $state([]);
	let renderPulse = $state(0);

	let rafId;
	let wasteInterval;

	function trackScript(fn) {
		const start = performance.now();
		const result = fn();
		tracker.recordScript(performance.now() - start);
		return result;
	}

	function updateTeamPayroll(teamId, nextPayroll) {
		if (isInefficient) {
			// Inefficient: serialize + deserialize the entire league on every single payroll change
			const cloned = JSON.parse(JSON.stringify(league));
			league = normalizeLeague(
				cloned.map((team) =>
					team.id === teamId ? { ...team, payrollM: Number(nextPayroll.toFixed(2)) } : team
				)
			);
		} else {
			// Efficient: only recompute the cap snapshot for the one team that actually changed
			league = league.map((team) =>
				team.id === teamId
					? buildTeamSnapshot({ ...team, payrollM: Number(nextPayroll.toFixed(2)) })
					: team
			);
		}
		tracker.recordRender();
	}

	function selectedTeam() {
		return league.find((team) => team.id === selectedTeamId) ?? league[0];
	}

	function partnerTeam() {
		if (partnerTeamId === selectedTeamId) {
			const fallback = league.find((team) => team.id !== selectedTeamId);
			if (fallback) partnerTeamId = fallback.id;
		}
		return league.find((team) => team.id === partnerTeamId) ?? league[1];
	}

	function doSignFreeAgent() {
		tracker.markInteraction();
		const team = selectedTeam();
		const result = trackScript(() => checkFreeAgentSigning(team, Number(freeAgentSalary)));
		lastResult = result.reason;

		if (result.possible) {
			updateTeamPayroll(team.id, result.nextPayroll);
			const newTx = { type: 'Signing', team: team.name, details: `Signed FA for $${Number(freeAgentSalary).toFixed(1)}M` };
			// Inefficient: unbounded array growth causes GC pressure over time
			// Efficient: capped at 10 entries — constant memory footprint
			transactions = isInefficient ? [newTx, ...transactions] : [newTx, ...transactions].slice(0, 10);
		}
	}

	function doTrade() {
		tracker.markInteraction();
		const teamA = selectedTeam();
		const teamB = partnerTeam();
		if (!teamA || !teamB || teamA.id === teamB.id) {
			lastResult = 'Choose two different teams.';
			return;
		}

		const result = trackScript(() =>
			checkTrade(teamA, teamB, Number(tradeOutgoingFromSelected), Number(tradeOutgoingFromPartner))
		);
		lastResult = result.reason;

		if (result.possible) {
			updateTeamPayroll(teamA.id, result.newPayrollA);
			updateTeamPayroll(teamB.id, result.newPayrollB);
			const newTx = {
				type: 'Trade',
				team: `${teamA.name} <-> ${teamB.name}`,
				details: `$${Number(tradeOutgoingFromSelected).toFixed(1)}M for $${Number(tradeOutgoingFromPartner).toFixed(1)}M`
			};
			transactions = isInefficient ? [newTx, ...transactions] : [newTx, ...transactions].slice(0, 10);
		}
	}

	function captureEnergy() {
		energySnapshot = tracker.snapshot();
		persistEnergySnapshot(energySnapshot);
	}

	onMount(() => {
		const animate = () => {
			tracker.recordFrame();
			rafId = requestAnimationFrame(animate);
		};
		rafId = requestAnimationFrame(animate);

		if (isInefficient) {
			backgroundNodes = Array.from({ length: 80 }, (_, i) => ({
				id: i,
				x: (i * 37) % 100,
				y: (i * 53) % 100,
				size: (i % 7) + 8
			}));

			wasteInterval = setInterval(() => {
				tracker.recordWakeup();
				trackScript(() => {
					let pointless = 0;
					for (let i = 0; i < 180000; i += 1) {
						pointless += Math.sqrt(i % 11) * Math.sin(i);
					}
					// Layout thrashing: reading geometry (offsetHeight) after a pending style
					// change forces the browser to synchronously flush its layout queue.
					// Interleaving reads and writes repeats this on every tick.
					const cards = document.querySelectorAll('.team-card');
					let totalH = 0;
					cards.forEach((c) => { totalH += c.offsetHeight; }); // read → forces layout flush
					backgroundNodes = backgroundNodes.map((node, index) => ({					// write
						...node,
						x: (node.x + ((index % 3) + 0.4)) % 100,
						y: (node.y + ((index % 5) + 0.2)) % 100
					}));
					cards.forEach((c) => { void c.scrollHeight; }); // read after write → second forced reflow
					renderPulse = pointless + totalH;
				});
				tracker.recordRender();
			}, 80);
		}

		return () => captureEnergy();
	});

	onDestroy(() => {
		if (rafId) cancelAnimationFrame(rafId);
		if (wasteInterval) clearInterval(wasteInterval);
	});
</script>

<section class="shell" class:inefficient={isInefficient}>
	<header class="hero">
		<div>
			<h1>NBA Contract And Cap Simulator</h1>
			<p>
				20 teams, current payroll snapshots, and hypothetical transactions to test cap feasibility.
			</p>
		</div>
		<div class="cap-lines">
			<span>Cap: ${SALARY_CAP_M.toFixed(1)}M</span>
			<span>Tax: ${LUXURY_TAX_LINE_M.toFixed(1)}M</span>
			<span>1st Apron: ${FIRST_APRON_M.toFixed(1)}M</span>
			<span>2nd Apron: ${SECOND_APRON_M.toFixed(1)}M</span>
		</div>
	</header>

	{#if isInefficient}
		<div class="fx-layer" aria-hidden="true">
			{#each backgroundNodes as node (node.id)}
				<div
					class="orb"
					style:left="{node.x}%"
					style:top="{node.y}%"
					style:width="{node.size}px"
					style:height="{node.size}px"
				></div>
			{/each}
		</div>
	{/if}

	<div class="grid">
		<article class="panel controls">
			<h2>Hypothetical Moves</h2>
			<label>
				Selected Team
				<select bind:value={selectedTeamId}>
					{#each league as team (team.id)}
						<option value={team.id}>{team.name}</option>
					{/each}
				</select>
			</label>

			<label>
				Trade Partner
				<select bind:value={partnerTeamId}>
					{#each league as team (team.id)}
						{#if team.id !== selectedTeamId}
							<option value={team.id}>{team.name}</option>
						{/if}
					{/each}
				</select>
			</label>

			<div class="row">
				<label>
					Selected Outgoing ($M)
					<input type="number" min="0" step="0.1" bind:value={tradeOutgoingFromSelected} />
				</label>
				<label>
					Partner Outgoing ($M)
					<input type="number" min="0" step="0.1" bind:value={tradeOutgoingFromPartner} />
				</label>
			</div>

			<button onclick={doTrade}>Test + Apply Trade</button>

			<div class="row">
				<label>
					Free Agent Salary ($M)
					<select bind:value={freeAgentSalary}>
						{#each FREE_AGENTS as fa (fa.name)}
							<option value={fa.salaryM}>{fa.name} ({fa.salaryM.toFixed(1)}M)</option>
						{/each}
					</select>
				</label>
				<button onclick={doSignFreeAgent}>Sign Free Agent</button>
			</div>

			<p class="result">{lastResult}</p>

			<div class="energy-box">
				<h3>Built-In Energy Tracker</h3>
				<p>
					This captures run-time metrics and stores snapshots for comparison on the home page.
				</p>
				<button class="secondary" onclick={captureEnergy}>Capture Energy Snapshot</button>
				{#if energySnapshot}
					<ul>
						<li>Elapsed: {energySnapshot.elapsedSec.toFixed(1)}s</li>
						<li>Script: {energySnapshot.scriptMs.toFixed(1)}ms</li>
						<li>Wakeups: {energySnapshot.wakeups}</li>
						<li>Re-renders: {energySnapshot.reRenders}</li>
						<li>Estimated Use: {energySnapshot.estimatedMwh.toFixed(4)} mWh</li>
					</ul>
				{/if}
			</div>
		</article>

		<article class="panel team-list">
			<h2>20-Team Financial Board</h2>
			<div class="teams">
				{#if isInefficient}
					<!-- Inefficient: no key → Svelte reconciles all 20 nodes by position on every
					     league update, destroying and recreating mismatched DOM nodes -->
					{#each league as team}
						<div class="team-card" class:selected={team.id === selectedTeamId}>
							<h3>{team.name}</h3>
							<p>Payroll: ${team.payrollM.toFixed(1)}M</p>
							<p>Cap Space: ${team.capSpaceM.toFixed(1)}M</p>
							<p>Tax Room: ${team.taxRoomM.toFixed(1)}M</p>
							<p>Status: {team.status}</p>
						</div>
					{/each}
				{:else}
					<!-- Efficient: keyed by team.id → Svelte patches only the one changed card -->
					{#each league as team (team.id)}
						<div class="team-card" class:selected={team.id === selectedTeamId}>
							<h3>{team.name}</h3>
							<p>Payroll: ${team.payrollM.toFixed(1)}M</p>
							<p>Cap Space: ${team.capSpaceM.toFixed(1)}M</p>
							<p>Tax Room: ${team.taxRoomM.toFixed(1)}M</p>
							<p>Status: {team.status}</p>
						</div>
					{/each}
				{/if}
			</div>
		</article>

		<article class="panel log">
			<h2>Transaction Log</h2>
			{#if transactions.length === 0}
				<p>No transactions yet.</p>
			{:else}
				<ul>
					{#each transactions as tx, index (`${tx.type}-${index}`)}
						<li>
							<strong>{tx.type}:</strong> {tx.team}<br />
							<small>{tx.details}</small>
						</li>
					{/each}
				</ul>
			{/if}
			{#if isInefficient}
				<p class="pulse">Background pulse: {renderPulse.toFixed(2)}</p>
			{/if}
		</article>
	</div>
</section>

<style>
	:global(body) {
		margin: 0;
		font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
		background: #f3f4f6;
		color: #101828;
	}

	.shell {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.2rem;
		position: relative;
	}

	.hero {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: end;
		margin-bottom: 1rem;
	}

	.hero h1 {
		margin: 0;
		font-size: clamp(1.2rem, 2vw, 1.9rem);
	}

	.hero p {
		margin: 0.35rem 0 0;
		max-width: 60ch;
	}

	.cap-lines {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.cap-lines span {
		background: #e4e7ec;
		padding: 0.35rem 0.55rem;
		border-radius: 0.5rem;
		font-size: 0.85rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1.1fr 1.4fr 1fr;
		gap: 0.9rem;
	}

	.panel {
		background: #ffffff;
		border: 1px solid #d0d5dd;
		border-radius: 0.85rem;
		padding: 0.9rem;
		position: relative;
		z-index: 2;
	}

	.panel h2 {
		margin-top: 0;
	}

	label {
		display: block;
		font-size: 0.86rem;
		margin-bottom: 0.55rem;
	}

	input,
	select,
	button {
		width: 100%;
		box-sizing: border-box;
		margin-top: 0.2rem;
		padding: 0.55rem;
		border-radius: 0.55rem;
		border: 1px solid #98a2b3;
		font: inherit;
	}

	button {
		border: none;
		background: #006d77;
		color: white;
		cursor: pointer;
		font-weight: 600;
	}

	button.secondary {
		background: #475467;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem;
	}

	.result {
		background: #ecfdf3;
		border: 1px solid #abefc6;
		padding: 0.55rem;
		border-radius: 0.55rem;
	}

	.teams {
		max-height: 62vh;
		overflow-y: auto;
		display: grid;
		gap: 0.5rem;
	}

	.team-card {
		padding: 0.7rem;
		border: 1px solid #d0d5dd;
		border-radius: 0.6rem;
		background: #f8fafc;
	}

	/* Efficient: CSS containment limits layout/style recalculation scope to within each
	   card boundary. content-visibility:auto skips rendering cards scrolled out of view. */
	.shell:not(.inefficient) .team-card {
		contain: layout style paint;
		content-visibility: auto;
		contain-intrinsic-size: auto 92px;
	}

	/* Efficient: hint browser to composite button layers ahead of hover so transitions
	   run on the GPU without triggering layout. Scoped to avoid over-promoting. */
	.shell:not(.inefficient) button {
		will-change: transform;
	}

	.team-card.selected {
		border-color: #0ba5ec;
		box-shadow: inset 0 0 0 1px #0ba5ec;
	}

	/* Inefficient: box-shadow is not GPU-composited — every keyframe step triggers a
	   full repaint of the painted layer containing all 20 cards. Runs continuously
	   even when nothing is happening. */
	@keyframes cardPulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(180, 35, 24, 0);
		}
		50% {
			box-shadow: 0 0 10px 3px rgba(180, 35, 24, 0.28);
		}
	}

	.inefficient .team-card {
		animation: cardPulse 1.6s ease-in-out infinite;
	}

	.team-card h3 {
		margin: 0 0 0.4rem;
	}

	.team-card p {
		margin: 0.2rem 0;
		font-size: 0.9rem;
	}

	.log ul,
	.energy-box ul {
		padding-left: 1rem;
	}

	.pulse {
		margin-top: 0.8rem;
		font-size: 0.85rem;
		color: #b42318;
	}

	.fx-layer {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		background:
			radial-gradient(circle at 15% 15%, rgba(240, 68, 56, 0.22), transparent 22%),
			radial-gradient(circle at 80% 20%, rgba(12, 166, 120, 0.24), transparent 28%),
			radial-gradient(circle at 65% 80%, rgba(56, 188, 248, 0.23), transparent 23%);
		filter: saturate(120%);
		z-index: 1;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.35);
		box-shadow: 0 0 16px rgba(16, 24, 40, 0.25);
	}

	.inefficient .panel {
		backdrop-filter: blur(3px);
		background: rgba(255, 255, 255, 0.82);
	}

	@media (max-width: 980px) {
		.grid {
			grid-template-columns: 1fr;
		}

		.hero {
			flex-direction: column;
			align-items: start;
		}

		.teams {
			max-height: 45vh;
		}
	}
</style>
