export const SALARY_CAP_M = 141.0;
export const LUXURY_TAX_LINE_M = 171.3;
export const FIRST_APRON_M = 178.7;
export const SECOND_APRON_M = 188.9;

export const FREE_AGENTS = [
	{ name: 'Veteran Wing', salaryM: 5.2 },
	{ name: 'Backup Guard', salaryM: 3.0 },
	{ name: 'Stretch Big', salaryM: 8.4 },
	{ name: 'Defensive Forward', salaryM: 6.8 },
	{ name: 'Microwave Scorer', salaryM: 11.0 }
];

export const NBA_TEAMS_20 = [
	{ id: 'atl', name: 'Atlanta Hawks', payrollM: 174.2 },
	{ id: 'bos', name: 'Boston Celtics', payrollM: 191.8 },
	{ id: 'bkn', name: 'Brooklyn Nets', payrollM: 152.9 },
	{ id: 'cha', name: 'Charlotte Hornets', payrollM: 136.5 },
	{ id: 'chi', name: 'Chicago Bulls', payrollM: 167.2 },
	{ id: 'cle', name: 'Cleveland Cavaliers', payrollM: 176.6 },
	{ id: 'dal', name: 'Dallas Mavericks', payrollM: 181.3 },
	{ id: 'den', name: 'Denver Nuggets', payrollM: 180.1 },
	{ id: 'det', name: 'Detroit Pistons', payrollM: 129.4 },
	{ id: 'gsw', name: 'Golden State Warriors', payrollM: 198.0 },
	{ id: 'hou', name: 'Houston Rockets', payrollM: 144.7 },
	{ id: 'ind', name: 'Indiana Pacers', payrollM: 164.8 },
	{ id: 'lac', name: 'LA Clippers', payrollM: 201.4 },
	{ id: 'lal', name: 'Los Angeles Lakers', payrollM: 184.2 },
	{ id: 'mem', name: 'Memphis Grizzlies', payrollM: 170.5 },
	{ id: 'mia', name: 'Miami Heat', payrollM: 177.9 },
	{ id: 'mil', name: 'Milwaukee Bucks', payrollM: 189.7 },
	{ id: 'min', name: 'Minnesota Timberwolves', payrollM: 182.6 },
	{ id: 'nop', name: 'New Orleans Pelicans', payrollM: 174.6 },
	{ id: 'nyk', name: 'New York Knicks', payrollM: 179.0 }
];

const toMoney = (amountM) => `$${amountM.toFixed(1)}M`;

export function buildTeamSnapshot(team) {
	const capSpaceM = SALARY_CAP_M - team.payrollM;
	const taxRoomM = LUXURY_TAX_LINE_M - team.payrollM;

	return {
		...team,
		capSpaceM,
		taxRoomM,
		status:
			team.payrollM > SECOND_APRON_M
				? 'Over second apron'
				: team.payrollM > FIRST_APRON_M
					? 'Over first apron'
					: team.payrollM > LUXURY_TAX_LINE_M
						? 'Tax team'
						: capSpaceM > 0
							? 'Under cap'
							: 'Over cap'
	};
}

export function normalizeLeague(teams) {
	return teams.map((team) => buildTeamSnapshot(team));
}

export function checkFreeAgentSigning(team, salaryM) {
	const nextPayroll = team.payrollM + salaryM;
	const possible = nextPayroll <= SECOND_APRON_M;

	return {
		possible,
		nextPayroll,
		reason: possible
			? `Signing works. New payroll: ${toMoney(nextPayroll)}.`
			: `Blocked: signing crosses second apron (${toMoney(SECOND_APRON_M)}).`
	};
}

export function checkTrade(teamA, teamB, outgoingFromA, outgoingFromB) {
	const incomingToA = outgoingFromB;
	const incomingToB = outgoingFromA;

	const teamAUnderCap = teamA.payrollM < SALARY_CAP_M;
	const teamBUnderCap = teamB.payrollM < SALARY_CAP_M;

	const teamAMaxIncoming = teamAUnderCap ? Infinity : outgoingFromA * 1.25 + 0.25;
	const teamBMaxIncoming = teamBUnderCap ? Infinity : outgoingFromB * 1.25 + 0.25;

	const newPayrollA = teamA.payrollM - outgoingFromA + incomingToA;
	const newPayrollB = teamB.payrollM - outgoingFromB + incomingToB;

	const legalByMatching = incomingToA <= teamAMaxIncoming && incomingToB <= teamBMaxIncoming;
	const legalByApron = newPayrollA <= SECOND_APRON_M && newPayrollB <= SECOND_APRON_M;
	const possible = legalByMatching && legalByApron;

	let reason = 'Trade works under this simplified cap model.';
	if (!legalByMatching) {
		reason = 'Blocked: one or both teams fail salary matching (125% + $0.25M).';
	} else if (!legalByApron) {
		reason = 'Blocked: one or both teams cross the second apron after trade.';
	}

	return {
		possible,
		newPayrollA,
		newPayrollB,
		reason
	};
}
