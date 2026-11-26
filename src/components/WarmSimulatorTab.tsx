import React from 'react';
import { BarChart3, DollarSign, Leaf, RotateCcw, ShieldAlert } from 'lucide-react';
import { DEFAULT_WARM_INPUT } from '../engine/warmEngine';
import { WarmScenarioInput, WarmSimulationResult } from '../engine/types';

interface WarmSimulatorTabProps {
  input: WarmScenarioInput;
  result: WarmSimulationResult;
  onChange: (patch: Partial<WarmScenarioInput>) => void;
  onReset: () => void;
}

export const WarmSimulatorTab: React.FC<WarmSimulatorTabProps> = ({
  input,
  result,
  onChange,
  onReset,
}) => {
  // SVG Tipping-Point Cliff Chart (Contamination % vs Annual Cost $)
  const W = 620;
  const H = 235;
  const padL = 62;
  const padR = 24;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxCost = Math.max(...result.tippingCurve.map((p) => p.annualCostUsd), 1000);
  const minCost = Math.min(...result.tippingCurve.map((p) => p.annualCostUsd), 0);
  const costSpan = Math.max(1000, maxCost - minCost);

  const xContam = (pct: number) => padL + (pct / 35) * innerW;
  const yCost = (usd: number) => padT + innerH - ((usd - minCost) / costSpan) * innerH;
  const yProb = (probPct: number) => padT + innerH - (probPct / 100) * innerH;

  const costPoints = result.tippingCurve
    .map((p) => `${xContam(p.contaminationPct)},${yCost(p.annualCostUsd)}`)
    .join(' ');
  const probPoints = result.tippingCurve
    .map((p) => `${xContam(p.contaminationPct)},${yProb(p.loadRejectionProbPct)}`)
    .join(' ');

  const threshX = xContam(input.mrfRejectionThresholdPct);
  const baseX = xContam(Math.min(35, input.baselineContaminationPct));
  const targetX = xContam(Math.min(35, input.targetContaminationPct));

  const mc = result.monteCarlo;

  return (
    <div className="section-stack">
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Net GHG Avoided (EPA WARM v16)</span>
            <Leaf size={15} color="#10B981" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            {result.netMtCo2eAvoided.toLocaleString()} t
          </div>
          <div className="kpi-meta">
            MTCO₂e/yr • Equivalent to {result.carsOffRoadEquivalent} passenger cars removed
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Annual Budget Savings</span>
            <DollarSign size={15} color="#38BDF8" />
          </div>
          <div className="kpi-value" style={{ color: '#7dd3fc' }}>
            ${result.annualDollarSavingsUsd.toLocaleString()}
          </div>
          <div className="kpi-meta">
            Cost drops ${result.baselineAnnualCostUsd.toLocaleString()} → $
            {result.targetAnnualCostUsd.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>MRF Rejection Risk</span>
            <ShieldAlert size={15} color="#F43F5E" />
          </div>
          <div className="kpi-value" style={{ color: '#fda4af' }}>
            {result.baselineRejectionRiskPct}% → {result.targetRejectionRiskPct}%
          </div>
          <div className="kpi-meta">
            Below {input.mrfRejectionThresholdPct}% MRF rejection cliff
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Edible Surplus Rescued</span>
            <BarChart3 size={15} color="#F59E0B" />
          </div>
          <div className="kpi-value" style={{ color: '#fcd34d' }}>
            {result.mealsEquivalentPerYear.toLocaleString()}
          </div>
          <div className="kpi-meta">Additional meals/yr via food-rescue dispatch</div>
        </div>
      </section>

      <section className="grid-2">
        {/* Left: Interactive Sliders */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Institutional Scale &amp; Diversion Parameters</h2>
              <p className="card-sub">
                Model 1 school to a 50-campus district using published EPA WARM v16 (Dec 2023) factors.
              </p>
            </div>
            <button type="button" className="btn btn-sm" onClick={onReset}>
              <RotateCcw size={13} /> Defaults
            </button>
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Facilities / Campuses Covered</span>
              <span className="slider-val">{input.facilityCount} sites ({result.totalAnnualTons.toLocaleString()} t/yr)</span>
            </div>
            <input
              type="range"
              aria-label="Facilities Covered"
              min={1}
              max={50}
              step={1}
              value={input.facilityCount}
              onChange={(e) => onChange({ facilityCount: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Baseline Contamination Rate (Before DivertIQ)</span>
              <span className="slider-val" style={{ color: '#fb7185' }}>{input.baselineContaminationPct}%</span>
            </div>
            <input
              type="range"
              aria-label="Baseline Contamination Rate"
              min={8}
              max={35}
              step={1}
              value={input.baselineContaminationPct}
              onChange={(e) => onChange({ baselineContaminationPct: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Target Contamination Rate (With Vision Triage)</span>
              <span className="slider-val">{input.targetContaminationPct}%</span>
            </div>
            <input
              type="range"
              aria-label="Target Contamination Rate"
              min={2}
              max={25}
              step={1}
              value={input.targetContaminationPct}
              onChange={(e) => onChange({ targetContaminationPct: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>MRF Rejection Threshold Cliff</span>
              <span className="slider-val" style={{ color: '#fcd34d' }}>{input.mrfRejectionThresholdPct}%</span>
            </div>
            <input
              type="range"
              aria-label="MRF Rejection Threshold"
              min={5}
              max={22}
              step={1}
              value={input.mrfRejectionThresholdPct}
              onChange={(e) => onChange({ mrfRejectionThresholdPct: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Surplus Edible Food Rescue Capture</span>
              <span className="slider-val">{input.foodRescueCapturePct}%</span>
            </div>
            <input
              type="range"
              aria-label="Food Rescue Capture"
              min={15}
              max={92}
              step={1}
              value={input.foodRescueCapturePct}
              onChange={(e) => onChange({ foodRescueCapturePct: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Organics Compost Adoption</span>
              <span className="slider-val">{input.compostAdoptionPct}%</span>
            </div>
            <input
              type="range"
              aria-label="Compost Adoption"
              min={20}
              max={92}
              step={1}
              value={input.compostAdoptionPct}
              onChange={(e) => onChange({ compostAdoptionPct: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Landfill Tipping Fee / Contamination Surcharge</span>
              <span className="slider-val">
                ${input.landfillTippingFeePerTon}/t • ${input.contaminationSurchargePerTon}/t
              </span>
            </div>
            <input
              type="range"
              aria-label="Landfill Tipping Fee"
              min={35}
              max={140}
              step={5}
              value={input.landfillTippingFeePerTon}
              onChange={(e) =>
                onChange({
                  landfillTippingFeePerTon: Number(e.target.value),
                  contaminationSurchargePerTon: Math.round(Number(e.target.value) * 1.6),
                })
              }
            />
          </div>
        </div>

        {/* Right: Tipping-Point Cliff + 500-Trial Monte Carlo Bands */}
        <div className="section-stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: 10 }}>
              <div>
                <h3 className="card-title">MRF Contamination Tipping-Point Economics</h3>
                <p className="card-sub">
                  Crossing the {input.mrfRejectionThresholdPct}% threshold triggers load rejection &amp; surcharge spikes.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                <span style={{ color: '#38BDF8', fontWeight: 600 }}>● Annual Cost ($)</span>
                <span style={{ color: '#F43F5E', fontWeight: 600 }}>-- Rejection Risk (%)</span>
              </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="MRF contamination tipping point cost and rejection curve">
              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                const y = padT + innerH * (1 - f);
                const val = Math.round((minCost + costSpan * f) / 1000);
                return (
                  <g key={f}>
                    <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(148,163,184,0.12)" />
                    <text x={padL - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10">
                      ${val}k
                    </text>
                  </g>
                );
              })}

              {/* MRF threshold vertical cliff */}
              <line
                x1={threshX}
                y1={padT}
                x2={threshX}
                y2={H - padB}
                stroke="#F59E0B"
                strokeWidth="1.6"
                strokeDasharray="5 4"
              />
              <text x={threshX + 5} y={padT + 12} fill="#fbbf24" fontSize="10" fontWeight="700">
                MRF Limit ({input.mrfRejectionThresholdPct}%)
              </text>

              {/* Target & Baseline vertical markers */}
              <line x1={targetX} y1={padT} x2={targetX} y2={H - padB} stroke="#10B981" strokeWidth="1.4" strokeOpacity="0.6" />
              <line x1={baseX} y1={padT} x2={baseX} y2={H - padB} stroke="#F43F5E" strokeWidth="1.4" strokeOpacity="0.6" />

              <polyline fill="none" stroke="#F43F5E" strokeWidth="2" strokeDasharray="4 3" points={probPoints} />
              <polyline fill="none" stroke="#38BDF8" strokeWidth="2.8" points={costPoints} />

              <text x={targetX} y={H - 8} textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">
                Target {input.targetContaminationPct}%
              </text>
              <text x={baseX} y={H - 8} textAnchor="middle" fill="#fda4af" fontSize="10" fontWeight="700">
                Base {input.baselineContaminationPct}%
              </text>
              {[0, 10, 20, 30].map((c) => (
                <text key={c} x={xContam(c)} y={H - padB + 14} textAnchor="middle" fill="#64748b" fontSize="9.5">
                  {c}%
                </text>
              ))}
            </svg>
          </div>

          <div className="card">
            <div className="card-header" style={{ marginBottom: 10 }}>
              <div>
                <h3 className="card-title">
                  Monte Carlo Uncertainty Analysis ({mc.trials} Seeded Trials)
                </h3>
                <p className="card-sub">
                  Perturbs waste tonnage (±11%), landfill CH₄ capture (±14%), &amp; sorting variance to report P10 / P50 / P90 confidence intervals.
                </p>
              </div>
              <span className="badge badge-recycle">Seed #{input.monteCarloSeed || DEFAULT_WARM_INPUT.monteCarloSeed}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  label: 'Annual Net MTCO₂e Avoided',
                  p10: `${mc.mtCo2eSaved.p10} t`,
                  p50: `${mc.mtCo2eSaved.p50} t`,
                  p90: `${mc.mtCo2eSaved.p90} t`,
                  color: '#10B981',
                },
                {
                  label: 'Annual Tipping & Penalty Savings',
                  p10: `$${mc.annualSavingsUsd.p10.toLocaleString()}`,
                  p50: `$${mc.annualSavingsUsd.p50.toLocaleString()}`,
                  p90: `$${mc.annualSavingsUsd.p90.toLocaleString()}`,
                  color: '#38BDF8',
                },
                {
                  label: 'Additional Metric Tons Diverted',
                  p10: `${mc.tonsDivertedDelta.p10} t`,
                  p50: `${mc.tonsDivertedDelta.p50} t`,
                  p90: `${mc.tonsDivertedDelta.p90} t`,
                  color: '#A78BFA',
                },
              ].map((row) => (
                <div key={row.label} className="verdict-box" style={{ marginBottom: 0, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <strong>{row.label}</strong>
                    <span className="mono" style={{ color: row.color, fontWeight: 700 }}>
                      Median (P50): {row.p50}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94a3b8' }}>
                    <span>Conservative P10: <strong className="mono">{row.p10}</strong></span>
                    <span>Upside P90: <strong className="mono">{row.p90}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10-Stream EPA WARM v16 Table */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">EPA WARM v16 Stream-by-Stream Lifecycle GHG Breakdown</h3>
            <p className="card-sub">
              Published U.S. EPA WARM v16 (Dec 2023) factors converted to metric tons (×1.10231). Negative factors denote avoided virgin extraction &amp; methane.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waste Stream</th>
                <th>Share</th>
                <th>Annual Tons</th>
                <th>WARM Divert Factor</th>
                <th>WARM Landfill Factor</th>
                <th>Diverted (Base → Target)</th>
                <th>Net MTCO₂e Saved</th>
              </tr>
            </thead>
            <tbody>
              {result.streams.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td className="mono">{s.sharePct}%</td>
                  <td className="mono">{s.tonsTotal} t</td>
                  <td className="mono" style={{ color: '#34d399' }}>{s.warmRecycleOrDivertFactor}</td>
                  <td className="mono" style={{ color: '#fda4af' }}>+{s.warmLandfillFactor}</td>
                  <td className="mono">
                    {s.tonsDivertedBaseline}t → <strong>{s.tonsDivertedTarget}t</strong>
                  </td>
                  <td className="mono" style={{ color: '#34d399', fontWeight: 700 }}>
                    +{s.netMtCo2eSaved} t
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
