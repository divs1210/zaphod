import z from 'zod'
import { EmptyTuple, Fn, GenericFn, Pred, ValidationMode, check } from '..'

const zInt = z.number().int()

describe(Fn, () => {
    const zEven = zInt.refine(
        x => x % 2 === 0,
        'should be even'
    )

    const zOdd = zInt.refine(
        x => !check(zEven, x),
        'should be odd'
    )

    const incEven = Fn(
        z.tuple([zEven]),
        zOdd,
        x => x + 1,
        ValidationMode.Both
    )

    it('incEven returns an odd number', () => {
        let x = 2
        let y = incEven(x)
        expect(y).toBe<number>(3)
        expect(check(zOdd, y)).toBe(true)
    })

    it('incEven returns the expected value', () => {
        expect(incEven(4)).toBe(5)
    })

    it('incEven throws if an odd number is passed', () => {
        expect(() => incEven(3)).toThrow('should be even')
    })

    it('throws if an invalid value is returned', () => {
        const f = Fn(
            EmptyTuple,
            z.string(),
            // @ts-expect-error
            () => 1,
            ValidationMode.Ret
        )
        expect(f).toThrow('Expected string')
    })
})


// ## Generic fn
// ==============
describe(GenericFn, () => {
    const map = GenericFn(<X extends Pred, Y extends Pred>({ X, Y, L }: { X: X, Y: Y, L: number }) =>
        Fn(
            z.tuple([
                z.array(X).length(L),
                z.function(z.tuple([X]), Y)
            ]),
            z.array(Y).length(L),
            (xs, f) => xs.map(x => f(x)),
            ValidationMode.Both
        )
    )

    let xs = [1, 2, 3]
    let ys = map({ X: zInt, Y: zInt, L: xs.length })(xs, x => x + 1)

    it('map returns Y[]', () => {
        expect(check(z.array(zInt), ys)).toBe(true)
    })

    it('map returns array with expected elements', () => {
        expect(ys).toEqual([2, 3, 4])
    })

    it('map returns array of same length as input', () => {
        expect(ys.length).toBe(xs.length)
    })
})