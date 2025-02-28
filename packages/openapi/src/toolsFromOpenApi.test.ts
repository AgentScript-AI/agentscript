import { expect, test } from 'vitest';

import { parseOpenApiDoc } from './parseOpenApiDoc.js';
import { toolsFromOpenApi } from './toolsFromOpenApi.js';

const swaggerUrl = 'https://petstore3.swagger.io/api/v3/openapi.json';
const apiUrl = 'https://petstore3.swagger.io/api/v3';

test('toolsFromOpenApi', async () => {
    const openApi = await fetch(swaggerUrl);
    const openApiJson = await openApi.text();

    const spec = await parseOpenApiDoc(openApiJson);
    const tools = toolsFromOpenApi({
        spec,
        baseUrl: apiUrl,
    });

    expect(tools).toBeDefined();
});
