export interface OpenAPISpec {
    components?: {
        parameters?: {
            [key: string]: OpenAPIParameter;
        };
        schemas?: {
            [key: string]: OpenAPIValueSchema;
        };
    };
    paths?: {
        [key: string]: OpenAPIPath;
    };
}

export interface OpenAPIPath {
    [httpMethod: string]: OpenAPIOperation;
}

export interface OpenAPIOperation {
    operationId?: string;
    parameters?: Array<OpenAPIParameter | OpenAPIRef>;
    requestBody?: OpenAPIRequestBody;
}

export interface OpenAPIRequestBody {
    required?: boolean;
    content?: {
        [contentType: string]: {
            schema?: OpenAPIValueSchema;
        };
    };
}

export interface OpenAPIParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    schema: OpenAPIValueSchema;
}

export type OpenAPIValueSchema =
    | OpenAPIAllOfSchema
    | OpenAPIAnyOfSchema
    | OpenAPIOneOfSchema
    | OpenAPIStringSchema
    | OpenAPINumberSchema
    | OpenAPIIntegerSchema
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
    minLength?: number;
    maxLength?: number;
    pattern?: string;
}

interface CommonNumberSchema {
    maximum?: number;
    minimum?: number;
    exclusiveMinimum?: boolean;
    exclusiveMaximum?: boolean;
}
export interface OpenAPINumberSchema extends CommonNumberSchema, OpenAPINullableSchema, OpenAPIEnumableSchema {
    type: 'number';
    maximum?: number;
    minimum?: number;
}



export interface OpenAPIIntegerSchema extends CommonNumberSchema, OpenAPINullableSchema, OpenAPIEnumableSchema {
    type: 'integer';
    format?: 'int32';
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
    uniqueItems?: boolean;
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
