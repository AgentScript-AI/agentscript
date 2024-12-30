/* eslint-disable @typescript-eslint/unbound-method */
export type NativeFunction = (...args: unknown[]) => unknown;

const allowedFunctions: (NativeFunction | string)[] = [
    'toString',
    Date.prototype.getTime,
    Date.prototype.getDate,
    Date.prototype.getDay,
    Date.prototype.getMonth,
    Date.prototype.getFullYear,
    Date.prototype.getHours,
    Date.prototype.getMinutes,
    Date.prototype.getSeconds,
    Date.prototype.getMilliseconds,
    Date.prototype.toISOString,
    Date.prototype.toLocaleString,
    Date.prototype.toUTCString,
    Date.prototype.toDateString,
    Date.prototype.toTimeString,
    Date.prototype.toLocaleDateString,
    Date.prototype.toLocaleTimeString,
];

export const allowedNativeFunctions = new Set(allowedFunctions);
