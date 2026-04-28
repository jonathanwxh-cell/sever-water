import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyChoice,
  resetState,
  getStateSnapshot,
  shouldRenderLuYuanHesitationCallback,
  getLiuRuyanOneOfThoseIntonation,
  shouldRenderTooManyQuestions,
} from './state';

describe('Choice 1A — Gave up letter', () => {
  beforeEach(() => resetState());
  it('sets heartState.leng to +1', () => {
    applyChoice('1A');
    expect(getStateSnapshot().heartState.leng).toBe(1);
  });
  it('does not affect other heart states', () => {
    applyChoice('1A');
    const s = getStateSnapshot();
    expect(s.heartState.cheng).toBe(0);
    expect(s.heartState.yuan).toBe(0);
    expect(s.heartState.huo).toBe(0);
  });
  it('sets flag A1', () => {
    applyChoice('1A');
    expect(getStateSnapshot().flags.A1).toBe(true);
  });
  it('does not set other flags', () => {
    applyChoice('1A');
    const s = getStateSnapshot();
    ['B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'].forEach((f) => {
      expect(s.flags[f as keyof typeof s.flags]).toBe(false);
    });
  });
});

describe('Choice 1B — Fought, kept letter', () => {
  beforeEach(() => resetState());
  it('sets heartState.cheng to +1', () => {
    applyChoice('1B');
    expect(getStateSnapshot().heartState.cheng).toBe(1);
  });
  it('sets flag B1', () => {
    applyChoice('1B');
    expect(getStateSnapshot().flags.B1).toBe(true);
  });
});

describe('Choice 1C — Asked, not acted', () => {
  beforeEach(() => resetState());
  it('sets heartState.huo to +1', () => {
    applyChoice('1C');
    expect(getStateSnapshot().heartState.huo).toBe(1);
  });
  it('sets flag C1', () => {
    applyChoice('1C');
    expect(getStateSnapshot().flags.C1).toBe(true);
  });
});

describe('Choice 2A — Swore debt openly', () => {
  beforeEach(() => resetState());
  it('accumulates cheng across choices', () => {
    applyChoice('1A');
    applyChoice('2A');
    const s = getStateSnapshot();
    expect(s.heartState.cheng).toBe(1);
    expect(s.heartState.leng).toBe(1);
  });
  it('sets flag A2', () => {
    applyChoice('2A');
    expect(getStateSnapshot().flags.A2).toBe(true);
  });
});

describe('Choice 2B — Acted silently', () => {
  beforeEach(() => resetState());
  it('sets heartState.huo to +1', () => {
    applyChoice('2B');
    expect(getStateSnapshot().heartState.huo).toBe(1);
  });
  it('sets flag B2', () => {
    applyChoice('2B');
    expect(getStateSnapshot().flags.B2).toBe(true);
  });
});

describe('Choice 2C — Asked the hard question', () => {
  beforeEach(() => resetState());
  it('sets heartState.leng to +1', () => {
    applyChoice('2C');
    expect(getStateSnapshot().heartState.leng).toBe(1);
  });
  it('sets flag C2', () => {
    applyChoice('2C');
    expect(getStateSnapshot().flags.C2).toBe(true);
  });
});

describe('Choice 3A — Duty Before Debt', () => {
  beforeEach(() => resetState());
  it('sets heartState.yuan to +1', () => {
    applyChoice('3A');
    expect(getStateSnapshot().heartState.yuan).toBe(1);
  });
  it('sets flag A3', () => {
    applyChoice('3A');
    expect(getStateSnapshot().flags.A3).toBe(true);
  });
});

describe('Choice 3B — Debt Before Duty', () => {
  beforeEach(() => resetState());
  it('sets heartState.cheng to +1', () => {
    applyChoice('3B');
    expect(getStateSnapshot().heartState.cheng).toBe(1);
  });
  it('sets flag B3', () => {
    applyChoice('3B');
    expect(getStateSnapshot().flags.B3).toBe(true);
  });
});

