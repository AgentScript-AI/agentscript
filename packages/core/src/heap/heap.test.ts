import { expect, test } from 'vitest';

import { createHeapDeserializer } from './createHeapDeserializer.js';
import { createHeapSerializer } from './createHeapSerializer.js';

test('heap serializer and deserializer', () => {
    const serializer = createHeapSerializer();

    const value = {
        a: 1,
        b: 2,
        c: [3, 4, 5],
        d: new Set([6, 7, 8]),
    };

    const index = serializer.push(value);

    const deserializer = createHeapDeserializer(serializer.heap);
    const deserialized = deserializer.get(index);

    expect(deserialized).toEqual(value);
});
