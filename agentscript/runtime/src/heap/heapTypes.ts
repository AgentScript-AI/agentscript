export type HeapSerialized = HeapSerializedValue[];

export type HeapSerializedValue =
    | PrimitiveSerialized
    | ArraySerialized
    | ObjectSerialized
    | BigIntSerialized
    | DateSerialized
    | SymbolSerialized
    | SetSerialized;

export type PrimitiveSerialized = ['', value: boolean | string | number | null];
export type ArraySerialized = ['arr', ...values: number[]];
export type ObjectSerialized = ['obj', value: Record<string, number>];
export type BigIntSerialized = ['bint', value: string];
export type DateSerialized = ['date', value: string];
export type SymbolSerialized = ['sym', value: string];
export type SetSerialized = ['set', ...values: number[]];
