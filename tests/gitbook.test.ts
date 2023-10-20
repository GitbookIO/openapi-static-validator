import { expect, test } from 'bun:test';
import { validateRequest } from './gitbook.validate';

test('POST /spaces/1234/hive/token', () => {
    const result = validateRequest({
        path: '/spaces/1234/hive/token',
        method: 'post',
        headers: {
            'content-type': 'application/json',
        },
        query: {},
    });
    expect(result).toMatchSnapshot();
});
