import { describe, expect, it } from 'vitest';
import {
  classifyPixelBuffer,
  renderSpecimenToBuffer,
  TEST_SPECIMENS,
} from '../engine/cvClassifier';

describe('On-Device Pixel Computer Vision Classifier', () => {
  it('classifies all 6 rendered test specimens accurately from raw RGBA pixels', () => {
    for (const specimen of TEST_SPECIMENS) {
      const buf = renderSpecimenToBuffer(specimen.id, 160, 120);
      const result = classifyPixelBuffer(buf);

      expect(result.topClass).toBe(specimen.expectedClass);
      expect(result.confidence).toBeGreaterThan(0.45);
      const probSum = result.predictions.reduce((s, p) => s + p.probability, 0);
      expect(probSum).toBeCloseTo(1.0, 5);
      expect(result.pixelCount).toBeGreaterThan(200);
      expect(result.boundingBox.width).toBeGreaterThan(0.15);
      expect(result.boundingBox.height).toBeGreaterThan(0.25);
    }
  });

  it('distinguishes clean kraft cardboard from grease-soiled pizza box via dark stain ratio', () => {
    const clean = classifyPixelBuffer(renderSpecimenToBuffer('specimen-cardboard', 160, 120));
    const greasy = classifyPixelBuffer(renderSpecimenToBuffer('specimen-greasy-pizza', 160, 120));

    expect(clean.topClass).toBe('cardboard');
    expect(greasy.topClass).toBe('contaminated_film');
    expect(greasy.features.darkSpotRatio).toBeGreaterThan(clean.features.darkSpotRatio + 0.12);
  });

  it('extracts strong specular sheen on metallic aluminum and high organic chroma on produce', () => {
    const alu = classifyPixelBuffer(renderSpecimenToBuffer('specimen-aluminum', 160, 120));
    const org = classifyPixelBuffer(renderSpecimenToBuffer('specimen-organics', 160, 120));

    expect(alu.features.specularRatio).toBeGreaterThan(0.08);
    expect(org.features.organicChromaRatio).toBeGreaterThan(0.45);
  });
});
