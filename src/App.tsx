import React, { useEffect, useMemo, useState } from 'react';
import { AuditReportTab } from './components/AuditReportTab';
import { AppTab, Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { RescueRouterTab } from './components/RescueRouterTab';
import { VisionSortTab } from './components/VisionSortTab';
import { WarmSimulatorTab } from './components/WarmSimulatorTab';
import {
  loadAuditEntries,
  saveAuditEntries,
  SEED_AUDIT_ENTRIES,
} from './engine/auditStore';
import { getMunicipality } from './engine/municipalRules';
import {
  AuditEntry,
  FleetConfig,
  FoodDonorNode,
  MunicipalityId,
  RecipientHub,
  WarmScenarioInput,
} from './engine/types';
import { compareVRPSolutions, VRP_PRESETS } from './engine/vrpSolver';
import { DEFAULT_WARM_INPUT, runWarmSimulation } from './engine/warmEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [cityId, setCityId] = useState<MunicipalityId>('sf');

  // Food Rescue VRP State
  const [presetId, setPresetId] = useState<string>(VRP_PRESETS[0].id);
  const [donors, setDonors] = useState<FoodDonorNode[]>(() => [...VRP_PRESETS[0].donors]);
  const [recipients, setRecipients] = useState<RecipientHub[]>(() => [...VRP_PRESETS[0].recipients]);
  const [fleet, setFleet] = useState<FleetConfig>(() => ({ ...VRP_PRESETS[0].fleet }));

  // EPA WARM v16 Simulator State
  const [warmInput, setWarmInput] = useState<WarmScenarioInput>(() => ({ ...DEFAULT_WARM_INPUT }));

  // Audit Ledger State
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(() => loadAuditEntries());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveAuditEntries(auditEntries);
  }, [auditEntries]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // Sync MRF rejection threshold when user switches municipality
  const handleCityChange = (nextCity: MunicipalityId) => {
    setCityId(nextCity);
    const profile = getMunicipality(nextCity);
    setWarmInput((prev) => ({
      ...prev,
      mrfRejectionThresholdPct: profile.mrfThresholdPct,
    }));
  };

  const handleSelectPreset = (nextPresetId: string) => {
    const preset = VRP_PRESETS.find((p) => p.id === nextPresetId) ?? VRP_PRESETS[0];
    setPresetId(preset.id);
    setDonors([...preset.donors]);
    setRecipients([...preset.recipients]);
    setFleet({ ...preset.fleet });
  };

  const handleLogAudit = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const created: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditEntries((prev) => [created, ...prev]);
    setToast(`Logged "${created.itemName}" to Audit Ledger`);
  };

  const vrpComparison = useMemo(
    () => compareVRPSolutions(donors, recipients, fleet),
    [donors, recipients, fleet]
  );

  const warmResult = useMemo(() => runWarmSimulation(warmInput, 500), [warmInput]);

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cityId={cityId}
        onCityChange={handleCityChange}
        auditCount={auditEntries.length}
      />

      <main className="main-container">
        {activeTab === 'overview' && (
          <OverviewTab
            cityId={cityId}
            warm={warmResult}
            vrp={vrpComparison}
            auditEntries={auditEntries}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'vision' && (
          <VisionSortTab cityId={cityId} onLogAudit={handleLogAudit} />
        )}

        {activeTab === 'router' && (
          <RescueRouterTab
            cityId={cityId}
            presetId={presetId}
            donors={donors}
            recipients={recipients}
            fleet={fleet}
            comparison={vrpComparison}
            onSelectPreset={handleSelectPreset}
            onUpdateFleet={(patch) => setFleet((prev) => ({ ...prev, ...patch }))}
            onAddDonor={(donor) => {
              setDonors((prev) => [...prev, donor]);
              setToast(`Added "${donor.name}" (${donor.surplusKg} kg) — routes re-optimized`);
            }}
            onRemoveDonor={(id) => setDonors((prev) => prev.filter((d) => d.id !== id))}
            onLogAudit={handleLogAudit}
          />
        )}

        {activeTab === 'simulator' && (
          <WarmSimulatorTab
            input={warmInput}
            result={warmResult}
            onChange={(patch) => setWarmInput((prev) => ({ ...prev, ...patch }))}
            onReset={() => setWarmInput({ ...DEFAULT_WARM_INPUT })}
          />
        )}

        {activeTab === 'audit' && (
          <AuditReportTab
            cityId={cityId}
            entries={auditEntries}
            warm={warmResult}
            onAddManual={handleLogAudit}
            onDelete={(id) => setAuditEntries((prev) => prev.filter((e) => e.id !== id))}
            onResetSeed={() => {
              setAuditEntries([...SEED_AUDIT_ENTRIES]);
              setToast('Reset audit ledger to pilot baseline dataset');
            }}
          />
        )}
      </main>

      <footer className="footer">
        DivertIQ • Open-Source (MIT) • Built for Arbiter Hacks V1 (Theme Track: Rethinking Waste) •
        GHG Factors: U.S. EPA WARM v16 (Dec 2023) • Runs 100% Client-Side ($0 Infrastructure)
      </footer>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
