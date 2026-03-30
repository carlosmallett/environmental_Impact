const STORAGE_KEY = 'energy_site_sessions_v1';

function now() {
	return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function createEnergyTracker(variant) {
	const state = {
		variant,
		startMs: now(),
		scriptMs: 0,
		wakeups: 0,
		interactions: 0,
		frames: 0,
		reRenders: 0
	};

	return {
		markInteraction() {
			state.interactions += 1;
		},
		recordScript(ms) {
			state.scriptMs += ms;
		},
		recordWakeup() {
			state.wakeups += 1;
		},
		recordFrame() {
			state.frames += 1;
		},
		recordRender() {
			state.reRenders += 1;
		},
		snapshot() {
			const elapsedMs = Math.max(1, now() - state.startMs);
			const framesPerSecond = (state.frames * 1000) / elapsedMs;
			const estimatedMwh =
				state.scriptMs * 0.00014 +
				state.wakeups * 0.00008 +
				state.reRenders * 0.00004 +
				state.interactions * 0.00002;

			return {
				variant: state.variant,
				elapsedSec: elapsedMs / 1000,
				scriptMs: state.scriptMs,
				wakeups: state.wakeups,
				interactions: state.interactions,
				framesPerSecond,
				reRenders: state.reRenders,
				estimatedMwh
			};
		}
	};
}

export function persistEnergySnapshot(snapshot) {
	if (typeof localStorage === 'undefined') return;

	const current = readEnergySnapshots();
	const withTimestamp = {
		...snapshot,
		timestamp: new Date().toISOString()
	};

	current.unshift(withTimestamp);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, 40)));
}

export function readEnergySnapshots() {
	if (typeof localStorage === 'undefined') return [];

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function clearEnergySnapshots() {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}
