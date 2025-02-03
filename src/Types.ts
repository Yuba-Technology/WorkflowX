/**
 * A step in a workflow.
 */
export interface Step<T = unknown> {
    run(): T;
}

/**
 * Configuration options for adding a step to a workflow.
 */
export interface StepInsertOptions {
    index?: number;
    position?: "before" | "after";
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
