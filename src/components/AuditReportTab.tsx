import React, { useState } from 'react';
import {
  ClipboardCheck,
  Download,
  FileCode2,
  FileText,
  PlusCircle,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  buildAuditCsv,
  buildExecutiveReportHtml,
  triggerFileDownload,
} from '../engine/auditStore';
import {
  AuditEntry,
  BinCategory,
  MunicipalityId,
  WarmSimulationResult,
} from '../engine/types';

interface AuditReportTabProps {
  cityId: MunicipalityId;
  entries: AuditEntry[];
  warm: WarmSimulationResult;
  onAddManual: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
  onResetSeed: () => void;
}

export const AuditReportTab: React.FC<AuditReportTabProps> = ({
  cityId,
  entries,
  warm,
  onAddManual,
  onDelete,
  onResetSeed,
}) => {
  const [itemName, setItemName] = useState('');
  const [binAssigned, setBinAssigned] = useState<BinCategory>('recycle');
  const [weightKg, setWeightKg] = useState('0.5');
  const [prevented, setPrevented] = useState(true);

  const totalWeightKg = entries.reduce((s, e) => s + e.weightKg, 0);
  const totalCo2eKg = entries.reduce((s, e) => s + e.co2eSavedKg, 0);
  const preventedCount = entries.filter((e) => e.contaminationPrevented).length;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    const wt = Math.max(0.01, parseFloat(weightKg) || 0.25);
    const factor = binAssigned === 'compost' ? 0.85 : binAssigned === 'recycle' ? 2.1 : 0.2;
    onAddManual({
      source: 'manual_audit',
      municipalityId: cityId,
      itemName: itemName.trim(),
      binAssigned,
      weightKg: wt,
      co2eSavedKg: Number((wt * factor).toFixed(3)),
      contaminationPrevented: prevented,
      notes: 'Manual field bin-audit entry',
    });
    setItemName('');
  };

  const handleExportCsv = () => {
    triggerFileDownload(
      `divertiq-audit-${cityId}.csv`,
      buildAuditCsv(entries),
      'text/csv;charset=utf-8'
    );
  };

  const handleExportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      municipality: cityId,
      methodology: 'EPA WARM v16 (Dec 2023)',
      summary: {
        loggedEntries: entries.length,
        totalWeightKg: Number(totalWeightKg.toFixed(2)),
        totalCo2eSavedKg: Number(totalCo2eKg.toFixed(2)),
        contaminantsIntercepted: preventedCount,
      },
      warmProjection: {
        baselineEffectiveDiversionPct: warm.baselineEffectiveDiversionPct,
        targetEffectiveDiversionPct: warm.targetEffectiveDiversionPct,
        annualDollarSavingsUsd: warm.annualDollarSavingsUsd,
        monteCarloP50MtCo2e: warm.monteCarlo.mtCo2eSaved.p50,
      },
      entries,
    };
    triggerFileDownload(
      `divertiq-audit-${cityId}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
  };

  const handleExportHtmlReport = () => {
    triggerFileDownload(
      `divertiq-executive-brief-${cityId}.html`,
      buildExecutiveReportHtml(entries, cityId, warm),
      'text/html;charset=utf-8'
    );
  };

  return (
    <div className="section-stack">
      {/* Measurement & Verification Protocol */}
      <section className="card-elevated">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <ClipboardCheck size={17} color="#10B981" /> Field Measurement &amp; Verification Protocol
            </h2>
            <p className="card-sub">
              How any school, campus, or community hub empirically verifies whether DivertIQ reduces real-world landfill waste.
            </p>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleExportCsv}>
              <Download size={14} /> Export CSV
            </button>
            <button type="button" className="btn btn-sky btn-sm" onClick={handleExportJson}>
              <FileCode2 size={14} /> Export JSON
            </button>
            <button type="button" className="btn btn-sm" onClick={handleExportHtmlReport}>
              <FileText size={14} /> Executive HTML Brief
            </button>
          </div>
        </div>

        <div className="grid-3">
          <div className="verdict-box" style={{ marginBottom: 0 }}>
            <strong style={{ fontSize: 13, color: '#34d399' }}>1. Pre/Post Bin Audit (Contamination %)</strong>
            <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '6px 0 0' }}>
              Weigh 50-bag baseline blue-bin samples before deployment vs. 30 days after mounting a tablet running DivertIQ Vision Triage above cafeteria sorting stations. Target: cut contamination below the municipal MRF rejection cliff (&lt;10–12%).
            </p>
          </div>
          <div className="verdict-box" style={{ marginBottom: 0 }}>
            <strong style={{ fontSize: 13, color: '#7dd3fc' }}>2. Rescued Meals &amp; Spoilage Telemetry</strong>
            <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '6px 0 0' }}>
              Log pan weights leaving dining halls vs. weights accepted by partner shelters on arrival. Compare meals accepted &amp; food-safety rejections under naive dispatch vs. CVRPTW-P urgency routes.
            </p>
          </div>
          <div className="verdict-box" style={{ marginBottom: 0 }}>
            <strong style={{ fontSize: 13, color: '#fcd34d' }}>3. Hauler Invoice &amp; WARM GHG Verification</strong>
            <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '6px 0 0' }}>
              Audit monthly hauler contamination-penalty invoices ($/load) and convert verified diverted stream tonnage into MTCO₂e using EPA WARM v16 factors.
            </p>
          </div>
        </div>
      </section>

      {/* Live Audit Summary + Quick Manual Entry */}
      <section className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Live Session &amp; Pilot Audit Totals</h3>
              <p className="card-sub">Persisted locally in browser storage (zero external server required).</p>
            </div>
            <button type="button" className="btn btn-sm" onClick={onResetSeed}>
              <RotateCcw size={13} /> Reset Demo Data
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div className="verdict-box" style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>MASS TRACKED</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>
                {totalWeightKg.toFixed(1)} kg
              </div>
            </div>
            <div className="verdict-box" style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>CO₂E AVOIDED</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>
                {totalCo2eKg.toFixed(1)} kg
              </div>
            </div>
            <div className="verdict-box" style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>CONTAM. STOPPED</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#fb7185' }}>
                {preventedCount}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 10 }}>
            <div>
              <h3 className="card-title">Add Manual Bin-Audit Record</h3>
              <p className="card-sub">Log field weigh-ins directly from a cafeteria or dorm audit.</p>
            </div>
          </div>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 90px', gap: 8 }}>
              <input
                type="text"
                className="input-field"
                placeholder="Item or bin batch (e.g., Dining Hall Bag #4)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                aria-label="Manual audit item name"
              />
              <select
                className="input-field"
                value={binAssigned}
                onChange={(e) => setBinAssigned(e.target.value as BinCategory)}
                aria-label="Manual audit bin"
              >
                <option value="recycle">Recycle</option>
                <option value="compost">Compost / Rescue</option>
                <option value="dropoff">Drop-Off</option>
                <option value="hazardous">Hazardous</option>
                <option value="landfill">Landfill</option>
              </select>
              <input
                type="number"
                step="any"
                min="0.01"
                className="input-field"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                aria-label="Manual audit weight kg"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12.5, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={prevented}
                  onChange={(e) => setPrevented(e.target.checked)}
                />
                Prevented wish-cycling / contamination event
              </label>
              <button type="submit" className="btn btn-primary btn-sm">
                <PlusCircle size={14} /> Add Record
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Audit Table */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Audit Ledger ({entries.length} entries)</h3>
            <p className="card-sub">Every Vision Scan, Food Rescue Dispatch, and Manual Field Audit is recorded here.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>Source</th>
                <th>Item / Batch</th>
                <th>Stream</th>
                <th>Weight</th>
                <th>CO₂e Avoided</th>
                <th>Contam. Prevented</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11.5 }}>
                    {entry.timestamp.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td>
                    <span className="badge badge-landfill">{entry.source.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <strong>{entry.itemName}</strong>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{entry.notes}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${entry.binAssigned}`}>{entry.binAssigned}</span>
                  </td>
                  <td className="mono">{entry.weightKg.toFixed(2)} kg</td>
                  <td className="mono" style={{ color: '#34d399' }}>{entry.co2eSavedKg.toFixed(2)} kg</td>
                  <td>
                    {entry.contaminationPrevented ? (
                      <span className="badge badge-compost">Yes</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm"
                      aria-label={`Delete ${entry.itemName}`}
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
