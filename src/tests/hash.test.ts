import { hash } from "../hash"


describe('Strings', () => {
    test('different', () => {
        expect(hash('foo')).not.toEqual(hash('bar'))
    })
})