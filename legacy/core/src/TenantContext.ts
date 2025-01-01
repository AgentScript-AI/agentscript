import { defineService } from '@nzyme/ioc';

export const TenantContext = defineService({
    name: 'TenantContext',
    setup() {
        return {
            tenantId: 123n,
        };
    },
});
