import { describe, it, expect } from 'vitest';
import { composeSvg, recolor, COLORS, colorScheme, generateStyles, extractContent } from './svg-render.js';
import fs from 'fs';
import path from 'path';

describe('COLORS', () => {
  it('should have 10 color entries', () => {
    expect(COLORS).toHaveLength(10);
  });

  it('should all have valid h, s, l values', () => {
    COLORS.forEach(c => {
      expect(c.h).toBeGreaterThanOrEqual(0);
      expect(c.h).toBeLessThanOrEqual(360);
      expect(c.s).toBeGreaterThanOrEqual(0);
      expect(c.s).toBeLessThanOrEqual(100);
      expect(c.l).toBeGreaterThanOrEqual(0);
      expect(c.l).toBeLessThanOrEqual(100);
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
});

describe('recolor', () => {
  it('should replace placeholder colors with derived colors', () => {
    const content = '<path fill="#1a1a1a"/><path fill="#ffffff"/>';
    const result = recolor(content, COLORS[0], COLORS[5]);
    expect(result).not.toContain('#1a1a1a');
    expect(result).not.toContain('#ffffff');
    expect(result).toContain('hsl(');
  });
});

describe('composeSvg', () => {
  const tracedDir = path.join(import.meta.dirname, '..', 'svg', 'parts-traced');
  const prefixes = { head: 'head', body: 'body', eyes: 'eye', mouth: 'mouth', accessory: 'accessory' };
  const dirs = { head: 'heads', body: 'bodies', eyes: 'eyes', mouth: 'mouths', accessory: 'accessories' };

  function loadParts() {
    const result = {};
    for (const [key, dir] of Object.entries(dirs)) {
      result[key] = [];
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(tracedDir, dir, `${prefixes[key]}-${i}.svg`);
        try {
          result[key].push(fs.readFileSync(filePath, 'utf8'));
        } catch {
          result[key].push('<svg><g class="empty"></g></svg>');
        }
      }
    }
    return result;
  }

  it('should return a valid SVG string', () => {
    const parts = loadParts();
    const svg = composeSvg(parts, [0, 0, 0, 0, 0, 0, 0, 0]);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('should include style block with correct hue', () => {
    const parts = loadParts();
    const svg = composeSvg(parts, [0, 0, 0, 0, 0, 7, 0, 0]);
    expect(svg).toContain('<style>');
    expect(svg).toContain('hsl(358');
  });

  it('should include all part layers', () => {
    const parts = loadParts();
    const svg = composeSvg(parts, [3, 5, 7, 2, 1, 0, 5, 3]);
    expect(svg).toContain('class="body-layer"');
    expect(svg).toContain('class="head-layer"');
    expect(svg).toContain('class="mouth-layer"');
    expect(svg).toContain('class="eyes-layer"');
    expect(svg).toContain('class="accessory-layer"');
  });

  it('should produce different SVGs for different buckets', () => {
    const parts = loadParts();
    const svg1 = composeSvg(parts, [0, 0, 0, 0, 0, 0, 0, 0]);
    const svg2 = composeSvg(parts, [9, 9, 9, 9, 9, 9, 9, 9]);
    expect(svg1).not.toBe(svg2);
  });

  it('should be deterministic', () => {
    const parts = loadParts();
    const buckets = [7, 4, 0, 0, 9, 2, 8, 9];
    expect(composeSvg(parts, buckets)).toBe(composeSvg(parts, buckets));
  });

  it('should use different accent color from main color', () => {
    const parts = loadParts();
    const svg = composeSvg(parts, [0, 0, 0, 0, 0, 0, 5, 0]);
    expect(svg).toContain('hsl(198'); // main (blue)
    expect(svg).toContain('hsl(331'); // accent (pink)
  });
});

describe('SVG traced part files', () => {
  const tracedDir = path.join(import.meta.dirname, '..', 'svg', 'parts-traced');
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
        it(`${prefix}-${i} should exist and be valid SVG`, () => {
          const filePath = path.join(tracedDir, dir, `${prefix}-${i}.svg`);
          expect(fs.existsSync(filePath)).toBe(true);
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content).toContain('<svg');
          expect(content).toContain('</svg>');
        });
      }
    });
  }
});

describe('SVG hand-drawn part files', () => {
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
        it(`${prefix}-${i} should exist and be valid SVG`, () => {
          const filePath = path.join(partsDir, dir, `${prefix}-${i}.svg`);
          expect(fs.existsSync(filePath)).toBe(true);
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content).toContain('<svg');
          expect(content).toContain('</svg>');
        });
      }
    });
  }
});
