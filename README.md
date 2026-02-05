# RoboJS 🤖

Deterministic robot avatar generator for the browser. Takes any string, MD5 hashes it, and renders a unique robot avatar on canvas.

Uses the wonderful robot images from [robohash.org](https://robohash.org).

[![CI](https://github.com/monteslu/robojs/actions/workflows/ci.yml/badge.svg)](https://github.com/monteslu/robojs/actions/workflows/ci.yml)

## Installation

```bash
npm install robojs
```

## Usage

### ES Module (recommended)

```javascript
import { createRobo } from 'robojs';

const canvas = document.getElementById('canvas');
const robo = await createRobo(canvas, 'path/to/set1.png');

// Render from any string
robo.render('username@example.com');

// Or render from a pre-computed MD5 hash
robo.renderHash('098f6bcd4621d373cade4e832627b4f6');
```

### Direct functions

```javascript
import { render, renderHash, getBuckets } from 'robojs';
import md5 from 'blueimp-md5';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const spriteSheet = document.getElementById('spriteSheet');

// Render directly
render(ctx, spriteSheet, 'any string');

// Get bucket values for custom rendering
const hash = md5('test');
const buckets = getBuckets(hash);
// buckets = [0-9, 0-9, 0-9, 0-9, 0-9, 0-9, 0-9, 0-9]
```

## API

### `createRobo(canvas, spriteSheetUrl)`

Creates a RoboJS instance bound to a canvas.

- `canvas` - HTMLCanvasElement to render to
- `spriteSheetUrl` - URL to the sprite sheet image (default: 'set1.png')
- Returns: `Promise<{ render, renderHash, getBuckets }>`

### `getBuckets(hash)`

Convert an MD5 hash to bucket indices for robot part selection.

- `hash` - MD5 hex string (32 chars)
- Returns: `number[]` - Array of 8 values (0-9)

### `render(context, spriteSheet, input)`

Render a robot avatar from any input string.

### `renderHash(context, spriteSheet, hash)`

Render a robot avatar from an MD5 hash.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Start demo server
npm start
```

## License

MIT
