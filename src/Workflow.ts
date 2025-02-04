/**
 * @file Workflow implementation for managing and executing sequential steps
 * @module workflow/Workflow
 */

import { minimatch } from "minimatch";
import {
    Step,
    StepInsertOptions,
    WorkflowResult,
    LastStepReturnType,
} from ".";

/**
 * Executes a sequence of steps.
 * @template TSteps - Tuple type representing the workflow steps.
 */
export class Workflow<TSteps extends readonly Step<unknown>[]> {
    /**
     * Creates a new Workflow instance with the provided steps.
     * @param steps - Array of workflow steps.
     * @private
     */
    private constructor(private steps: TSteps) {
        this.steps = steps;
    }

    /**
     * Creates an empty Workflow.
     * @returns A new Workflow with no steps.
     */
    public static create(): Workflow<[]> {
        return new Workflow([]);
    }

    /**
     * Returns indices of steps matching the pattern.
     * @param test - Pattern to match step names.
     * @returns Array of matching step indices.
     * @private
     * @example
     * // Given steps: [ { name: 'test-1' }, { name: 'test-2' }, { name: 'test-3' } ]
     * const indices = workflow.findMatchingStepIndices('test-*');
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
     * Converts an insertion option (number, pattern, or undefined) into
     * concrete insertion points.
     * - If the option is a number, it is used as the array index.
     * - If the option is a string, it is matched against step names.
     * - If the option is undefined, it is ignored, and no insertion is done.
     * @param option - Option value to process.
     * @param pos - Position to insert the step.
     * @returns Array with index and position info, or null.
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
     * @param multi - Controls multiple insertions (boolean or number or undefined).
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
     * Inserts a single step to the workflow.
     * @template T - Type of the step result.
     * @param step - A single step.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the added step
     * @example
     * workflow.addStep(step, { index: 0, position: 'before' });
     */
    public addStep<T>(
        step: Step<T>,
        options?: StepInsertOptions,
    ): Workflow<[...TSteps, Step<T>]>;

    /**
     * Inserts an array of steps to the workflow.
     * @template T - Type of the step result.
     * @param steps - Readonly array of steps.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the steps inserted.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.addStep([step1, step2]);
     * // => Workflow<[typeof step1, typeof step2]>
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public addStep<K extends readonly Step<any>[]>( // 改为 readonly 约束
        steps: readonly [...K], // 处理 readonly 元组
        options?: StepInsertOptions,
    ): Workflow<[...TSteps, ...K]>;

    public addStep(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        steps: Step<any> | readonly Step<any>[],
        options: StepInsertOptions = {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Workflow<any> {
        const stepsArray = Array.isArray(steps) ? steps : [steps];
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

        return new Workflow(newSteps);
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
            return { result: step.run() };
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
        let caughtError: unknown = null;
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
            error: caughtError,
        };

        return caughtError ? failedOutput : successOutput;
    }
}
