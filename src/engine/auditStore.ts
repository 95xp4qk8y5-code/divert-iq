import { AuditEntry, DailyTrendPoint, MunicipalityId, WarmSimulationResult } from './types';

const STORAGE_KEY = 'divertiq_audit_entries_v1';

export const PILOT_30DAY_TREND: DailyTrendPoint[] = [
  { dayLabel: 'W1 Mon', contaminationPct: 24.8, diversionPct: 31.2, rescuedMeals: 84 },
  { dayLabel: 'W1 Wed', contaminationPct: 23.4, diversionPct: 33.5, rescuedMeals: 112 },
  { dayLabel: 'W1 Fri', contaminationPct: 20.9, diversionPct: 37.8, rescuedMeals: 146 },
  { dayLabel: 'W2 Mon', contaminationPct: 17.6, diversionPct: 43.1, rescuedMeals: 188 },
  { dayLabel: 'W2 Wed', contaminationPct: 14.9, diversionPct: 48.6, rescuedMeals: 214 },
  { dayLabel: 'W2 Fri', contaminationPct: 12.1, diversionPct: 53.9, rescuedMeals: 256 },
  { dayLabel: 'W3 Mon', contaminationPct: 10.4, diversionPct: 58.4, rescuedMeals: 282 },
  { dayLabel: 'W3 Wed', contaminationPct: 8.9, diversionPct: 62.7, rescuedMeals: 315 },
  { dayLabel: 'W3 Fri', contaminationPct: 7.8, diversionPct: 66.2, rescuedMeals: 348 },
  { dayLabel: 'W4 Mon', contaminationPct: 7.2, diversionPct: 69.5, rescuedMeals: 372 },
  { dayLabel: 'W4 Wed', contaminationPct: 6.8, diversionPct: 71.8, rescuedMeals: 394 },
  { dayLabel: 'W4 Fri', contaminationPct: 6.4, diversionPct: 74.1, rescuedMeals: 418 },
];

export const SEED_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'seed-1',
    timestamp: '2026-11-26T09:15:00Z',
    source: 'vision_scan',
    municipalityId: 'sf',
    itemName: 'Greasy / Cheese-Soiled Pizza Box',
    binAssigned: 'compost',
    weightKg: 0.24,
    co2eSavedKg: 0.19,
    contaminationPrevented: true,
    notes: 'Intercepted from Blue Recycling cart — prevented OCC bale grease contamination.',
  },
  {
    id: 'seed-2',
    timestamp: '2026-11-26T10:02:00Z',
    source: 'vision_scan',
    municipalityId: 'sf',
    itemName: 'Plastic Grocery Bag / LDPE Film (#4)',
    binAssigned: 'dropoff',
    weightKg: 0.008,
    co2eSavedKg: 0.015,
    contaminationPrevented: true,
    notes: 'Diverted tangler film away from single-stream MRF disc screens.',
  },
  {
    id: 'seed-3',
    timestamp: '2026-11-26T11:30:00Z',
    source: 'food_dispatch',
    municipalityId: 'sf',
    itemName: 'Campus Dining Rescue Batch (8 Donors -> 3 Shelters)',
    binAssigned: 'compost',
    weightKg: 262.4,
    co2eSavedKg: 1044.2,
    contaminationPrevented: false,
    notes: 'CVRPTW-P route dispatch rescued ~483 meals before 90-min hot-meal expiry.',
  },
  {
    id: 'seed-4',
    timestamp: '2026-11-26T12:18:00Z',
    source: 'vision_scan',
    municipalityId: 'sf',
    itemName: 'Aluminum Beverage Can',
    binAssigned: 'recycle',
    weightKg: 0.015,
    co2eSavedKg: 0.151,
    contaminationPrevented: false,
    notes: 'Clean ALU 41 verified (92% confidence specular profile).',
  },
  {
    id: 'seed-5',
    timestamp: '2026-11-26T12:41:00Z',
    source: 'rule_lookup',
    municipalityId: 'sf',
    itemName: 'BPI-Certified Compostable Bioplastic Cup (PLA #7)',
    binAssigned: 'compost',
    weightKg: 0.016,
    co2eSavedKg: 0.019,
    contaminationPrevented: true,
    notes: 'Flagged PLA bioplastic to stop melting-point contamination in PET #1 stream.',
  },
];

