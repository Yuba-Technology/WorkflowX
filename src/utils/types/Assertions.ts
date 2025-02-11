import type { MergeInsertions, Negate } from ".";
/**
 * Expect the type to be `true`.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template T - The type to expect to be `true`.
 * @example
 * type IsTrueType = true;
 * type ExpectTrueType = Expect<IsTrueType>;
 * // => true
 * @example
 * type IsFalseType = false;
 * type ExpectFalseType = Expect<IsFalseType>;
 * // => Error: Type 'false' is not assignable to type 'true'.
 */
export type Expect<T extends true> = T;

/**
 * Expect the type to be `true`.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template T - The type to expect to be `true`.
 * @example
 * type IsTrueType = true;
 * type ExpectTrueType = ExpectTrue<IsTrueType>;
 * // => true
 * @example
 * type IsFalseType = false;
 * type ExpectFalseType = ExpectTrue<IsFalseType>;
 * // => Error: Type 'false' is not assignable to type 'true'.
 */
export type ExpectTrue<T extends true> = T;

/**
 * Expect the type to be `false`.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template T - The type to expect to be `false`.
 * @example
 * type IsFalseType = false;
 * type ExpectFalseType = ExpectFalse<IsFalseType>;
 * // => false
 * @example
 * type IsTrueType = true;
 * type ExpectFalseType = ExpectFalse<IsTrueType>;
 * // => Error: Type 'true' is not assignable to type 'false'.
 */
export type ExpectFalse<T extends false> = T;

/**
 * Check whether the two given types are equal.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template X - The first type to compare.
 * @template Y - The second type to compare.
 * @example
 * type IsNotEqual = Equal<true, false>;
 * // => false
 */
export type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
        ? true
        : false;

/**
 * Check whether the two given types are not equal.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template X - The first type to compare.
 * @template Y - The second type to compare.
 * @example
 * type IsNotEqual = NotEqual<true, false>;
 * // => true
 */
export type NotEqual<X, Y> = Negate<Equal<X, Y>>;

/**
 * Expect the former type to be assignable to the latter type.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template TValue - The value to check if it extends the expected type.
 * @template TExpected - The expected type to check if the value extends.
 * @example
 * type IsAssignable = ExpectExtends<true, string>;
 * // => false
 */
export type Extends<TValue, TExpected> = TExpected extends TValue
    ? true
    : false;

/**
 * Check whether two types are the same after merging insertions.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template X - The first type to compare.
 * @template Y - The second type to compare.
 * @example
 * type IsAlike = Alike<{ a: number }, { a: number }>;
 * // => true
 * @example
 * type IsNotAlike = Alike<{ a: number }, { a: string }>;
 * // => false
 */
export type Alike<X, Y> = Equal<MergeInsertions<X>, MergeInsertions<Y>>;
