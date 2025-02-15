/*
 * This file stores context types used to define the context of a workflow.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

/**
 * Represents the context of an error that occurred during workflow execution.
 */
export type ErrorContext = {
    step: number;
    cause: Error;
};

/**
 * Represents the runtime context of a workflow.
 * This context stores the status of the workflow and the output of
 * the previous step.
 * If the workflow failed, it also contains the error context.
 * @property status - The status of the workflow.
 * @property previousStepOutput - The output of the previous step.
 * @property error - The error context, will be `undefined` if the workflow
 * succeeded.
 */
export type RuntimeContext = {
    status: "success" | "failed";
    previousStepOutput: unknown;
    error: ErrorContext | undefined;
};

/**
 * Utility type to extract the runtime context type of a workflow.
 * @template TWorkflow - The type of the workflow.
 * @returns The runtime context type of the workflow.
 */
export type ExtractRuntimeContext<T> = T extends {
    blueprint: { runtimeContext: infer TContext };
}
    ? TContext
    : never;

/**
 * Utility type to extract the context type of a workflow.
 * @template TWorkflow - The type of the workflow.
 * @returns The user context type of the workflow.
 */
export type ExtractUserContext<T> = T extends {
    blueprint: { userContext: infer TContext };
}
    ? TContext
    : never;
