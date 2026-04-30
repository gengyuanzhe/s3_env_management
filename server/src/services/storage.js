import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../../data');

function filePath(filename) {
  return path.join(DATA_DIR, filename);
}

export async function readJson(filename) {
  try {
    const content = await fs.readFile(filePath(filename), 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeJson(filename, data) {
  await fs.writeFile(filePath(filename), JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

export async function getById(filename, id) {
  const items = await readJson(filename);
  return items.find(item => item.id === id) || null;
}

export async function addItem(filename, item) {
  const items = await readJson(filename);
  items.push(item);
  await writeJson(filename, items);
  return item;
}

export async function updateItem(filename, id, updates) {
  const items = await readJson(filename);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  await writeJson(filename, items);
  return items[index];
}

export async function deleteItem(filename, id) {
  const items = await readJson(filename);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  await writeJson(filename, filtered);
  return true;
}
