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

import type { Step } from "@/types";

/**
 * Represents a blueprint for a workflow.
 * @template TReturnType - The return type of the workflow.
 * @template TUserContext - The context of the workflow.
 * @property steps - The steps of the workflow.
 * @property conclude - The final step of the workflow, which returns the result.
 * @property userContext - The context of the workflow.
 */
export class WorkflowBlueprint<
    TReturnType = unknown,
    TUserContext extends object = object,
> {
    // eslint-disable-next-line no-useless-constructor
    constructor(
        public steps: Step[],
        public conclude: Step<TReturnType>,
        public userContext: TUserContext,
    ) {}
}
