# `openapi-static-validator`

CLI to compile an OpenAPI specification as JavaScript validation file, optimized for performances.

## Installation

```
npm install openapi-static-validator -g
```

## Usage

```
openapi-static-validator spec.json > validate.js
```

## TODOs

-   Parameters:
    -   [ ] in `cookie`
    -   [ ] in `header`
    -   [ ] in `query`
-   JSONSchema `string` validation of:
    -   [ ] `format`
-   JSONSchema `integer`
    -   [ ] no float

## Development

To publish the package:

-   Change version in `package.json`
-   Commit the change and tag it
-   Run `npm publish`
