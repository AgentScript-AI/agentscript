export * from '@nzyme/zchema';

declare module '@nzyme/zchema' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface SchemaProps<V> {
        description?: string | string[];
    }
}
