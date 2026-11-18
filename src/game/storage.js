const KEY = 'slot08.records.v1';
export class RecordStore {
  constructor(storage) {
    this.storage = storage; this.data = {};
    try {
      const value = JSON.parse(storage?.getItem(KEY) || '{}');
      for (const key of ['time', 'race']) if (Number.isFinite(value?.[key]) && value[key] > 0) this.data[key] = value[key];
    } catch { /* Storage can be blocked in private browsers. The game still works. */ }
  }
  get(mode) { return this.data[mode] ?? Infinity; }
  save(mode, time) {
    if (!Number.isFinite(time) || time <= 0 || time >= this.get(mode)) return false;
    this.data[mode] = time;
    try { this.storage?.setItem(KEY, JSON.stringify(this.data)); } catch { /* Session-only record. */ }
    return true;
  }
}