describe('Choice 3C — The Impossible Both', () => {
  beforeEach(() => resetState());
  it('sets heartState.huo to +1', () => {
    applyChoice('3C');
    expect(getStateSnapshot().heartState.huo).toBe(1);
  });
  it('sets flag C3', () => {
    applyChoice('3C');
    expect(getStateSnapshot().flags.C3).toBe(true);
  });
});

describe('Full playthroughs', () => {
  beforeEach(() => resetState());
  it('1A→2B→3C produces correct final state', () => {
    applyChoice('1A'); applyChoice('2B'); applyChoice('3C');
    const s = getStateSnapshot();
    expect(s.heartState).toEqual({ cheng: 0, yuan: 0, huo: 2, leng: 1 });
    expect(s.flags.A1).toBe(true);
    expect(s.flags.B2).toBe(true);
    expect(s.flags.C3).toBe(true);
  });
  it('1B→2A→3B produces correct final state', () => {
    applyChoice('1B'); applyChoice('2A'); applyChoice('3B');
    const s = getStateSnapshot();
    expect(s.heartState).toEqual({ cheng: 3, yuan: 0, huo: 0, leng: 0 });
  });
  it('1C→2C→3A produces correct final state', () => {
    applyChoice('1C'); applyChoice('2C'); applyChoice('3A');
    const s = getStateSnapshot();
    expect(s.heartState).toEqual({ cheng: 0, yuan: 1, huo: 1, leng: 1 });
  });
});

describe('Callback: Lu Yuan hesitation (A1 or C1)', () => {
  beforeEach(() => resetState());
  it('renders when A1 is true', () => {
    applyChoice('1A');
    expect(shouldRenderLuYuanHesitationCallback()).toBe(true);
  });
  it('renders when C1 is true', () => {
    applyChoice('1C');
    expect(shouldRenderLuYuanHesitationCallback()).toBe(true);
  });
  it('does NOT render when only B1 is true', () => {
    applyChoice('1B');
    expect(shouldRenderLuYuanHesitationCallback()).toBe(false);
  });
  it('does NOT render when no flags set', () => {
    expect(shouldRenderLuYuanHesitationCallback()).toBe(false);
  });
});

describe('Callback: Liu Ruyan intonation (B2)', () => {
  beforeEach(() => resetState());
  it('is recognition when B2 is true', () => {
    applyChoice('2B');
    expect(getLiuRuyanOneOfThoseIntonation()).toBe('recognition');
  });
  it('is flat when B2 is false', () => {
    applyChoice('2A');
    expect(getLiuRuyanOneOfThoseIntonation()).toBe('flat');
  });
  it('is flat when no Scene 2 choice made', () => {
    expect(getLiuRuyanOneOfThoseIntonation()).toBe('flat');
  });
});

describe('Callback: "too many questions" (C3 AND C2)', () => {
  beforeEach(() => resetState());
  it('renders when both C3 and C2 are true', () => {
    applyChoice('2C'); applyChoice('3C');
    expect(shouldRenderTooManyQuestions()).toBe(true);
  });
  it('does NOT render when only C2', () => {
    applyChoice('2C'); applyChoice('3A');
    expect(shouldRenderTooManyQuestions()).toBe(false);
  });
  it('does NOT render when only C3', () => {
    applyChoice('2B'); applyChoice('3C');
    expect(shouldRenderTooManyQuestions()).toBe(false);
  });
  it('does NOT render when neither', () => {
    expect(shouldRenderTooManyQuestions()).toBe(false);
  });
});

describe('Edge cases', () => {
  it('throws on invalid choice ID', () => {
    resetState();
    expect(() => applyChoice('99Z')).toThrow();
  });
  it('resetState clears all heart states', () => {
    resetState();
    applyChoice('1A'); applyChoice('2B'); applyChoice('3C');
    resetState();
    expect(getStateSnapshot().heartState).toEqual({ cheng: 0, yuan: 0, huo: 0, leng: 0 });
  });
  it('resetState clears all flags', () => {
    resetState();
    applyChoice('1A'); applyChoice('2B'); applyChoice('3C');
    resetState();
    const s = getStateSnapshot();
    ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'].forEach((f) => {
      expect(s.flags[f as keyof typeof s.flags]).toBe(false);
    });
  });
});
