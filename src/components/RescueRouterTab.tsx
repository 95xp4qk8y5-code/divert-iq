import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Plus,
  RotateCcw,
  Route,
  Snowflake,
  Truck,
  Zap,
} from 'lucide-react';
import { FOOD_TYPE_META, VRP_PRESETS } from '../engine/vrpSolver';
import {
  AuditEntry,
  FleetConfig,
  FoodDonorNode,
  FoodPerishabilityType,
  MunicipalityId,
  RecipientHub,
  VRPComparisonResult,
} from '../engine/types';

interface RescueRouterTabProps {
  cityId: MunicipalityId;
  presetId: string;
  donors: FoodDonorNode[];
  recipients: RecipientHub[];
  fleet: FleetConfig;
  comparison: VRPComparisonResult;
  onSelectPreset: (presetId: string) => void;
  onUpdateFleet: (patch: Partial<FleetConfig>) => void;
  onAddDonor: (donor: FoodDonorNode) => void;
  onRemoveDonor: (id: string) => void;
  onLogAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

export const RescueRouterTab: React.FC<RescueRouterTabProps> = ({
  cityId,
  presetId,
  donors,
  recipients,
  fleet,
  comparison,
  onSelectPreset,
  onUpdateFleet,
  onAddDonor,
  onRemoveDonor,
  onLogAudit,
}) => {
  const [viewMode, setViewMode] = useState<'optimized' | 'baseline'>('optimized');
  const [newFoodType, setNewFoodType] = useState<FoodPerishabilityType>('hot_prepared');
  const [newSurplusKg, setNewSurplusKg] = useState<number>(36);

  const activeSolution =
    viewMode === 'optimized' ? comparison.optimized : comparison.baseline;

  // Map coordinate transform: 0..10 km -> SVG 560x420
  const W = 560;
  const H = 420;
  const pad = 34;
  const toX = (kmX: number) => pad + (kmX / 10) * (W - pad * 2);
  const toY = (kmY: number) => H - pad - (kmY / 10) * (H - pad * 2);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const kmX = Math.max(0.5, Math.min(9.5, ((px - pad) / (W - pad * 2)) * 10));
    const kmY = Math.max(0.5, Math.min(9.5, ((H - pad - py) / (H - pad * 2)) * 10));
    const meta = FOOD_TYPE_META[newFoodType];
    const nextNum = donors.length + 1;
    onAddDonor({
      id: `custom-${Date.now()}`,
      name: `Added Cafeteria #${nextNum}`,
      x: Number(kmX.toFixed(1)),
      y: Number(kmY.toFixed(1)),
      surplusKg: newSurplusKg,
      foodType: newFoodType,
      readyMin: 0,
      expiryMin: Math.round(meta.shelfLifeHours * 45),
      decayRatePerHour: meta.defaultDecayPerHour,
    });
  };

  const handleCommitDispatch = () => {
    const opt = comparison.optimized;
    onLogAudit({
      source: 'food_dispatch',
      municipalityId: cityId,
      itemName: `Surplus Food Rescue Dispatch (${donors.length} Donors, ${fleet.vehicleCount} Vans)`,
      binAssigned: 'compost',
      weightKg: opt.totalRescuedKg,
      co2eSavedKg: opt.netCo2eAvoidedKg,
      contaminationPrevented: false,
      notes: `Rescued ${opt.mealsRescued} meals (${opt.rescueRatePct}% capture, avg ${opt.avgFreshnessPct}% freshness) vs ${comparison.baseline.mealsRescued} naive meals.`,
    });
  };

  return (
    <div className="section-stack">
      {/* Top Algorithm Benchmark Comparison Strip */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Meals Rescued (Optimized)</span>
            <Zap size={15} color="#10B981" />
          </div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            {comparison.optimized.mealsRescued}
          </div>
          <div className="kpi-meta">
            vs. {comparison.baseline.mealsRescued} naive (
            <strong style={{ color: '#34d399' }}>
              {comparison.deltaMeals >= 0 ? `+${comparison.deltaMeals}` : comparison.deltaMeals} meals
            </strong>
            )
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Spoilage Prevented</span>
            <Flame size={15} color="#F59E0B" />
          </div>
          <div className="kpi-value" style={{ color: '#fcd34d' }}>
            {comparison.spoilageReductionPct > 0 ? `-${comparison.spoilageReductionPct}%` : '0%'}
          </div>
          <div className="kpi-meta">
            Spoiled: {comparison.baseline.totalSpoiledKg} kg → {comparison.optimized.totalSpoiledKg} kg
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Net CO₂e Avoided</span>
            <Route size={15} color="#38BDF8" />
          </div>
          <div className="kpi-value" style={{ color: '#7dd3fc' }}>
            {comparison.optimized.netCo2eAvoidedKg.toLocaleString()} kg
          </div>
          <div className="kpi-meta">
            After deducting {comparison.optimized.transportCo2eKg} kg van tailpipe CO₂
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>Avg Arrival Freshness</span>
            <Clock size={15} color="#A78BFA" />
          </div>
          <div className="kpi-value" style={{ color: '#c4b5fd' }}>
            {comparison.optimized.avgFreshnessPct}%
          </div>
          <div className="kpi-meta">
            Solved in {comparison.optimized.solveTimeMs} ms • {comparison.optimized.totalDistanceKm} km
          </div>
        </div>
      </section>

      <section className="grid-router">
        {/* Left: Interactive Spatial Map */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Truck size={17} color="#10B981" /> Live Perishability-Aware Food Rescue Map (10 × 10 km)
              </h2>
              <p className="card-sub">
                Click anywhere on the grid to spawn a new surplus cafeteria donor and watch CVRPTW-P re-optimize live.
              </p>
            </div>
            <div className="btn-row">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'optimized' ? 'btn-primary' : ''}`}
                onClick={() => setViewMode('optimized')}
              >
                DivertIQ Optimized
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'baseline' ? 'btn-amber' : ''}`}
                onClick={() => setViewMode('baseline')}
              >
                Naive Baseline
              </button>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="map-svg"
            onClick={handleMapClick}
            role="img"
            aria-label="Interactive food rescue routing map"
          >
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map((km) => (
              <g key={km}>
                <line
                  x1={toX(km)}
                  y1={pad}
                  x2={toX(km)}
                  y2={H - pad}
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth="1"
                />
                <line
                  x1={pad}
                  y1={toY(km)}
                  x2={W - pad}
                  y2={toY(km)}
                  stroke="rgba(148,163,184,0.1)"
                  strokeWidth="1"
                />
                <text x={toX(km)} y={H - 12} textAnchor="middle" fill="#64748b" fontSize="9.5">
                  {km}km
                </text>
              </g>
            ))}

