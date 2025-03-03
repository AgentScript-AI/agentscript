## 0.7.0 (2025-03-03)

### 🚀 Features

- support record schema type ([9e7dec8](https://github.com/AgentScript-AI/agentscript/commit/9e7dec8))
- add support for lazy schema ([7451cac](https://github.com/AgentScript-AI/agentscript/commit/7451cac))
- support early return from the script ([7906d78](https://github.com/AgentScript-AI/agentscript/commit/7906d78))
- support object spread ([84d3b1f](https://github.com/AgentScript-AI/agentscript/commit/84d3b1f))
- support assigning object property ([12d4b9e](https://github.com/AgentScript-AI/agentscript/commit/12d4b9e))
- poc of @agentscript-ai/openapi library ([4fe08e5](https://github.com/AgentScript-AI/agentscript/commit/4fe08e5))
- add array spread support ([da52177](https://github.com/AgentScript-AI/agentscript/commit/da52177))
- add regex support ([6586836](https://github.com/AgentScript-AI/agentscript/commit/6586836))
- **core:** allow tools to inject dependencies from ioc container ([c8faee6](https://github.com/AgentScript-AI/agentscript/commit/c8faee6))

### 🩹 Fixes

- improvent to cjs support ([17ea9a0](https://github.com/AgentScript-AI/agentscript/commit/17ea9a0))
- fix support for logical operators ([fea98d5](https://github.com/AgentScript-AI/agentscript/commit/fea98d5))
- agent prompt fix for longer context windows ([a3abfe6](https://github.com/AgentScript-AI/agentscript/commit/a3abfe6))
- fixed lazy schemas ([5ee77a8](https://github.com/AgentScript-AI/agentscript/commit/5ee77a8))
- removing unnecessary exports from runtime code ([0010b3a](https://github.com/AgentScript-AI/agentscript/commit/0010b3a))
- compilation fixes ([e04cb75](https://github.com/AgentScript-AI/agentscript/commit/e04cb75))
- fix stack frame for object and array literals ([c64a0dc](https://github.com/AgentScript-AI/agentscript/commit/c64a0dc))
- fix literal expression type ([cbe6ba9](https://github.com/AgentScript-AI/agentscript/commit/cbe6ba9))

### ❤️ Thank You

- Michał Kędrzyński

## 0.6.0 (2025-02-24)

### 🚀 Features

- add while loop and variable increment ([9a05c34](https://github.com/AgentScript-AI/agentscript/commit/9a05c34))
- add unary operators ([ad85b76](https://github.com/AgentScript-AI/agentscript/commit/ad85b76))
- added custom agent metadata ([b926f63](https://github.com/AgentScript-AI/agentscript/commit/b926f63))
- commonjs support ([d483204](https://github.com/AgentScript-AI/agentscript/commit/d483204))
- add @agentscript/llamaindex package ([c66dec6](https://github.com/AgentScript-AI/agentscript/commit/c66dec6))

### ❤️ Thank You

- Michał Kędrzyński

## 0.5.0 (2025-01-27)

### 🚀 Features

- ast runtime optimizations ([afbca7d](https://github.com/AgentScript-AI/agentscript/commit/afbca7d))
- extracted parser to a separate package ([207846d](https://github.com/AgentScript-AI/agentscript/commit/207846d))
- add support for Vercel AI SDK providers ([5b4fbeb](https://github.com/AgentScript-AI/agentscript/commit/5b4fbeb))
- added support for LangChain models ([a5c1ed4](https://github.com/AgentScript-AI/agentscript/commit/a5c1ed4))

### 🩹 Fixes

- renaming stuff ([a06ffaf](https://github.com/AgentScript-AI/agentscript/commit/a06ffaf))

### ❤️ Thank You

- Michał Kędrzyński

## 0.4.0 (2025-01-22)

### 🚀 Features

- experimental support for chain of agents ([dd1d7d1](https://github.com/AgentScript-AI/agentscript/commit/dd1d7d1))
- **core:** add support for if, else, else if ([7ac1828](https://github.com/AgentScript-AI/agentscript/commit/7ac1828))
- **core:** serialization optimizations ([485956b](https://github.com/AgentScript-AI/agentscript/commit/485956b))
- **core:** ternary operator support ([9c1a6ca](https://github.com/AgentScript-AI/agentscript/commit/9c1a6ca))
- **runtime:** template literals ([3f7134a](https://github.com/AgentScript-AI/agentscript/commit/3f7134a))

### 🩹 Fixes

- bump package versions ([8ff632c](https://github.com/AgentScript-AI/agentscript/commit/8ff632c))
- ast literals optimization ([1c122c5](https://github.com/AgentScript-AI/agentscript/commit/1c122c5))
- **core:** minor fixes and temporary deprecations ([51c1556](https://github.com/AgentScript-AI/agentscript/commit/51c1556))

### ❤️ Thank You

- Michał Kędrzyński

## 0.3.0 (2025-01-14)

### 🚀 Features

- add binary operators ([#8](https://github.com/AgentScript-AI/agentscript/pull/8))
- execution state perisistence ([#9](https://github.com/AgentScript-AI/agentscript/pull/9))
- support array.map loops ([#10](https://github.com/AgentScript-AI/agentscript/pull/10))

### 🩹 Fixes

- parsing LLM response when code is not wrapped ([96f23f1](https://github.com/AgentScript-AI/agentscript/commit/96f23f1))

### ❤️ Thank You

- Michał Kędrzyński

## 0.2.0 (2025-01-13)

### 🚀 Features

- tool execution state ([#6](https://github.com/AgentScript-AI/agentscript/pull/6))
- tool interactivity ([#7](https://github.com/AgentScript-AI/agentscript/pull/7))

### 🩹 Fixes

- runtime code generation refactor ([b8b2740](https://github.com/AgentScript-AI/agentscript/commit/b8b2740))

### ❤️ Thank You

- Michał Kędrzyński

## 0.1.2 (2025-01-08)

### 🩹 Fixes

- **linear:** fixed bad gql rename ([abb7c9b](https://github.com/AgentScript-AI/agentscript/commit/abb7c9b))

### ❤️ Thank You

- Michał Kędrzyński

## 0.1.1 (2025-01-08)

### 🩹 Fixes

- rename workflow to agent ([069b9c0](https://github.com/AgentScript-AI/agentscript/commit/069b9c0))

### ❤️ Thank You

- Michał Kędrzyński

## 0.1.0 (2025-01-07)

### 🚀 Features

- scaffolding project ([ece2c06](https://github.com/AgentScript-AI/agentscript/commit/ece2c06))
- start working on agentscript ([805b521](https://github.com/AgentScript-AI/agentscript/commit/805b521))
- rendering runtime ([1cddd21](https://github.com/AgentScript-AI/agentscript/commit/1cddd21))
- initial script parser implementation ([ea3358c](https://github.com/AgentScript-AI/agentscript/commit/ea3358c))
- improved rendering modules ([2ae240f](https://github.com/AgentScript-AI/agentscript/commit/2ae240f))
- added basic runtime ([67ceb32](https://github.com/AgentScript-AI/agentscript/commit/67ceb32))
- swithed to nzyme schema ([4fedb2d](https://github.com/AgentScript-AI/agentscript/commit/4fedb2d))
- add support for nested function calls ([6a39bb4](https://github.com/AgentScript-AI/agentscript/commit/6a39bb4))
- renaming and moving packages ([9a83e47](https://github.com/AgentScript-AI/agentscript/commit/9a83e47))
- added inferWorkflow and a simple demo ([ccaef22](https://github.com/AgentScript-AI/agentscript/commit/ccaef22))
- **core:** added implicit type rendering for functions ([32aa5cd](https://github.com/AgentScript-AI/agentscript/commit/32aa5cd))
- **core:** defineTool input can be a schema ([e8e9773](https://github.com/AgentScript-AI/agentscript/commit/e8e9773))
- **linear:** working on approval pipeline ([2219b6c](https://github.com/AgentScript-AI/agentscript/commit/2219b6c))
- **linear:** creating linear tasks ([538031f](https://github.com/AgentScript-AI/agentscript/commit/538031f))
- **linear:** add linear demo ([c3d82d2](https://github.com/AgentScript-AI/agentscript/commit/c3d82d2))
- **runtime:** variable assignment ([d5b4418](https://github.com/AgentScript-AI/agentscript/commit/d5b4418))
- **runtime:** member expression ([2aa9782](https://github.com/AgentScript-AI/agentscript/commit/2aa9782))
- **runtime:** support object literals ([d1a2842](https://github.com/AgentScript-AI/agentscript/commit/d1a2842))
- **runtime:** add functions to runtime ([91f967f](https://github.com/AgentScript-AI/agentscript/commit/91f967f))
- **runtime:** add support for single arg tools ([e8bb405](https://github.com/AgentScript-AI/agentscript/commit/e8bb405))
- **runtime:** add support for output ([6ecfc89](https://github.com/AgentScript-AI/agentscript/commit/6ecfc89))

### ❤️ Thank You

- Michał Kędrzyński
