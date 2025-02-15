/**
 * List all properties of an object.
 * From: https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
 * @template T - The object type to list properties of.
 * @example
 * type OriginalType = {
 *     a: number;
 *     b: string;
 * };
 * type ExtendedOriginalType = OriginalType & {c: { d: boolean; e: string[] };}
 * // => OriginalType & {c: { d: boolean; e: string[] };}
 * type DebuggedType = Debug<ExtendedOriginalType>;
 * // => { a: number; b: string; c: { d: boolean; e: string[]; } }
 */
export type Debug<T> = { [K in keyof T]: T[K] };
