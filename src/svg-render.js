/**
 * RoboJS SVG Renderer
 * Composes robot avatars from SVG part templates with hash-driven colors
 * 
 * @module svg-render
 */

/**
 * Color palette mapping bucket index (0-9) to hue degrees
 * Matches the sprite sheet color groups
 */
const COLOR_HUES = [200, 180, 270, 0, 190, 30, 45, 120, 220, 25];

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
export function recolor(content, mainHue, accentHue) {
  const outline = `hsl(${mainHue}, 15%, 20%)`;
  const fill = `hsl(${mainHue}, 70%, 50%)`;
  const highlight = `hsl(${mainHue}, 60%, 70%)`;
  const shadow = `hsl(${mainHue}, 70%, 35%)`;
  const accent = `hsl(${accentHue}, 85%, 60%)`;

  return content
    .replaceAll('#1a1a1a', outline)
    .replaceAll('#ffffff', fill)
    .replaceAll('#4ade80', highlight)
    .replaceAll('#d1d5db', shadow)
    .replaceAll('#ef4444', accent)
    .replaceAll('#3b82f6', accent);
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

  const mainHue = COLOR_HUES[bhColor] || 120;
  const accentHue = COLOR_HUES[emColor] || 45;
  const styles = generateStyles(mainHue, accentHue);

  const headContent = recolor(extractContent(parts.head), mainHue, accentHue);
  const bodyContent = recolor(extractContent(parts.body), mainHue, accentHue);
  const eyeContent = recolor(extractContent(parts.eyes), mainHue, accentHue);
  const mouthContent = recolor(extractContent(parts.mouth), mainHue, accentHue);
  const accContent = recolor(extractContent(parts.accessory), mainHue, accentHue);

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
export { COLOR_HUES, colorScheme, generateStyles, extractContent };
