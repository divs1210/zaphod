import z from 'zod'
import { Fn, Schema, check } from '..'

const zInt = z.number().int()

const zEven = zInt.refine(
    x => x % 2 === 0,
    'should be even'
)

const zOdd = zInt.refine(
    x => !check(zEven, x),
    'should be odd'
)

describe(Fn, () => {
    const incEven = Fn()
        .args(zEven)
        .returns(zOdd)
        .implement(x => x + 1)

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


    const addX = Fn()
        .args(zInt)
        .returns(z.function().args(zInt).returns(zInt))
        .implement(x => y => x + y)

    it('addX returns adding function', () => {
        const add5 = addX(5)
        expect(check(z.function().args(zInt).returns(zInt), add5)).toBe(true)
    })

    it('function returned by addX works as expected', () => {
        const add5 = addX(5)
        expect(add5(1)).toBe(6)
    })


    it('throws if an invalid value is returned', () => {
        const f = Fn()
            .returns(z.string())
            // @ts-expect-error
            .implement(() => 1)

        expect(f).toThrow('Expected string')
    })
})


describe('Generic Fns', () => {
    const map = <X extends Schema, Y extends Schema>(X: X, Y: Y, L: number) => Fn()
        .args(
            z.array(X).length(L),
            z.function().args(X).returns(Y)
        )
        .returns(z.array(Y).length(L))
        .implement((xs, f) => xs.map(x => f(x)))

    const reduce = <X extends Schema, Acc extends Schema>(X: X, Acc: Acc) => Fn()
        .args(
            z.array(X),
            z.function().args(Acc, X).returns(Acc),
            Acc
        )
        .returns(Acc)
        .implement((xs, f, init) => xs.reduce((acc, x) => f(acc, x), init))

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