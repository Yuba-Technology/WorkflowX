/**
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 */
export type MergeInsertions<T> = T extends object
    ? { [K in keyof T]: MergeInsertions<T[K]> }
    : T;

/**
 * Merge all objects in a tuple into one object.
 * From: https://github.com/type-challenges/type-challenges/issues/608#issuecomment-1529153906
 * @template F - The first object to merge.
 * @template S - The second object to merge.
 * @example
 * type A = { a: number; b: string };
 * type B = { b: number; c: boolean };
 * type Merged = Merge<A, B>;
 * // => type Merged = { a: number; b: number; c: boolean; }
 */
export type Merge<F, S> = Omit<F, keyof S> & S;
