import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function ensure(file, initial) {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) fs.writeFileSync(full, JSON.stringify(initial, null, 2));
  return full;
}

const FP_FILE = ensure('fingerprints.json', []);
const WT_FILE = ensure('wiretaps.json', []);

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf-8'));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

export const db = {
  fingerprints: {
    list: () => read(FP_FILE),
    add: (item) => { const l = read(FP_FILE); l.push(item); write(FP_FILE, l); return item; },
    remove: (id) => { const l = read(FP_FILE).filter((x) => x.id !== id); write(FP_FILE, l); },
    findByFilename: (name) => read(FP_FILE).find((x) => x.filename === name),
  },
  wiretaps: {
    list: () => read(WT_FILE),
    add: (item) => { const l = read(WT_FILE); l.push(item); write(WT_FILE, l); return item; },
    remove: (id) => { const l = read(WT_FILE).filter((x) => x.id !== id); write(WT_FILE, l); },
    find: (id) => read(WT_FILE).find((x) => x.id === id),
  },
};
