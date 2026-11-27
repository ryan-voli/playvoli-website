// A QR code drawn at build time, so a desktop visitor can scan their way to
// the app with no script, no modal and no outside service: the code is plain
// SVG in the page.
//
// Deliberately small: version 3 (29 x 29 modules), error correction M, byte
// mode. That holds 42 bytes, enough for https://playvoli.com/download.
const SIZE = 29;
const DATA_CODEWORDS = 44;
const EC_CODEWORDS = 26;

// GF(256) arithmetic for Reed-Solomon, polynomial 0x11D.
const mul = (x: number, y: number) => {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
};

const reedSolomon = (data: number[]) => {
  const gen: number[] = new Array(EC_CODEWORDS).fill(0);
  gen[EC_CODEWORDS - 1] = 1;
  let root = 1;
  for (let i = 0; i < EC_CODEWORDS; i++) {
    for (let j = 0; j < EC_CODEWORDS; j++) {
      gen[j] = mul(gen[j], root);
      if (j + 1 < EC_CODEWORDS) gen[j] ^= gen[j + 1];
    }
    root = mul(root, 2);
  }
  const rem: number[] = new Array(EC_CODEWORDS).fill(0);
  for (const b of data) {
    const factor = b ^ (rem.shift() as number);
    rem.push(0);
    gen.forEach((g, i) => { rem[i] ^= mul(g, factor); });
  }
  return rem;
};

/** The modules of a QR code for `text`: rows of booleans, true = dark. */
export const qrMatrix = (text: string): boolean[][] => {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > 42) throw new Error('qr: text is longer than a version 3-M code holds');

  // Byte mode, the length, the bytes, a terminator, then padding.
  const bits: number[] = [];
  const push = (value: number, length: number) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, 8);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < DATA_CODEWORDS * 8; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((n, b) => (n << 1) | b, 0));
  const codewords = [...data, ...reedSolomon(data)];

  const dark: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  const fixed: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));
  const set = (x: number, y: number, on: boolean) => { dark[y][x] = on; fixed[y][x] = true; };

  // Timing lines, the three finders, the one alignment mark.
  for (let i = 0; i < SIZE; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [SIZE - 4, 3], [3, SIZE - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) set(x, y, d !== 2 && d !== 4);
    }
  }
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(22 + dx, 22 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);

  // Error correction M is 00; the mask number rides beside it, BCH-protected.
  const format = (mask: number) => {
    let rem = mask;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const word = ((mask << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((word >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(SIZE - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, SIZE - 15 + i, bit(i));
    set(8, SIZE - 8, true);
  };
  format(0);

  // The codewords zigzag up and down in two-module columns from the right.
  let n = 0;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < SIZE; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? SIZE - 1 - vert : vert;
        if (!fixed[y][x] && n < codewords.length * 8) {
          dark[y][x] = ((codewords[n >>> 3] >>> (7 - (n & 7))) & 1) === 1;
          n++;
        }
      }
    }
  }

  const MASKS = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const flip = (mask: number) => {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!fixed[y][x] && MASKS[mask](x, y)) dark[y][x] = !dark[y][x];
  };

  // The standard's four penalties, so the chosen mask is the easiest to scan.
  const penalty = () => {
    let score = 0;
    const lines = [...dark, ...dark[0].map((_, x) => dark.map((row) => row[x]))];
    for (const line of lines) {
      let run = 1;
      for (let i = 1; i <= SIZE; i++) {
        if (i < SIZE && line[i] === line[i - 1]) run++;
        else { if (run >= 5) score += run - 2; run = 1; }
      }
      const s = line.map((d) => (d ? '1' : '0')).join('');
      for (const pattern of ['10111010000', '00001011101']) {
        for (let at = s.indexOf(pattern); at !== -1; at = s.indexOf(pattern, at + 1)) score += 40;
      }
    }
    for (let y = 0; y < SIZE - 1; y++) for (let x = 0; x < SIZE - 1; x++) {
      const c = dark[y][x];
      if (c === dark[y][x + 1] && c === dark[y + 1][x] && c === dark[y + 1][x + 1]) score += 3;
    }
    const total = SIZE * SIZE;
    const count = dark.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    score += Math.floor(Math.abs(count * 20 - total * 10) / total) * 10;
    return score;
  };

  let best = 0, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    flip(mask); format(mask);
    const score = penalty();
    if (score < bestScore) { bestScore = score; best = mask; }
    flip(mask);
  }
  flip(best); format(best);
  return dark;
};

/** One SVG path for the dark modules, with the 4-module quiet zone around it. */
export const qrPath = (text: string) => {
  const m = qrMatrix(text);
  const quiet = 4;
  let d = '';
  m.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (!row[x]) continue;
      let w = 1;
      while (x + w < row.length && row[x + w]) w++;
      d += `M${x + quiet} ${y + quiet}h${w}v1h-${w}z`;
      x += w - 1;
    }
  });
  return { d, size: m.length + quiet * 2 };
};
