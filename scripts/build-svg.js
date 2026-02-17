#!/usr/bin/env node
/**
 * Build script: reads all 50 SVG parts and outputs:
 *   dist/robojs-svg.js    — renderer + loader (small, ~5KB)
 *   dist/robojs-parts.json — all 50 SVG parts data
 *   dist/robojs-svg.min.js — single file bundle (large, for CDN/offline)
 *   dist/demo.html         — interactive demo
 *
 * Usage: node scripts/build-svg.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const partsDir = join(root, 'svg', 'parts-traced');
const distDir = join(root, 'dist');

mkdirSync(distDir, { recursive: true });

const PART_TYPES = [
  { key: 'body', dir: 'bodies', prefix: 'body' },
  { key: 'head', dir: 'heads', prefix: 'head' },
  { key: 'eye', dir: 'eyes', prefix: 'eye' },
  { key: 'mouth', dir: 'mouths', prefix: 'mouth' },
  { key: 'accessory', dir: 'accessories', prefix: 'accessory' },
];

function extractInner(svg) {
  svg = svg.replace(/<\?xml[^?]*\?>\s*/g, '');
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return match ? match[1].trim() : svg;
}

// Read all parts
const parts = {};
for (const { key, dir, prefix } of PART_TYPES) {
  parts[key] = [];
  for (let i = 0; i < 10; i++) {
    const file = join(partsDir, dir, `${prefix}-${i}.svg`);
    const raw = readFileSync(file, 'utf-8');
    parts[key].push(extractInner(raw));
  }
}

// Write parts JSON
writeFileSync(join(distDir, 'robojs-parts.json'), JSON.stringify(parts));
console.log('Built dist/robojs-parts.json (' + (Buffer.byteLength(JSON.stringify(parts)) / 1024).toFixed(1) + ' KB)');

// Update demo.html
const demoHtml = `<!DOCTYPE html>
<html>
<head>
  <title>RoboJS SVG Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    .robots { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 20px; }
    .robot-card { text-align: center; }
    .robot-card svg { width: 150px; height: 150px; border: 1px solid #eee; border-radius: 8px; }
    .robot-card p { font-size: 12px; color: #666; margin: 4px 0; }
    input { font-size: 18px; padding: 8px 12px; width: 300px; }
    #live svg { width: 200px; height: 200px; }
  </style>
</head>
<body>
  <h1>🤖 RoboJS SVG</h1>
  <p>One script, deterministic robot avatars. Type anything:</p>
  <input id="input" type="text" placeholder="type a name..." value="monteslu" autofocus>
  <div id="live"></div>
  <h2>Gallery</h2>
  <div class="robots" id="gallery"></div>

  <script src="robojs-svg.cjs"></script>
  <script>
    RoboJS.init().then(function() {
      var input = document.getElementById('input');
      var live = document.getElementById('live');
      var gallery = document.getElementById('gallery');
      function update() { live.innerHTML = RoboJS.renderSvg(input.value); }
      input.addEventListener('input', update);
      update();
      ['alice','bob','charlie','dave','eve','frank','grace','heidi','ivan','judy','monteslu','radagast'].forEach(function(name) {
        var card = document.createElement('div');
        card.className = 'robot-card';
        card.innerHTML = RoboJS.renderSvg(name) + '<p>' + name + '</p>';
        gallery.appendChild(card);
      });
    });
  </script>
</body>
</html>`;

writeFileSync(join(distDir, 'demo.html'), demoHtml);

