/*
 * This file implements a robust workflow engine that orchestrates a sequence
 * of steps.
 *
 * This module implements the Workflow class which manages the execution of
 * multiple steps defined by the user. It supports operations such as adding,
 * inserting, and removing steps, as well as mapping the return types of these
 * steps. The class ensures type safety through advanced TypeScript generics
 * and tuple manipulation, providing a solid foundation for a robust workflow
 * execution engine.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { minimatch } from "minimatch";
import type {
    Step,
    StepInsertOptions,
    WorkflowResult,
    LastStepReturnType,
    Pop,
    PopN,
    Shift,
    ShiftN,
} from ".";

/**
 * Executes a sequence of steps.
 * @template TSteps - Tuple type representing the workflow steps.
 * @template TContext - Type of the workflow context.
 */
export class Workflow<
    TContext extends object,
    TSteps extends readonly Step<unknown>[] = [],
> {
    public readonly steps: TSteps;
    public context: TContext;
    // @ts-expect-error - This property exists solely to facilitate
    // compile-time type inference for the workflow's context.
    // !It should not be accessed directly in any runtime logic.
    public readonly __contextType: TContext;

    /**
     * Creates a new Workflow instance with the provided steps.
     * @param steps - Array of workflow steps.
     * @private
     */
    private constructor(steps: TSteps, context: TContext) {
        this.steps = steps;
        this.context = context;
    }

    /**
     * Creates an empty Workflow.
     * @returns A new Workflow with no steps.
     * @template TContext - Type of the workflow context.
     */
    public static create<TContext extends object>(): Workflow<
        TContext,
        readonly []
    > {
        return new Workflow([], {} as TContext);
    }

    /**
     * Returns indices of steps matching the pattern.
     * @param test - Pattern to match step names.
     * @returns Array of matching step indices.
     * @private
     * @example
     * // Given steps: [ { name: 'test-1' }, { name: 'test-2' }, { name: 'test-3' } ]
     * const indices = this.findMatchingStepIndices('test-*');
     * // => [0, 1, 2]
     */
    private findMatchingStepIndices(test: string): number[] {
        return this.steps
            .map((step, index) =>
                step.name && minimatch(step.name, test) ? index : -1,
            )
            .filter((index) => index !== -1);
    }

    /**
     * Converts an insertion option into concrete insertion points.
     * - If the option is a `number`, it is used as the array index.
     * - If the option is a `string`, it is matched against step names.
     * - If the option is `undefined`, it is ignored, and no insertion is done.
     * @param option - Option value to process.
     * @param pos - Position to insert the step.
     * @returns Array with index and position info, or `null`.
     * @private
     */
    private processOption(
        option: number | string | undefined,
        pos: "before" | "after",
    ) {
        switch (typeof option) {
            case "undefined": {
                return null;
            }

            case "number": {
                return [{ index: option, pos }];
            }

            case "string": {
                return this.findMatchingStepIndices(option).map((i) => ({
                    index: i,
                    pos,
                }));
            }

            // Make sure all cases are handled.
            /* istanbul ignore next */
            default: {
                const _exhaustiveCheck: never = option;
                return _exhaustiveCheck;
            }
        }
    }

    /**
     * Provides the default insertion point at the end of the workflow.
     * @returns Array with a point after the last step.
     * @private
     */
    private defaultInsertIndex(): {
        index: number;
        pos: "before" | "after";
    }[] {
        return [
            {
                index: this.steps.length,
                pos: "after",
            },
        ];
    }

    /**
     * Merges and sorts insertion points from "before" and "after" options.
     * @param options - Insertion options.
     * @returns Sorted list of insertion points.
     * @private
     */
    private getSortedIndices(
        options: StepInsertOptions,
    ): { index: number; pos: "before" | "after" }[] {
        // Get all indices from "before" and "after" options, and merge them.
        const { before, after } = options;
        const indices: { index: number; pos: "before" | "after" }[] = [
            ...(this.processOption(before, "before") || []),
            ...(this.processOption(after, "after") || []),
        ];

        // Sorted by: 1. index, 2. position ("before" comes first)
        indices.sort((a, b) => {
            if (a.index !== b.index) {
                return a.index - b.index;
            }

            // Make sure all cases are handled.
            /* istanbul ignore next */
            return a.pos === "before" ? -1 : 1;
        });

        return indices;
    }

    /**
     * Filters insertion points based on the `multi` option.
     * - If `multi` is undefined, all indices are returned.
     * - If `multi` is a boolean:
     *   - If `multi` is true, all indices are returned.
     *   - If `multi` is false, only the first index is returned.
     * - If `multi` is a number, the specified number of indices are returned:
     *   - If the number is positive, the first n indices are returned.
     *   - If the number is negative, the last n indices are returned.
     * @param indices - Sorted insertion points.
     * @param multi - Controls multiple insertions.
     * @returns Array of objects containing the index and position
     */
    private handleMultiOption(
        indices: { index: number; pos: "before" | "after" }[],
        multi: boolean | number | undefined,
    ): { index: number; pos: "before" | "after" }[] {
        if (multi === true || multi === undefined) {
            return indices;
        }

        if (multi === false) {
            return indices.slice(0, 1);
        }

        if (typeof multi === "number") {
            return multi > 0
                ? indices.slice(0, multi)
                : indices.slice(Math.max(indices.length + multi, 0));
        }

        // Make sure all cases are handled.
        /* istanbul ignore next */
        const _exhaustiveCheck: never = multi;
        /* istanbul ignore next */
        return _exhaustiveCheck;
    }

    /**
     * Computes the final insertion points based on provided options.
     * @param options - Insertion options.
     * @returns List of insertion index and position objects.
     * @private
     */
    private calcInsertIndex(options: StepInsertOptions): {
        index: number;
        pos: "before" | "after";
    }[] {
        // If no options are provided, insert at the end of the workflow by default.
        if (!options || Object.keys(options).length === 0) {
            return this.defaultInsertIndex();
        }

        // Else, calculate the index to insert the step based on the options.
        const indices = this.getSortedIndices(options);

        // Finally filter the indices based on the `multi` option.
        return this.handleMultiOption(indices, options.multi);
    }

    /**
     * Type safe method to push a step to the end of the workflow.
     * @template T - Type of the step to add.
     * @param step - The step to add.
     * @returns A new Workflow instance with the added step.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<object, readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.pushStep(step1).pushStep(step2);
     * // => Workflow<object, readonly [typeof step1, typeof step2]>
     */
    public pushStep<T extends Step<unknown>>(
        step: T,
    ): Workflow<TContext, readonly [...TSteps, T]>;

    /**
     * Type safe method to push multiple steps to the end of the workflow.
     * @template K - Tuple of steps to add.
     * @param steps - Tuple of steps to add.
     * @returns A new Workflow instance with the added steps.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<object, readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.pushStep(step1).pushStep([step2, step3]);
     * // => Workflow<object, readonly [typeof step1, typeof step2, typeof step3]>
     */
    public pushStep<K extends readonly Step<unknown>[]>(
        steps: readonly [...K],
    ): Workflow<TContext, readonly [...TSteps, ...K]>;

    /**
     * Type safe method to push a step or multiple steps to the end of the workflow.
     * @param steps - A single step or an array of steps to add.
     * @returns A new Workflow instance with the added step(s).
     */
    public pushStep(
        steps: Step<unknown> | readonly Step<unknown>[],
    ): Workflow<TContext, readonly Step<unknown>[]> {
        const stepsArray = Array.isArray(steps) ? steps : [steps];
        return new Workflow([...this.steps, ...stepsArray], this.context);
    }

    /**
     * Type safe method to unshift a step to the beginning of the workflow.
     * @template T - Type of the step to add.
     * @param step - The step to add.
     * @returns A new Workflow instance with the added step.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<object, readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.unshiftStep(step1).unshiftStep(step2);
     * // => Workflow<object, readonly [typeof step2, typeof step1]>
     */
    public unshiftStep<T extends Step<unknown>>(
        step: T,
    ): Workflow<TContext, readonly [T, ...TSteps]>;

    /**
     * Type safe method to unshift multiple steps to the beginning of the workflow.
     * @template K - Tuple of steps to add.
     * @param steps - Tuple of steps to add.
     * @returns A new Workflow instance with the added steps.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<object, readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.unshiftStep(step1).unshiftStep([step2, step3]);
     * // => Workflow<object, readonly [typeof step2, typeof step3, typeof step1]>
     */
    public unshiftStep<K extends readonly Step<unknown>[]>(
        steps: readonly [...K],
    ): Workflow<TContext, readonly [...K, ...TSteps]>;

    /**
     * Type safe method to unshift a step or multiple steps to the beginning of the workflow.
     * @param steps - A single step or an array of steps to add.
     * @returns A new Workflow instance with the added step(s).
     */
    public unshiftStep(
        steps: Step<unknown> | readonly Step<unknown>[],
    ): Workflow<TContext, readonly Step<unknown>[]> {
        const stepsArray = Array.isArray(steps) ? steps : [steps];
        return new Workflow([...stepsArray, ...this.steps], this.context);
    }

    /**
     * Inserts a single step to the workflow.
     * Notice that this method is **type unsafe**, and it is recommended to use
     * `pushStep` or `unshiftStep` for better type inference.
     * @template T - Type of the step result.
     * @param step - A single step.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the added step
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<object, readonly []>
     * workflow.addStep(step, { index: 0, position: 'before' });
     * // => Workflow<object, readonly Step<unknown, unknown>[]>
     */
    public addStep<T>(
        step: Step<T, TContext>,
        options?: StepInsertOptions,
    ): Workflow<TContext, readonly Step<unknown>[]>;

    /**
     * Inserts an array of steps to the workflow.
     * Notice that this method is **type unsafe**, and it is recommended to use
     * `pushStep` or `unshiftStep` for better type inference.
     * @template T - Type of the step result.
     * @param steps - Readonly array of steps.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the steps inserted.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<object, readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.addStep([step1, step2]);
     * // => Workflow<object, readonly Step<unknown, unknown>[]>
     */
    public addStep<K extends Step<unknown>[]>( // 改为 readonly 约束
        steps: [...K] | readonly [...K],
        options?: StepInsertOptions,
    ): Workflow<TContext, readonly Step<unknown>[]>;

    /**
     * Inserts a single step or an array of steps to the workflow.
     * @param steps - A single step or an array of steps to add.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the added step(s).
     */
    public addStep(
        steps: Step<unknown> | Step<unknown>[] | readonly Step<unknown>[],
        options: StepInsertOptions = {},
    ): Workflow<TContext, readonly Step<unknown>[]> {
        const stepsArray: Step<unknown>[] = Array.isArray(steps)
            ? ([...steps] as Step<unknown>[])
            : ([steps] as Step<unknown>[]);
        // Reverse the order of insert index array, so that we can insert the steps
        // from the last index to the first index, to keep the order of the steps array
        const insertIndex = this.calcInsertIndex(options)?.reverse();
        const newSteps: Step<unknown>[] = [...this.steps];

        for (const { index, pos } of insertIndex) {
            switch (pos) {
                case "before": {
                    newSteps.splice(index, 0, ...stepsArray);
                    break;
                }

                case "after": {
                    newSteps.splice(index + 1, 0, ...stepsArray);
                    break;
                }

                // Make sure all cases are handled.
                /* istanbul ignore next */
                default: {
                    const _exhaustiveCheck: never = pos;
                    return _exhaustiveCheck;
                }
            }
        }

        return new Workflow(newSteps, this.context);
    }

    /**
     * Type safe method to pop a step from the end of the workflow.
     * @returns A new Workflow instance with the last step removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<object, readonly [typeof step1, typeof step2]>
     * workflow.popStep();
     * // => Workflow<object, readonly [typeof step1]>
     */
    public popStep(): Workflow<TContext, Pop<TSteps>>;

    /**
     * Type safe method to pop multiple steps from the end of the workflow.
     * @template N - Number of steps to remove.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the last N steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3]);
     * // => Workflow<object, readonly [typeof step1, typeof step2, typeof step3]>
     * workflow.popStep(2);
     * // => Workflow<object, readonly [typeof step1]>
     */
    public popStep<N extends number>(
        n: N,
    ): Workflow<TContext, PopN<TSteps, N>>;

    /**
     * Type safe method to pop a single step or multiple steps from the end of the workflow.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the last N steps removed.
     */
    public popStep(n?: number): Workflow<TContext, readonly Step<unknown>[]> {
        // If no number is provided, remove the last step.
        const count = n === undefined ? 1 : n;
        const newSteps = this.steps.slice(
            0,
            Math.max(0, this.steps.length - count),
        );
        return new Workflow(newSteps, this.context);
    }

    /**
     * Type safe method to shift a step from the beginning of the workflow.
     * @returns A new Workflow instance with the first step removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<object, readonly [typeof step1, typeof step2]>
     * workflow.shiftStep();
     * // => Workflow<object, readonly [typeof step2]>
     */
    public shiftStep(): Workflow<TContext, Shift<TSteps>>;

    /**
     * Type safe method to shift multiple steps from the beginning of the workflow.
     * @template N - Number of steps to remove.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the first N steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3]);
     * // => Workflow<object, readonly [typeof step1, typeof step2, typeof step3]>
     * workflow.shiftStep(2);
     * // => Workflow<object, readonly [typeof step3]>
     */
    public shiftStep<N extends number>(
        n: N,
    ): Workflow<TContext, ShiftN<TSteps, N>>;

    /**
     * Type safe method to shift a single step or multiple steps from the
     * beginning of the workflow.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the first N steps removed.
     */
    public shiftStep(
        n?: number,
    ): Workflow<TContext, readonly Step<unknown>[]> {
        const count = n === undefined ? 1 : n;
        const newSteps = this.steps.slice(count);
        return new Workflow(newSteps, this.context);
    }

    /**
     * Removes a single step from the workflow.
     * Notice that this method is **type unsafe**, and it is recommended to use
     * `popStep` or `shiftStep` for better type inference.
     * @param step - The step to remove.
     * @returns A new Workflow instance with the step removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<object, readonly [typeof step1, typeof step2]>
     * workflow.removeStep(step1);
     * // => Workflow<object, readonly Step<unknown, unknown>[]>
     */
    public removeStep(
        steps: Step<unknown>,
    ): Workflow<TContext, readonly Step<unknown>[]>;

    /**
     * Removes an array of steps from the workflow.
     * @param steps - Readonly array of steps to remove.
     * @returns A new Workflow instance with the steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3]);
     * // => Workflow<object, readonly [typeof step1, typeof step2, typeof step3]>
     * workflow.removeStep([step1, step3]);
     * // => Workflow<object, readonly Step<unknown, unknown>[]>
     */
    public removeStep(
        steps: readonly Step<unknown>[],
    ): Workflow<TContext, readonly Step<unknown>[]>;

    /**
     * Removes steps matching the provided pattern from the workflow.
     * @param steps - Pattern to match step names.
     * @returns A new Workflow instance with the steps removed.
     * @example
     * const step1 = { name: 'test-1', run: () => 'step-1' };
     * const step2 = { name: 'test-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<object, readonly [typeof step1, typeof step2]>
     * workflow.removeStep('test-*');
     * // => Workflow<object, readonly Step<unknown, unknown>[]>
     */
    public removeStep(steps: string): Workflow<TContext, Step<unknown>[]>;

    /**
     * Removes a single step, an array of steps, or steps matching a pattern
     * from the workflow.
     * @param steps - A single step, an array of steps, or a pattern to match step names.
     * @returns A new Workflow instance with the steps removed.
     */
    public removeStep(
        steps: Step<unknown> | readonly Step<unknown>[] | string,
    ): Workflow<TContext, Step<unknown>[]> {
        let testFn: (step: Step<unknown>) => boolean;

        if (typeof steps === "string") {
            // If a string is provided, treat it as a minimatch pattern on the step's name.
            testFn = (step) => {
                // Only remove the step if it has a name and the pattern matches.
                return step.name !== undefined && minimatch(step.name, steps);
            };
        } else if (Array.isArray(steps)) {
            // If an array is provided, remove steps that are strictly equal.
            testFn = (step) => steps.includes(step);
        } else if (typeof steps === "object" && steps !== null) {
            // If a single step is provided, remove that step.
            testFn = (step) => step === steps;
        } else {
            // This branch should never be reached.
            // The following never-check ensures that all possible types are handled.
            /* istanbul ignore next */
            const _exhaustiveCheck: never = steps;
            /* istanbul ignore next */
            throw new Error(`Unhandled type for 'steps': ${_exhaustiveCheck}`);
        }

        // Filter out steps that match the test.
        const newSteps = this.steps.filter((step) => !testFn(step));
        return new Workflow(newSteps, this.context);
    }

    /**
     * Changes the context of the workflow.
     * @returns A new Workflow instance with the updated context.
     * @example
     * const oldContext = { oldKey: 'oldValue' };
     * const workflow = Workflow.create<typeof oldContext>();
     * // => Workflow<typeof oldContext, ...>
     * const newContext = { newKey: 'newValue' };
     * const newWorkflow = workflow.withContext<typeof newContext>();
     * // => Workflow<typeof newContext, ...>
     */
    public withContext<TNewContext extends object>(): Workflow<
        TNewContext,
        TSteps
    > {
        return new Workflow(this.steps, {} as TNewContext);
    }

    /**
     * Executes a single step.
     * @param step - The step to run.
     * @returns An object with the step's result or error.
     * @private
     */
    private runStep(step: Step<unknown>): {
        result?: unknown;
        error?: Error;
    } {
        try {
            return { result: step.run(this.context) };
        } catch (error) {
            const processedError =
                error instanceof Error ? error : new Error(String(error));
            return { error: processedError };
        }
    }

    /**
     * Executes all steps in the workflow sequentially.
     * The return type is determined by the last step in the workflow.
     *
     * @returns A WorkflowResult with the success status and result,
     * or error info.
     * @example
     * const result = workflow.run();
     * if (result.status === 'success') {
     *   console.log(result.result);
     * }
     */
    public run(): WorkflowResult<LastStepReturnType<TSteps>> {
        let result: unknown;
        let caughtError: Error | null = null;
        let errorStep: number = -1;

        for (const [index, step] of this.steps.entries()) {
            if ((!step.on || step.on === "success") && caughtError) {
                continue;
            }

            const { result: stepResult, error } = this.runStep(step);

            if (error) {
                caughtError = error;
                errorStep = index;
                continue;
            }

            result = stepResult;
        }

        const successOutput = {
            status: "success" as const,
            result: result as LastStepReturnType<TSteps>,
        };

        const failedOutput = {
            status: "failed" as const,
            step: errorStep,
            // `error` here is non-null, because we will check it later
            // when returning the output
            error: caughtError!,
        };

        return caughtError ? failedOutput : successOutput;
    }
}
