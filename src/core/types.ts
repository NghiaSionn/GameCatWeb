export type RNG = () => number;
export type Rarity = 'common' | 'rare' | 'epic' | 'god';
export type GeneSlot = 'body' | 'face' | 'weapon' | 'accessory';
export type Passive = 'none' | 'skirmisher';
export interface Allocation { hp: number; atk: number; spd: number }
export interface Gene {
  id: string;
  name: string;
  rarity: Rarity;
  points: number;
  /** MOV for face, RNG for weapon; zero for other slots. Includes mutation bonus. */
  reach: number;
  mutated: boolean;
  attackStyle?: 'direct' | 'lobbed';
  minRange?: number;
  passive?: Passive;
}
export interface CatStats { hp: number; atk: number; spd: number; mov: number; rng: number; defense: number }
export interface Cat {
  id: string;
  name: string;
  generation: number;
  rarity: Rarity;
  createdAt: number;
  parents: string[];
  allocation: Allocation;
  genes: Record<GeneSlot, Gene>;
  stats: CatStats;
}
export interface FactoryOptions { rng?: RNG; now?: () => number; id?: () => string }
export type Team = 'player' | 'enemy';
export interface Position { x: number; y: number }
export type Terrain = 'plains' | 'wall' | 'bush' | 'water' | 'pit';
export interface CombatUnit { id: string; cat: Cat; team: Team; position: Position; hp: number }
export interface ReachableCell extends Position { cost: number; path: Position[] }
export interface CombatEvent {
  type: 'move' | 'attack' | 'miss' | 'death' | 'turn' | 'win';
  unitId: string;
  targetId?: string;
  damage?: number;
  path?: Position[];
  winner?: Team;
}
export interface BattleResult { id: string; winner: Team; turns: number; reward: number }
export interface CombatState {
  id: string;
  size: 8 | 10;
  terrain: Terrain[][];
  /** Dead units remain here with hp=0 for presentation; they have no board presence. */
  units: CombatUnit[];
  activeUnitId: string | null;
  timeline: string[];
  time: number;
  turns: number;
  moved: boolean;
  acted: boolean;
  winner: Team | null;
  result: BattleResult | null;
  events: CombatEvent[];
}
export interface CombatOptions {
  id?: string;
  size: 8 | 10;
  terrain?: Terrain[][];
  units: CombatUnit[];
  rng?: RNG;
}
export interface BattleRecord extends BattleResult { recordedAt: number }
export interface PlayerState {
  version: 1;
  catnip: number;
  cats: Cat[];
  roster: string[];
  history: BattleRecord[];
}
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface StoreOptions extends FactoryOptions { storage?: StorageLike; key?: string }
