/*
 * This file stores utility types that are used across the workflow system.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

/**
 * Extracts the last element of a tuple.
 * @template T - The tuple to extract the last element from.
 * @returns The last element of the tuple.
 * @example
 * type MyTuple = [1, 2, 3, 4, 5];
 * type MyLastElement = LastElement<MyTuple>; // => 5
 * @example
 * type MyEmptyTuple = [];
 * type MyEmptyTupleElement = LastElement<MyEmptyTuple>; // => unknown
 */
export type LastElement<T extends readonly unknown[]> = T extends readonly [
    ...unknown[],
    infer Last,
]
    ? Last
    : unknown;

/**
 * Removes the last element of a tuple.
 * @template Tuple - The tuple to remove the last element from.
 * @returns The tuple without the last element.
 * @example
 * type MyTuple = [1, 2, 3, 4, 5];
 * type MyPoppedTuple = Pop<MyTuple>; // => [1, 2, 3, 4]
 * @example
 * type MyEmptyTuple = [];
 * type MyEmptyPoppedTuple = Pop<MyEmptyTuple>; // => []
 */
export type Pop<Tuple extends readonly unknown[]> = Tuple extends readonly [
    ...infer Rest,
    infer _Last,
]
    ? readonly [...Rest]
    : readonly [];

/**
 * Helper type to recursively remove the last N elements from a readonly tuple.
 * @template Tuple - The tuple to remove elements from.
 * @template RemovalCount - The number of elements to remove.
 * @template RemovedElements - The elements that have been removed so far.
 * @returns The tuple without the last N elements.
 */
type PopNHelper<
    Tuple extends readonly unknown[],
    RemovalCount extends number,
    RemovedElements extends readonly unknown[],
> = Tuple extends readonly [...infer Rest, infer _Last]
    ? readonly [...PopN<Rest, RemovalCount, [...RemovedElements, unknown]>]
    : readonly [];
/**
 * Removes the last N elements from a readonly tuple.
 * @template Tuple - The tuple to remove elements from.
 * @template RemovalCount - The number of elements to remove.
 * @template RemovedElements - The elements that have been removed so far.
 * @returns The tuple without the last N elements.
 * @example
 * type MyTuple = [1, 2, 3, 4, 5];
 * type MyPoppedTuple = PopN<MyTuple, 2>; // => [1, 2, 3]
 * @example
 * type MyEmptyTuple = [];
 * type MyEmptyPoppedTuple = PopN<MyEmptyTuple, 2>; // => []
 */
export type PopN<
    Tuple extends readonly unknown[],
    RemovalCount extends number,
    RemovedElements extends readonly unknown[] = [],
> = RemovedElements["length"] extends RemovalCount
    ? readonly [...Tuple]
    : PopNHelper<Tuple, RemovalCount, RemovedElements>;

/**
 * Removes the first element of a tuple.
 * @template Tuple - The tuple to remove the first element from.
 * @returns The tuple without the first element.
 * @example
 * type MyTuple = [1, 2, 3, 4, 5];
 * type MyShiftedTuple = Shift<MyTuple>; // => [2, 3, 4, 5]
 * @example
 * type MyEmptyTuple = [];
 * type MyEmptyShiftedTuple = Shift<MyEmptyTuple>; // => []
 */
export type Shift<Tuple extends readonly unknown[]> = Tuple extends readonly [
    infer _First,
    ...infer Rest,
]
    ? readonly [...Rest]
    : readonly [];

/**
 * Helper type to recursively remove the first N elements from a readonly tuple.
 * @template Tuple - The tuple to remove elements from.
 * @template RemovalCount - The number of elements to remove.
 * @template RemovedElements - The elements that have been removed so far.
 * @returns The tuple without the first N elements.
 */
type ShiftNHelper<
    Tuple extends readonly unknown[],
    RemovalCount extends number,
    RemovedElements extends readonly unknown[],
> = Tuple extends readonly [infer _First, ...infer Rest]
    ? readonly [...ShiftN<Rest, RemovalCount, [...RemovedElements, unknown]>]
    : readonly [];

/**
 * Removes the first N elements from a readonly tuple.
 * @template Tuple - The tuple to remove elements from.
 * @template RemovalCount - The number of elements to remove.
 * @template RemovedElements - The elements that have been removed so far.
 * @returns The tuple without the first N elements.
 * @example
 * type MyTuple = [1, 2, 3, 4, 5];
 * type MyShiftedTuple = ShiftN<MyTuple, 2>; // => [3, 4, 5]
 * @example
 * type MyEmptyTuple = [];
 * type MyEmptyShiftedTuple = ShiftN<MyEmptyTuple, 2>; // => []
 */
export type ShiftN<
    Tuple extends readonly unknown[],
    RemovalCount extends number,
    RemovedElements extends readonly unknown[] = [],
> = RemovedElements["length"] extends RemovalCount
    ? readonly [...Tuple]
    : ShiftNHelper<Tuple, RemovalCount, RemovedElements>;

/**
 * Adds `null` and `undefined` to all properties of an object.
 * @template T - The type to make unreliable.
 * @returns The unreliable type.
 * @example
 * type MyType = { prop1: string; prop2: number };
 * type MyUnreliableType = UnreliableObject<MyType>;
 * // => { prop1: string | undefined | null; prop2: number | undefined | null; }
 */
type UnreliableObject<T> = { [K in keyof T]: T[K] | undefined | null };

/**
 * Makes a type unreliable by adding `undefined` and `null` to it.
 * If the type is an object, it will add `undefined` and `null` to all
 * properties.
 * For other types, it will add `undefined` and `null` to the type itself.
 * @template T - The type to make unreliable.
 * @returns The unreliable type.
 * @example
 * type MyType = string;
 * type MyUnreliableType = Unreliable<MyType>;
 * // => string | undefined | null
 * @example
 * type MyType = { prop1: string; prop2: number };
 * type MyUnreliableType = Unreliable<MyType>;
 * // => { prop1: string | undefined | null; prop2: number | undefined | null; }
 */
export type Unreliable<T> = T extends object
    ? UnreliableObject<T>
    : T | undefined | null;
