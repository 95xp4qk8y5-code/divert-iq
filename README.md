# DivertIQ — On-Device Waste Contamination Vision, Food Rescue VRP & EPA WARM v16 Simulator

> **Built for [Arbiter Hacks V1](https://arbiter-hacks-v1.devpost.com/) — Theme Track: _Rethinking Waste_**
> **100% Client-Side • $0 API Keys • $0 Server Cost • Offline-Ready Open-Source Web App (MIT)**

- **Live Demo (GitHub Pages):** `https://95xp4qk8y5-code.github.io/divert-iq/`
- **Repository:** `https://github.com/95xp4qk8y5-code/divert-iq`

---

## The Waste Problem We Target

Two last-mile operational failures undermine institutional and municipal waste diversion every day:

1. **Wish-Cycling & MRF Load Rejection:** U.S. residential and campus single-stream recycling averages **17–25% contamination** by weight. When contamination crosses a Materials Recovery Facility's (MRF) rejection threshold (typically **6–14%**), a single grease-soaked pizza box, LDPE plastic bag tangler, PLA bioplastic cup, or crushed lithium battery can trigger **$100+/ton contamination surcharges** or send an entire recycling load straight to landfill.
2. **Perishable Surplus Food Landfilling:** Unserved cafeteria and dining-hall food spoils rapidly inside narrow 60–120 minute food-safety windows if dispatched via naive nearest-neighbor routing. Under **U.S. EPA WARM v16 (Dec 2023)**, landfilled food emits **+0.58 MTCO₂e/short ton** (mostly landfill methane, 28× CO₂ GWP₁₀₀), whereas rescuing and donating surplus food avoids **-3.66 MTCO₂e/short ton** — over **6× the climate impact of composting**.

**DivertIQ** unifies three browser-native engineering engines so any school cafeteria, college campus, community pantry, or municipality can deploy a real waste-diversion tool today for **$0**:

---

## Architecture & Core Engineering Engines

```
src/
├── engine/
│   ├── cvClassifier.ts     # Pixel-level RGBA CV pipeline (CIELAB, HSV, Sobel, Shannon entropy, softmax) + 6 test specimens
│   ├── municipalRules.ts   # 6-Municipality MRF Rule Matrix (SF, NYC, Seattle, Austin, Beijing 4-Bin, Tokyo) × 30 items
│   ├── vrpSolver.ts        # CVRPTW-P Solver (Arrhenius perishability decay + Urgency Insertion + 2-Opt + Relocate)
│   ├── warmEngine.ts       # EPA WARM v16 Lifecycle GHG + Logistic MRF Tipping-Point + 500-Trial Seeded Monte Carlo
│   └── auditStore.ts       # LocalStorage Audit Ledger + CSV / JSON / Printable HTML Executive Brief Exporter
├── components/
│   ├── Header.tsx          # Global municipality switcher & navigation
│   ├── OverviewTab.tsx     # Command center KPIs & 30-day pilot diversion trajectory SVG chart
│   ├── VisionSortTab.tsx   # Webcam / Photo Upload / 6 deterministic CV specimens + explainable feature bars + rule search
│   ├── RescueRouterTab.tsx # Interactive 10×10 km SVG spatial map + Naive vs Optimized CVRPTW-P benchmark
│   ├── WarmSimulatorTab.tsx# Interactive EPA WARM v16 sliders + MRF tipping cliff + P10/P50/P90 uncertainty bands
│   └── AuditReportTab.tsx  # Field measurement protocol + persistent audit ledger + 1-click exports
└── __tests__/              # 14 automated Vitest unit & React integration tests
```

### 1. On-Device Pixel Contamination Vision + 6-City Municipal Rule Matrix
- Operates directly on raw RGBA pixel buffers (`Uint8ClampedArray`) from **live webcam frames**, **uploaded photos**, or **6 deterministic procedural test specimens** (for zero-webcam judge evaluation).
- Segments the foreground ROI against the border background, draws a live HUD reticle bounding box, and computes a **12-feature perceptual visual descriptor** (`CIELAB L*a*b*`, `HSV`, `3×3 Sobel edge density`, `16-bin Shannon luminance entropy`, `specular glint ratio`, `kraft-brown ratio`, `organic chroma ratio`, `RGB dispersion`, and `dark grease/stain ratio`).
- Runs normalized Gaussian prototype log-likelihood + calibrated softmax across 8 material classes, flags low-confidence predictions transparently instead of guessing, and maps the result to **30 high-confusion items** across **6 real-world municipal rulebooks** (San Francisco Recology, NYC DSNY, Seattle SPU, Austin Resource Recovery, Beijing 4-Bin, Tokyo 23-Ward).

### 2. Perishability-Aware Food Rescue CVRPTW-P Solver
- Models surplus food donors with realistic exponential quality retention $Q(t) = e^{-(k_{\text{wait}} t_{\text{wait}} + k_{\text{transit}} t_{\text{transit}})}$ and hard food-safety expiry deadlines (refrigerated vans cut in-transit decay constant $k$ by 72%).
- Benchmarks **Naive Nearest-Neighbor Dispatch** against **DivertIQ's CVRPTW-P Optimizer** (Perishability-Urgency Weighted Regret Insertion + Intra-Route 2-Opt + Inter-Vehicle Relocate local search) live in `< 10 ms`.
- Click anywhere on the interactive 10×10 km SVG dispatch map to spawn new cafeterias, toggle cold-chain refrigeration, adjust fleet count/capacity, and inspect per-stop freshness manifests.

### 3. EPA WARM v16 Lifecycle GHG & MRF Contamination Tipping-Point Simulator
- Uses published **U.S. EPA WARM Version 16 (December 2023)** net emission factors (converted transparently from short tons to metric tons via `×1.10231`) across 10 municipal waste streams.
- Models the non-linear **logistic MRF load-rejection cliff** where exceeding local contamination limits causes rejected recycling loads and hauler surcharges.
- Runs a deterministic **500-trial Mulberry32 + Box-Muller Monte Carlo simulation** perturbing tonnage (±11%), landfill methane collection (±14%), and sorting capture (±8%) to report conservative **P10 / P50 / P90** confidence intervals.

---

## Verified Local Benchmarks & Test Results

Verified via `npm test && npm run build` (Node v22, TypeScript strict mode, Vite 6):

| Check / Benchmark | Verified Result |
| :--- | :--- |
| Automated Test Suite (`vitest run`) | **5 test files, 14/14 tests passing (0 errors)** |
| Production Build (`tsc -b && vite build`) | **0 TypeScript errors**, **108.5 kB gzipped JS** + **3.0 kB gzipped CSS** |
| Browser Verification (`vite preview`) | **0 console errors**, all 5 tabs & 240×180 Canvas verified |
| Pixel CV Specimen Testbench | **6/6 (100%) accurate** across Aluminum, PET #1, Cardboard, Greasy Pizza Box, Produce, HDPE #2 (~13–19 ms) |
| Campus Dining VRP Preset (8 donors, 2 vans) | **-47.2% food spoilage** (17.6 kg → 9.3 kg), **+15 meals rescued** (524 total), **1,133.8 kg net CO₂e avoided** in **7.1 ms** |
| Hot-Meal Rush VRP Preset (tight 56-min FDA window) | **+19 meals rescued** over naive dispatch in **1.7 ms** |
| EPA WARM v16 Default (12 facilities, 1,140 t/yr) | Effective diversion **12.6% → 72.3%**, MRF rejection **93.8% → 6.2%**, **1,775.2 MTCO₂e/yr avoided (P50)**, **$87,078/yr saved** |

---

## Running Locally

```bash
npm install
npm test        # Run all 14 unit & React integration tests
npm run dev     # Start local dev server (http://localhost:5173)
npm run build   # Type-check & create static production bundle in dist/
```

---

## Data Sources & Citations

- **U.S. EPA WARM Version 16 (December 2023):** Lifecycle GHG emission factors for Aluminum, PET #1, HDPE #2, OCC Cardboard, Mixed Paper, Glass, Steel Cans, Food Donation, Food Composting, Electronics, and Landfilling.
- **U.S. EPA Greenhouse Gas Equivalencies Calculator:** Passenger vehicle equivalency (`4.6 MTCO₂e/year`).
- **USDA / ReFED Food Waste Conversion:** `1.2 lb (~0.544 kg)` per meal (`~1.84 meals/kg`).
- **The Recycling Partnership (State of Recycling) & Municipal Agencies:** SF Environment/Recology, NYC DSNY, Seattle Public Utilities, Austin Resource Recovery, Beijing Municipal Solid Waste 4-Bin Standard, and Tokyo 23-Ward Resource Recovery rules.

---

## Transparent AI Assistance Disclosure

In full compliance with Arbiter Hacks V1 guidelines:
- **AI coding tools** were used as an interactive engineering and code-authoring assistant during development for TypeScript scaffolding, CSS layout iteration, test case drafting, and documentation formatting.
- All system architecture decisions, waste-domain modeling (EPA WARM v16 conversion, MRF logistic rejection threshold model, Arrhenius perishability VRP formulation, 6-city municipal rule matrix, and 12-feature pixel CV design), parameter tuning, automated test verification, and live browser testing were reviewed, understood, and validated end-to-end.
- **No external LLM APIs or paid cloud inference services** are called at runtime; every algorithm executes deterministically in the user's browser.

---

## License

MIT License — see [LICENSE](./LICENSE).
