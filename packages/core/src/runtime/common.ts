/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/unbound-method */
import { Console } from 'console';

/**
 * Native function type.
 */
export type NativeFunction = Function;

/**
 * Set of allowed native functions.
 */
export const allowedNativeFunctions = new Set<NativeFunction | string>([
    'toString',
    Number,
    String,
    Boolean,
    Console.prototype.log,
    Array.prototype.push,
    Array.prototype.pop,
    Array.prototype.shift,
    Array.prototype.unshift,
    Array.prototype.slice,
    Array.prototype.splice,
    Date.prototype.constructor,
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
]);

/**
 * Set of allowed native identifiers.
 */
export const allowedNativeIdentifiers = new Set([
    'console',
    'Date',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
]);
