import { describe, it, expect } from 'vitest';
import { gameNodes } from './data';
import { applyChoice, resetState } from './state';
import resolveCallbackNode from './game/callback';

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

const choiceGroups = [
  ['1A', '1B', '1C'],
  ['2A', '2B', '2C'],
  ['3A', '3B', '3C'],
] as const;

const fullAct1Paths = choiceGroups[0].flatMap((choice1) =>
  choiceGroups[1].flatMap((choice2) =>
    choiceGroups[2].map((choice3) => [choice1, choice2, choice3] as const)
  )
);

function expectedFinalCallback(path: readonly string[]): string | null {
  const [choice1, choice2, choice3] = path;
  if (choice3 === '3A' && (choice1 === '1A' || choice1 === '1C')) return 'callback_3a_lu';
  if (choice3 === '3B') return choice2 === '2B' ? 'callback_3b_liu_recognition' : 'callback_3b_liu';
  if (choice3 === '3C' && choice2 === '2C') return 'callback_3c_too_many';
  return null;
}

function walkAct1Path(path: readonly string[]): string[] {
  resetState();

  let nodeId = 'scene1_heading';
  let choiceIndex = 0;
  const visited: string[] = [];

  for (let guard = 0; guard < 100; guard += 1) {
    const node = gameNodes[nodeId];
    expect(node, nodeId).toBeDefined();
    visited.push(nodeId);

    if (nodeId === 'act1_end') break;

    if (node.type === 'choice') {
      const choiceId = path[choiceIndex];
      expect(choiceId, `${node.id} has scripted choice`).toBeDefined();
      expect(node.choices?.some((choice) => choice.id === choiceId), `${node.id} contains ${choiceId}`).toBe(true);
      applyChoice(choiceId);
      choiceIndex += 1;
      nodeId = resolveCallbackNode(choiceId, node.next ?? 'act1_end');
    } else {
      expect(node.next, `${node.id} has next`).toBeDefined();
      nodeId = node.next!;
    }
  }

  expect(visited.at(-1)).toBe('act1_end');
  expect(choiceIndex).toBe(path.length);
  return visited;
}

describe('Act 1 full path verification', () => {
  for (const path of fullAct1Paths) {
    it(`${path.join('→')} reaches END OF ACT 1 with correct callback branch`, () => {
      const visited = walkAct1Path(path);
      const expectedCallback = expectedFinalCallback(path);
      const callbackNodes = [
        'callback_3a_lu',
        'callback_3b_liu',
        'callback_3b_liu_recognition',
        'callback_3c_too_many',
      ];

      if (expectedCallback) {
        expect(visited).toContain(expectedCallback);
      } else {
        for (const callbackNode of callbackNodes) {
          expect(visited).not.toContain(callbackNode);
        }
      }
    });
  }
});
