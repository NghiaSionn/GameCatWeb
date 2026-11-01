import { CatFactory, breedCats, isCat } from './cats.ts';
import type { BattleResult, Cat, PlayerState, StorageLike, StoreOptions } from './types.ts';

export const ECONOMY = Object.freeze({ initialCatnip: 300, gachaCost: 100, breedCost: 150, winReward: 100, lossReward: 25 });
export const SAVE_KEY = 'meow-brawlers:v1';
export class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}
function validState(value: unknown): value is PlayerState {
  if (!value || typeof value !== 'object') return false;
  const s = value as PlayerState;
  if (s.version !== 1 || !Number.isSafeInteger(s.catnip) || s.catnip < 0 || !Array.isArray(s.cats) || s.cats.length < 3 || !s.cats.every(isCat)) return false;
  const ids = new Set(s.cats.map(c => c.id));
  if (ids.size !== s.cats.length || !Array.isArray(s.roster) || s.roster.length !== 3 || new Set(s.roster).size !== 3 || !s.roster.every(id => ids.has(id))) return false;
  return Array.isArray(s.history) && new Set(s.history.map(r => r?.id)).size === s.history.length && s.history.every(r => r && typeof r.id === 'string' && r.id.length > 0
    && (r.winner === 'player' || r.winner === 'enemy') && Number.isSafeInteger(r.turns) && r.turns > 0
    && r.reward === (r.winner === 'player' ? ECONOMY.winReward : ECONOMY.lossReward) && Number.isFinite(r.recordedAt) && r.recordedAt >= 0);
}
export class GameStore {
  private state: PlayerState;
  private storage: StorageLike;
  private options: StoreOptions;
  private listeners = new Set<(state: PlayerState) => void>();
  /** Visible warning allows UI to explain unavailable/corrupt persistence. */
  persistenceWarning: string | null = null;
  constructor(options: StoreOptions | StorageLike = {}) {
    this.options = 'getItem' in options ? { storage: options } : options;
    try { this.storage = this.options.storage ?? globalThis.localStorage ?? new MemoryStorage(); }
    catch { this.storage = new MemoryStorage(); this.persistenceWarning = 'LocalStorage unavailable; using memory'; }
    let loaded: unknown;
    try { const raw = this.storage.getItem(this.options.key ?? SAVE_KEY); if (raw !== null) loaded = JSON.parse(raw); }
    catch { this.persistenceWarning = 'Could not read save; starting a new local game'; }
    if (validState(loaded)) this.state = loaded;
    else {
      if (loaded !== undefined) this.persistenceWarning = 'Invalid save; starting a new local game';
      const factory = new CatFactory(this.options);
      const cats = ['Múp Tiên Phong', 'Ngáo Đột Kích', 'Meme Xạ Thủ'].map(name => factory.createF0(name));
      if (new Set(cats.map(c => c.id)).size !== 3) throw new Error('ID generator must produce unique IDs');
      this.state = { version: 1, catnip: ECONOMY.initialCatnip, cats, roster: cats.map(c => c.id), history: [] };
      this.persist();
    }
  }
  getState(): PlayerState { return structuredClone(this.state); }
  subscribe(listener: (state: PlayerState) => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private persist(): void {
    try { this.storage.setItem(this.options.key ?? SAVE_KEY, JSON.stringify(this.state)); }
    catch { this.persistenceWarning = 'Save failed; changes remain in memory only'; }
  }
  private changed(): void { this.persist(); for (const listener of this.listeners) listener(this.getState()); }
  private addCat(cat: Cat, cost: number): Cat {
    if (this.state.cats.some(c => c.id === cat.id)) throw new Error('ID generator produced a duplicate ID');
    this.state.cats.push(cat); this.state.catnip -= cost; this.changed(); return structuredClone(cat);
  }
  gacha(name?: string): Cat {
    if (this.state.catnip < ECONOMY.gachaCost) throw new Error('Not enough Catnip');
    return this.addCat(new CatFactory(this.options).createF0(name), ECONOMY.gachaCost);
  }
  breed(fatherId: string, motherId: string): Cat {
    if (this.state.catnip < ECONOMY.breedCost) throw new Error('Not enough Catnip');
    const father = this.state.cats.find(c => c.id === fatherId), mother = this.state.cats.find(c => c.id === motherId);
    if (!father || !mother) throw new Error('Parents must be owned cats');
    return this.addCat(breedCats(father, mother, this.options), ECONOMY.breedCost);
  }
  setRoster(ids: string[]): void {
    if (ids.length !== 3 || new Set(ids).size !== 3 || ids.some(id => !this.state.cats.some(c => c.id === id))) throw new Error('Roster requires three different owned cats');
    this.state.roster = [...ids]; this.changed();
  }
  recordBattle(result: BattleResult): boolean {
    if (!result || typeof result.id !== 'string' || !result.id || !['player', 'enemy'].includes(result.winner)
      || !Number.isSafeInteger(result.turns) || result.turns <= 0) throw new Error('Invalid battle result');
    if (this.state.history.some(r => r.id === result.id)) return false;
    const reward = result.winner === 'player' ? ECONOMY.winReward : ECONOMY.lossReward;
    if (!Number.isSafeInteger(this.state.catnip + reward)) throw new Error('Catnip balance overflow');
    this.state.catnip += reward;
    this.state.history.push({ id: result.id, winner: result.winner, turns: result.turns, reward, recordedAt: (this.options.now ?? Date.now)() });
    this.changed(); return true;
  }
}
