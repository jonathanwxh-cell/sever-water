import { describe, it, expect } from 'vitest';
import { gameNodes } from './data';
import { applyChoice, resetState } from './state';

describe('game node graph integrity', () => {
  it('all next references point to existing nodes', () => {
    for (const node of Object.values(gameNodes)) {
      if (node.next) {
        expect(gameNodes[node.next], `${node.id} -> ${node.next}`).toBeDefined();
      }
    }
  });

  it('all choice IDs are valid state choices', () => {
    for (const node of Object.values(gameNodes)) {
      for (const choice of node.choices ?? []) {
        resetState();
        expect(() => applyChoice(choice.id)).not.toThrow();
      }
    }
  });

  it('callback nodes exist', () => {
    expect(gameNodes.callback_3a_lu).toBeDefined();
    expect(gameNodes.callback_3b_liu).toBeDefined();
    expect(gameNodes.callback_3b_liu_recognition).toBeDefined();
    expect(gameNodes.callback_3c_too_many).toBeDefined();
  });

  it('asset paths are non-empty strings when present', () => {
    for (const node of Object.values(gameNodes)) {
      if (node.image) expect(node.image.src).toMatch(/^\/assets\//);
      if (node.narrationAudio) expect(node.narrationAudio).toMatch(/^\/assets\//);
    }
  });

  it('choice nodes have at least 2 options', () => {
    for (const node of Object.values(gameNodes)) {
      if (node.type === 'choice') {
        expect(node.choices?.length, `${node.id} choices`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
