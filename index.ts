import z from 'zod'

// ## Aliases
// ==========
export type Schema = z.ZodType
export type UnknownSchema = z.ZodUnknown
export type PossiblyEmptyTupleSchema = z.AnyZodTuple
export type TupleSchema = typeof z.ZodTuple
export type FunctionSchema<ArgsSchema extends PossiblyEmptyTupleSchema, RetSchema extends Schema> = z.ZodFunction<ArgsSchema, RetSchema>

export type Infer<P extends Schema> = z.infer<P>

export const Schema = z.ZodType


// ## Helpers
// ==========
export const check =
    (p: Schema, x: any) =>
        p.safeParse(x).success

export const validate =
    <P extends Schema>(p: P, x: any) =>
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
export type ArrayOfSchemas = Parameters<TupleSchema["create"]>[0]

export interface Fn<ArgsSchema extends PossiblyEmptyTupleSchema, RetSchema extends Schema> {
    parameters: () => ArgsSchema;
    args: <Items extends ArrayOfSchemas>(...items: Items) => Fn<z.ZodTuple<Items, UnknownSchema>, RetSchema>;

    returnType: () => RetSchema;
    returns: <NewRetSchema extends Schema>(retSchema: NewRetSchema) => Fn<ArgsSchema, NewRetSchema>;

    functionType: () => FunctionSchema<ArgsSchema, RetSchema>;

    validationMode: () => ValidationMode;
    setValidationMode: (mode: ValidationMode) => Fn<ArgsSchema, RetSchema>;

    implement: <F extends z.InnerTypeOfFunction<ArgsSchema, RetSchema>>(impl: F) =>
        ReturnType<F> extends RetSchema["_output"] ?
        (...args: ArgsSchema["_input"]) => ReturnType<F>
        : z.OuterTypeOfFunction<ArgsSchema, RetSchema>;
}

export function Fn<ArgsSchema extends PossiblyEmptyTupleSchema, RetSchema extends Schema>(): Fn<ArgsSchema, RetSchema> {
    return {
        parameters: () => z.tuple([]) as ArgsSchema,
        args: function <Items extends ArrayOfSchemas>(...schemas: Items) {
            const parametersSchema = z.function().args(...schemas).parameters()
            return {
                ...this,
                parameters: () => parametersSchema
            }
        },

        returnType: () => z.any() as unknown as RetSchema,
        returns: function (retSchema) {
            return {
                ...this,
                returnType: () => retSchema
            }
        },

        functionType: function () {
            return z.function().args(this.parameters()).returns(this.returnType()) as unknown as FunctionSchema<ArgsSchema, RetSchema>
        },

        validationMode: () => ValidationMode.Both,
        setValidationMode: function (validationMode: ValidationMode) {
            return {
                ...this,
                validationMode: () => validationMode
            }
        },

        implement: function <F extends z.InnerTypeOfFunction<ArgsSchema, RetSchema>>(impl: F) {
            const argsSchema = this.parameters()
            const returnSchema = this.returnType()
            const mode = this.validationMode()
            const validateArgs = mode === ValidationMode.Args || mode === ValidationMode.Both
            const validateRet = mode === ValidationMode.Ret || mode === ValidationMode.Both

            return function (...args: Infer<ArgsSchema>) {
                if (validateArgs)
                    args = validate(argsSchema, args)

                let ret = impl(...args)
                if (validateRet)
                    ret = validate(returnSchema, ret)

                return ret
            } as ReturnType<F> extends RetSchema["_output"] ?
                (...args: ArgsSchema["_input"]) => ReturnType<F>
                : z.OuterTypeOfFunction<ArgsSchema, RetSchema>;
        }
    }
}