import type { HeapSerialized } from './heapTypes.js';

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
            case 'object':
                if (Array.isArray(value)) {
                    heap.push(['arr', ...value.map(push)]);
                    break;
                }

                if (value instanceof Set) {
                    heap.push(['set', ...Array.from(value).map(push)]);
                    break;
                }

                if (value instanceof Date) {
                    heap.push(['date', value.toISOString()]);
                    break;
                }

                heap.push([
                    'obj',
                    Object.fromEntries(
                        Object.entries(value).map(([key, value]) => [key, push(value)]),
                    ),
                ]);

                break;
            default:
                throw new Error(`Unsupported type: ${typeof value}`);
        }

        return index;
    }
}
