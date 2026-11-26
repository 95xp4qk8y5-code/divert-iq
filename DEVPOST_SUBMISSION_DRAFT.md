# DivertIQ — Ready-to-Paste Devpost Submission Draft (Arbiter Hacks V1)

> **Target Track:** **Theme Track — Rethinking Waste** (Remember: Arbiter Hacks V1 allows submitting to **ONE track only** — choose **Theme Track: Rethinking Waste** for the strongest rubric fit and highest win probability!)
> **Submission Deadline:** **December 20, 2026 @ 9:00 PM PST** (Beijing Time: **December 21, 2026 @ 1:00 PM CST**)

---

## Project Title
**DivertIQ**

## Elevator Pitch / Tagline (≤200 chars)
Zero-cost, browser-native waste contamination computer vision, perishability-aware food rescue routing (CVRPTW-P), and EPA WARM v16 Monte Carlo diversion simulator for schools & municipalities.

## Built With (Tags)
`typescript` `react` `vite` `html5-canvas` `svg` `computer-vision` `operations-research` `vitest` `github-pages`

## Links
- **GitHub Repository:** `https://github.com/95xp4qk8y5-code/divert-iq`
- **Live Demo URL:** `https://95xp4qk8y5-code.github.io/divert-iq/`
- **Demo Video URL:** *(Paste your 2:15–2:45 YouTube/Vimeo unlisted or public video link here)*

---

## REQUIRED THEME TRACK PARAGRAPH (Waste Problem & Measurement)
*(Arbiter Hacks V1 explicitly requires Theme Track submissions to include one dedicated paragraph stating the specific waste problem targeted and how you would measure whether it worked — place this right at the top of your Devpost description!)*

**Specific Waste Problem & How We Measure Success:**
DivertIQ directly targets two interconnected institutional landfill drivers: (1) **single-stream recycling contamination ("wish-cycling")**, where contamination rates averaging 17–25% push school and campus loads past Materials Recovery Facility (MRF) rejection thresholds (6–14%), causing entire bales to be landfilled and triggering $100+/ton contamination surcharges; and (2) **perishable surplus food waste**, where unserved cafeteria food spoils in transit before reaching shelters and generates landfill methane (28× CO₂ GWP₁₀₀). To measure whether DivertIQ works in a real deployment, we embed a three-metric empirical verification protocol directly in our Audit & Export module: (a) **Pre/Post Contamination Weight Audits** comparing 50-bag blue-bin contamination % before deployment against 30 days after deploying DivertIQ's bin-side vision triage tablet (success = dropping below the local MRF threshold); (b) **Rescued Meal & Spoilage Telemetry** logging pan weights departing dining halls vs. weights passing food-safety intake at recipient shelters under naive vs. CVRPTW-P urgency routes; and (c) **Monthly Hauler Invoice & EPA WARM v16 Accounting**, verifying reduced contamination surcharges ($) and converting audited diverted stream tonnage into MTCO₂e avoided.

---

## Devpost Story Sections

### Inspiration
Most recycling apps are either static PDF posters nobody reads at a crowded cafeteria trash station or thin wrappers around paid cloud vision APIs that schools and student sustainability clubs cannot afford to run. Meanwhile, when I looked into how Materials Recovery Facilities (MRFs) actually fail, I learned a brutal engineering fact: **wish-cycling is non-linear**. Once a campus recycling dumpster crosses ~10–14% contamination (just a few greasy pizza boxes, plastic film tanglers wrapping around spinning disc screens, or PLA bioplastic cups melting into PET flakes), haulers don't just lose that 10%—they reject the **entire load** straight to landfill and charge contamination surcharges. At the exact same time, dining halls throw away trays of safe hot meals because volunteer drivers route pickups by convenience instead of thermal perishability decay. I wanted to build a single, genuinely technical, **$0-cost, offline-capable operational suite** that solves sorting contamination, food rescue routing, and lifecycle climate economics in one clean browser app.

### What it does
**DivertIQ** runs 100% client-side in any modern browser (zero paid API keys, zero backend fees) and unites four operational modules:

