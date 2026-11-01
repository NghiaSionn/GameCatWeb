import { isCat, newId, roll } from './cats.ts';
import { ECONOMY } from './store.ts';
import type { CombatOptions, CombatState, CombatUnit, Position, ReachableCell, RNG, Terrain } from './types.ts';

export function manhattan(a: Position, b: Position): number { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
export function bresenham(a: Position, b: Position): Position[] {
  const cells: Position[] = [];
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - x), dy = -Math.abs(b.y - y), sx = x < b.x ? 1 : -1, sy = y < b.y ? 1 : -1;
  let error = dx + dy;
  while (true) {
    cells.push({ x, y });
    if (x === b.x && y === b.y) return cells;
    const e = 2 * error;
    if (e >= dy) { error += dy; x += sx; }
    if (e <= dx) { error += dx; y += sy; }
  }
}
export function createTerrain(size: 8 | 10): Terrain[][] { return Array.from({ length: size }, () => Array<Terrain>(size).fill('plains')); }
const key = (p: Position) => `${p.x},${p.y}`;
export class TacticalEngine {
  private state: CombatState;
  private rng: RNG;
  private ready = new Map<string, number>();
  constructor(options: CombatOptions) {
    if (options.size !== 8 && options.size !== 10) throw new Error('Map size must be 8 or 10');
    const terrain = structuredClone(options.terrain ?? createTerrain(options.size));
    if (terrain.length !== options.size || terrain.some(row => row.length !== options.size || row.some(t => !['plains', 'wall', 'bush', 'water', 'pit'].includes(t)))) throw new Error('Invalid terrain');
    const units = structuredClone(options.units);
    if (units.length === 0 || new Set(units.map(u => u.id)).size !== units.length) throw new Error('Units require unique IDs');
    const occupied = new Set<string>();
    for (const u of units) {
      if (!u.id || !isCat(u.cat) || !['player', 'enemy'].includes(u.team) || !Number.isFinite(u.hp) || u.hp <= 0 || u.hp > u.cat.stats.hp
        || !Number.isInteger(u.position.x) || !Number.isInteger(u.position.y) || u.position.x < 0 || u.position.x >= options.size || u.position.y < 0 || u.position.y >= options.size
        || ['wall', 'pit'].includes(terrain[u.position.y][u.position.x]) || occupied.has(key(u.position))) throw new Error('Invalid combat unit or spawn');
      occupied.add(key(u.position));
    }
    if (!units.some(u => u.team === 'player') || !units.some(u => u.team === 'enemy')) throw new Error('Both teams must be present');
    this.rng = options.rng ?? Math.random;
    this.state = { id: options.id ?? newId(), size: options.size, terrain, units, activeUnitId: null, timeline: [], time: 0, turns: 1, moved: false, acted: false, winner: null, result: null, events: [] };
    for (const u of units) this.ready.set(u.id, 100 / this.speed(u));
    this.selectNext();
  }
  getState(): CombatState { return structuredClone(this.state); }
  private alive(): CombatUnit[] { return this.state.units.filter(u => u.hp > 0); }
  private unit(id: string): CombatUnit {
    const u = this.state.units.find(u => u.id === id && u.hp > 0);
    if (!u) throw new Error('Unknown or dead unit');
    return u;
  }
  private active(): CombatUnit {
    if (this.state.winner || !this.state.activeUnitId) throw new Error('Battle is over');
    return this.unit(this.state.activeUnitId);
  }
  private speed(u: CombatUnit): number { return u.cat.stats.spd * (this.state.terrain[u.position.y][u.position.x] === 'water' ? .85 : 1); }
  private selectNext(): void {
    this.state.timeline = this.alive().sort((a, b) => (this.ready.get(a.id)! - this.ready.get(b.id)!) || this.speed(b) - this.speed(a) || a.id.localeCompare(b.id)).map(u => u.id);
    this.state.activeUnitId = this.state.timeline[0] ?? null;
    if (this.state.activeUnitId) this.state.time = this.ready.get(this.state.activeUnitId)!;
  }
  private inBounds(p: Position): boolean { return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < this.state.size && p.y < this.state.size; }
  private underControl(p: Position, unit: CombatUnit): boolean { return this.alive().some(enemy => enemy.team !== unit.team && manhattan(enemy.position, p) === 1); }
  private canMove(unit: CombatUnit): boolean {
    return unit.id !== this.state.activeUnitId || (!this.state.moved && (!this.state.acted || unit.cat.genes.accessory.passive === 'skirmisher'));
  }
  getReachable(unitId = this.state.activeUnitId ?? ''): ReachableCell[] {
    if (this.state.winner) return [];
    const unit = this.unit(unitId);
    if (!this.canMove(unit)) return [];
    const start: ReachableCell = { ...unit.position, cost: 0, path: [] };
    const pending = [start], best = new Map<string, ReachableCell>([[key(start), start]]);
    const occupied = new Set(this.alive().filter(u => u.id !== unit.id).map(u => key(u.position)));
    while (pending.length) {
      pending.sort((a, b) => a.cost - b.cost || a.y - b.y || a.x - b.x);
      const cell = pending.shift()!;
      if (best.get(key(cell)) !== cell) continue;
      for (const p of [{ x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y }, { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 }]) {
        if (!this.inBounds(p) || occupied.has(key(p))) continue;
        const terrain = this.state.terrain[p.y][p.x];
        if (terrain === 'wall' || terrain === 'pit') continue;
        const cost = cell.cost + (terrain === 'water' ? 2 : 1) * (this.underControl(cell, unit) ? 2 : 1);
        if (cost > unit.cat.stats.mov || cost >= (best.get(key(p))?.cost ?? Infinity)) continue;
        const next = { ...p, cost, path: [...cell.path, p] };
        best.set(key(p), next); pending.push(next);
      }
    }
    best.delete(key(start));
    return structuredClone([...best.values()].sort((a, b) => a.cost - b.cost || a.y - b.y || a.x - b.x));
  }
  hasLineOfSight(attackerId: string, targetId: string): boolean {
    const attacker = this.unit(attackerId), target = this.unit(targetId);
    const ray = bresenham(attacker.position, target.position).slice(1, -1);
    return !ray.some(p => this.state.terrain[p.y][p.x] === 'wall'
      || (attacker.cat.genes.weapon.attackStyle !== 'lobbed' && this.alive().some(u => key(u.position) === key(p))));
  }
  getAttackable(unitId = this.state.activeUnitId ?? ''): string[] {
    if (this.state.winner) return [];
    const unit = this.unit(unitId);
    if (unit.id === this.state.activeUnitId && this.state.acted) return [];
    return this.alive().filter(target => {
      const distance = manhattan(unit.position, target.position);
      return target.team !== unit.team && distance >= (unit.cat.genes.weapon.minRange ?? 1) && distance <= unit.cat.stats.rng && this.hasLineOfSight(unit.id, target.id);
    }).map(u => u.id);
  }
  move(to: Position): CombatState {
    const unit = this.active();
    const cell = this.getReachable().find(p => p.x === to.x && p.y === to.y);
    if (!cell) throw new Error('Illegal movement');
    unit.position = { x: to.x, y: to.y }; this.state.moved = true;
    this.state.events = [{ type: 'move', unitId: unit.id, path: cell.path }];
    if (this.state.acted) this.finishTurn(1);
    return this.getState();
  }
  attack(targetId: string): CombatState {
    const attacker = this.active();
    if (!this.getAttackable().includes(targetId)) throw new Error('Illegal target');
    const target = this.unit(targetId);
    // Only bush grants MVP evasion; critical/passive damage systems are deliberately deferred.
    const miss = this.state.terrain[target.position.y][target.position.x] === 'bush' && roll(this.rng) < .2;
    const damage = miss ? 0 : Math.max(1, Math.round(attacker.cat.stats.atk * (.9 + .2 * roll(this.rng)) - target.cat.stats.defense));
    target.hp = Math.max(0, target.hp - damage); this.state.acted = true;
    this.state.events = [{ type: miss ? 'miss' : 'attack', unitId: attacker.id, targetId, damage }];
    if (target.hp === 0) {
      this.state.events.push({ type: 'death', unitId: target.id });
      this.ready.delete(target.id);
      this.state.timeline = this.state.timeline.filter(id => id !== target.id);
    }
    if (!this.alive().some(u => u.team === target.team)) {
      this.state.winner = attacker.team;
      this.state.result = { id: this.state.id, winner: attacker.team, turns: this.state.turns, reward: attacker.team === 'player' ? ECONOMY.winReward : ECONOMY.lossReward };
      this.state.events.push({ type: 'win', unitId: attacker.id, winner: attacker.team });
      this.state.activeUnitId = null; this.state.timeline = [];
    } else if (this.state.moved || attacker.cat.genes.accessory.passive !== 'skirmisher') this.finishTurn(1);
    return this.getState();
  }
  private finishTurn(multiplier: number): void {
    const unit = this.active();
    this.ready.set(unit.id, this.state.time + multiplier * 100 / this.speed(unit));
    this.state.moved = false; this.state.acted = false; this.state.turns++;
    this.selectNext();
    this.state.events.push({ type: 'turn', unitId: this.state.activeUnitId! });
  }
  wait(): CombatState {
    this.active();
    if (this.state.moved || this.state.acted) throw new Error('Wait requires an untouched turn; use endTurn');
    this.state.events = []; this.finishTurn(.8); return this.getState();
  }
  endTurn(): CombatState {
    this.active(); this.state.events = []; this.finishTurn(1); return this.getState();
  }
}
