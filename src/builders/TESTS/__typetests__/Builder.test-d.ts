/*
 * This file tests the type inference of `WorkflowBuilder` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { expectType } from "tsd-lite";
import { WorkflowBuilder } from "../..";
import { StepReturnType } from "@/types";
import type { Alike, Equal } from "@/utils/types";

/*
 * ====================================
 * Describe `WorkflowBuilder.createBlueprint`:
 * ====================================
 */

/*
 * It should use `void` as the default return type.
 */
{
    const blueprint = WorkflowBuilder.createBlueprint();
    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, void>>(true);
}

/*
 * It should use a default context.
 */
{
    const blueprintWithDefaultContext = WorkflowBuilder.createBlueprint();
    type WorkflowContext = typeof blueprintWithDefaultContext.userContext;
    expectType<Equal<object, WorkflowContext>>(true);
}

/*
 * It should use the given conclusion and context.
 */
{
    const conclusion = { run: () => 42 };
    const context = { key: "value" };
    const blueprint = WorkflowBuilder.createBlueprint([], conclusion, context);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, typeof context>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.pushStep`:
 * ====================================
 */

/*
 * It should not change the `TReturnType` and `TContext` of the blueprint.
 */
{
    const step = { run: () => 42 };
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        { key: "value" },
    );
    const blueprint = WorkflowBuilder.pushStep(initialWorkflow, [step]);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.unshiftStep`:
 * ====================================
 */

/*
 * It should not change the `TReturnType` and `TContext` of the blueprint.
 */
{
    const step = { run: () => 42 };
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        { key: "value" },
    );
    const blueprint = WorkflowBuilder.unshiftStep(initialWorkflow, [step]);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.clearSteps`:
 * ====================================
 */

/*
 * It should not change the `TReturnType` and `TContext` of the blueprint.
 */
{
    const step = { run: () => 42 };
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [step],
        { run: () => 42 },
        { key: "value" },
    );
    const blueprint = WorkflowBuilder.clearSteps(initialWorkflow);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.popStep`:
 * ====================================
 */

/*
 * It should not change the `TReturnType` and `TContext` of the blueprint.
 */
{
    const step = { run: () => 42 };
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [step],
        { run: () => 42 },
        { key: "value" },
    );
    const blueprint = WorkflowBuilder.popStep(initialWorkflow);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.shiftStep`:
 * ====================================
 */

/*
 * It should not change the `TReturnType` and `TContext` of the blueprint.
 */
{
    const step = { run: () => 42 };
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [step],
        { run: () => 42 },
        { key: "value" },
    );
    const blueprint = WorkflowBuilder.shiftStep(initialWorkflow);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.setConclude`:
 * ====================================
 */

/*
 * It should change the return type of a Workflow instance correctly.
 */

{
    const initialBlueprint = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        {
            key: "value",
        },
    );
    const blueprint = WorkflowBuilder.setConclude(initialBlueprint, {
        run: () => "Hello, World!",
    });

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, string>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.setContext`:
 * ====================================
 */

/*
 * It should change the user context type of a Workflow instance correctly.
 */
{
    const initialBlueprint = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        {
            a: "Hello",
            b: 42,
        },
    );
    const blueprint = WorkflowBuilder.setContext(initialBlueprint, {
        a: "Hello",
        b: 42,
        c: true,
    });

    type NewContext = { a: string; b: number; c: boolean };
    expectType<Equal<NewContext, typeof blueprint.userContext>>(true);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);
}

/*
 * It should clear the user context type of a blueprint
 * if no type is provided.
 */

{
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        {
            a: "Hello",
            b: 42,
        },
    );
    const blueprint = WorkflowBuilder.setContext(initialWorkflow);

    expectType<Equal<object, typeof blueprint.userContext>>(true);

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.mergeContext`:
 * ====================================
 */

/*
 * It should merge the new context with the existing context.
 */
{
    type MergedContext = { a: string; b: number; c: boolean };

    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        {
            a: "Hello",
            b: 42,
        },
    );
    const blueprint = WorkflowBuilder.mergeContext(initialWorkflow, {
        c: true,
    });

    expectType<Alike<MergedContext, typeof blueprint.userContext>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.updateContext`:
 * ====================================
 */

/*
 * It should not change the `TReturnType` and `TContext` of the blueprint.
 */
{
    const initialWorkflow = WorkflowBuilder.createBlueprint(
        [],
        { run: () => 42 },
        { key: "value" },
    );
    const blueprint = WorkflowBuilder.updateContext(initialWorkflow, {
        key: "new value",
    });

    type WorkflowReturnType = StepReturnType<typeof blueprint.conclude>;
    expectType<Equal<WorkflowReturnType, number>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}
