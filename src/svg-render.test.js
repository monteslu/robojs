import { describe, it, expect } from 'vitest';
import { composeSvg, COLOR_HUES, colorScheme, generateStyles, extractContent } from './svg-render.js';
import fs from 'fs';
import path from 'path';

describe('COLOR_HUES', () => {
  it('should have 10 color hues', () => {
    expect(COLOR_HUES).toHaveLength(10);
  });

  it('should all be valid hue values (0-360)', () => {
    COLOR_HUES.forEach(hue => {
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThanOrEqual(360);
    });
  });
});

describe('colorScheme', () => {
  it('should return fill, outline, highlight, shadow, neck, neckStroke', () => {
    const scheme = colorScheme(120);
    expect(scheme).toHaveProperty('fill');
    expect(scheme).toHaveProperty('outline');
    expect(scheme).toHaveProperty('highlight');
    expect(scheme).toHaveProperty('shadow');
    expect(scheme).toHaveProperty('neck');
    expect(scheme).toHaveProperty('neckStroke');
  });

  it('should produce HSL color strings', () => {
    const scheme = colorScheme(200);
    expect(scheme.fill).toMatch(/^hsl\(/);
    expect(scheme.outline).toMatch(/^hsl\(/);
    expect(scheme.highlight).toMatch(/^hsl\(/);
  });

  it('should use the provided hue', () => {
    const scheme = colorScheme(45);
    expect(scheme.fill).toContain('45');
  });

  it('should produce different schemes for different hues', () => {
    const a = colorScheme(0);
    const b = colorScheme(180);
    expect(a.fill).not.toBe(b.fill);
  });
});

describe('generateStyles', () => {
  it('should return a <style> element string', () => {
    const styles = generateStyles(120, 45);
    expect(styles).toContain('<style>');
    expect(styles).toContain('</style>');
  });

  it('should include all CSS classes', () => {
    const styles = generateStyles(200, 30);
    expect(styles).toContain('.outline');
    expect(styles).toContain('.fill');
    expect(styles).toContain('.highlight');
    expect(styles).toContain('.shadow');
    expect(styles).toContain('.neck');
    expect(styles).toContain('.rivet');
    expect(styles).toContain('.accent');
  });

  it('should use main hue for fill/outline', () => {
    const styles = generateStyles(120, 45);
    expect(styles).toContain('hsl(120');
  });

  it('should use accent hue for accent class', () => {
    const styles = generateStyles(120, 270);
    expect(styles).toContain('hsl(270');
  });
});

describe('extractContent', () => {
  it('should extract content between <g> tags', () => {
    const svg = '<svg><g class="test"><circle cx="10" cy="10" r="5"/></g></svg>';
    const content = extractContent(svg);
    expect(content).toContain('<circle');
  });

  it('should return original string for SVG without group', () => {
    const content = extractContent('<svg></svg>');
    expect(content).toBe('<svg></svg>');
  });

  it('should handle multiline content', () => {
    const svg = '<svg><g class="head">\n  <path d="M 0 0"/>\n  <circle r="5"/>\n</g></svg>';
    const content = extractContent(svg);
    expect(content).toContain('<path');
    expect(content).toContain('<circle');
  });
});

describe('composeSvg', () => {
  // Load real SVG parts for integration tests
  const partsDir = path.join(import.meta.dirname, '..', 'svg', 'parts');
  
  function loadPart(type, singular, index) {
    try {
      return fs.readFileSync(path.join(partsDir, type, singular + '-' + index + '.svg'), 'utf8');
    } catch {
      return '<svg><g class="empty"></g></svg>';
    }
  }

  function loadPartsForBuckets(buckets) {
    const [bodyStyle, headStyle, eyeStyle, mouthStyle, accStyle] = buckets;
    return {
      head: loadPart('heads', 'head', headStyle),
      body: loadPart('bodies', 'body', bodyStyle),
      eyes: loadPart('eyes', 'eye', eyeStyle),
      mouth: loadPart('mouths', 'mouth', mouthStyle),
      accessory: loadPart('accessories', 'accessory', accStyle),
    };
  }

  it('should return a valid SVG string', () => {
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0];
    const parts = loadPartsForBuckets(buckets);
    const svg = composeSvg(parts, buckets);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox="0 0 300 300"');
  });

  it('should include style block with colors', () => {
    const buckets = [0, 0, 0, 0, 0, 7, 0, 0]; // bhColor=7 → hue 120 (green)
    const parts = loadPartsForBuckets(buckets);
    const svg = composeSvg(parts, buckets);
    expect(svg).toContain('<style>');
    expect(svg).toContain('hsl(120');
  });

  it('should include all part layers', () => {
    const buckets = [3, 5, 7, 2, 1, 0, 5, 3];
    const parts = loadPartsForBuckets(buckets);
    const svg = composeSvg(parts, buckets);
    expect(svg).toContain('class="body-layer"');
    expect(svg).toContain('class="head-layer"');
    expect(svg).toContain('class="mouth-layer"');
    expect(svg).toContain('class="eyes-layer"');
    expect(svg).toContain('class="accessory-layer"');
  });

  it('should produce different SVGs for different buckets', () => {
    const b1 = [0, 0, 0, 0, 0, 0, 0, 0];
    const b2 = [9, 9, 9, 9, 9, 9, 9, 9];
    const svg1 = composeSvg(loadPartsForBuckets(b1), b1);
    const svg2 = composeSvg(loadPartsForBuckets(b2), b2);
    expect(svg1).not.toBe(svg2);
  });

  it('should be deterministic - same buckets = same SVG', () => {
    const buckets = [7, 7, 3, 1, 4, 9, 7, 6];
    const parts = loadPartsForBuckets(buckets);
    const svg1 = composeSvg(parts, buckets);
    const svg2 = composeSvg(parts, buckets);
    expect(svg1).toBe(svg2);
  });

  it('should use different accent color from main color', () => {
    const buckets = [0, 0, 0, 0, 0, 0, 5, 0]; // bhColor=0 (hue 200), emColor=5 (hue 30)
    const parts = loadPartsForBuckets(buckets);
    const svg = composeSvg(parts, buckets);
    expect(svg).toContain('hsl(200'); // main
    expect(svg).toContain('hsl(30');  // accent
  });
});

describe('SVG part files', () => {
  const partsDir = path.join(import.meta.dirname, '..', 'svg', 'parts');
  const partTypes = [
    { dir: 'heads', prefix: 'head' },
    { dir: 'bodies', prefix: 'body' },
    { dir: 'eyes', prefix: 'eye' },
    { dir: 'mouths', prefix: 'mouth' },
    { dir: 'accessories', prefix: 'accessory' },
  ];

  for (const { dir, prefix } of partTypes) {
    describe(dir, () => {
      for (let i = 0; i < 10; i++) {
        it(prefix + '-' + i + ' should exist and be valid SVG', () => {
          const filePath = path.join(partsDir, dir, prefix + '-' + i + '.svg');
          expect(fs.existsSync(filePath)).toBe(true);
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content).toContain('<svg');
          expect(content).toContain('</svg>');
          expect(content).toContain('viewBox="0 0 300 300"');
        });

        it(prefix + '-' + i + ' should have extractable content', () => {
          const filePath = path.join(partsDir, dir, prefix + '-' + i + '.svg');
          const content = fs.readFileSync(filePath, 'utf8');
          const extracted = extractContent(content);
          expect(extracted.length).toBeGreaterThan(0);
        });
      }
    });
  }
});
