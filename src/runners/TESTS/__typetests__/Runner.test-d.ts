/*
 * This file tests the type inference of `WorkflowRunner` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { expectType } from "tsd-lite";
import { WorkflowRunner } from "../..";
import { WorkflowBuilder } from "@/builders";
import type { WorkflowResult } from "@/types";
import type { Equal } from "@/utils/types";

/*
 * ====================================
 * Describe `WorkflowRunner.run`:
 * ====================================
 */

/*
 * It should infer WorkflowResult<void> for an empty workflow blueprint.
 */
{
    const emptyWorkflowBlueprint = WorkflowBuilder.createBlueprint();
    const runner = new WorkflowRunner(emptyWorkflowBlueprint);
    type EmptyResult = ReturnType<typeof runner.run>;

    expectType<Equal<EmptyResult, WorkflowResult<void>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflow blueprints with
 * `conclude` method returning a value.
 */
{
    const conclude = { run: () => 42 };
    const singleStepWorkflow = WorkflowBuilder.createBlueprint([], conclude);
    const runner = new WorkflowRunner(singleStepWorkflow);
    type NumberResult = ReturnType<typeof runner.run>;

    expectType<Equal<NumberResult, WorkflowResult<number>>>(true);
}
