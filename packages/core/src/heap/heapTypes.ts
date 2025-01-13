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
    | HeapSet;

/**
 * Primitive serialized.
 */
export type HeapPrimitive = boolean | string | number | null;
/**
 * Array serialized.
 */
export type HeapArray = ['arr', ...values: number[]];
/**
 * Object serialized.
 */
export type HeapObject = Record<string, number>;
/**
 * BigInt serialized.
 */
export type HeapBigInt = ['bint', value: string];
/**
 * Date serialized.
 */
export type HeapDate = ['date', value: string];
/**
 * Symbol serialized.
 */
export type HeapSymbol = ['sym', value: string | undefined] | ['sym'];
/**
 * Set serialized.
 */
export type HeapSet = ['set', ...values: number[]];
