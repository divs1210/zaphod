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
import { Fn, ValidationMode, check } from '@divs1210/zaphod'

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

// zaphod Fn incEven: (x: zEven) => zOdd 
const incEven = Fn(
    z.tuple([zEven]),   // schema of argslist: [zEven]
    zOdd,               // schema of return value: zOdd
    x => x + 1,         // actual implementation
    ValidationMode.Both // Args / Ret / Both / None
)
```

`incEven` is now a fully statically typechecked + runtime validated function!

```typescript
incEven(2)   // => 3
incEven('2') // => TS error (string is not number)
incEven(1)   // => validation error (1 is not even)
```

### Generic functions

```typescript
const map = <X extends Pred, Y extends Pred>(X: X, Y: Y, L: number) =>
    Fn(
        z.tuple([                         // argslist: [
            z.array(X).length(L),         //   X[] of length L
            z.function(z.tuple([X]), Y)   //   (x: X) => Y
        ]),                               // ]
        z.array(Y).length(L),             // return: Y[] of length L
        (xs, f) => xs.map(x => f(x)),
        ValidationMode.Both
    )

const xs = [1, 2, 3]
const ys = map(zInt, zInt, xs.length)(xs, x => x + 1)
```

## Use cases

If you squint, you might see dependent types in here...

## ...but Zod already has `z.function()`?

Yes, Zod already provides a way to define function schemas and implement them:

```typescript
const f = z
    .function()
    .args(z.number())
    .returns(z.string())
    .implement(x => '' + x)
```

but it will ALWAYS validate the arguments.

Zaphod allows you to turn off validation for arguments, return values, or both,
thereby enabling writing code in a style akin to dependent typing.

You can validate all functions during development,
and disable validation for all but the edge functions (I/O) in production.

Though this library could possibly be better written as:

```typescript
const f = z
    .function()
    .args(z.number())
    .returns(z.string())
    .implement(x => '' + x)
    .validate(ValidationMode.BOTH)
```

## License

[MIT](/LICENSE)
