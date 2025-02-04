/**
 * A step in a workflow.
 */
export interface Step<T = unknown> {
    /**
     * Name of the step.
     */
    name?: string;
    /**
     * Whether to continue after the step fails.
     * - `failure` - Continue even the workflow fails.
     * - `success` - Continue only if the step succeeds.
     * - `always` - Continue regardless of the step result.
     * @default "success"
     */
    on?: "failure" | "success" | "always";
    /**
     * Executes the step.
     * @template T - The return type of the step.
     * @returns The result of the step.
     * @throws An error if the step fails. Will be caught by the workflow.
     */
    run(): T;
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
 * Util type for getting the return type of the last step in a workflow.
 */
export type LastStepReturnType<TSteps> = TSteps extends [
    ...Step[],
    Step<infer R>,
]
    ? R
    : never;

/**
 * Output of a successful workflow.
 */
type WorkflowSuccessOutput<T> = { status: "success"; result: T };

/**
 * Output of a failed workflow.
 */
type WorkflowFailedOutput = { status: "failed"; step: number; error: unknown };

/**
 * Result of a workflow.
 */
export type WorkflowResult<T> =
    | WorkflowSuccessOutput<T>
    | WorkflowFailedOutput;
