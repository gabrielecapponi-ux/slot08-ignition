import test from 'node:test';
import assert from 'node:assert/strict';
import {SectorClock} from '../src/game/sector-clock.js';
import {RaceSession} from '../src/game/session.js';

test('sector boundaries interpolate, carry time spent stopped, and compare equivalent sectors', () => {
  const clock = new SectorClock(2, 30);
  clock.advance(2, 22, 8, 8);
  assert.deepEqual(clock.best, [4, 4, null]);
  clock.advance(22, 22, 11, 3);
  assert.equal(clock.completed, 2);
  clock.advance(22, 32, 15, 4);
  assert.equal(clock.last[2].duration, 7);
  clock.advance(32, 45, 18.9, 3.9);
  assert.ok(Math.abs(clock.last[0].delta + 1) < 1e-10);
  clock.advance(45, 52, 24, 5.1);
  assert.ok(Math.abs(clock.last[1].delta - 2) < 1e-10);
  assert.equal(clock.best[1], 4);
});

test('Time Attack splits add up to the lap clock and reset on track or mode change', () => {
  const session = new RaceSession();
  session.configure({assisted:true});
  session.reset('time');
  session.start();
  const dt = 1 / 120;
  for (let i = 0; i < 120 * 80 && session.player.laps < 2; i++) session.update(dt, {throttle:1});
  assert.equal(session.player.laps, 2);
  const clock = session.sectors;
  assert.equal(clock.completed, 6);
  assert.ok(clock.last.every(result => Number.isFinite(result.delta)));
  assert.ok(Math.abs(clock.last.reduce((total, split) => total + split.duration, 0) - session.player.lastLap) < 1e-8);
  const elapsed = session.elapsed;
  const count = clock.completed;
  session.pause();
  session.update(1, {throttle:1});
  assert.equal(session.elapsed, elapsed);
  assert.equal(clock.completed, count);
  session.configure({level:3});
  assert.equal(session.sectors.completed, 0);
  session.reset('local3');
  assert.equal(session.sectors, null);
});
