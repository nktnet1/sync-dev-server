import path from 'path';
import { defineConfig } from 'vitest/config';
import { BaseSequencer, TestSpecification } from 'vitest/node';

class CustomSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    const order = ['basic.test.ts', 'error.test.ts', 'start.test.ts'];

    return files.toSorted((a, b) => {
      const aIndex = order.indexOf(path.basename(a.moduleId));
      const bIndex = order.indexOf(path.basename(b.moduleId));
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      return a.moduleId.localeCompare(b.moduleId);
    });
  }
}

export default defineConfig({
  test: {
    isolate: false,
    maxWorkers: 1,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/types.ts'],
    },
    sequence: {
      sequencer: CustomSequencer,
    },
  },
});
