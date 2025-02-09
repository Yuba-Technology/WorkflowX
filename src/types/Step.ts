/*
 * This file stores types related to steps in a workflow.
 *
 * These types define the structure of a step and provide utility types
 * for extracting information about steps, such as their name and return type.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import type { RuntimeContext } from "./Context";
import type { LastElement } from "./Utils";

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
    run(runtimeContext: RuntimeContext, userContext: TContext): TResult;
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
