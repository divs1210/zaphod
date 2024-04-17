import z from 'zod'

// ## Aliases
// ==========
export type Pred = z.ZodType
export const Pred = z.ZodType

export type TuplePred = z.AnyZodTuple

export type Infer<P extends Pred> = z.infer<P>


// ## Helpers
// ==========
export const check =
    (p: Pred, x: any) =>
        p.safeParse(x).success

export const validate =
    <P extends Pred>(p: P, x: any) =>
        p.parse(x) as Infer<P>


// ## Settings
// ===========
export enum ValidationMode {
    None,
    Args,
    Ret,
    Both
}


// ## Typechecked + validated functions
// ====================================
export function Fn
    <ArgsPred extends TuplePred, RetPred extends Pred>(
        argsPred: ArgsPred,
        retPred: RetPred,
        f: (...args: Infer<ArgsPred>) => Infer<RetPred>,
        validationMode: ValidationMode
    ) {
    return function (...args: Infer<ArgsPred>) {
        if (validationMode === ValidationMode.Args || validationMode === ValidationMode.Both)
            args = validate(argsPred, args)

        let ret = f(...args)
        if (validationMode === ValidationMode.Ret || validationMode === ValidationMode.Both)
            ret = validate(retPred, ret)

        return ret as Infer<RetPred>
    }
}