export function loadAuditEntries(): AuditEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...SEED_AUDIT_ENTRIES];
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_AUDIT_ENTRIES];
  } catch {
    return [...SEED_AUDIT_ENTRIES];
  }
}

export function saveAuditEntries(entries: AuditEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota errors in restricted/private browsing modes
  }
}

export function buildAuditCsv(entries: AuditEntry[]): string {
  const header = [
    'id',
    'timestamp',
    'source',
    'municipality',
    'item_name',
    'bin_assigned',
    'weight_kg',
    'co2e_saved_kg',
    'contamination_prevented',
    'notes',
  ].join(',');

  const escapeCsv = (val: string | number | boolean) => {
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = entries.map((e) =>
    [
      e.id,
      e.timestamp,
      e.source,
      e.municipalityId,
      e.itemName,
      e.binAssigned,
      e.weightKg,
      e.co2eSavedKg,
      e.contaminationPrevented,
      e.notes,
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [header, ...rows].join('\n');
}

export function buildExecutiveReportHtml(
  entries: AuditEntry[],
  cityId: MunicipalityId,
  warm: WarmSimulationResult
): string {
  const totalKg = entries.reduce((s, e) => s + e.weightKg, 0);
  const totalCo2 = entries.reduce((s, e) => s + e.co2eSavedKg, 0);
  const preventedCount = entries.filter((e) => e.contaminationPrevented).length;

  const rowsHtml = entries
    .slice(0, 40)
    .map(
      (e) => `<tr>
        <td>${e.timestamp.slice(0, 16).replace('T', ' ')}</td>
        <td>${e.itemName}</td>
        <td>${e.binAssigned.toUpperCase()}</td>
        <td>${e.weightKg.toFixed(2)} kg</td>
        <td>${e.co2eSavedKg.toFixed(2)} kg</td>
        <td>${e.contaminationPrevented ? 'YES' : '—'}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>DivertIQ Waste Diversion & Contamination Audit Report</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 32px; line-height: 1.5; }
  h1 { margin: 0 0 4px; color: #065f46; }
  .meta { color: #475569; font-size: 13px; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 24px; }
  .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #f8fafc; }
  .card .k { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
  .card .v { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
  th { background: #f1f5f9; }
</style>
</head>
<body>
  <h1>DivertIQ — Executive Waste Diversion &amp; MRF Contamination Audit</h1>
  <div class="meta">Municipality Profile: <strong>${cityId.toUpperCase()}</strong> | Methodology: EPA WARM v16 (Dec 2023) | Generated: ${new Date().toISOString()}</div>
  <div class="grid">
    <div class="card"><div class="k">Logged Mass Tracked</div><div class="v">${totalKg.toFixed(1)} kg</div></div>
    <div class="card"><div class="k">Logged CO2e Avoided</div><div class="v">${totalCo2.toFixed(1)} kg</div></div>
    <div class="card"><div class="k">Contaminants Intercepted</div><div class="v">${preventedCount} events</div></div>
    <div class="card"><div class="k">Projected Annual Savings</div><div class="v">$${warm.annualDollarSavingsUsd.toLocaleString()}</div></div>
  </div>
  <h2>EPA WARM v16 Institutional Projection (P50 Monte Carlo, ${warm.monteCarlo.trials} Trials)</h2>
  <p>Effective diversion rises from <strong>${warm.baselineEffectiveDiversionPct}%</strong> to <strong>${warm.targetEffectiveDiversionPct}%</strong>, reducing MRF load-rejection probability from <strong>${warm.baselineRejectionRiskPct}%</strong> to <strong>${warm.targetRejectionRiskPct}%</strong> and avoiding <strong>${warm.monteCarlo.mtCo2eSaved.p50} MTCO2e/year</strong> (P10–P90: ${warm.monteCarlo.mtCo2eSaved.p10}–${warm.monteCarlo.mtCo2eSaved.p90} MTCO2e).</p>
  <h2>Recent Audit Ledger</h2>
  <table>
    <thead><tr><th>Timestamp</th><th>Item / Dispatch</th><th>Stream</th><th>Weight</th><th>CO2e Avoided</th><th>Contamination Prevented</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
