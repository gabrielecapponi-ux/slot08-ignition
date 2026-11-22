// The simulation supplies cumulative centreline distance and race time. Pauses
// freeze that clock; a recovery keeps adding time to the sector in progress.
export class SectorClock {
  constructor(startDistance, lapLength) {
    this.startDistance = startDistance;
    this.sectorLength = lapLength / 3;
    this.completed = 0;
    this.startedAt = 0;
    this.best = [null, null, null];
    this.last = [null, null, null];
  }

  get current() { return this.completed % 3; }

  advance(from, to, elapsed, dt) {
    if (to <= from) return;
    let boundary = this.startDistance + (this.completed + 1) * this.sectorLength;
    while (boundary <= to) {
      const crossedAt = elapsed - dt * Math.min(1, (to - boundary) / (to - from));
      const duration = crossedAt - this.startedAt;
      const index = this.current;
      const previous = this.best[index];
      this.last[index] = {duration, delta: previous === null ? null : duration - previous};
      this.best[index] = previous === null ? duration : Math.min(previous, duration);
      this.startedAt = crossedAt;
      this.completed++;
      boundary = this.startDistance + (this.completed + 1) * this.sectorLength;
    }
  }
}
