/**
 * Negate the given type.
 * @template T - The type to negate.
 * @example
 * type NegatedTrue = Negate<true>;
 * // => false
 */
export type Negate<T extends true | false> = T extends true ? false : true;
