/*
 * This file implements the WorkflowAsStep class, which represents a step that
 * converted from a workflow.
 *
 * The WorkflowAsStep class is a subclass of the Step class. It can be used to
 * convert a workflow into a step, so that the workflow can be executed as a
 * single step in another workflow.
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
    BlueprintReturnType,
    BlueprintUserContext,
} from "@/types";
import type { WorkflowBlueprint } from "@/blueprints";
import { WorkflowBuilder } from "@/builders";
import { WorkflowRunner } from "@/runners";

/**
 * Represents a step that converted from a workflow.
 * @property blueprint - The blueprint of the workflow.
 * @property on - The event that triggers the workflow.
 * @property name - The name of the step.
 */
export class WorkflowAsStep<T extends WorkflowBlueprint> implements Step {
    private _blueprint: T;
    public readonly on: "success" | "failure" | "always";
    public readonly name: string;

    public get blueprint(): T {
        return this._blueprint;
    }

    /**
     * Creates a new WorkflowAsStep instance.
     * @param blueprint The blueprint of the workflow.
     * @param options The options of the step. If provided, will override the default options.
     */
    constructor(blueprint: T, options?: Omit<Step, "run">) {
        this._blueprint = blueprint;
        this.on = options?.on || "success";
        this.name = options?.name || "";
    }

    /**
     * Executes the workflow.
     * @param runtimeContext - The runtime context of the workflow.
     * @param userContext - The user context of the workflow.
     * @returns The result of the workflow.
     * @throws The error that occurred during the workflow execution.
     */
    public run<TUserContext extends object>(
        runtimeContext: RuntimeContext,
        userContext: TUserContext,
    ): BlueprintReturnType<T> {
        const oldBlueprint = this._blueprint as unknown as WorkflowBlueprint<
            BlueprintReturnType<T>,
            BlueprintUserContext<T>
        >;
        const blueprint = WorkflowBuilder.mergeContext(
            oldBlueprint,
            userContext,
        );
        const runner = new WorkflowRunner(blueprint, runtimeContext);
        const result = runner.run();

        if (result.status === "success") {
            return result.result;
        }

        throw result.error;
    }
}
