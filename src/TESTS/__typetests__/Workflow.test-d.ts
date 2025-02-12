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
import type { WorkflowBlueprint } from "../..";
import { Workflow } from "../..";
import type {
    WorkflowResult,
    Unreliable,
    ExtractUserContext,
} from "../../types";
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
            WorkflowBlueprint<readonly [], object>,
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
 * It should add a single step to the workflow.
 */

{
    const step = { run: () => 42 };
    const workflow = Workflow.create().pushStep(step);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step]>>(true);
}

/*
 * It should add multiple steps to the workflow.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflow = Workflow.create().pushStep([step1, step2]);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step1, typeof step2]>>(
        true,
    );
}

/*
 * It should change the return type of `workflow.run` after adding a step.
 */

{
    const step = { run: () => 42 };
    const workflow = Workflow.create().addStep(step).pushStep(step);
    type NumberResult = ReturnType<typeof workflow.run>;
    expectType<Equal<NumberResult, WorkflowResult<number>>>(true);
}

/*
 * ====================================
 * Describe `Workflow.unshiftStep`:
 * ====================================
 */

/*
 * It should add a single step to the beginning of the workflow.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create().unshiftStep(step);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step]>>(true);
}

/*
 * It should add multiple steps to the beginning of the workflow.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflow = Workflow.create().unshiftStep([step1, step2]);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step1, typeof step2]>>(
        true,
    );
}

/*
 * ====================================
 * Describe `Workflow.clearSteps`:
 * ====================================
 */

/*
 * It should remove all steps from the workflow.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflow = Workflow.create().pushStep([step1, step2]).clearSteps();
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * ====================================
 * Describe `Workflow.popStep`:
 * ====================================
 */

/*
 * It should remove the last step from the workflow.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create().pushStep(step).popStep();
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * It should remove the last n steps with `n` >= 1.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const step3 = { run: () => true };
    const workflow = Workflow.create()
        .pushStep([step1, step2, step3])
        .popStep(2);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step1]>>(true);
}

/*
 * It should remove all steps if `n` is greater than the number of steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflow = Workflow.create().pushStep([step1, step2]).popStep(3);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * It should do nothing if the workflow is empty.
 */
{
    const workflow = Workflow.create().popStep();
    type EmptyResult = ReturnType<typeof workflow.run>;

    expectType<Equal<EmptyResult, WorkflowResult<undefined>>>(true);
}

/*
 * It should change the return type of `workflow.run` after removing a step.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflow = Workflow.create().pushStep([step1, step2]).popStep();
    type NumberResult = ReturnType<typeof workflow.run>;
    expectType<Equal<NumberResult, WorkflowResult<number>>>(true);
}

/*
 * ====================================
 * Describe `Workflow.shiftStep`:
 * ====================================
 */

/*
 * It should remove the first step from the workflow.
 */
{
    const step = { run: () => 42 };
    const workflow = Workflow.create().pushStep(step).shiftStep();
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * It should remove the first n steps with `n` >= 1.
 */

{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const step3 = { run: () => true };
    const workflow = Workflow.create()
        .pushStep([step1, step2, step3])
        .shiftStep(2);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step3]>>(true);
}

/*
 * It should remove all steps if `n` is greater than the number of steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflow = Workflow.create().pushStep([step1, step2]).shiftStep(3);
    type WorkflowStep = typeof workflow.blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * It should do nothing if the workflow is empty.
 */
{
    const workflow = Workflow.create().shiftStep();
    type EmptyResult = ReturnType<typeof workflow.run>;
    expectType<Equal<EmptyResult, WorkflowResult<undefined>>>(true);
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
 * It should infer WorkflowResult<undefined> for an empty workflow run.
 */
{
    const emptyWorkflow = Workflow.create();
    type EmptyResult = ReturnType<typeof emptyWorkflow.run>;
    expectType<Equal<EmptyResult, WorkflowResult<undefined>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflows with single step.
 */
{
    const step = { run: () => 42 };
    const singleStepWorkflow = Workflow.create().pushStep(step);
    type NumberResult = ReturnType<typeof singleStepWorkflow.run>;

    expectType<Equal<NumberResult, WorkflowResult<number>>>(true);
}

/*
 * It should infer correct WorkflowResult<T> for workflows with multiple steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const multiStepWorkflow = Workflow.create().pushStep([step1, step2]);
    type StringResult = ReturnType<typeof multiStepWorkflow.run>;

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
    const lastStepVoidWorkflow = Workflow.create().pushStep([step1, step2]);
    type VoidResult = ReturnType<typeof lastStepVoidWorkflow.run>;

    expectType<Equal<VoidResult, WorkflowResult<void>>>(true);
}
