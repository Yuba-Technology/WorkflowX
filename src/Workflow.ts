/**
 * @file Workflow implementation for managing and executing sequential steps
 * @module workflow/Workflow
 */

import {
    Step,
    StepInsertOptions,
    WorkflowResult,
    LastStepReturnType,
} from ".";

/**
 * Represents a workflow that manages and executes a sequence of steps.
 * Each step is executed in order, and the workflow tracks the execution state.
 *
 * @template TSteps - Tuple type of steps in the workflow
 */
export class Workflow<TSteps extends readonly Step<unknown>[]> {
    /**
     * Creates a new Workflow instance with the provided steps.
     * @private
     * @param steps - Array of workflow steps
     */
    private constructor(private steps: TSteps) {
        this.steps = steps;
    }

    /**
     * Creates a new empty Workflow instance.
     * @returns A new Workflow instance with no steps
     */
    public static create(): Workflow<[]> {
        return new Workflow([]);
    }

    /**
     * Adds one step to the workflow.
     * @template T - Type of the step result
     * @param steps - Single step or array of steps to add
     * @param options - Configuration for step insertion
     * @returns A new Workflow instance with the added steps
     * @example
     * workflow.addStep(step, { index: 0, position: 'before' });
     */
    public addStep<T>(
        step: Step<T>,
        options?: StepInsertOptions,
    ): Workflow<[...TSteps, Step<T>]>;

    /**
     * Adds an array of steps to the workflow.
     * @template T - Type of the step result
     * @param steps - Single step or array of steps to add
     * @returns A new Workflow instance with the added steps
     * @example
     * workflow.addStep(step);
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
        const { index, position = "after" } = options;

        let newSteps: Step<unknown>[];

        // Default to appending steps to the end
        if (typeof index === "undefined") {
            newSteps = [...this.steps, ...stepsArray];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Workflow(newSteps as any);
        }

        // Make sure the index is within the bounds of the steps array
        const normalizedIndex = Math.max(
            0,
            Math.min(index, this.steps.length),
        );
        const insertIndex =
            position === "after" ? normalizedIndex + 1 : normalizedIndex;

        newSteps = [
            ...this.steps.slice(0, insertIndex),
            ...stepsArray,
            ...this.steps.slice(insertIndex),
        ];

        return new Workflow(newSteps);
    }

    /**
     * Executes all steps in the workflow sequentially.
     * The return type is determined by the last step in the workflow.
     *
     * @returns A WorkflowResult containing either success with the final result
     *          or failure with the error details
     * @throws Never throws - errors are captured in the WorkflowResult
     * @example
     * const result = workflow.run();
     * if (result.status === 'success') {
     *   console.log(result.result);
     * }
     */
    public run(): WorkflowResult<LastStepReturnType<TSteps>> {
        let result: unknown;

        for (const [index, step] of this.steps.entries()) {
            try {
                result = step.run();
            } catch (error) {
                const processedError =
                    error instanceof Error ? error : new Error(String(error));
                return {
                    status: "failed",
                    step: index,
                    error: processedError,
                };
            }
        }

        return {
            status: "success",
            result: result as LastStepReturnType<TSteps>,
        };
    }
}
