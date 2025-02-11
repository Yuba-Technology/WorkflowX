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
import { WorkflowBuilder, WorkflowRunner } from "../..";
import type { WorkflowResult } from "../../types";
import type { Equal } from "@/utils/types";

/*
 * ====================================
 * Describe `WorkflowRunner.run`:
 * ====================================
 */

/*
 * It should infer WorkflowResult<undefined> for an empty workflow blueprint.
 */
{
    const emptyWorkflowBlueprint = WorkflowBuilder.createBlueprint();
    const runner = new WorkflowRunner(emptyWorkflowBlueprint);
    type EmptyResult = ReturnType<typeof runner.run>;
    expectType<Equal<EmptyResult, WorkflowResult<undefined>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflows with single step.
 */
{
    const step = { run: () => 42 };
    const singleStepWorkflow = WorkflowBuilder.createBlueprint([step]);
    const runner = new WorkflowRunner(singleStepWorkflow);
    type NumberResult = ReturnType<typeof runner.run>;

    expectType<Equal<NumberResult, WorkflowResult<number>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflows with multiple steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const multiStepWorkflow = WorkflowBuilder.createBlueprint([step1, step2]);
    const runner = new WorkflowRunner(multiStepWorkflow);
    type StringResult = ReturnType<typeof runner.run>;

    expectType<Equal<StringResult, WorkflowResult<string>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflows with last step
 * returning void.
 */
{
    const step1 = { run: () => 42 };
    const step2 = {
        run() {
            /* do nothing */
        },
    };
    const lastStepVoidWorkflow = WorkflowBuilder.createBlueprint([
        step1,
        step2,
    ]);
    const runner = new WorkflowRunner(lastStepVoidWorkflow);
    type VoidResult = ReturnType<typeof runner.run>;

    expectType<Equal<VoidResult, WorkflowResult<void>>>(true);
}
