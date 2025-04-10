/**
 * Heap. Allows for recursive serialization of values.
 */
export type Heap = HeapValue[];

/**
 * Heap value.
 */
export type HeapValue =
    | HeapPrimitive
    | HeapArray
    | HeapObject
    | HeapBigInt
    | HeapDate
    | HeapSymbol
    | HeapSet
    | HeapRegex;

/**
 * Primitive serialized.
 */
export type HeapPrimitive = boolean | string | number | null;

/**
 * Array serialized.
 */
export type HeapArray = ['a', ...values: number[]];

/**
 * Object serialized.
 */
export type HeapObject = ['o', ...values: (string | number)[]];

/**
 * BigInt serialized.
 */
export type HeapBigInt = ['bi', value: string];

/**
 * Date serialized.
 */
export type HeapDate = ['d', value: string];

/**
 * Symbol serialized.
 */
export type HeapSymbol = ['sm', value: string | undefined] | ['sm'];

/**
 * Set serialized.
 */
export type HeapSet = ['st', ...values: number[]];

/**
 * Regex serialized.
 */
export type HeapRegex = ['r', value: string, flags: string];
