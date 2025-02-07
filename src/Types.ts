/*
 * This file provides type definitions and utility types for a workflow system.
 *
 * This module defines interfaces and helper types essential for managing
 * workflow steps. It includes definitions for individual steps, options for
 * inserting steps, and various utility types for uple manipulation. These
 * types ensure type safety and facilitate operations such as adding, removing,
 * and mapping workflow steps to their corresponding return types, supporting a
 * robust workflow execution engine.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

/**
 * A step in a workflow.
 */
export interface Step<TResult = unknown, TContext = unknown> {
    /**
     * Name of the step.
     */
    name?: string;
    /**
     * Whether to continue after the step fails.
     * - "failure" - Continue even the workflow fails.
     * - "success" - Continue only if the step succeeds.
     * - "always" - Continue regardless of the step result.
     * @default "success"
     */
    on?: "failure" | "success" | "always";
    /**
     * Executes the step.
     * @template TResult - The return type of the step.
     * @param context - The context provided to the step.
     * @returns The result of the step.
     * @throws An error if the step fails. Will be caught by the workflow.
     */
    run(context: TContext): TResult;
}

/**
 * Configuration options for adding a step to a workflow.
 */
export interface StepInsertOptions {
    before?: number | string;
    after?: number | string;
    multi?: boolean | number;
}

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
 * Extract the name of a single step:
 * If the step has a non-empty name, return the type of the name,
 * otherwise return `never`.
 * @template TStep - The type of the step.
 * @returns The name of the step.
 * @example
 * type MyStep = { name: "step1" };
 * type MyStepName = StepName<Step>; // => "step1"
 * @example
 * type MyStep2 = {};
 * type MyStepName2 = StepName<MyStep2>; // => never
 */
export type StepName<TStep> = TStep extends { name?: infer TName }
    ? TName extends string
        ? TName
        : never
    : never;

/**
 * Extract the return type of a single step:
 * If the step has a run method, return the return type of the method,
 * otherwise return `unknown`.
 * @template TStep - The type of the step.
 * @returns The return type of the step.
 * @example
 * type MyStep = { run: () => string };
 * type MyStepReturn = StepReturn<Step1>; // => string
 * @example
 * type MyStep2 = { };
 * type MyStepReturn2 = StepReturn<MyStep2>; // => unknown
 */
export type StepReturnType<TStep> =
    TStep extends Step<infer TResult> ? TResult : unknown;

/**
 * Extracts the return type of the last step in a Workflow.
 * Returns `undefined` if the steps array is empty.
 */
export type LastStepReturnType<TSteps extends readonly Step<unknown>[]> =
    TSteps extends readonly []
        ? undefined
        : StepReturnType<LastElement<TSteps>>;

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
 * Output of a successful workflow.
 */
type WorkflowSuccessOutput<TResult> = { status: "success"; result: TResult };

/**
 * Output of a failed workflow.
 */
type WorkflowFailedOutput = { status: "failed"; step: number; error: Error };

/**
 * Result of a workflow.
 * @template TResult - The result type of the workflow.
 */
export type WorkflowResult<TResult> =
    | WorkflowSuccessOutput<TResult>
    | WorkflowFailedOutput;

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

/**
 * Utility type to extract the context type of a workflow.
 * @template TWorkflow - The type of the workflow.
 * @returns The context type of the workflow.
 */
export type ExtractContext<T> = T extends { __contextType: infer TContext }
    ? TContext
    : never;