            {/* Route polylines */}
            {activeSolution.routes.map((route) => {
              const pts = route.stops.map((s) => `${toX(s.x)},${toY(s.y)}`).join(' ');
              return (
                <g key={route.vehicleId}>
                  <polyline
                    fill="none"
                    stroke={route.color}
                    strokeWidth="2.8"
                    strokeOpacity="0.88"
                    strokeDasharray={viewMode === 'baseline' ? '6 4' : undefined}
                    points={pts}
                  />
                  {route.stops.map((stop, idx) => {
                    if (stop.kind === 'depot') return null;
                    return (
                      <text
                        key={`${route.vehicleId}-${idx}`}
                        x={toX(stop.x) + 9}
                        y={toY(stop.y) - 7}
                        fill={route.color}
                        fontSize="9.5"
                        fontWeight="700"
                      >
                        V{route.vehicleId}.{idx}
                      </text>
                    );
                  })}
                </g>
              );
            })}

            {/* Depot */}
            <g>
              <rect
                x={toX(fleet.depotX) - 7}
                y={toY(fleet.depotY) - 7}
                width="14"
                height="14"
                rx="3"
                fill="#F8FAFC"
                stroke="#0F172A"
                strokeWidth="2"
              />
              <text
                x={toX(fleet.depotX)}
                y={toY(fleet.depotY) + 19}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="10"
                fontWeight="700"
              >
                Dispatch Hub
              </text>
            </g>

            {/* Recipient Shelters (Triangles) */}
            {recipients.map((r) => {
              const cx = toX(r.x);
              const cy = toY(r.y);
              return (
                <g key={r.id}>
                  <polygon
                    points={`${cx},${cy - 9} ${cx - 8},${cy + 7} ${cx + 8},${cy + 7}`}
                    fill="#38BDF8"
                    stroke="#082F49"
                    strokeWidth="1.6"
                  />
                  <text
                    x={cx}
                    y={cy + 18}
                    textAnchor="middle"
                    fill="#bae6fd"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {r.name.split(' ').slice(0, 2).join(' ')}
                  </text>
                </g>
              );
            })}