1. **On-Device Pixel Contamination Vision & 6-City Municipal Rule Matrix:** Uses live webcam capture, uploaded photos, or 6 built-in procedural pixel test specimens to run a real pixel-level computer vision pipeline (foreground ROI segmentation + 12 perceptual features across CIELAB, HSV, 3×3 Sobel edge density, 16-bin Shannon luminance entropy, specular metallic glint, and dark grease-stain ratio). It classifies materials in ~15 ms with explainable feature bars, flags low-confidence scans transparently, and resolves exact disposal rules, prep steps, and MRF hazards across **30 high-confusion items** and **6 real municipalities** (San Francisco, New York City, Seattle, Austin, Beijing 4-Bin, and Tokyo 23-Ward).
2. **Perishability-Aware Food Rescue CVRPTW-P Solver:** Models surplus donors with Arrhenius-inspired exponential freshness decay $Q(t) = e^{-k t}$ and hard food-safety cutoffs. It benchmarks **Naive Nearest-Neighbor dispatch** live against **DivertIQ's Urgency-Weighted Insertion + 2-Opt + Inter-Vehicle Relocate optimizer** on an interactive 10×10 km SVG spatial map. Users can click anywhere on the map to add new cafeterias, toggle refrigerated vans (-72% transit decay), adjust fleet capacity, and compare rescued meals, prevented spoilage, and net CO₂e (deducting van tailpipe emissions).
3. **EPA WARM v16 Lifecycle GHG & MRF Tipping-Point Economics Simulator:** Applies published **U.S. EPA WARM v16 (Dec 2023)** factors across 10 waste streams, models the logistic MRF contamination rejection cliff, and executes a **500-trial seeded Monte Carlo simulation** (Mulberry32 + Box-Muller) to produce P10 / P50 / P90 confidence intervals for annual MTCO₂e avoided and tipping-fee savings.
4. **Persistent Audit Ledger & Executive Report Exporter:** Logs scans, food dispatches, and manual field weigh-ins in `localStorage` and exports **CSV**, **JSON**, and **print-ready Executive HTML Audit Briefs** in one click.

### How we built it
- **Frontend & Visualization:** React 19, TypeScript (strict mode), Vite 6, custom CSS design system (zero bloat — final gzipped bundle is **108.5 kB JS + 3.0 kB CSS**), HTML5 Canvas 2D for pixel processing & HUD bounding reticles, and hand-crafted responsive SVG charts and dispatch maps.
- **Core Algorithms Written From Scratch in TypeScript:**
  - `cvClassifier.ts`: sRGB→XYZ→CIELAB and HSV transforms, border-contrast foreground bounding box extraction, 3×3 Sobel gradient filter, 16-bin Shannon luminance entropy, calibrated softmax scoring, plus deterministic procedural specimen rendering for reproducible verification.
  - `vrpSolver.ts`: Capacitated multi-vehicle simulator with intermediate shelter drop-offs when capacity fills or hot cargo approaches expiry, urgency-weighted regret insertion, and iterative 2-Opt + inter-vehicle Relocate refinement.
  - `warmEngine.ts`: Published EPA WARM v16 short-ton→metric-ton factor engine, logistic MRF rejection probability curve, and deterministic 500-trial Monte Carlo quantile estimator.
- **Quality & Testing:** Verified with **14 automated Vitest unit & React Testing Library integration tests** covering all 6 CV specimens, cross-city rule overrides, VRP capacity & spoilage superiority, Monte Carlo quantile monotonicity, and full 5-tab UI workflows, plus live headless browser checks confirming **0 console errors**.
- **AI Assistance Disclosure:** AI coding tools were used transparently as an engineering assistant for TypeScript scaffolding, CSS iteration, test drafting, and documentation editing; all domain modeling, algorithm design, parameter calibration, and test/browser validation were verified directly, and **zero external AI/LLM APIs** are used at runtime.

