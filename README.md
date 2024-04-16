# Zaphod

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
 ![CI](https://github.com/divs1210/zaphod/actions/workflows/node.js.yml/badge.svg)

TypeScript library for writing 

fully typechecked + runtime validated functions 

using [Zod](https://github.com/colinhacks/zod).

## Installation

```
$ npm i @divs1210/zaphod
```

## Usage

```typescript
import z from 'zod'
import { Fn, ValidationMode, check } from 'zaphod'

// zod schema for integers
const zInt = z.number().int()

// zod schema for even numbers
const zEven = zInt.refine(
    x => x % 2 === 0,
    'should be even'
)

// zod schema for odd numbers
const zOdd = zInt.refine(
    x => !check(zEven, x),
    'should be odd'
)

// zaphod Fn
const incEven = Fn(
    z.tuple([zEven]),   // schema of argslist: [zEven]
    zOdd,               // schema of return value: zOdd
    x => x + 1,         // actual implementation
    ValidationMode.Both // Args / Ret / Both / None
)

incEven(2)   // => 3
incEven('2') // => TS error (string is not number)
incEven(1)   // => validation error (1 is not even)
```

## Generic functions

```typescript
import { GenericFn } from 'zaphod'

// X, Y, and L are called "PredVars"
const map = GenericFn(<X extends Pred, Y extends Pred>({ X, Y, L }: { X: X, Y: Y, L: number }) =>
    Fn(
        z.tuple([                         // argslist: [
            z.array(X).length(L),         //   X[] of length L
            z.function(z.tuple([X]), Y)   //   (x: X) => Y
        ]),                               // ]
        z.array(Y).length(L),             // return: Y[] of length L
        (xs, f) => xs.map(x => f(x)),
        ValidationMode.Both
    )
)

const xs = [1, 2, 3]
const ys = map({ X: zInt, Y: zInt, L: xs.length })(xs, x => x + 1)
```

## Edge cases

### Empty argslist

```typescript
import { EmptyTuple } from 'zaphod'

const f = Fn(
    EmptyTuple,   // empty argslist
    z.number(),
    () => 1, 
    ValidationMode.Both
)

f() // TS complains that no args were provided
```


## License

[MIT](/LICENSE)