            {/* Donor Nodes */}
            {donors.map((d) => {
              const cx = toX(d.x);
              const cy = toY(d.y);
              const meta = FOOD_TYPE_META[d.foodType];
              const radius = Math.max(5.5, Math.min(10, 4.5 + d.surplusKg / 12));
              return (
                <g key={d.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={meta.color}
                    stroke="#070D14"
                    strokeWidth="1.6"
                  />
                  <text x={cx} y={cy + radius + 11} textAnchor="middle" fill="#e2e8f0" fontSize="9">
                    {d.name.split(' ')[0]} ({d.surplusKg}kg)
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              flexWrap: 'wrap',
              gap: 10,
              fontSize: 11.5,
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>■ Dispatch Hub</span>
              <span style={{ color: '#38BDF8' }}>▲ Food Shelter/Hub</span>
              <span style={{ color: '#F43F5E' }}>● Hot Meals (High Decay)</span>
              <span style={{ color: '#F59E0B' }}>● Dairy/Deli</span>
              <span style={{ color: '#10B981' }}>● Produce</span>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleCommitDispatch}>
              <Plus size={14} /> Log Optimized Dispatch to Audit
            </button>
          </div>
        </div>

        {/* Right: Scenario Controls + Fleet Parameters */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Scenario &amp; Fleet Optimizer Controls</h3>
              <p className="card-sub">
                Exponential shelf-life model: Q(t) = exp(-k·t) with 72% decay slowdown under refrigeration.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onSelectPreset(presetId)}
              title="Reset scenario nodes"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {VRP_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`specimen-btn ${presetId === p.id ? 'selected' : ''}`}
                onClick={() => onSelectPreset(p.id)}
              >
                <span className="specimen-name">{p.name}</span>
                <span className="specimen-sub">{p.description}</span>
              </button>
            ))}
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Rescue Vehicles</span>
              <span className="slider-val">{fleet.vehicleCount} vans</span>
            </div>
            <input
              type="range"
              aria-label="Rescue Vehicles"
              min={1}
              max={4}
              step={1}
              value={fleet.vehicleCount}
              onChange={(e) => onUpdateFleet({ vehicleCount: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Van Cargo Capacity</span>
              <span className="slider-val">{fleet.vehicleCapacityKg} kg</span>
            </div>
            <input
              type="range"
              aria-label="Van Cargo Capacity"
              min={80}
              max={240}
              step={10}
              value={fleet.vehicleCapacityKg}
              onChange={(e) => onUpdateFleet({ vehicleCapacityKg: Number(e.target.value) })}
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Urban Average Speed</span>
              <span className="slider-val">{fleet.avgSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              aria-label="Urban Average Speed"
              min={16}
              max={45}
              step={2}
              value={fleet.avgSpeedKmh}
              onChange={(e) => onUpdateFleet({ avgSpeedKmh: Number(e.target.value) })}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 10,
              background: fleet.refrigerated ? 'rgba(56,189,248,0.12)' : 'rgba(148,163,184,0.08)',
              border: '1px solid rgba(148,163,184,0.22)',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
              <Snowflake size={16} color={fleet.refrigerated ? '#38BDF8' : '#94a3b8'} />
              <div>
                <strong>Refrigerated Cold-Chain Vans</strong>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Cuts in-transit spoilage rate k by 72%
                </div>
              </div>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${fleet.refrigerated ? 'btn-sky' : ''}`}
              onClick={() => onUpdateFleet({ refrigerated: !fleet.refrigerated })}
            >
              {fleet.refrigerated ? 'Enabled' : 'Ambient'}
            </button>
          </div>

          {/* Click-to-Add Node Config */}
          <div className="verdict-box" style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              Click-Map Donor Spawn Settings:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
              <select
                aria-label="New donor food type"
                className="input-field"
                value={newFoodType}
                onChange={(e) => setNewFoodType(e.target.value as FoodPerishabilityType)}
              >
                {(Object.keys(FOOD_TYPE_META) as FoodPerishabilityType[]).map((k) => (
                  <option key={k} value={k}>
                    {FOOD_TYPE_META[k].label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                aria-label="New donor surplus kg"
                className="input-field"
                min={10}
                max={100}
                value={newSurplusKg}
                onChange={(e) => setNewSurplusKg(Math.max(5, Number(e.target.value)))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Route Manifest & Baseline Comparison Table */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              Dispatch Manifest — {activeSolution.algorithm}
            </h3>
            <p className="card-sub">
              Showing exact arrival timestamp, onboard load, freshness retention %, and shelf-life compliance for each vehicle.
            </p>
          </div>
          <span className="badge badge-compost">
            Total Surplus: {activeSolution.totalSurplusKg} kg • Rescued: {activeSolution.totalRescuedKg} kg
          </span>
        </div>

        <div className="grid-2">
          {activeSolution.routes.map((r) => (
            <div key={r.vehicleId} className="verdict-box" style={{ marginBottom: 0, borderLeft: `4px solid ${r.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <strong style={{ color: r.color }}>
                  Vehicle #{r.vehicleId} ({r.distanceKm} km • {r.durationMin} min)
                </strong>
                <span className="mono" style={{ fontSize: 12 }}>
                  Rescued {r.rescuedKg} kg • Spoiled {r.spoiledKg} kg
                </span>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Stop</th>
                      <th>Arr.</th>
                      <th>Load</th>
                      <th>Fresh</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.stops.map((s, idx) => (
                      <tr key={`${r.vehicleId}-${idx}`}>
                        <td>
                          <strong>{s.nodeName}</strong>
                        </td>
                        <td className="mono">+{s.arrivalMin}m</td>
                        <td className="mono">{s.loadAfterKg} kg</td>
                        <td className="mono" style={{ color: s.freshnessPct > 70 ? '#34d399' : '#fcd34d' }}>
                          {s.freshnessPct}%
                        </td>
                        <td>
                          {s.kind === 'recipient' ? (
                            <span className="badge badge-compost">Drop {s.rescuedKg}kg</span>
                          ) : s.kind === 'donor' ? (
                            <span className="badge badge-recycle">
                              Pick +{s.loadDeltaKg}kg
                            </span>
                          ) : (
                            <span className="badge badge-landfill">Hub</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {donors.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Active Donors (click × to remove):</span>
            {donors.map((d) => (
              <button
                key={d.id}
                type="button"
                className="btn btn-sm"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => donors.length > 1 && onRemoveDonor(d.id)}
                disabled={donors.length <= 1}
              >
                {d.name} ({d.surplusKg}kg) ×
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
