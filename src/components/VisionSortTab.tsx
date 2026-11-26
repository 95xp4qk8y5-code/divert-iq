import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  PlusCircle,
  Search,
  Sparkles,
  Upload,
  VideoOff,
} from 'lucide-react';
import {
  classifyPixelBuffer,
  PixelBuffer,
  renderSpecimenToBuffer,
  TEST_SPECIMENS,
} from '../engine/cvClassifier';
import {
  getBinColor,
  getItemById,
  resolveItemRule,
  searchWasteItems,
} from '../engine/municipalRules';
import {
  AuditEntry,
  BinCategory,
  CVClassificationResult,
  MunicipalityId,
} from '../engine/types';

interface VisionSortTabProps {
  cityId: MunicipalityId;
  onLogAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

const BIN_FILTERS: Array<{ id: BinCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Streams' },
  { id: 'recycle', label: 'Recycle' },
  { id: 'compost', label: 'Compost' },
  { id: 'dropoff', label: 'Drop-Off' },
  { id: 'hazardous', label: 'Hazardous' },
  { id: 'landfill', label: 'Landfill' },
];

export const VisionSortTab: React.FC<VisionSortTabProps> = ({ cityId, onLogAudit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selectedSpecimen, setSelectedSpecimen] = useState<string>(TEST_SPECIMENS[3].id); // Greasy pizza box default for dramatic demo!
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>('Synthetic Specimen: Greasy Pizza Box');
  const [cvResult, setCvResult] = useState<CVClassificationResult>(() => {
    const buf = renderSpecimenToBuffer(TEST_SPECIMENS[3].id, 160, 120);
    return classifyPixelBuffer(buf);
  });
  const [selectedItemId, setSelectedItemId] = useState<string>('greasy-pizza-box');
  const [searchQuery, setSearchQuery] = useState('');
  const [binFilter, setBinFilter] = useState<BinCategory | 'all'>('all');

  const drawAnnotatedBuffer = (buf: PixelBuffer, result: CVClassificationResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = buf.width;
    canvas.height = buf.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render pixels safely in browser environments (jsdom may lack ImageData constructor)
    if (typeof ImageData !== 'undefined') {
      const imgData = new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height);
      ctx.putImageData(imgData, 0, 0);
    }

    // Draw HUD bounding box over detected foreground object
    const bx = result.boundingBox.x * buf.width;
    const by = result.boundingBox.y * buf.height;
    const bw = result.boundingBox.width * buf.width;
    const bh = result.boundingBox.height * buf.height;

    const accent = result.topClass === 'contaminated_film' ? '#F43F5E' : '#10B981';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner reticles
    const corner = Math.max(8, Math.min(bw, bh) * 0.18);
    ctx.lineWidth = 3;
    ctx.beginPath();
    // top-left
    ctx.moveTo(bx, by + corner);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + corner, by);
    // top-right
    ctx.moveTo(bx + bw - corner, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + corner);
    // bottom-left
    ctx.moveTo(bx, by + bh - corner);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + corner, by + bh);
    // bottom-right
    ctx.moveTo(bx + bw - corner, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - corner);
    ctx.stroke();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const runSpecimen = (specimenId: string) => {
    stopCamera();
    setCameraError(null);
    const spec = TEST_SPECIMENS.find((s) => s.id === specimenId) ?? TEST_SPECIMENS[0];
    setSelectedSpecimen(spec.id);
    const buf = renderSpecimenToBuffer(spec.id, 240, 180);
    const res = classifyPixelBuffer(buf);
    setCvResult(res);
    setSelectedItemId(res.representativeItemId);
    setSourceLabel(`Synthetic Specimen: ${spec.label}`);
    drawAnnotatedBuffer(buf, res);
  };

  useEffect(() => {
    const buf = renderSpecimenToBuffer(selectedSpecimen, 240, 180);
    drawAnnotatedBuffer(buf, cvResult);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stopCamera();
    setCameraError(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const targetW = 240;
      const targetH = 180;
      const off = document.createElement('canvas');
      off.width = targetW;
      off.height = targetH;
      const ctx = off.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const buf: PixelBuffer = { data: imgData.data, width: targetW, height: targetH };
        const res = classifyPixelBuffer(buf);
        setCvResult(res);
        setSelectedItemId(res.representativeItemId);
        setSourceLabel(`Uploaded Image: ${file.name}`);
        drawAnnotatedBuffer(buf, res);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleStartCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Webcam API is unavailable in this browser context. Upload a photo or select a test specimen below.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access was blocked or no webcam was found. Use Photo Upload or the 6 instant test specimens below.');
    }
  };

  const handleCaptureCameraFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const targetW = 240;
    const targetH = 180;
    const off = document.createElement('canvas');
    off.width = targetW;
    off.height = targetH;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, targetW, targetH);
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const buf: PixelBuffer = { data: imgData.data, width: targetW, height: targetH };
    const res = classifyPixelBuffer(buf);
    setCvResult(res);
    setSelectedItemId(res.representativeItemId);
    setSourceLabel('Live Webcam Frame Capture');
    stopCamera();
    drawAnnotatedBuffer(buf, res);
  };

  const activeItem = useMemo(() => getItemById(selectedItemId), [selectedItemId]);
  const resolved = useMemo(() => resolveItemRule(activeItem, cityId), [activeItem, cityId]);
  const filteredRules = useMemo(
    () => searchWasteItems(searchQuery, binFilter, cityId),
    [searchQuery, binFilter, cityId]
  );

  const handleLogCurrent = () => {
    const preventsContam =
      resolved.item.wishCyclingRisk === 'critical' || resolved.item.wishCyclingRisk === 'high';
    onLogAudit({
      source: 'vision_scan',
      municipalityId: cityId,
      itemName: resolved.item.name,
      binAssigned: resolved.bin,
      weightKg: resolved.item.avgWeightKg,
      co2eSavedKg: resolved.item.co2eSavedKg,
      contaminationPrevented: preventsContam,
      notes: `${sourceLabel} (${(cvResult.confidence * 100).toFixed(0)}% CV confidence) -> ${resolved.binLabel}`,
    });
  };

  return (
    <div className="section-stack">
      <section className="grid-vision">
        {/* Left: Live On-Device Pixel Vision Stage */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Cpu size={17} color="#38BDF8" /> On-Device Pixel Material &amp; Contamination Scanner
              </h2>
              <p className="card-sub">
                Real CIELAB + HSV + Sobel edge + Shannon entropy pipeline on raw RGBA pixels ({cvResult.inferenceMs} ms)
              </p>
            </div>
            <span className="badge badge-recycle">{cvResult.pixelCount.toLocaleString()} FG px</span>
          </div>

          <div className="canvas-stage">
            {cameraActive ? (
              <video ref={videoRef} playsInline muted />
            ) : (
              <canvas ref={canvasRef} aria-label="Waste specimen vision canvas" />
            )}
            <div
              style={{
                position: 'absolute',
                left: 10,
                bottom: 10,
                background: 'rgba(7,13,20,0.84)',
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: 6,
                padding: '4px 9px',
                fontSize: 11.5,
              }}
            >
              <strong>{cvResult.topLabel}</strong> •{' '}
              <span className="mono" style={{ color: '#34d399' }}>
                {(cvResult.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 12 }}>
            {!cameraActive ? (
              <button type="button" className="btn btn-sky btn-sm" onClick={handleStartCamera}>
                <Camera size={14} /> Use Live Webcam
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleCaptureCameraFrame}>
                  <Sparkles size={14} /> Capture &amp; Classify Frame
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={stopCamera}>
                  <VideoOff size={14} /> Stop Camera
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Upload Waste Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
          </div>

          {cameraError && (
            <div className="info-callout" style={{ marginTop: 10 }}>
              {cameraError}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>
              1-Click Deterministic Pixel Specimens (Zero-Webcam Judge Testbench):
            </div>
            <div className="specimen-grid">
              {TEST_SPECIMENS.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  className={`specimen-btn ${selectedSpecimen === spec.id && !cameraActive ? 'selected' : ''}`}
                  onClick={() => runSpecimen(spec.id)}
                >
                  <span className="specimen-name">{spec.label}</span>
                  <span className="specimen-sub">{spec.subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Explainable CV Feature Attribution */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 10 }}>
              Explainable Perceptual Feature Vector (Extracted Directly From Canvas Pixels):
            </div>
            {cvResult.attributions.map((attr) => (
              <div key={attr.name} className="meter-row">
                <div className="meter-head">
                  <span>
                    <strong>{attr.name}</strong>{' '}
                    <span style={{ color: '#94a3b8' }}>— {attr.interpretation}</span>
                  </span>
                  <span className="mono" style={{ color: '#7dd3fc' }}>
                    {attr.valueLabel}
                  </span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${Math.max(4, Math.round(attr.normalized * 100))}%`,
                      background:
                        attr.name.includes('Grease') && attr.normalized > 0.45
                          ? '#F43F5E'
                          : 'linear-gradient(90deg, #38BDF8, #10B981)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Municipal Bin Verdict + MRF Contamination Risk */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Municipal Sorting Verdict ({resolved.city.name})</h2>
              <p className="card-sub">
                Source: {sourceLabel} • {resolved.city.agency}
              </p>
            </div>
            <span className={`badge badge-${resolved.item.wishCyclingRisk}`}>
              Wish-Cycle Risk: {resolved.item.wishCyclingRisk}
            </span>
          </div>

          {cvResult.uncertain && (
            <div className="info-callout" style={{ marginBottom: 12 }}>
              <strong>Low visual confidence ({(cvResult.confidence * 100).toFixed(0)}%):</strong>{' '}
              Lighting or angle caused overlapping material scores — confirm the exact item in the
              rule table below before binning so you never wish-cycle!
            </div>
          )}

          <div
            className="verdict-box"
            style={{ borderColor: getBinColor(resolved.bin), borderWidth: 1.5 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Detected Item • {resolved.item.resinOrCode}
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, marginTop: 2 }}>{resolved.item.name}</div>
              </div>
              <span className={`badge badge-${resolved.bin}`} style={{ fontSize: 12, padding: '5px 12px' }}>
                {resolved.binLabel}
              </span>
            </div>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="info-callout emerald">
                <strong>Required Prep Before Disposal:</strong> {resolved.item.prepSteps}
              </div>

              <div
                className={`info-callout ${
                  resolved.item.wishCyclingRisk === 'critical' ? 'rose' : ''
                }`}
              >
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={13} /> MRF Engineering Impact:
                </strong>{' '}
                {resolved.item.mrfImpactNote}
              </div>

              {resolved.citySpecificNote && (
                <div className="info-callout" style={{ borderLeftColor: '#38BDF8', background: 'rgba(56,189,248,0.1)', color: '#e0f2fe' }}>
                  <strong>{resolved.city.name} Local Rule Override:</strong> {resolved.citySpecificNote}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid rgba(148,163,184,0.18)',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ fontSize: 12.5, color: '#cbd5e1' }}>
                Avg mass: <strong className="mono">{(resolved.item.avgWeightKg * 1000).toFixed(0)} g</strong> •
                Avoided GHG: <strong className="mono" style={{ color: '#34d399' }}>{resolved.item.co2eSavedKg.toFixed(3)} kg CO₂e</strong>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleLogCurrent}>
                <PlusCircle size={14} /> Log to Audit Ledger
              </button>
            </div>
          </div>

          {/* Top-4 Softmax Material Probabilities */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
              Top Material Class Probabilities (Calibrated Softmax):
            </div>
            {cvResult.predictions.slice(0, 4).map((pred) => (
              <div key={pred.materialClass} className="meter-row">
                <div className="meter-head">
                  <span>{pred.label}</span>
                  <span className="mono">{(pred.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${Math.max(2, pred.probability * 100)}%`,
                      background:
                        pred.materialClass === cvResult.topClass ? '#10B981' : '#475569',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom: Searchable 30-Item Cross-City Municipal Rule Matrix */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <CheckCircle2 size={16} color="#10B981" /> 30 High-Confusion Items — Municipal Rule Matrix ({resolved.city.name})
            </h3>
            <p className="card-sub">
              Click any item to inspect its MRF impact or switch cities in the top bar to see regional rule differences (e.g., Tokyo PET cap/label rules, SF compostable pizza boxes, Beijing 4-Bin).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, top: 10, color: '#64748b' }}
              />
              <input
                type="text"
                aria-label="Search waste items"
                className="input-field"
                style={{ paddingLeft: 30, width: 220 }}
                placeholder="Search pizza, PLA, film, battery..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {BIN_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm ${binFilter === f.id ? 'btn-primary' : ''}`}
                onClick={() => setBinFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item &amp; Code</th>
                <th>Assigned Stream ({resolved.city.name})</th>
                <th>Wish-Cycle Risk</th>
                <th>Preparation &amp; MRF Note</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((r) => (
                <tr
                  key={r.item.id}
                  style={{
                    background:
                      r.item.id === selectedItemId ? 'rgba(16,185,129,0.08)' : undefined,
                  }}
                >
                  <td>
                    <strong style={{ display: 'block' }}>{r.item.name}</strong>
                    <span className="mono" style={{ fontSize: 11, color: '#94a3b8' }}>
                      {r.item.resinOrCode}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.bin}`}>{r.binLabel}</span>
                    {r.citySpecificNote && (
                      <div style={{ fontSize: 11, color: '#7dd3fc', marginTop: 4 }}>
                        Local override active
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${r.item.wishCyclingRisk}`}>
                      {r.item.wishCyclingRisk}
                    </span>
                  </td>
                  <td style={{ maxWidth: 420, color: '#cbd5e1' }}>
                    <div>{r.item.prepSteps}</div>
                    {r.citySpecificNote && (
                      <div style={{ color: '#93c5fd', fontSize: 11.5, marginTop: 3 }}>
                        {r.citySpecificNote}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setSelectedItemId(r.item.id);
                        setSourceLabel(`Rule Lookup: ${r.item.name}`);
                      }}
                    >
                      Inspect
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
