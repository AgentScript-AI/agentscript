import type { Constructor } from '@nzyme/types';

/* eslint-disable @typescript-eslint/unbound-method */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NativeFunction = (...args: any[]) => unknown;

const allowedFunctions: (NativeFunction | string)[] = [
    'toString',
    Number,
    String,
    Boolean,
    Array.prototype.push,
    Array.prototype.pop,
    Array.prototype.shift,
    Array.prototype.unshift,
    Array.prototype.slice,
    Array.prototype.splice,
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

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const allowedConstructors: Function[] = [Date.prototype.constructor];

export const allowedNativeConstructors = new Set(allowedConstructors as Constructor[]);
