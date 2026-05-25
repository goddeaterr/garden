import type { PlacedTree, Tree } from '@/types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseHeightCm(height = '') {
  const normalized = height.toLowerCase().replace(',', '.');
  const range = normalized.match(/(\d+(?:\.\d+)?)\s*[-\u2013]\s*(\d+(?:\.\d+)?)\s*cm/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;

  const cm = normalized.match(/(\d+(?:\.\d+)?)\s*cm/);
  if (cm) return Number(cm[1]);

  const meters = normalized.match(/(\d+(?:\.\d+)?)\s*m\b/);
  if (meters) return Number(meters[1]) * 100;

  return 0;
}

function realWorldScale(tree: Tree) {
  const heightCm = parseHeightCm(tree.height);
  if (heightCm > 0) return clamp(Math.pow(heightCm / 120, 0.38), 0.58, 1.58);

  if (tree.size === 'large') return 1.26;
  if (tree.size === 'small') return 0.74;
  if (tree.category === 'evergreen') return 1.08;
  if (tree.category === 'shrub') return 0.88;
  return 0.96;
}

export function getGardenDepthMetrics(placed: PlacedTree, tree: Tree) {
  const depth = clamp((placed.y - 0.18) / 0.78, 0, 1);
  const perspectiveScale = 0.36 + Math.pow(depth, 1.32) * 1.08;
  const realScale = realWorldScale(tree);
  const finalScale = clamp(placed.scale * perspectiveScale * realScale, 0.16, 4);

  return {
    depth,
    finalScale,
    zIndex: Math.max(1, Math.min(Math.round(placed.y * 100) + placed.z, 199)),
    visualOpacity: clamp(placed.opacity * (0.74 + depth * 0.26), 0.18, 1),
    blurPx: (1 - depth) * 0.28,
    shadowOpacity: 0.1 + depth * 0.26,
    shadowScale: 0.62 + depth * 0.72,
    shadowBlur: 8 + depth * 14,
    shadowY: 128 + depth * 10,
  };
}
