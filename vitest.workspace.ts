import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./nzyme/packages/ioc/vitest.config.ts",
  "./nzyme/packages/utils/vitest.config.ts",
  "./nzyme/packages/zchema/vitest.config.ts",
  "./packages/core/vitest.config.ts"
])
