import { expect, test } from 'vitest';

import { createDeserializer } from './createDeserializer.js';
import { createSerializer } from './createSerializer.js';

test('serializer and deserializer', () => {
    const serializer = createSerializer();

    const value = {
        a: 1,
        b: 'ieaiea',
        c: [3, 4, 5],
        d: new Set([6, 7, 8]),
        e: new Date('2021-01-01'),
        f: {
            g: 45n,
            h: 'foo',
            i: false,
            j: true,
            k: null,
            l: undefined,
            m: /test/i,
        },
    };

    const index = serializer.push(value);

    const deserializer = createDeserializer(serializer.heap);
    const deserialized = deserializer.get(index);

    expect(deserialized).toEqual(value);
});

test('recursive object', () => {
    const serializer = createSerializer();

    const value = {
        a: 1,
        b: null as unknown,
    };

    value.b = value;

    const index = serializer.push(value);

    const deserializer = createDeserializer(serializer.heap);
    const deserialized = deserializer.get(index);

    expect(deserialized).toEqual(value);
});

test('symbol', () => {
    const serializer = createSerializer();

    const value = {
        a: Symbol('foo'),
        b: Symbol(),
    };

    const index = serializer.push(value);

    const deserializer = createDeserializer(serializer.heap);
    const deserialized = deserializer.get(index) as typeof value;

    expect(deserialized.a.description).toEqual('foo');
    expect(deserialized.b.description).toEqual(undefined);
});

test('multiple values', () => {
    const serializer = createSerializer();

    const arr = [1, 2, 3, 4, 5n, true, 'foo', new Date('2021-01-01')];
    const arrIndex = serializer.push(arr);

    const obj = {
        a: arr,
        b: new Set(arr),
    };

    const objIndex = serializer.push(obj);

    const deserializer = createDeserializer(serializer.heap);

    const arrDeserialized = deserializer.get(arrIndex) as typeof arr;
    const objDeserialized = deserializer.get(objIndex) as typeof obj;

    expect(arrDeserialized).toEqual(arr);
    expect(objDeserialized).toEqual(obj);
    expect(objDeserialized.a).toBe(arrDeserialized);
});
