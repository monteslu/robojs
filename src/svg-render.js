/**
 * RoboJS SVG Renderer
 * Composes robot avatars from SVG part templates with hash-driven colors
 * 
 * @module svg-render
 */

/**
 * Color palette sampled from sprite sheet color groups
 * Each entry has { h, s, l } matching the actual set1.png colors
 */
const COLORS = [
  { h: 198, s: 75, l: 51 },  // 0: Blue
  { h: 26,  s: 40, l: 39 },  // 1: Brown
  { h: 129, s: 53, l: 46 },  // 2: Green
  { h: 216, s: 3,  l: 66 },  // 3: Gray
  { h: 32,  s: 92, l: 54 },  // 4: Orange
  { h: 331, s: 100,l: 64 },  // 5: Pink
  { h: 301, s: 57, l: 36 },  // 6: Purple
  { h: 358, s: 85, l: 52 },  // 7: Red
  { h: 240, s: 4,  l: 95 },  // 8: Near-white
  { h: 56,  s: 94, l: 58 },  // 9: Yellow
];

/**
 * Derive a full color scheme from a hue value
 * @param {number} hue - Hue in degrees (0-360)
 * @returns {object} Color scheme with fill, outline, highlight, shadow
 */
function colorScheme(hue) {
  return {
    fill: `hsl(${hue}, 70%, 50%)`,
    outline: `hsl(${hue}, 15%, 20%)`,
    highlight: `hsl(${hue}, 60%, 70%)`,
    shadow: `hsl(${hue}, 70%, 35%)`,
    neck: 'hsl(0, 0%, 55%)',
    neckStroke: 'hsl(0, 0%, 35%)',
  };
}

/**
 * Generate CSS style block for SVG coloring
 * @param {number} mainHue - Main body/head hue
 * @param {number} accentHue - Accent color hue (eyes, teeth)
 * @returns {string} CSS style element
 */
function generateStyles(mainHue, accentHue) {
  const c = colorScheme(mainHue);
  return `<style>
    .outline { fill: ${c.outline}; stroke: ${c.outline}; stroke-width: 2; }
    .fill { fill: ${c.fill}; stroke: none; }
    .highlight { fill: ${c.highlight}; opacity: 0.5; stroke: none; }
    .shadow { fill: ${c.shadow}; opacity: 0.4; stroke: none; }
    .neck { fill: ${c.neck}; stroke: ${c.neckStroke}; stroke-width: 2; }
    .rivet { fill: ${c.outline}; stroke: none; }
    .accent { fill: hsl(${accentHue}, 85%, 60%); stroke: none; }
    .accent-stroke { stroke: hsl(${accentHue}, 85%, 60%); fill: none; }
    line.outline { fill: none; }
  </style>`;
}

/**
 * Replace placeholder inline colors with hash-derived colors
 * Templates use fixed colors for standalone viewing; renderer swaps them
 * @param {string} content - SVG content with placeholder colors
 * @param {number} mainHue - Main hue
 * @param {number} accentHue - Accent hue
 * @returns {string} Recolored SVG content
 */
export function recolor(content, main, accent) {
  const m = typeof main === 'number' ? (COLORS[main] || COLORS[0]) : main;
  const a = typeof accent === 'number' ? (COLORS[accent] || COLORS[9]) : accent;

  const outline = `hsl(${m.h}, ${Math.max(m.s - 40, 10)}%, ${Math.max(m.l - 30, 12)}%)`;
  const fill = `hsl(${m.h}, ${m.s}%, ${m.l}%)`;
  const highlight = `hsl(${m.h}, ${Math.max(m.s - 15, 10)}%, ${Math.min(m.l + 20, 85)}%)`;
  const shadow = `hsl(${m.h}, ${m.s}%, ${Math.max(m.l - 15, 20)}%)`;
  const accentFill = `hsl(${a.h}, ${a.s}%, ${a.l}%)`;

  return content
    .replaceAll('#1a1a1a', outline)
    .replaceAll('#ffffff', fill)
    .replaceAll('#4ade80', highlight)
    .replaceAll('#d1d5db', shadow)
    .replaceAll('#ef4444', accentFill)
    .replaceAll('#3b82f6', accentFill);
}

/**
 * Extract inner SVG content from a part template string
 * @param {string} svgString - Full SVG file content
 * @returns {string} Inner group content
 */
function extractContent(svgString) {
  const match = svgString.match(/<g[^>]*>([\s\S]*?)<\/g>/);
  return match ? match[1] : svgString;
}

/**
 * Compose a complete robot SVG from part templates and bucket values
 * 
 * @param {object} parts - Object with SVG content strings: { head, body, eyes, mouth, accessory }
 * @param {number[]} buckets - 8 bucket values from getBuckets()
 * @returns {string} Complete SVG string
 */
export function composeSvg(parts, buckets) {
  const [,,,, , bhColor, emColor] = buckets;

  const main = COLORS[bhColor] || COLORS[0];
  const accent = COLORS[emColor] || COLORS[9];
  const styles = generateStyles(main.h, accent.h);

  const headContent = recolor(extractContent(parts.head), main, accent);
  const bodyContent = recolor(extractContent(parts.body), main, accent);
  const eyeContent = recolor(extractContent(parts.eyes), main, accent);
  const mouthContent = recolor(extractContent(parts.mouth), main, accent);
  const accContent = recolor(extractContent(parts.accessory), main, accent);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  ${styles}
  <g class="robot">
    <g class="body-layer" transform="translate(15, 80) scale(0.9)">${bodyContent}</g>
    <g class="head-layer" transform="translate(22, -10) scale(0.85)">${headContent}</g>
    <g class="mouth-layer" transform="translate(22, -10) scale(0.85)">${mouthContent}</g>
    <g class="eyes-layer" transform="translate(22, -10) scale(0.85)">${eyeContent}</g>
    <g class="accessory-layer" transform="translate(22, -10) scale(0.85)">${accContent}</g>
  </g>
</svg>`;
}

/**
 * Color hues exported for external use
 */
export { COLORS, colorScheme, generateStyles, extractContent };