### Challenges we ran into
- **Distinguishing Matte White HDPE (#2) from Glossy Translucent PET (#1) in Raw Pixels:** Our first specular-highlight threshold flagged uniformly bright matte white HDPE milk jugs as high-specular PET. Switching to a sharper localized high-value glint threshold (`V > 0.89`) combined with luminance entropy (`H = 1.55` matte vs. `2.75` refractive) cleanly separated HDPE from PET with >92% confidence.
- **Modeling Realistic MRF Non-Linearity Without Oversimplifying:** Linear recycling calculators miss why cutting contamination from 24% to 7% yields massive dollar savings. Formulating a smooth logistic MRF rejection probability curve centered above each municipality's actual contamination threshold captured the true economic cliff.
- **Balancing Fast Browser-Side VRP Solve Times With Route Quality:** Combining urgency-sorted best-position insertion with bounded 2-Opt + Relocate local search achieved **-47.2% spoilage reduction** on the Campus Dining scenario while keeping solve latency under **8 milliseconds** so dragging fleet sliders updates routes instantaneously.

### Accomplishments that we're proud of
- **Zero-Cost Real-World Feasibility:** Any high school cafeteria or community mutual-aid team can open the GitHub Pages URL on an old tablet or laptop today—no login wall, no API keys, no server bill, works offline.
- **100% Real Algorithms & Real Data:** Every chart, bounding box, route polyline, spoilage metric, and EPA WARM v16 P10/P50/P90 number is computed live from real math and cited public datasets—zero hardcoded fake outputs.
- **Verified Engineering Rigor:** 14/14 automated Vitest unit & integration tests passing, strict TypeScript build with 0 errors, and 0 browser console errors.

### What we learned
- Municipal recycling rules vary dramatically even between major cities (for example, San Francisco composts grease-soaked pizza boxes while Beijing routes them to residual waste, and Tokyo requires peeling PET shrink-wrap labels and separating caps). A real waste tool must treat municipal rules as first-class configuration.
- In climate accounting (EPA WARM v16), rescuing edible surplus food for human donation avoids **~6× more GHG per ton** than composting the exact same food—making cold-chain/urgency routing one of the highest-leverage interventions in urban waste systems.

### What's next
- **ONNX Runtime Web / Quantized MobileNetV3 Edge Upgrade:** Pair our fast explainable perceptual CV pipeline with an optional quantized client-side neural vision model (cached via Service Worker PWA) trained on TACO + TrashNet datasets for complex cluttered real-world scenes.
- **OpenStreetMap / OSRM Street-Network Routing:** Optional toggle to snap donor/shelter coordinates onto real city road networks and live traffic speeds while preserving our offline fallback mode.
- **Campus Cafeteria Field Pilot:** Partner with a local school sustainability club to run a 30-day pre/post weighed bin audit using DivertIQ's built-in CSV/HTML reporting workflow.

---

## 2:30 Demo Video Script (Shot-by-Shot Guide — Keep Strictly Under 3:00!)

> **Recording Tip:** Record 1080p browser window (`1280×720` or `1920×1080`) using OBS Studio or Loom/QuickTime, keep pacing brisk, speak clearly (or add crisp clean captions + voiceover), and upload to YouTube (Unlisted or Public) or Vimeo.

- **[0:00 – 0:25] Hook & Overview Tab (25 sec):**
  - Show `Overview` tab at `https://95xp4qk8y5-code.github.io/divert-iq/`.
  - Script: *"Hi, I'm [Your Name], and this is DivertIQ for the Arbiter Hacks V1 Rethinking Waste track. Up to 25% of campus and residential recycling is contaminated—crossing a 10–12% MRF limit sends whole loads to landfill. Meanwhile, unrouted cafeteria surplus spoils before shelters receive it. DivertIQ solves both problems 100% client-side in your browser for $0."*
  - Switch the top-right **MRF Rules** dropdown from **San Francisco** to **Beijing (4-Bin)** and **Tokyo**, showing the MRF limit line and municipal notes update live.
- **[0:25 – 1:05] Vision Triage & 6-City Municipal Rules (40 sec):**
  - Click **Vision Triage & Rules** tab.
  - Show the live Canvas classifying **Greasy Pizza Box** (`98.8%` confidence, red HUD reticle, Grease/Dark Stain bar spiking, CRITICAL wish-cycling risk warning).
  - Click **Corrugated Kraft Box** → watch it flip instantly to Blue Recycling (clean low-stain surface). Click **Aluminum Soda Can** → specular sheen bar jumps!
  - Mention: *"You can also use a live webcam or upload any real photo—everything runs locally on raw RGBA pixels using CIELAB, HSV, Sobel edge density, and Shannon entropy with zero paid APIs."*
  - Scroll briefly to the **30-Item Rule Matrix**, type `PLA` or `film` in search, click **Log to Audit Ledger** to show the green confirmation toast.
- **[1:05 – 1:45] Perishability-Aware Food Rescue CVRPTW-P Solver (40 sec):**
  - Click **Food Rescue VRP** tab.
  - Toggle between **Naive Baseline** and **DivertIQ Optimized** on the 10×10 km SVG map — highlight **-47.2% spoilage reduction** and **+15 more meals rescued** in **7 ms**!
  - Click **High-Perishability Hot-Meal Rush**, then **click directly on the SVG map** to spawn a new cafeteria donor and watch the routes re-optimize live! Toggle **Refrigerated Cold-Chain Vans** ON and watch Average Arrival Freshness jump.
  - Click **Log Optimized Dispatch to Audit**.
- **[1:45 – 2:15] EPA WARM v16 Simulator & Audit Export (30 sec):**
  - Click **EPA WARM v16 Simulator** tab.
  - Drag **Baseline Contamination** and **Facilities Covered** sliders — point out the **MRF Contamination Tipping-Point Cliff** SVG curve and the **500-Trial Monte Carlo P10/P50/P90** confidence ranges (`~1,775 MTCO₂e/yr` and `$87k/yr` saved).
  - Click **Audit & Export** tab — show the **Field Measurement Protocol**, our newly logged items in the ledger, and click **Executive HTML Brief** / **Export CSV** to demonstrate real file downloads.
- **[2:15 – 2:30] Wrap-Up (15 sec):**
  - Show GitHub repo + 14/14 passing Vitest tests (or README).
  - Script: *"DivertIQ is open-source, tested with 14 automated Vitest checks, and deployable today by any school or community hub for $0. Thanks for watching!"*
