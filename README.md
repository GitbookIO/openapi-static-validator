# `openapi-to-validate`

CLI to compile an OpenAPI specification as JavaScript validation file, optimized for performances.

## TODOs

- Path/Operations
  - [ ] Validate parameters
- JSONSchema `string` validation of:
  - [x] `minLength`
  - [x] `maxLength`
  - [ ] `format`
  - [x] `pattern`
- JSONSchema `array` validation of:
  - [x] `minItems`
  - [x] `maxItems`
  - [x] `uniqueItems`
- JSONSchema `integer`
  - [ ] no float
