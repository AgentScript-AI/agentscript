import { expect, test } from 'vitest';

import type { MetadataWrapper } from './defineMetadata.js';
import { defineMetadata } from './defineMetadata.js';

test('number metadata', () => {
    const metadata = defineMetadata<number>({ name: 'test' });
    const wrapper: MetadataWrapper = { metadata: {} };

    expect(metadata(wrapper)).toBeUndefined();

    metadata(wrapper, 1);

    expect(metadata(wrapper)).toBe(1);
    expect(wrapper.metadata).toEqual({ test: 1 });
});

test('string metadata', () => {
    const metadata = defineMetadata<string>({ name: 'test' });
    const wrapper: MetadataWrapper = { metadata: {} };

    expect(metadata(wrapper)).toBeUndefined();

    metadata(wrapper, 'test');

    expect(metadata(wrapper)).toBe('test');
    expect(wrapper.metadata).toEqual({ test: 'test' });
});

test('object metadata', () => {
    const metadata = defineMetadata<{ a: number }>({ name: 'test' });
    const wrapper: MetadataWrapper = { metadata: {} };

    expect(metadata(wrapper)).toBeUndefined();

    metadata(wrapper, { a: 1 });

    expect(metadata(wrapper)).toEqual({ a: 1 });
    expect(wrapper.metadata).toEqual({ test: { a: 1 } });
});

test('multiple metadata', () => {
    const metadata1 = defineMetadata<{ a: number }>({ name: 'test1' });
    const metadata2 = defineMetadata<{ b: string }>({ name: 'test2' });
    const wrapper: MetadataWrapper = { metadata: {} };

    expect(metadata1(wrapper)).toBeUndefined();
    expect(metadata2(wrapper)).toBeUndefined();

    metadata1(wrapper, { a: 1 });
    metadata2(wrapper, { b: 'test' });

    expect(metadata1(wrapper)).toEqual({ a: 1 });
    expect(metadata2(wrapper)).toEqual({ b: 'test' });

    expect(wrapper.metadata).toEqual({
        test1: { a: 1 },
        test2: { b: 'test' },
    });
});
