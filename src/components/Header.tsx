import React from 'react';
import {
  Activity,
  BarChart3,
  Camera,
  ClipboardCheck,
  MapPin,
  Recycle,
  Route,
} from 'lucide-react';
import { MUNICIPALITIES } from '../engine/municipalRules';
import { MunicipalityId } from '../engine/types';

export type AppTab = 'overview' | 'vision' | 'router' | 'simulator' | 'audit';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  cityId: MunicipalityId;
  onCityChange: (city: MunicipalityId) => void;
  auditCount: number;
}

const TABS: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <Activity size={15} /> },
  { id: 'vision', label: 'Vision Triage & Rules', icon: <Camera size={15} /> },
  { id: 'router', label: 'Food Rescue VRP', icon: <Route size={15} /> },
  { id: 'simulator', label: 'EPA WARM v16 Simulator', icon: <BarChart3 size={15} /> },
  { id: 'audit', label: 'Audit & Export', icon: <ClipboardCheck size={15} /> },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  cityId,
  onCityChange,
  auditCount,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-row">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <Recycle size={21} />
            </div>
            <div>
              <h1 className="brand-title">
                DivertIQ <span className="brand-tag">Rethinking Waste</span>
              </h1>
              <p className="brand-sub">
                On-Device Contamination Vision • Perishability Food-Rescue VRP • EPA WARM v16 Economics
              </p>
            </div>
          </div>

          <div className="topbar-controls">
            <span className="pill-offline" title="Runs 100% locally in your browser with zero paid API keys">
              <span className="pulse-dot" />
              100% Client-Side • $0 API
            </span>
            <label className="city-select-wrap">
              <MapPin size={14} color="#38BDF8" />
              <span>MRF Rules:</span>
              <select
                aria-label="Select Municipality Rules"
                className="city-select"
                value={cityId}
                onChange={(e) => onCityChange(e.target.value as MunicipalityId)}
              >
                {MUNICIPALITIES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.region})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Primary Navigation">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.id === 'audit' && (
                <span
                  style={{
                    fontSize: 11,
                    background: 'rgba(16,185,129,0.22)',
                    color: '#a7f3d0',
                    padding: '1px 6px',
                    borderRadius: 999,
                  }}
                >
                  {auditCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
