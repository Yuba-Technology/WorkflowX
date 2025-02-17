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
import type { Alike, Equal } from "@/utils/types";

/*
 * ====================================
 * Describe `WorkflowBuilder.createBlueprint`:
 * ====================================
 */

/*
 * It should use a default context.
 */
{
    const blueprintWithDefaultContext = WorkflowBuilder.createBlueprint();
    type WorkflowContext = typeof blueprintWithDefaultContext.userContext;
    expectType<Equal<object, WorkflowContext>>(true);
}

/*
 * It should add a set of empty steps to the blueprint.
 */
{
    const blueprint = WorkflowBuilder.createBlueprint();
    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * It should use the given steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const context = { key: "value" };
    const blueprint = WorkflowBuilder.createBlueprint([step1, step2], context);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step1, typeof step2]>>(
        true,
    );

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, typeof context>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.pushStep`:
 * ====================================
 */

/*
 * It should add multiple steps to the blueprint.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const step3 = { run: () => true };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithStep1 = WorkflowBuilder.pushStep(contextSetWorkflow, [
        step1,
    ]);
    const blueprint = WorkflowBuilder.pushStep(blueprintWithStep1, [
        step2,
        step3,
    ]);

    type WorkflowStep = typeof blueprint.steps;
    expectType<
        Equal<
            WorkflowStep,
            readonly [typeof step1, typeof step2, typeof step3]
        >
    >(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.unshiftStep`:
 * ====================================
 */

/*
 * It should add multiple steps to the beginning of the blueprint.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const step3 = { run: () => true };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithStep1 = WorkflowBuilder.unshiftStep(
        contextSetWorkflow,
        [step1],
    );
    const blueprint = WorkflowBuilder.unshiftStep(blueprintWithStep1, [
        step2,
        step3,
    ]);

    type WorkflowStep = typeof blueprint.steps;
    expectType<
        Equal<
            WorkflowStep,
            readonly [typeof step2, typeof step3, typeof step1]
        >
    >(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.clearSteps`:
 * ====================================
 */

/*
 * It should remove all steps from the blueprint.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithSteps = WorkflowBuilder.pushStep(contextSetWorkflow, [
        step1,
        step2,
    ]);
    const blueprint = WorkflowBuilder.clearSteps(blueprintWithSteps);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.popStep`:
 * ====================================
 */

/*
 * It should remove the last n steps with `n`.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const step3 = { run: () => true };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithSteps = WorkflowBuilder.pushStep(contextSetWorkflow, [
        step1,
        step2,
        step3,
    ]);
    const blueprint = WorkflowBuilder.popStep(blueprintWithSteps, 2);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step1]>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * It should remove all steps if `n` is greater than the number of steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithSteps = WorkflowBuilder.pushStep(contextSetWorkflow, [
        step1,
        step2,
    ]);
    const blueprint = WorkflowBuilder.popStep(blueprintWithSteps, 3);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * It should do nothing if the `steps` tuple is empty.
 */
{
    const emptyWorkflow = WorkflowBuilder.createBlueprint();
    const blueprintWithContext = WorkflowBuilder.setContext(emptyWorkflow, {
        key: "value",
    });
    const blueprint = WorkflowBuilder.popStep(blueprintWithContext, 1);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);

    type WorkflowContext = typeof blueprint.userContext;
    expectType<Equal<WorkflowContext, { key: string }>>(true);
}

/*
 * ====================================
 * Describe `WorkflowBuilder.shiftStep`:
 * ====================================
 */

/*
 * It should remove the first n steps with `n`.
 */

{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const step3 = { run: () => true };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithSteps = WorkflowBuilder.pushStep(contextSetWorkflow, [
        step1,
        step2,
        step3,
    ]);
    const blueprint = WorkflowBuilder.shiftStep(blueprintWithSteps, 2);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly [typeof step3]>>(true);
}

/*
 * It should remove all steps if `n` is greater than the number of steps.
 */
{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const contextSetWorkflow = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprintWithSteps = WorkflowBuilder.pushStep(contextSetWorkflow, [
        step1,
        step2,
    ]);
    const blueprint = WorkflowBuilder.shiftStep(blueprintWithSteps, 3);

    type WorkflowStep = typeof blueprint.steps;
    expectType<Equal<WorkflowStep, readonly []>>(true);
}

/*
 * It should do nothing if the `steps` tuple is empty.
 */
{
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const blueprintWithContext = WorkflowBuilder.setContext(initialWorkflow, {
        key: "value",
    });
    const blueprint = WorkflowBuilder.shiftStep(blueprintWithContext, 1);

    type EmptyWorkflowStep = typeof blueprint.steps;
    expectType<Equal<EmptyWorkflowStep, readonly []>>(true);

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
    const initialBlueprint = WorkflowBuilder.createBlueprint();
    const blueprintWithSteps = WorkflowBuilder.pushStep(initialBlueprint, [
        { run: () => 42 },
    ]);
    const blueprintWithOldContext = WorkflowBuilder.setContext(
        blueprintWithSteps,
        {
            a: "Hello",
            b: 42,
        },
    );
    const blueprint = WorkflowBuilder.setContext(blueprintWithOldContext, {
        a: "Hello",
        b: 42,
        c: true,
    });

    type NewContext = { a: string; b: number; c: boolean };
    expectType<Equal<NewContext, typeof blueprint.userContext>>(true);

    type Steps = typeof blueprint.steps;
    expectType<Equal<Steps, readonly [{ run: () => number }]>>(true);
}

/*
 * It should clear the user context type of a blueprint
 * if no type is provided.
 */

{
    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const blueprintWithOldContext = WorkflowBuilder.setContext(
        initialWorkflow,
        {
            a: "Hello",
            b: 42,
        },
    );
    const blueprint = WorkflowBuilder.setContext(blueprintWithOldContext);

    expectType<Equal<object, typeof blueprint.userContext>>(true);
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

    const initialWorkflow = WorkflowBuilder.createBlueprint();
    const blueprintWithOldContext = WorkflowBuilder.setContext(
        initialWorkflow,
        {
            a: "Hello",
            b: 42,
        },
    );
    const blueprint = WorkflowBuilder.mergeContext(blueprintWithOldContext, {
        c: true,
    });

    expectType<Alike<MergedContext, typeof blueprint.userContext>>(true);
}
