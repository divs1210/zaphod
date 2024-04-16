import z from 'zod'

// ## Aliases
// ==========
export type Pred = z.ZodType
export const Pred = z.ZodType

export type Tuple = z.ZodTuple
export const Tuple = z.ZodTuple
export const EmptyTuple = z.tuple([]) as unknown as Tuple

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
    <ArgsPred extends Tuple, RetPred extends Pred>(
        argsPred: ArgsPred,
        retPred: RetPred,
        f: (...args: Infer<ArgsPred>) => Infer<RetPred>,
        validationMode: ValidationMode
    ) {
    return function (...args: Infer<ArgsPred>) {
        if (validationMode === ValidationMode.Args || validationMode === ValidationMode.Both)
            if(argsPred)
                args = validate(argsPred, args)

        let ret = f(...args)
        if (validationMode === ValidationMode.Ret || validationMode === ValidationMode.Both)
            ret = validate(retPred, ret)

        return ret as Infer<RetPred>
    }
}

export function GenericFn
    <PredVars extends object, ArgsPred extends Tuple, RetPred extends Pred>(
        f: (vars: PredVars) => (...args: Infer<ArgsPred>) => Infer<RetPred>
    ) {
    return (vars: PredVars) => f(vars)
}