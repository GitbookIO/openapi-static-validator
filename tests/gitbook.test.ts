import { expect, test } from 'bun:test';
import { validateRequest, ValidationError } from './gitbook.validate';

test('POST /spaces/1234/hive/token', () => {
    const result = validateRequest({
        path: '/spaces/1234/hive/token',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
    });
    expect(result).toMatchObject({
        headers: {
            'content-type': 'application/json',
        },
        method: 'post',
        operationId: 'generateSpaceHiveReadAccessToken',
        params: {
            spaceId: '1234',
        },
        path: '/spaces/1234/hive/token',
        query: {},
    });
});

test('POST orgs/appleId/custom-fields', () => {
    const result = validateRequest({
        path: '/orgs/appleId/custom-fields',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: { name: 'jira_board', type: 'number' },
    });
    expect(result).toMatchObject({
        params: {
            organizationId: 'appleId',
        },
    });
});

test('GET orgs/microsoft/collections?limit=invalid', () => {
    const result = validateRequest({
        path: '/orgs/microsoft/collections',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            limit: 'invalid',
        },
    });
    expect(result instanceof ValidationError ? result.path : null).toEqual(['query', 'limit']);
});

test('GET orgs/microsoft/collections?limit=10', () => {
    const result = validateRequest({
        path: '/orgs/microsoft/collections',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            limit: '10',
        },
    });
    expect(result).toMatchObject({
        params: {
            organizationId: 'microsoft',
        },
        query: {
            limit: 10,
        },
    });
});

test('GET orgs/microsoft/collections?nested=true', () => {
    const result = validateRequest({
        path: '/orgs/microsoft/collections',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            nested: 'true',
        },
    });
    expect(result).toMatchObject({
        params: {
            organizationId: 'microsoft',
        },
        query: {
            nested: true,
        },
    });
});

test('POST orgs/appleId/custom-fields', () => {
    const result = validateRequest({
        path: '/orgs/appleId/spaces',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: undefined,
    });
    expect(result).toMatchObject({
        params: {
            organizationId: 'appleId',
        },
    });
});

test('PUT orgs/apple/schemas/newType', () => {
    const result = validateRequest({
        path: '/orgs/apple/schemas/newType',
        method: 'put',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            type: 'newType',
            title: {
                singular: 'New type',
                plural: 'New types',
            },
            properties: [
                {
                    name: 'title',
                    type: 'text',
                    title: 'Title',
                },
            ],
        },
    });
    expect(result).toMatchObject({
        operationId: 'setEntitySchema',
        params: {
            organizationId: 'apple',
            entityType: 'newType',
        },
    });
});

test('PUT orgs/apple/schemas/newType/entities', () => {
    const result = validateRequest({
        path: '/orgs/apple/schemas/newType/entities',
        method: 'put',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            entities: [
                {
                    entityId: 'something',
                    properties: {
                        title: 'Updated lambda',
                        description: 'the description',
                        url: 'https://example.com',
                        public_traffic: false,
                        created_on: '2020-01-01T00:00:00.000Z',
                    },
                },
            ],
        },
    });
    expect(result).toMatchObject({
        operationId: 'upsertSchemaEntities',
        params: {
            organizationId: 'apple',
            entityType: 'newType',
        },
    });
});

test('POST orgs/apple/members/jony (invalid)', () => {
    const result = validateRequest({
        path: '/orgs/apple/members/jony',
        method: 'patch',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            role: 'invalid',
        },
    });
    expect(result instanceof ValidationError ? result.path : null).toEqual(['body', 'role']);
});

test('POST orgs/apple/members/jony (null)', () => {
    const result = validateRequest({
        path: '/orgs/apple/members/jony',
        method: 'patch',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
        body: {
            role: null,
        },
    });
    expect(result).toMatchObject({
        operationId: 'updateMemberInOrganizationById',
        params: {
            organizationId: 'apple',
            userId: 'jony',
        },
    });
});

test('GET spaces/space_iphone-doc/content/path/apps%2Fphone', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/content/path/apps%2Fphone',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
    });
    expect(result).toMatchObject({
        operationId: 'getPageByPath',
        params: {
            spaceId: 'space_iphone-doc',
            pagePath: 'apps/phone',
        },
    });
});

test('GET spaces/space_iphone-doc/revisions/somerevision/files', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/revisions/somerevision/files',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
    });
    expect(result).toMatchObject({
        operationId: 'listFilesInRevisionById',
        params: {
            spaceId: 'space_iphone-doc',
            revisionId: 'somerevision',
        },
    });
});

test('GET spaces/space_iphone-doc/revisions/somerevision/files?limit=1', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/revisions/somerevision/files',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            limit: '1',
        },
    });
    expect(result).toMatchObject({
        operationId: 'listFilesInRevisionById',
        query: {
            limit: 1,
        },
        params: {
            spaceId: 'space_iphone-doc',
            revisionId: 'somerevision',
        },
    });
});

test('GET spaces/space_iphone-doc/revisions/somerevision/files?metadata=false', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/revisions/somerevision/files',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            metadata: 'false',
        },
    });
    expect(result).toMatchObject({
        operationId: 'listFilesInRevisionById',
        query: {
            metadata: false,
        },
        params: {
            spaceId: 'space_iphone-doc',
            revisionId: 'somerevision',
        },
    });
});

test('GET spaces/space_iphone-doc/revisions/somerevision/files?metadata=true', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/revisions/somerevision/files',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            metadata: 'true',
        },
    });
    expect(result).toMatchObject({
        operationId: 'listFilesInRevisionById',
        query: {
            metadata: true,
        },
        params: {
            spaceId: 'space_iphone-doc',
            revisionId: 'somerevision',
        },
    });
});

test('GET spaces/space_iphone-doc/revisions/somerevision/files?limit=1000 (invalid, number above maximum)', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/revisions/somerevision/files',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            limit: '1000',
        },
    });
    expect(result instanceof ValidationError ? result.path : null).toEqual(['query', 'limit']);
});

test('GET spaces/space_iphone-doc/revisions/somerevision/files?limit=-1 (invalid, number below minimum)', () => {
    const result = validateRequest({
        path: '/spaces/space_iphone-doc/revisions/somerevision/files',
        method: 'get',
        headers: {
            'content-type': 'application/json',
        },
        query: {
            limit: '-1',
        },
    });
    expect(result instanceof ValidationError ? result.path : null).toEqual(['query', 'limit']);
});
