import z from 'zod'
import { Fn, Pred, ValidationMode, check } from '..'

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

    const addX = Fn(
        z.tuple([zInt]),
        z.function().args(zInt).returns(zInt),
        x => y => x + y,
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

    it('addX returns adding function', () => {
        const add5 = addX(5)
        expect(check(z.function().args(zInt).returns(zInt), add5)).toBe(true)
    })

    it('function returned by addX works as expected', () => {
        const add5 = addX(5)
        expect(add5(1)).toBe(6)
    })

    it('throws if an invalid value is returned', () => {
        const f = Fn(
            z.tuple([]),
            z.string(),
            // @ts-expect-error
            () => 1,
            ValidationMode.Ret
        )
        expect(f).toThrow('Expected string')
    })
})


describe('Generic Fns', () => {
    const map = <X extends Pred, Y extends Pred>(X: X, Y: Y, L: number) =>
        Fn(
            z.tuple([
                z.array(X).length(L),
                z.function().args(X).returns(Y)
            ]),
            z.array(Y).length(L),
            (xs, f) => xs.map(x => f(x)),
            ValidationMode.Both
        )

    const reduce = <X extends Pred, Acc extends Pred>(X: X, Acc: Acc) =>
        Fn(
            z.tuple([
                z.array(X),
                z.function().args(Acc, X).returns(Acc),
                Acc
            ]),
            Acc,
            (xs, f, init) => xs.reduce((acc, x) => f(acc, x), init),
            ValidationMode.Both
        )

    let xs = [1, 2, 3]
    let ys = map(zInt, zInt, xs.length)(xs, x => x + 1)
    let zs = reduce(zInt, z.string())(xs, (acc, x) => acc + x, '')

    it('map returns Y[]', () => {
        expect(check(z.array(zInt), ys)).toBe(true)
    })

    it('map returns array with expected elements', () => {
        expect(ys).toEqual([2, 3, 4])
    })

    it('map returns array of same length as input', () => {
        expect(ys.length).toBe(xs.length)
    })

    it('map returns array of same length as input', () => {
        expect(zs).toBe('123')
    })
})