# RoboJS SVG Spec — Bit Allocation

## Overview

128 bits from MD5 hash → deterministic robot avatar rendered as SVG.

Single color scheme per robot. SVG templates with fill/outline/highlight driven by hash bits.

## Bit Allocation (128 bits total)

### Color Scheme (16 bits)
| Bits | Field | Range | Description |
|------|-------|-------|-------------|
| 0-7 | `hue` | 0-255 | Base hue (mapped to 0-360°) |
| 8-11 | `saturation` | 0-15 | Saturation modifier (60-100%) |
| 12-15 | `lightness` | 0-15 | Lightness modifier (40-65%) |

**Derived colors (computed, not stored):**
- **Fill:** `hsl(hue, sat%, light%)`
- **Outline:** same hue, 15% saturation, 20% lightness (dark, nearly black-brown)
- **Highlight:** same hue, sat-10%, light+20% (lighter accent)
- **Accent color** (eyes, teeth, details): see bits 80-95

### Part Selection — v1 (20 bits, 10 variations each)
| Bits | Field | Range | Description |
|------|-------|-------|-------------|
| 16-19 | `headShape` | 0-9 | Head template (10 shapes) |
| 20-23 | `bodyShape` | 0-9 | Body template |
| 24-27 | `eyeShape` | 0-9 | Eye template |
| 28-31 | `mouthShape` | 0-9 | Mouth template |
| 32-35 | `accessoryShape` | 0-9 | Accessory template |

### Part Selection — v2 expansion (use full 4 bits = 16 variations)
Same bit positions, but `0-15` range when we have 16 templates per part.

### Accent / Secondary Color (16 bits)
| Bits | Field | Range | Description |
|------|-------|-------|-------------|
| 80-87 | `accentHue` | 0-255 | Accent hue (eyes, teeth, antenna tips) |
| 88-91 | `accentSat` | 0-15 | Accent saturation |
| 92-95 | `accentLight` | 0-15 | Accent lightness (biased brighter: 55-85%) |

### Surface Details (20 bits)
| Bits | Field | Range | Description |
|------|-------|-------|-------------|
| 36-39 | `rivetStyle` | 0-15 | Rivet/bolt pattern on head |
| 40-43 | `panelLines` | 0-15 | Panel line pattern on body |
| 44-47 | `eyeSize` | 0-15 | Eye scale modifier (80-120%) |
| 48-51 | `mouthWidth` | 0-15 | Mouth scale modifier |
| 52-55 | `accPlacement` | 0-15 | Accessory position offset |

### Transforms (16 bits)
| Bits | Field | Range | Description |
|------|-------|-------|-------------|
| 56-59 | `headTilt` | 0-15 | Slight head rotation (-8° to +7°) |
| 60-63 | `eyeAsymmetry` | 0-15 | Left/right eye size difference |
| 64-67 | `bodyWidth` | 0-15 | Body scale X (90-110%) |
| 68-71 | `accRotation` | 0-15 | Accessory rotation |

### Reserved (24 bits)
| Bits | Field | Description |
|------|-------|-------------|
| 72-79 | `reserved1` | Future use (antenna style? background?) |
| 96-103 | `reserved2` | Future use |
| 104-111 | `reserved3` | Future use |
| 112-119 | `reserved4` | Future use |
| 120-127 | `reserved5` | Future use |

## SVG Template Structure

Each part is an SVG `<g>` element with CSS classes:

```svg
<g id="head-3" class="part head">
  <path class="outline" d="M..."/>   <!-- dark outline stroke -->
  <path class="fill" d="M..."/>      <!-- main body fill -->
  <path class="highlight" d="M..."/> <!-- lighter accent/reflection -->
  <circle class="rivet" .../>        <!-- optional rivets -->
</g>
```

At render time, CSS variables inject colors:
```css
:root {
  --fill: hsl(120, 80%, 50%);
  --outline: hsl(120, 15%, 20%);
  --highlight: hsl(120, 70%, 70%);
  --accent: hsl(45, 90%, 65%);
}
.fill { fill: var(--fill); }
.outline { fill: var(--outline); stroke: var(--outline); }
.highlight { fill: var(--highlight); }
.accent { fill: var(--accent); }
```

## Rendering Pipeline

1. Hash input string → MD5 (128 bits)
2. Extract bit fields per allocation table
3. Compute color scheme from hue/sat/light bits
4. Select part templates from shape bits
5. Apply transforms (tilt, scale, asymmetry)
6. Compose SVG: body → head → mouth → eyes → accessory (back to front)
7. Inject CSS color variables
8. Output as SVG string or render to canvas via `<img>` or inline SVG

## Backward Compatibility

v1 maintains same part selection as current sprite sheet (10 variations per part).
`getBuckets()` output can map to v1 SVG parts for visual parity.

## File Structure

```
svg/
  parts/
    heads/     # head-0.svg through head-9.svg (v1) or head-15.svg (v2)
    bodies/
    eyes/
    mouths/
    accessories/
  render.js    # SVG composition + color injection
```
