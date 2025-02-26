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
    Array.prototype.includes,
    Array.prototype.indexOf,
    Array.prototype.lastIndexOf,
    Array.prototype.concat,
    Array.prototype.flat,
    Array.prototype.filter,
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
    String.prototype.startsWith,
    String.prototype.endsWith,
    String.prototype.includes,
    String.prototype.indexOf,
    String.prototype.lastIndexOf,
    String.prototype.replace,
    String.prototype.replaceAll,
    String.prototype.search,
    String.prototype.slice,
    String.prototype.split,
    String.prototype.substring,
    String.prototype.toLowerCase,
    String.prototype.toUpperCase,
    String.prototype.trim,
    String.prototype.trimEnd,
    String.prototype.trimStart,
    String.prototype.valueOf,
]);
