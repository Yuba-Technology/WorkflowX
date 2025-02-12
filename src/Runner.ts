/*
 * This file implements the WorkflowRunner class, which is responsible for
 * executing a workflow blueprint.
 *
 * The WorkflowRunner class is used to execute a workflow blueprint by running
 * each step in the blueprint sequentially. The class keeps track of the
 * runtime context of the workflow, including the status of the workflow, the
 * output of the previous step, and any errors that occur during execution.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import type {
    Step,
    RuntimeContext,
    LastStepReturnType,
    WorkflowResult,
} from "./types";
import type { WorkflowBlueprint } from ".";

/**
 * Represents a runner for a workflow blueprint.
 * @template T - The type of the workflow blueprint.
 * @property blueprint - The blueprint of the workflow.
 * @property runtimeContext - The runtime context of the workflow.
 * @property userContext - The user context of the workflow.
 */
export class WorkflowRunner<T extends WorkflowBlueprint> {
    public readonly blueprint: WorkflowBlueprint;
    public runtimeContext: RuntimeContext = {
        status: "success",
        previousStepOutput: undefined,
        error: undefined,
    };
    public userContext: T["userContext"];

    /**
     * Creates a new WorkflowRunner instance.
     * @param blueprint The blueprint of the workflow.
     * @param runtimeContext The runtime context of the workflow. If provided, will
     * override the default runtime context.
     */
    constructor(blueprint: T, runtimeContext?: RuntimeContext) {
        this.blueprint = blueprint;
        this.userContext = blueprint.userContext;
        if (runtimeContext) {
            this.runtimeContext = runtimeContext;
        }
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
            return { result: step.run(this.runtimeContext, this.userContext) };
        } catch (error) {
            const processedError =
                error instanceof Error ? error : new Error(String(error));
            return { error: processedError };
        }
    }

    /**
     * Executes all steps in the workflow sequentially.
     * The return type is determined by the last step in the workflow.
     * @returns A WorkflowResult with the success status and result,
     * or error info.
     */
    public run(): WorkflowResult<LastStepReturnType<T["steps"]>> {
        for (const [index, step] of this.blueprint.steps.entries()) {
            if (
                (!step.on || step.on === "success") &&
                this.runtimeContext.status === "failed"
            ) {
                continue;
            }

            const { result: stepResult, error } = this.runStep(step);

            if (error) {
                this.runtimeContext.status = "failed";
                this.runtimeContext.error = {
                    step: index,
                    cause: error,
                };

                continue;
            }

            this.runtimeContext.previousStepOutput = stepResult;
        }

        const successOutput = {
            status: "success" as const,
            result: this.runtimeContext
                .previousStepOutput as LastStepReturnType<T["steps"]>,
        };

        const failedOutput = {
            status: "failed" as const,
            error: this.runtimeContext.error!,
        };

        return this.runtimeContext.error ? failedOutput : successOutput;
    }
}
