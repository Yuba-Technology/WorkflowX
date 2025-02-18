/*
 * This file tests the type inference of `Workflow` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { expectType } from "tsd-lite";
import { Workflow } from "../..";
import type { WorkflowResult, Unreliable, ExtractUserContext } from "@/types";
import type { WorkflowBlueprint } from "@/blueprints";
import type { Alike, Equal } from "@/utils/types";

/*
 * ====================================
 * Describe `Workflow.create`:
 * ====================================
 */

/*
 * It should use a default blueprint.
 */
{
    const workflowWithDefaultBlueprint = Workflow.create();
    expectType<
        Equal<
            WorkflowBlueprint<void, object>,
            typeof workflowWithDefaultBlueprint.blueprint
        >
    >(true);
}

/*
 * ====================================
 * Describe `Workflow.pushStep`:
 * ====================================
 */

/*
 * It should not change the type of the blueprint.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create()
        .setConclude({ run: () => 42 })
        .setContext({ key: "value" })
        .pushStep(step);
    type WorkflowStep = typeof workflow.blueprint;
    expectType<
        Equal<WorkflowBlueprint<number, { key: string }>, WorkflowStep>
    >(true);
}

/*
 * ====================================
 * Describe `Workflow.unshiftStep`:
 * ====================================
 */

/*
 * It should not change the type of the blueprint.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create()
        .setConclude({ run: () => 42 })
        .setContext({ key: "value" })
        .unshiftStep(step);
    type WorkflowStep = typeof workflow.blueprint;
    expectType<
        Equal<WorkflowBlueprint<number, { key: string }>, WorkflowStep>
    >(true);
}

/*
 * ====================================
 * Describe `Workflow.clearSteps`:
 * ====================================
 */

/*
 * It should not change the type of the blueprint.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create()
        .pushStep(step)
        .setConclude({ run: () => 42 })
        .setContext({ key: "value" })
        .clearSteps();
    type WorkflowStep = typeof workflow.blueprint;
    expectType<
        Equal<WorkflowBlueprint<number, { key: string }>, WorkflowStep>
    >(true);
}

/*
 * ====================================
 * Describe `Workflow.popStep`:
 * ====================================
 */

/*
 * It should not change the type of the blueprint.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create()
        .pushStep(step)
        .setConclude({ run: () => 42 })
        .setContext({ key: "value" })
        .popStep();
    type WorkflowStep = typeof workflow.blueprint;
    expectType<
        Equal<WorkflowBlueprint<number, { key: string }>, WorkflowStep>
    >(true);
}

/*
 * ====================================
 * Describe `Workflow.shiftStep`:
 * ====================================
 */

/*
 * It should not change the type of the blueprint.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create()
        .pushStep(step)
        .setConclude({ run: () => 42 })
        .setContext({ key: "value" })
        .shiftStep();
    type WorkflowStep = typeof workflow.blueprint;
    expectType<
        Equal<WorkflowBlueprint<number, { key: string }>, WorkflowStep>
    >(true);
}

/*
 * ====================================
 * Describe `Workflow.setContext`:
 * ====================================
 */

/*
 * It should change the user context type of a Workflow instance correctly.
 */
{
    type OldContext = Unreliable<{ a: string; b: number }>;
    type NewContext = Unreliable<{ a: string; b: number; c: boolean }>;

    const workflow = Workflow.create()
        .setContext<OldContext>()
        .setContext<NewContext>();

    expectType<Equal<NewContext, ExtractUserContext<typeof workflow>>>(true);
}

/*
 * It should clear the user context type of a Workflow instance
 * if no type is provided.
 */

{
    type Context = Unreliable<{ a: string; b: number }>;

    const workflow = Workflow.create().setContext<Context>().setContext();
    expectType<Equal<object, ExtractUserContext<typeof workflow>>>(true);
}

/*
 * ====================================
 * Describe `Workflow.mergeContext`:
 * ====================================
 */

/*
 * It should merge the new context with the existing context.
 */
{
    type Context1 = Unreliable<{ a: string; b: number }>;
    type Context2 = Unreliable<{ c: boolean }>;
    type MergedContext = Unreliable<{ a: string; b: number; c: boolean }>;

    const workflow = Workflow.create()
        .setContext<Context1>()
        .mergeContext<Context2>();

    expectType<Alike<MergedContext, ExtractUserContext<typeof workflow>>>(
        true,
    );
}

/*
 * It should auto infer type of new context if no type is provided,
 * and auto merge variable context into the workflow context.
 */
{
    const context1 = { a: "Hello", b: "World" };
    const context2 = { b: 42, c: true };

    const workflow = Workflow.create()
        .setContext(context1)
        .mergeContext(context2);

    type MergedContext = {
        a: string;
        b: number;
        c: boolean;
    };
    expectType<Alike<MergedContext, ExtractUserContext<typeof workflow>>>(
        true,
    );
}

/*
 * ====================================
 * Describe `Workflow.run`:
 * ====================================
 */

/*
 * It should infer WorkflowResult<void> for an empty workflow run.
 */
{
    const emptyWorkflow = Workflow.create();
    type EmptyResult = ReturnType<typeof emptyWorkflow.run>;
    expectType<Equal<EmptyResult, WorkflowResult<void>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflow blueprints with
 * `conclude` method returning a value.
 */
{
    const step = { run: () => 42 };
    const singleStepWorkflow = Workflow.create().setConclude(step);
    type NumberResult = ReturnType<typeof singleStepWorkflow.run>;

    expectType<Equal<NumberResult, WorkflowResult<number>>>(true);
}
