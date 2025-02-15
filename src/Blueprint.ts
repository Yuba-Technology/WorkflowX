/*
 * This file implements the WorkflowBlueprint class, which is responsible for
 * defining the structure of a workflow.
 *
 * The WorkflowBlueprint class is used to define the structure of a workflow by
 * specifying the steps that the workflow should execute and the context that
 * the workflow should use. The class is used to create a blueprint for a
 * workflow, which can then be executed by a WorkflowRunner.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import type { Step } from "./types";

/**
 * Represents a blueprint for a workflow.
 * @template TSteps - The steps of the workflow.
 * @template TUserContext - The context of the workflow.
 * @property steps - The steps of the workflow.
 * @property userContext - The context of the workflow.
 */
export class WorkflowBlueprint<
    TSteps extends readonly Step[] = readonly Step[],
    TUserContext extends object = object,
> {
    public readonly steps: TSteps;
    public userContext: TUserContext;

    constructor(steps: TSteps, context: TUserContext) {
        this.userContext = context;
        this.steps = steps;
    }
}
