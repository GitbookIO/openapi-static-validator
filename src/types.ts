export interface OpenAPISpec {
    components?: {
        parameters?: {
            [key: string]: OpenAPIParameter;
        };
        schemas?: {
            [key: string]: OpenAPIValueSchema;
        };
    };
}

export interface OpenAPIParameter {
    name: string;
    in: string;
    required?: boolean;
    schema: OpenAPIValueSchema;
}

export type OpenAPIValueSchema =
    | OpenAPIAllOfSchema
    | OpenAPIAnyOfSchema
    | OpenAPIOneOfSchema
    | OpenAPIStringSchema
    | OpenAPINumberSchema
    | OpenAPIBooleanSchema
    | OpenAPIObjectSchema
    | OpenAPIArraySchema
    | OpenAPIRef;

export interface OpenAPIAllOfSchema {
    allOf: OpenAPIValueSchema[];
}

export interface OpenAPIAnyOfSchema {
    anyOf: OpenAPIValueSchema[];
}

export interface OpenAPIOneOfSchema {
    oneOf: OpenAPIValueSchema[];
}

export interface OpenAPIStringSchema extends OpenAPINullableSchema, OpenAPIEnumableSchema {
    type: 'string';
    format?: 'date' | 'uri';
}

export interface OpenAPINumberSchema extends OpenAPINullableSchema, OpenAPIEnumableSchema {
    type: 'number';
}

export interface OpenAPIBooleanSchema extends OpenAPINullableSchema, OpenAPIEnumableSchema {
    type: 'boolean';
}

export interface OpenAPIObjectSchema extends OpenAPINullableSchema {
    type: 'object';
    required?: string[];
    properties?: {
        [key: string]: OpenAPIValueSchema & { default?: string | number | boolean };
    };
    additionalProperties?: boolean | OpenAPIValueSchema;
    minProperties?: number;
    maxProperties?: number;
}

export interface OpenAPIArraySchema extends OpenAPINullableSchema {
    type: 'array';
    items: OpenAPIValueSchema;
    minItems?: number;
    maxItems?: number;
}

export interface OpenAPINullableSchema {
    nullable?: boolean;
}

export interface OpenAPIEnumableSchema {
    enum?: (string | number | boolean)[];
}

export interface OpenAPIRef {
    $ref: string;
}
