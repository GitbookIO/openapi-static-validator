# `openapi-static-validator`

CLI to compile an OpenAPI specification as JavaScript validation file, optimized for performances.

## Installation

```
npm install openapi-static-validator -g
```

## Usage

#### Compilation of the OpenAPI spec to JavaScript

```
openapi-static-validator spec.json > validate.js
```

#### Use of the validation code

Then the validation can be imported in your code:

```ts
import { validateRequest, RequestError } from './validate';

const result = validateRequest({
    path: 'say/hello',
    method: 'post',
    headers: {},
    query: {},
    body: {
        message: 'Hello world',
    },
});

if (result instanceof RequestError) {
    // Do something with the error
} else {
    console.log(result);
}
```

#### Custom string format

When using `format` for data of `type: string`, you need to define validators for them:

```ts
import { validateRequest, ValidationError } from './validate';

const result = validateRequest(
    {
        path: 'say/hello',
        method: 'post',
        headers: {},
        query: {},
        body: {
            message: 'Hello world',
        },
    },
    {
        stringFormats: {
            uri: (value, path) =>
                value.startsWith('https://') ? null : new ValidationError(path, 'Invalid url'),
        },
    },
);
```

## TODOs

-   [ ] `in: header` and `in: cookie` parameters
-   [ ] validation of `type: integer`, not just as `number`
-   [ ] validation of response using a `validateResponse` function

## Development

To publish the package:

-   Change version in `package.json`
-   Commit the change and tag it
-   Run `npm run build` and `npm publish`
