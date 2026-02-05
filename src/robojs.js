/**
 * RoboJS - Deterministic robot avatar generator
 * Takes any string, MD5 hashes it, renders a unique robot avatar
 * 
 * @module robojs
 */

import md5 from 'blueimp-md5';

/**
 * Convert a hex string to an array of bytes
 * @param {string} hex - Hex string (32 chars for MD5)
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert MD5 hash to bucket indices (0-9) for robot part selection
 * @param {string} hash - MD5 hex string
 * @returns {number[]} Array of 8 bucket values (0-9)
 */
export function getBuckets(hash) {
  // Strip any dashes (e.g., from UUIDs)
  const cleanHash = hash.replace(/-/g, '');
  const bytes = hexToBytes(cleanHash);
  
  // Group bytes into pairs and convert to bucket indices
  const buckets = [];
  for (let i = 0; i < bytes.length; i += 2) {
    const value = (bytes[i] << 8) + bytes[i + 1];
    buckets.push(value % 10);
  }
  
  return buckets;
}

/**
 * Render robot avatar to canvas
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {HTMLImageElement} spriteSheet - Robot parts sprite sheet
 * @param {number[]} buckets - Array of 8 bucket values
 */
export function renderBuckets(context, spriteSheet, buckets) {
  const [
    bodyStyle,
    headStyle,
    eyeStyle,
    mouthStyle,
    accStyle,
    bhColor,
    emColor,
    accColor
  ] = buckets;

  const SIZE = 300;
  const COLOR_HEIGHT = 1500;

  context.clearRect(0, 0, SIZE, SIZE);

  // Body
  context.drawImage(spriteSheet, SIZE * bodyStyle, COLOR_HEIGHT * bhColor + 900, SIZE, SIZE, 0, 0, SIZE, SIZE);
  // Head
  context.drawImage(spriteSheet, SIZE * headStyle, COLOR_HEIGHT * bhColor + 1200, SIZE, SIZE, 0, 0, SIZE, SIZE);
  // Mouth
  context.drawImage(spriteSheet, SIZE * mouthStyle, COLOR_HEIGHT * emColor, SIZE, SIZE, 0, 0, SIZE, SIZE);
  // Eyes
  context.drawImage(spriteSheet, SIZE * eyeStyle, COLOR_HEIGHT * emColor + 300, SIZE, SIZE, 0, 0, SIZE, SIZE);
  // Accessory
  context.drawImage(spriteSheet, SIZE * accStyle, COLOR_HEIGHT * accColor + 600, SIZE, SIZE, 0, 0, SIZE, SIZE);
}

/**
 * Render robot avatar from a hash string
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {HTMLImageElement} spriteSheet - Robot parts sprite sheet
 * @param {string} hash - MD5 hex string (32 chars)
 */
export function renderHash(context, spriteSheet, hash) {
  let validHash = hash;
  if (!hash || hash.length < 32) {
    validHash = md5(hash || '');
  }
  const buckets = getBuckets(validHash);
  renderBuckets(context, spriteSheet, buckets);
}

/**
 * Render robot avatar from any input string
 * @param {CanvasRenderingContext2D} context - Canvas 2D context
 * @param {HTMLImageElement} spriteSheet - Robot parts sprite sheet
 * @param {string} input - Any string to hash
 */
export function render(context, spriteSheet, input) {
  const hash = md5(input || '');
  renderHash(context, spriteSheet, hash);
}

/**
 * Create a RoboJS instance bound to a canvas
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {string} spriteSheetUrl - URL to sprite sheet image
 * @returns {Promise<{render: Function, renderHash: Function}>}
 */
export async function createRobo(canvas, spriteSheetUrl = 'set1.png') {
  const context = canvas.getContext('2d');
  
  const spriteSheet = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load sprite sheet'));
    img.src = spriteSheetUrl;
  });

  return {
    render: (input) => render(context, spriteSheet, input),
    renderHash: (hash) => renderHash(context, spriteSheet, hash),
    getBuckets
  };
}

export default { render, renderHash, renderBuckets, getBuckets, createRobo };
