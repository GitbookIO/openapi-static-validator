export interface OpenAPISpec {
    components: {
        parameters?: {
            [key: string]: OpenAPIParameter;
        };
    };
}

export interface OpenAPIParameter {
    name: string;
    in: string;
    required?: boolean;
    schema: OpenAPIValueSchema | OpenAPIRef;
}

export type OpenAPIValueSchema =
    | OpenAPIAllOfSchema
    | OpenAPIAnyOfSchema
    | OpenAPIOneOfSchema
    | OpenAPIStringSchema
    | OpenAPINumberSchema
    | OpenAPIObjectSchema;

export interface OpenAPIAllOfSchema {
    allOf: OpenAPIValueSchema[];
}

export interface OpenAPIAnyOfSchema {
    anyOf: OpenAPIValueSchema[];
}

export interface OpenAPIOneOfSchema {
    oneOf: OpenAPIValueSchema[];
}

export interface OpenAPIStringSchema {
    type: 'string';
    format?: 'date' | 'uri';
}

export interface OpenAPINumberSchema {
    type: 'number';
}

export interface OpenAPIObjectSchema {
    type: 'object';
    required?: string[];
    properties?: {
        [key: string]: OpenAPIValueSchema & { default?: string | number | boolean };
    };
    additionalProperties?: boolean | OpenAPIValueSchema;
    minProperties?: number;
    maxProperties?: number;
}

export interface OpenAPIRef {
    $ref: string;
}
