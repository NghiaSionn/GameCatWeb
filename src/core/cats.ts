import type { Cat, CatStats, FactoryOptions, Gene, GeneSlot, RNG, Rarity } from './types.ts';

export const RARITY_MULTIPLIER: Record<Rarity, number> = { common: 1, rare: 1.2, epic: 1.45, god: 1.8 };
export const GENE_SLOTS: GeneSlot[] = ['body', 'face', 'weapon', 'accessory'];
const NAMES: Record<GeneSlot, string[]> = {
  body: ['Mèo Múp', 'Mèo Bánh Mì', 'Mèo Mây'],
  face: ['Mặt Khóc Cười', 'Mặt Ngầu', 'Mặt Ngơ'],
  weapon: ['Dép Tổ Ong', 'Cá Khô', 'Tia Meme'],
  accessory: ['Nơ Cỏ Mèo', 'Kính Meme', 'Giày Lò Xo'],
};
let sequence = 0;
export function newId(): string { return globalThis.crypto?.randomUUID?.() ?? `cat-${Date.now()}-${sequence++}`; }
export function roll(rng: RNG): number {
  const n = rng();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw new Error('RNG must return a number in [0,1)');
  return n;
}
export function seededRandom(seed: number): RNG {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}
function randomGene(slot: GeneSlot, points: number, rng: RNG): Gene {
  const variant = Math.floor(roll(rng) * 3);
  const r = roll(rng);
  const rarity: Rarity = r < .75 ? 'common' : r < .95 ? 'rare' : 'epic';
  const reach = slot === 'face' ? (rarity === 'common' ? 2 : rarity === 'rare' ? 3 : 4)
    : slot === 'weapon' ? (variant === 0 ? (rarity === 'common' ? 1 : 2) : rarity === 'common' ? 2 : 3) : 0;
  return {
    id: `${slot}-${variant}`, name: NAMES[slot][variant], rarity, points, reach, mutated: false,
    ...(slot === 'weapon' ? { attackStyle: variant === 1 ? 'lobbed' as const : 'direct' as const, minRange: variant === 2 ? 2 : 1 } : {}),
    ...(slot === 'accessory' ? { passive: variant === 2 ? 'skirmisher' as const : 'none' as const } : {}),
  };
}
export function deriveStats(genes: Cat['genes']): CatStats {
  const scaled = (gene: Gene, base: number, span: number) => Math.round((base + span * (gene.points - 10) / 70) * RARITY_MULTIPLIER[gene.rarity]);
  return {
    hp: scaled(genes.body, 300, 500), atk: scaled(genes.weapon, 30, 90), spd: scaled(genes.face, 20, 70),
    mov: Math.min(5, Math.max(2, genes.face.reach)), rng: Math.min(4, Math.max(1, genes.weapon.reach)), defense: 0,
  };
}
function assemble(name: string, generation: number, genes: Cat['genes'], parents: string[], options: FactoryOptions): Cat {
  const rarity = GENE_SLOTS.reduce<Rarity>((a, slot) => RARITY_MULTIPLIER[genes[slot].rarity] > RARITY_MULTIPLIER[a] ? genes[slot].rarity : a, 'common');
  return {
    id: (options.id ?? newId)(), name, generation, rarity, createdAt: (options.now ?? Date.now)(), parents,
    allocation: { hp: genes.body.points, atk: genes.weapon.points, spd: genes.face.points },
    genes, stats: deriveStats(genes),
  };
}
export class CatFactory {
  private options: FactoryOptions;
  constructor(options: FactoryOptions = {}) { this.options = options; }
  createF0(name = 'Mèo Meme'): Cat {
    const rng = this.options.rng ?? Math.random;
    // Minimum 10 in each stat; distribute the remaining 70 integer points.
    const points = [10, 10, 10];
    for (let i = 0; i < 70; i++) points[Math.floor(roll(rng) * 3)]++;
    return assemble(name, 0, {
      body: randomGene('body', points[0], rng), face: randomGene('face', points[2], rng),
      weapon: randomGene('weapon', points[1], rng), accessory: randomGene('accessory', 0, rng),
    }, [], this.options);
  }
}
export function breedCats(father: Cat, mother: Cat, options: FactoryOptions = {}): Cat {
  if (father.id === mother.id) throw new Error('Choose two different parents');
  const rng = options.rng ?? Math.random;
  const genes = {} as Cat['genes'];
  for (const slot of GENE_SLOTS) {
    const r = roll(rng);
    if (r < .9) genes[slot] = structuredClone((r < .45 ? father : mother).genes[slot]);
    else {
      // Mutated reach starts from one parent's value, rather than stacking all historical bonuses.
      const inherited = (roll(rng) < .5 ? father : mother).genes[slot];
      const gene = randomGene(slot, inherited.points, rng);
      gene.mutated = true;
      if (slot === 'face' || slot === 'weapon') {
        gene.rarity = 'god';
        gene.reach = Math.min(slot === 'face' ? 5 : 4, inherited.reach + 1);
        if (slot === 'weapon') gene.minRange = Math.min(gene.minRange ?? 1, gene.reach);
      }
      genes[slot] = gene;
    }
  }
  return assemble(`${father.name} × ${mother.name}`, Math.max(father.generation, mother.generation) + 1, genes, [father.id, mother.id], options);
}

/** Strict enough to reject corrupt browser saves before they reach the engine. */
export function isCat(value: unknown): value is Cat {
  if (!value || typeof value !== 'object') return false;
  const c = value as Cat;
  const number = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  if (typeof c.id !== 'string' || !c.id || typeof c.name !== 'string' || !number(c.generation, 0, 1e6) || !Number.isInteger(c.generation)
    || !number(c.createdAt, 0, Number.MAX_SAFE_INTEGER) || !Array.isArray(c.parents) || !c.parents.every(p => typeof p === 'string')
    || !Object.hasOwn(RARITY_MULTIPLIER, c.rarity) || !c.genes || !c.allocation || !c.stats) return false;
  for (const slot of GENE_SLOTS) {
    const g = c.genes[slot];
    if (!g || typeof g.id !== 'string' || typeof g.name !== 'string' || !Object.hasOwn(RARITY_MULTIPLIER, g.rarity)
      || !number(g.points, slot === 'accessory' ? 0 : 10, slot === 'accessory' ? 0 : 80) || !Number.isInteger(g.points)
      || !number(g.reach, slot === 'face' ? 2 : slot === 'weapon' ? 1 : 0, slot === 'face' ? 5 : slot === 'weapon' ? 4 : 0)
      || !Number.isInteger(g.reach) || typeof g.mutated !== 'boolean') return false;
    if (g.attackStyle !== undefined && g.attackStyle !== 'direct' && g.attackStyle !== 'lobbed') return false;
    if (g.minRange !== undefined && (!Number.isInteger(g.minRange) || g.minRange < 1 || g.minRange > g.reach)) return false;
    if (g.passive !== undefined && g.passive !== 'none' && g.passive !== 'skirmisher') return false;
  }
  if (c.allocation.hp !== c.genes.body.points || c.allocation.atk !== c.genes.weapon.points || c.allocation.spd !== c.genes.face.points) return false;
  if (c.generation === 0 && c.allocation.hp + c.allocation.atk + c.allocation.spd !== 100) return false;
  const derived = deriveStats(c.genes);
  return (Object.keys(derived) as (keyof CatStats)[]).every(k => c.stats[k] === derived[k]);
}
