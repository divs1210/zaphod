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
import { Fn, check } from '@divs1210/zaphod'

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
const incEven = Fn()
    .args(zEven)
    .returns(zOdd)
    .implement(x => x + 1)
```

`incEven` is now a fully statically typechecked + runtime validated function!

```typescript
incEven(2)   // => 3
incEven('2') // => TS error (string is not number)
incEven(1)   // => validation error (1 is not even)
```

### Validation Modes

```typescript
import { ValidationMode } from '@divs1210/zaphod'

const incEven = Fn()
    .args(zEven)
    .returns(zOdd)
    // disable runtime validation
    .setValidationMode(ValidationMode.None)
    .implement(x => x + 1)
```

The default mode is `Both`.

Others available are `Args`, `Ret`, and `None`.

### Generic functions

```typescript
const map = <X extends Schema, Y extends Schema>(X: X, Y: Y, L: number) => Fn()
    .args(                                    // argslist: [
        z.array(X).length(L),                 //   X[] of length L
        z.function().args(X).returns(Y)       //   (x: X) => Y
    )                                         // ]
    .returns(z.array(Y).length(L))            // returns: Y[] of length L
    .implement((xs, f) => xs.map(x => f(x)))

const xs = [1, 2, 3]
const ys = map(zInt, zInt, xs.length)(xs, x => x + 1)
```

The call to `map` might look weird,

but it is roughly equivalent to the following pseudo-TS:

```typescript
const ys = map<number, number, xs.length>(xs, x => x + 1)
```

## Use cases

### ...but Zod already has `z.function()`?

If you squint, you might see dependent types in here...

Yes, Zod already provides a way to define function schemas and implement them:

```typescript
const f = z
    .function()
    .args(z.number())
    .returns(z.string())
    .implement(x => '' + x)
```

but it ALWAYS validates the arguments, and also the return (if provided).

Zaphod allows you to turn off validation for arguments, return values, or both -
enabling you to write code in a style akin to dependent typing.

You can validate all functions during development,
and disable validation for all but the edge functions (I/O) in production.

## License

[MIT](/LICENSE)
