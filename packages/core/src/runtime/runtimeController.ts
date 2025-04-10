/**
 *
 */
export interface RuntimeController {
    /**
     *
     */
    tick(count?: number): void;
    /**
     *
     */
    continue(): boolean;
    /**
     *
     */
    ticks: number;
}

/**
 *
 */
export interface RuntimeControllerOptions {
    /**
     *
     */
    ticks?: number;
    /**
     *
     */
    timeout?: number | Date;
    /**
     *
     */
    until?: () => boolean;
}

const TICK_MULTIPLIER = 1000;

/**
 *
 */
export function createRuntimeControler(options: RuntimeControllerOptions): RuntimeController {
    const { timeout, until = () => false } = options;

    const maxTicks = options.ticks ? options.ticks * TICK_MULTIPLIER : Infinity;
    const timeoutDate =
        timeout != null
            ? typeof timeout === 'number'
                ? Date.now() + timeout
                : timeout.getTime()
            : null;

    let ticks = 0;

    return {
        tick(count = 1) {
            ticks += count * TICK_MULTIPLIER;
        },
        continue() {
            if (ticks >= maxTicks) {
                return false;
            }

            if (timeoutDate && Date.now() > timeoutDate) {
                return false;
            }

            if (until()) {
                return false;
            }

            return true;
        },
        get ticks() {
            return Math.round(ticks) / TICK_MULTIPLIER;
        },
    };
}