// Renderer JS — UMD for browser <script>, .cjs for Node
const rendererJs = `// RoboJS SVG Renderer — load parts from robojs-parts.json
// Usage (browser): <script src="robojs-svg.js"></script> then RoboJS.init().then(() => { div.innerHTML = RoboJS.renderSvg("name"); })
// Usage (Node): const RoboJS = require('./robojs-svg.js'); await RoboJS.init('./robojs-parts.json'); RoboJS.renderSvg("name");
(function(root, factory) {
  if (typeof define === "function" && define.amd) define([], factory);
  else if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RoboJS = factory();
}(typeof self !== "undefined" ? self : this, function() {
"use strict";

function md5(str) {
  function safeAdd(x, y) { var lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
  function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
  function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[((len + 64) >>> 9 << 4) + 14] = len;
    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (var i = 0; i < x.length; i += 16) {
      var oa = a, ob = b, oc = c, od = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936); d = md5ff(d, a, b, c, x[i+1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i+2], 17, 606105819); b = md5ff(b, c, d, a, x[i+3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i+4], 7, -176418897); d = md5ff(d, a, b, c, x[i+5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i+6], 17, -1473231341); b = md5ff(b, c, d, a, x[i+7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i+8], 7, 1770035416); d = md5ff(d, a, b, c, x[i+9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i+10], 17, -42063); b = md5ff(b, c, d, a, x[i+11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i+12], 7, 1804603682); d = md5ff(d, a, b, c, x[i+13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i+14], 17, -1502002290); b = md5ff(b, c, d, a, x[i+15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i+1], 5, -165796510); d = md5gg(d, a, b, c, x[i+6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i+11], 14, 643717713); b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i+5], 5, -701558691); d = md5gg(d, a, b, c, x[i+10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i+15], 14, -660478335); b = md5gg(b, c, d, a, x[i+4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i+9], 5, 568446438); d = md5gg(d, a, b, c, x[i+14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i+3], 14, -187363961); b = md5gg(b, c, d, a, x[i+8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i+13], 5, -1444681467); d = md5gg(d, a, b, c, x[i+2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i+7], 14, 1735328473); b = md5gg(b, c, d, a, x[i+12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i+5], 4, -378558); d = md5hh(d, a, b, c, x[i+8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i+11], 16, 1839030562); b = md5hh(b, c, d, a, x[i+14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i+1], 4, -1530992060); d = md5hh(d, a, b, c, x[i+4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i+7], 16, -155497632); b = md5hh(b, c, d, a, x[i+10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i+13], 4, 681279174); d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i+3], 16, -722521979); b = md5hh(b, c, d, a, x[i+6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i+9], 4, -640364487); d = md5hh(d, a, b, c, x[i+12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i+15], 16, 530742520); b = md5hh(b, c, d, a, x[i+2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844); d = md5ii(d, a, b, c, x[i+7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i+14], 15, -1416354905); b = md5ii(b, c, d, a, x[i+5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i+12], 6, 1700485571); d = md5ii(d, a, b, c, x[i+3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i+10], 15, -1051523); b = md5ii(b, c, d, a, x[i+1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i+8], 6, 1873313359); d = md5ii(d, a, b, c, x[i+15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i+6], 15, -1560198380); b = md5ii(b, c, d, a, x[i+13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i+4], 6, -145523070); d = md5ii(d, a, b, c, x[i+11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i+2], 15, 718787259); b = md5ii(b, c, d, a, x[i+9], 21, -343485551);
      a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
    }
    return [a, b, c, d];
  }
  function rstrMD5(s) {
    var bin = binlMD5(str2binl(s), s.length * 8);
    var out = "";
    for (var i = 0; i < bin.length * 32; i += 8) out += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & 0xff);
    return out;
  }
  function str2binl(str) {
    var bin = [];
    for (var i = 0; i < str.length * 8; i += 8) bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << (i % 32);
    return bin;
  }
  function rstr2hex(input) {
    var hex = "0123456789abcdef", output = "";
    for (var i = 0; i < input.length; i++) { var x = input.charCodeAt(i); output += hex.charAt((x >>> 4) & 0x0f) + hex.charAt(x & 0x0f); }
    return output;
  }
  function rstrMD5str(s) {
    var utf8 = unescape(encodeURIComponent(s));
    return rstr2hex(rstrMD5(utf8));
  }
  return rstrMD5str(str);
}

var COLORS = [
  {h:198,s:75,l:51},{h:26,s:40,l:39},{h:129,s:53,l:46},{h:216,s:3,l:66},{h:32,s:92,l:54},
  {h:331,s:100,l:64},{h:301,s:57,l:36},{h:358,s:85,l:52},{h:240,s:4,l:95},{h:56,s:94,l:58}
];
var SOURCE_HUES = {body:129,head:129,eye:198,mouth:198,accessory:198};
var PARTS = null;

function hexToBytes(hex) {
  var bytes = [];
  for (var i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.substring(i, i + 2), 16));
  return bytes;
}

function getBuckets(hash) {
  var clean = hash.replace(/-/g, "");
  var bytes = hexToBytes(clean);
  var buckets = [];
  for (var i = 0; i < bytes.length; i += 2) buckets.push(((bytes[i] << 8) + bytes[i + 1]) % 10);
  return buckets;
}

function renderBuckets(buckets) {
  if (!PARTS) throw new Error("RoboJS: call init() first or pass parts to setParts()");
  var bodyIdx = buckets[0], headIdx = buckets[1], eyeIdx = buckets[2];
  var mouthIdx = buckets[3], accIdx = buckets[4];
  var bhColor = buckets[5], emColor = buckets[6], accColor = buckets[7];
  var bhHue  = (COLORS[bhColor]  || COLORS[0]).h;
  var emHue  = (COLORS[emColor]  || COLORS[0]).h;
  var accHue = (COLORS[accColor] || COLORS[0]).h;
  var fid = 0;
  function hf(src, tgt) {
    var id = "hue" + (fid++);
    return { id: id, def: '<filter id="' + id + '"><feColorMatrix type="hueRotate" values="' + (tgt - src) + '"/></filter>' };
  }
  var bf = hf(SOURCE_HUES.body, bhHue), hef = hf(SOURCE_HUES.head, bhHue);
  var ef = hf(SOURCE_HUES.eye, emHue), mf = hf(SOURCE_HUES.mouth, emHue);
  var af = hf(SOURCE_HUES.accessory, accHue);
  var defs = "<defs>" + bf.def + hef.def + ef.def + mf.def + af.def + "</defs>";
  var layers = [
    [PARTS.body[bodyIdx], bf.id], [PARTS.head[headIdx], hef.id],
    [PARTS.mouth[mouthIdx], mf.id], [PARTS.eye[eyeIdx], ef.id],
    [PARTS.accessory[accIdx], af.id]
  ];
  var inner = "";
  for (var i = 0; i < layers.length; i++) {
    if (layers[i][0]) inner += '<g filter="url(#' + layers[i][1] + ')">' + layers[i][0] + "</g>";
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' + defs + inner + "</svg>";
}

function renderSvgHash(hash) {
  if (!hash || hash.length < 32) hash = md5(hash || "");
  return renderBuckets(getBuckets(hash));
}

function renderSvg(input) {
  return renderBuckets(getBuckets(md5(input || "")));
}

function setParts(p) { PARTS = p; }

function init(partsUrl) {
  if (PARTS) return Promise.resolve();
  if (!partsUrl) partsUrl = "robojs-parts.json";
  if (typeof process !== "undefined" && typeof require !== "undefined") {
    // Node.js — use fs
    var fs = require("fs");
    var path = require("path");
    var resolved = path.resolve(partsUrl);
    PARTS = JSON.parse(fs.readFileSync(resolved, "utf-8"));
    return Promise.resolve();
  } else if (typeof fetch !== "undefined") {
    return fetch(partsUrl).then(function(r) { return r.json(); }).then(function(p) { PARTS = p; });
  }
  return Promise.reject(new Error("Cannot load parts: no fetch or require"));
}

return {
  init: init,
  setParts: setParts,
  renderSvg: renderSvg,
  renderSvgHash: renderSvgHash,
  renderBuckets: renderBuckets,
  getBuckets: getBuckets,
  COLORS: COLORS,
  md5: md5
};

}));
`;

// Write as .cjs (works in Node with "type":"module" packages + browser <script>)
writeFileSync(join(distDir, 'robojs-svg.cjs'), rendererJs);
console.log('Built dist/robojs-svg.cjs (' + (Buffer.byteLength(rendererJs) / 1024).toFixed(1) + ' KB)');

// Also write ESM wrapper
const esmJs = `// RoboJS SVG Renderer — ESM wrapper
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const RoboJS = require('./robojs-svg.cjs');
export default RoboJS;
export const { init, setParts, renderSvg, renderSvgHash, renderBuckets, getBuckets, md5, COLORS } = RoboJS;
`;
writeFileSync(join(distDir, 'robojs-svg.js'), esmJs);
console.log('Built dist/robojs-svg.js (ESM wrapper)');
