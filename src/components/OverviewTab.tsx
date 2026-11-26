import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Leaf,
  Route,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';
import { PILOT_30DAY_TREND } from '../engine/auditStore';
import { getMunicipality } from '../engine/municipalRules';
import { AuditEntry, MunicipalityId, VRPComparisonResult, WarmSimulationResult } from '../engine/types';
import { AppTab } from './Header';

interface OverviewTabProps {
  cityId: MunicipalityId;
  warm: WarmSimulationResult;
  vrp: VRPComparisonResult;
  auditEntries: AuditEntry[];
  onNavigate: (tab: AppTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  cityId,
  warm,
  vrp,
  auditEntries,
  onNavigate,
}) => {
  const city = getMunicipality(cityId);
  const contaminantsStopped = auditEntries.filter((e) => e.contaminationPrevented).length;

  // Build 30-day pilot dual-line SVG geometry
  const W = 640;
  const H = 220;
  const padL = 44;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xAt = (i: number) => padL + (i / (PILOT_30DAY_TREND.length - 1)) * innerW;
  const yPct = (v: number) => padT + innerH - (Math.min(100, Math.max(0, v)) / 100) * innerH;

  const contamPoints = PILOT_30DAY_TREND.map((d, i) => `${xAt(i)},${yPct(d.contaminationPct)}`).join(' ');
  const divertPoints = PILOT_30DAY_TREND.map((d, i) => `${xAt(i)},${yPct(d.diversionPct)}`).join(' ');
  const thresholdY = yPct(city.mrfThresholdPct);

  return (
    <div className="section-stack">
      <section className="hero-banner">
        <div>
          <div className="hero-eyebrow">
            <Leaf size={14} /> Arbiter Hacks V1 • Theme Track: Rethinking Waste
          </div>
          <h2 className="hero-title">
            Stop MRF Bale Rejections &amp; Rescue Perishable Surplus Before It Hits Landfill.
          </h2>
          <p className="hero-desc">
            25% residential/campus recycling contamination triggers whole-load MRF rejections, while
            unrouted cafeteria surplus decomposes into landfill methane (28× CO₂).{' '}
            <strong>DivertIQ</strong> combines an on-device pixel CV contamination classifier, a
            perishability-aware food-rescue VRP solver, and an EPA WARM v16 Monte Carlo simulator —
            100% browser-native and $0 to deploy.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('vision')}>
              <Camera size={15} /> Launch Vision Triage <ArrowRight size={14} />
            </button>
            <button type="button" className="btn btn-sky" onClick={() => onNavigate('router')}>
              <Route size={15} /> Optimize Food Rescue Routes
            </button>
            <button type="button" className="btn" onClick={() => onNavigate('simulator')}>
              <BarChart3 size={15} /> Run EPA WARM v16 Model
            </button>
          </div>
        </div>

        <div className="card" style={{ background: 'rgba(7, 13, 20, 0.72)' }}>
          <div className="card-header" style={{ marginBottom: 10 }}>
            <div>
              <h3 className="card-title" style={{ fontSize: 14 }}>
                Active Municipal Profile: {city.name}
              </h3>
              <p className="card-sub">{city.agency}</p>
            </div>
            <span className="badge badge-compost">MRF Limit {city.mrfThresholdPct}%</span>
          </div>
          <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '0 0 12px' }}>{city.notes}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div style={{ padding: 9, borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>MRF Rejection Drop</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>
                {warm.baselineRejectionRiskPct}% → {warm.targetRejectionRiskPct}%
              </div>
            </div>
            <div style={{ padding: 9, borderRadius: 8, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.22)' }}>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>Audit Contaminations Stopped</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: '#7dd3fc' }}>
                {contaminantsStopped} logged
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Headline Waste Impact Metrics">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Annual GHG Avoided (P50)</span>
            <Leaf size={15} color="#10B981" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            {warm.monteCarlo.mtCo2eSaved.p50.toLocaleString()} t
          </div>
          <div className="kpi-meta">
            MTCO₂e/yr • P10–P90: {warm.monteCarlo.mtCo2eSaved.p10}–{warm.monteCarlo.mtCo2eSaved.p90} t (~
            {warm.carsOffRoadEquivalent} cars off road)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Tipping &amp; Penalty Savings</span>
            <TrendingDown size={15} color="#38BDF8" />
          </div>
          <div className="kpi-value" style={{ color: '#7dd3fc' }}>
            ${warm.annualDollarSavingsUsd.toLocaleString()}
          </div>
          <div className="kpi-meta">
            Projected/yr across {warm.totalAnnualTons.toLocaleString()} metric tons/yr
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Live VRP Meals Rescued</span>
            <Route size={15} color="#F59E0B" />
          </div>
          <div className="kpi-value" style={{ color: '#fcd34d' }}>
            {vrp.optimized.mealsRescued}
          </div>
          <div className="kpi-meta">
            {vrp.deltaMeals >= 0 ? `+${vrp.deltaMeals}` : vrp.deltaMeals} more meals vs. naive dispatch (
            {vrp.optimized.rescueRatePct}% capture)
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Effective Diversion Rate</span>
            <CheckCircle2 size={15} color="#A78BFA" />
          </div>
          <div className="kpi-value" style={{ color: '#c4b5fd' }}>
            {warm.targetEffectiveDiversionPct}%
          </div>
          <div className="kpi-meta">
            Up from {warm.baselineEffectiveDiversionPct}% net-of-rejection baseline
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">30-Day Campus Pilot Trajectory (Modeled Benchmark)</h3>
              <p className="card-sub">
                Bin-side vision triage + afternoon food routing drops contamination below the{' '}
                {city.mrfThresholdPct}% MRF rejection cliff.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11.5 }}>
              <span style={{ color: '#34d399', fontWeight: 600 }}>● Diversion %</span>
              <span style={{ color: '#fb7185', fontWeight: 600 }}>● Contamination %</span>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>-- MRF Limit</span>
            </div>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="30-day contamination and diversion trend chart">
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={yPct(tick)}
                  x2={W - padR}
                  y2={yPct(tick)}
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth="1"
                />
                <text x={padL - 8} y={yPct(tick) + 4} textAnchor="end" fill="#64748b" fontSize="10">
                  {tick}%
                </text>
              </g>
            ))}

            {/* MRF threshold line */}
            <line
              x1={padL}
              y1={thresholdY}
              x2={W - padR}
              y2={thresholdY}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text x={W - padR - 4} y={thresholdY - 5} textAnchor="end" fill="#fbbf24" fontSize="10" fontWeight="600">
              {city.name} MRF Limit ({city.mrfThresholdPct}%)
            </text>

            <polyline fill="none" stroke="#10b981" strokeWidth="2.8" points={divertPoints} />
            <polyline fill="none" stroke="#f43f5e" strokeWidth="2.8" points={contamPoints} />

            {PILOT_30DAY_TREND.map((d, i) => (
              <g key={d.dayLabel}>
                <circle cx={xAt(i)} cy={yPct(d.diversionPct)} r="3.5" fill="#34d399" />
                <circle cx={xAt(i)} cy={yPct(d.contaminationPct)} r="3.5" fill="#fb7185" />
                {i % 2 === 0 && (
                  <text x={xAt(i)} y={H - 10} textAnchor="middle" fill="#94a3b8" fontSize="10">
                    {d.dayLabel}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Three Integrated Zero-Cost Engines</h3>
              <p className="card-sub">
                Built from scratch in TypeScript — zero mock placeholders, zero paid API keys.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="verdict-box" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Camera size={15} color="#38BDF8" /> 1. Pixel-Level Contamination Vision + 6-City Rule Matrix
                </strong>
                <button type="button" className="btn btn-sm" onClick={() => onNavigate('vision')}>
                  Open
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
                Extracts 12 perceptual features (CIELAB, HSV, Sobel edge density, Shannon luminance entropy,
                specular glint, oil-stain darkness) on live webcam, photo upload, or 6 synthetic specimens —
                mapped to 30 high-confusion items across 6 real municipal MRFs.
              </p>
            </div>

            <div className="verdict-box" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Route size={15} color="#10B981" /> 2. Perishability-Aware Food Rescue CVRPTW-P Solver
                </strong>
                <button type="button" className="btn btn-sm" onClick={() => onNavigate('router')}>
                  Open
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
                Solves Capacitated Vehicle Routing with Time Windows &amp; Arrhenius exponential spoilage
                decay using urgency-weighted insertion + 2-Opt + inter-route Relocate, benchmarked live
                against naive dispatch in &lt;10 ms.
              </p>
            </div>

            <div className="verdict-box" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ShieldAlert size={15} color="#F59E0B" /> 3. EPA WARM v16 + MRF Tipping-Point Monte Carlo
                </strong>
                <button type="button" className="btn btn-sm" onClick={() => onNavigate('simulator')}>
                  Open
                </button>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#94a3b8' }}>
                Computes exact lifecycle MTCO₂e across 10 waste streams using published EPA WARM v16 factors,
                logistic MRF load-rejection surcharges, and 500-trial seeded P10/P50/P90 uncertainty bands.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
