import { type AnyApiDefinitionFormat, load, upgrade } from '@scalar/openapi-parser';
import type { OpenAPIV3 } from 'openapi-types';
/**
 * Parses an OpenAPI definition.
 * @param openApi - The OpenAPI definition.
 * @returns The parsed OpenAPI definition.
 */
export async function parseOpenApiDoc(
    openApi: AnyApiDefinitionFormat,
): Promise<OpenAPIV3.Document> {
    const openApiObject = await load(openApi);
    const upgradedOpenApi = upgrade(openApiObject.specification);

    return upgradedOpenApi.specification as OpenAPIV3.Document;
}
