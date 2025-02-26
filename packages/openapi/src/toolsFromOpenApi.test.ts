import { expect, test } from 'vitest';

import { toolsFromOpenApi } from './toolsFromOpenApi.js';

const swaggerUrl = 'https://petstore3.swagger.io/api/v3/openapi.json';
const apiUrl = 'https://petstore3.swagger.io/api/v3';

test('toolsFromOpenApi', async () => {
    const openApi = await fetch(swaggerUrl);
    const openApiJson = await openApi.text();
    const tools = await toolsFromOpenApi({
        spec: openApiJson,
        baseUrl: apiUrl,
    });

    expect(tools).toBeDefined();
});
