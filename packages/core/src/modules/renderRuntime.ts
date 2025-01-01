import type { Runtime } from '../defineRuntime.js';
import { renderModule } from './renderModule.js';

/**
 * Render a runtime as TypeScript code.
 * @param runtime - Runtime to render.
 * @returns Rendered runtime.
 */
export function renderRuntime(runtime: Runtime) {
    return renderModule(runtime);
}
