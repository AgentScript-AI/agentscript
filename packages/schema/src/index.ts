export * from '@nzyme/zchema';

declare module '@nzyme/zchema' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface SchemaProps<V> {
        /**
         * The name of the type.
         */
        name?: string;

        /**
         * A description of the property.
         */
        description?: string | string[];
    }
}
