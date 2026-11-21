import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/core/**',
        'src/rooms/RoomGraph.ts',
        'src/rooms/RoomManager.ts',
        'src/secrets/**',
        'src/puzzles/PuzzleManager.ts',
        'src/inventory/**',
        'src/hints/**',
        'src/save/**',
        'src/doors/**',
        'src/achievements/**',
      ],
      exclude: ['src/save/IndexedDBStorage.ts'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});