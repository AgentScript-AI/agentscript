import type { HeapSerialized, HeapSerializedValue } from './heapTypes.js';

export function createHeapSerializer() {
    const heap: HeapSerialized = [];
    const heapMap = new Map<unknown, number>();

    return {
        heap,
        push,
    };

    function push(value: unknown) {
        if (value === undefined) {
            return -1;
        }

        let index = heapMap.get(value);
        if (index !== undefined) {
            return index;
        } else {
            heapMap.set(value, heap.length);
            index = heap.length;
        }

        if (value === null) {
            heap.push(['', value]);
            return index;
        }

        switch (typeof value) {
            case 'number':
            case 'string':
            case 'boolean':
                heap.push(['', value]);
                break;
            case 'bigint':
                heap.push(['bint', value.toString()]);
                break;
            case 'symbol':
                heap.push(['sym', value.toString()]);
                break;
            case 'object': {
                let serialized: [string, ...number[]];

                if (Array.isArray(value)) {
                    serialized = ['arr'];
                    for (const item of value) {
                        serialized.push(push(item));
                    }
                } else if (value instanceof Set) {
                    serialized = ['set'];
                    for (const item of value) {
                        serialized.push(push(item));
                    }
                } else if (value instanceof Date) {
                    serialized = ['date', push(value.toISOString())];
                } else {
                    serialized = ['obj'];
                    for (const [key, val] of Object.entries(value)) {
                        serialized.push(key, push(val));
                    }
                }

                heap.push(serialized as HeapSerializedValue);
                break;
            }
            default:
                throw new Error(`Unsupported type: ${typeof value}`);
        }

        return index;
    }
}
