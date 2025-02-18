/*
 * This file implements a robust workflow engine that orchestrates a sequence
 * of steps.
 *
 * This module implements the Workflow class which manages the execution of
 * multiple steps defined by the user. It supports operations such as adding,
 * inserting, and removing steps, as well as mapping the return types of these
 * steps.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import type {
    Step,
    StepInsertOptions,
    WorkflowResult,
    BlueprintReturnType,
    BlueprintUserContext,
} from "@/types";
import type { WorkflowBlueprint } from "@/blueprints";
import { WorkflowBuilder } from "@/builders";
import { WorkflowRunner } from "@/runners";
import { WorkflowAsStep } from "@/steps";
import { Merge } from "@/utils/types";

/**
 * Executes a sequence of steps.
 * @template TSteps - Tuple type representing the workflow steps.
 * @template TUserContext - Type of the workflow context.
 * @property blueprint - The blueprint of the workflow.
 */
export class Workflow<T extends WorkflowBlueprint> {
    private _blueprint: T;

    public get blueprint(): T {
        return this._blueprint;
    }

    /**
     * Creates a new Workflow instance with the provided steps.
     * @param steps - Array of workflow steps.
     * @param context - Initial user context.
     * @private
     */
    private constructor(blueprint: T) {
        this._blueprint = blueprint;
    }

    /**
     * Creates an empty Workflow.
     * @returns A new Workflow with no steps.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<WorkflowBlueprint<void, object>>
     */
    public static create(): Workflow<WorkflowBlueprint<void, object>> {
        return new Workflow(WorkflowBuilder.createBlueprint());
    }

    private normalizeSteps(
        steps: Step<unknown, unknown> | Step<unknown, unknown>[],
    ) {
        switch (typeof steps) {
            case "object": {
                // Handle both array and single step
                steps = "run" in steps ? [steps] : steps;
                break;
            }

            // Make sure all other types are handled
            /* istanbul ignore next */
            default: {
                const _exhaustiveCheck: never = steps;
                throw new Error(`Unexpected steps type: ${_exhaustiveCheck}`);
            }
        }

        return steps;
    }

    /**
     * Push a single step or an array of steps to the end of the workflow.
     * @param steps - Step(s) to add.
     * @returns Workflow instance with the added steps.
     * @example
     * const workflow = Workflow.create();
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.pushStep(step1).pushStep([step2, step3]);
     * console.log(workflow.blueprint.steps); // => [step1, step2, step3]
     */
    public pushStep(steps: Step | Step[]): this {
        steps = this.normalizeSteps(steps);

        this._blueprint = WorkflowBuilder.pushStep(
            this._blueprint,
            steps,
        ) as T;
        return this;
    }

    /**
     * Unshift a single step or an array of steps to the beginning of the
     * workflow.
     * @param steps - Step(s) to add.
     * @returns Workflow instance with the added steps.
     * @example
     * const workflow = Workflow.create();
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.unshiftStep(step1).unshiftStep([step2, step3]);
     * console.log(workflow.blueprint.steps); // => [step2, step3, step1]
     */
    public unshiftStep(steps: Step | Step[]): this {
        steps = this.normalizeSteps(steps);

        this._blueprint = WorkflowBuilder.unshiftStep(
            this._blueprint,
            steps,
        ) as T;
        return this;
    }

    /**
     * Inserts a single step or an array of steps to the workflow.
     * @param steps - A single step or an array of steps to add.
     * @param options - Insertion configuration.
     * @returns Workflow instance with the added step(s).
     * @example
     * const workflow = Workflow.create();
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.addStep(step1, { after: 0 });
     * console.log(workflow.blueprint.steps); // => [step1]
     * workflow.addStep([step2], { before: step1 });
     * console.log(workflow.blueprint.steps); // => [step2, step1]
     * workflow.addStep(step3, { after: "step-*" });
     * console.log(workflow.blueprint.steps); // => [step2, step3, step1, step3]
     */
    public addStep(
        steps: Step | Step[],
        options: StepInsertOptions = {},
    ): this {
        steps = this.normalizeSteps(steps);

        this._blueprint = WorkflowBuilder.addStep(
            this._blueprint,
            steps as Step[],
            options,
        ) as T;
        return this;
    }

    /**
     * Type safe method to clear all steps from the workflow.
     * @returns A new Workflow instance with no steps.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * console.log(workflow.blueprint.steps); // => [step1, step2]
     * workflow.clearSteps();
     * console.log(workflow.blueprint.steps); // => []
     */
    public clearSteps(): this {
        this._blueprint = WorkflowBuilder.clearSteps(this._blueprint) as T;
        return this;
    }

    /**
     * Pop a single step or multiple steps from the end of the workflow.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the last N steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const step4 = { name: 'step-4', run: () => 'step-4' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3, step4]);
     * console.log(workflow.blueprint.steps); // => [step1, step2, step3, step4]
     * workflow.popStep();
     * console.log(workflow.blueprint.steps); // => [step1, step2, step3]
     * workflow.popStep(2);
     * console.log(workflow.blueprint.steps); // => [step1]
     */
    public popStep(n?: number): this {
        const count = n === undefined ? 1 : n;
        this._blueprint = WorkflowBuilder.popStep(this._blueprint, count) as T;
        return this;
    }

    /**
     * Shift a single step or multiple steps from the beginning of the
     * workflow.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the first N steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const step4 = { name: 'step-4', run: () => 'step-4' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3, step4]);
     * console.log(workflow.blueprint.steps); // => [step1, step2, step3, step4]
     * workflow.shiftStep();
     * console.log(workflow.blueprint.steps); // => [step2, step3, step4]
     * workflow.shiftStep(2);
     * console.log(workflow.blueprint.steps); // => [step4]
     */
    public shiftStep(n?: number): this {
        const count = n === undefined ? 1 : n;
        this._blueprint = WorkflowBuilder.shiftStep(
            this._blueprint,
            count,
        ) as T;
        return this;
    }

    /**
     * Removes a single step, an array of steps, or steps matching a pattern
     * from the workflow.
     * @param steps - A single step, an array of steps, or a pattern to match step names.
     * @returns A new Workflow instance with the steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const step4 = { name: 'step-4', run: () => 'step-4' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3, step4]);
     * console.log(workflow.blueprint.steps); // => [step1, step2, step3, step4]
     * workflow.removeStep(step2);
     * console.log(workflow.blueprint.steps); // => [step1, step3, step4]
     * workflow.removeStep([step1, step3]);
     * console.log(workflow.blueprint.steps); // => [step4]
     * workflow.removeStep("step-*");
     * console.log(workflow.blueprint.steps); // => []
     */
    public removeStep(steps: Step | Step[] | string): this {
        switch (typeof steps) {
            case "string": {
                // Handle step name patterns
                break;
            }

            case "object": {
                // Handle both arrays (readonly and mutable) and single steps
                steps = "run" in steps ? [steps] : steps;
                break;
            }

            // Make sure all other types are handled
            /* istanbul ignore next */
            default: {
                const _exhaustiveCheck: never = steps;
                throw new Error(`Unexpected steps type: ${_exhaustiveCheck}`);
            }
        }

        this._blueprint = WorkflowBuilder.removeStep(
            this._blueprint,
            steps as Step[] | string,
        ) as T;
        return this;
    }

    public setConclude<TReturnType = unknown>(
        conclude: Step<TReturnType>,
    ): Workflow<
        /* eslint-disable @stylistic/ts/indent */
        WorkflowBlueprint<TReturnType, BlueprintUserContext<T>>
    > {
        /* eslint-enable @stylistic/ts/indent */
        const newBlueprint = WorkflowBuilder.setConclude(
            this._blueprint,
            conclude,
        );

        return new Workflow(newBlueprint) as Workflow<
            WorkflowBlueprint<TReturnType, BlueprintUserContext<T>>
        >;
    }

    /**
     * Replaces the current user context with a new context type.
     * @template TNewContext - The type of the new user context.
     * @param context - An optional new context object (defaults to an empty object).
     * @returns A new Workflow instance whose user context is fully replaced by `TNewContext`.
     * @example
     * // 1) Explicitly replace the user context type:
     * type Context = { key: boolean };
     * const workflow = Workflow.create().setContext<Context>({ key: true });
     * // => Workflow<WorkflowBlueprint<..., Context>>
     * console.log(workflow.userContext); // => { key: true }
     * @example
     * // 2) Let TypeScript infer the new context type from the passed object:
     * const inferredWorkflow = Workflow.create().setContext({ foo: "bar" });
     * // => Workflow<WorkflowBlueprint<..., { foo: string; }>>
     * const updatedWorkflow = inferredWorkflow.setContext({ newField: 42 });
     * // => Workflow<WorkflowBlueprint<..., { newField: number; }>>
     * @example
     * // 3) Call setContext with a type parameter, but no context argument:
     * const workflow = Workflow.create().setContext({ key: true });
     * // => Workflow<WorkflowBlueprint<..., { key: boolean; }>>
     * const emptyContextWorkflow = workflow.setContext();
     * // => Workflow<WorkflowBlueprint<..., object>>
     * console.log(emptyContextWorkflow.userContext); // => {}
     */
    public setContext<TNewContext extends object>(
        context?: TNewContext,
    ): Workflow<
        /* eslint-disable @stylistic/ts/indent */
        WorkflowBlueprint<BlueprintReturnType<T>, TNewContext>
    > {
        /* eslint-enable @stylistic/ts/indent */
        const newBlueprint = WorkflowBuilder.setContext(
            this._blueprint,
            context,
        );
        return new Workflow(newBlueprint) as Workflow<
            WorkflowBlueprint<BlueprintReturnType<T>, TNewContext>
        >;
    }

    /**
     * Merges the current user context with a new context object.
     * @template TNewContext - The type of the new user context.
     * @param context - The new context object to merge.
     * @returns A new Workflow instance with the merged user context.
     * @example
     * // 1) Explicitly merge the user context type:
     * type Context = { key: boolean };
     * type NewContext = { newKey: string };

     * const workflow = Workflow.create()
     *     .setContext<Context>({ key: true })
     *     .mergeContext<newContext>({ newKey: "Hello, world!" });
     * // => Workflow<WorkflowBlueprint<newContext, Merge<Context>>, ...>
     * console.log(workflow.userContext); // => { key: true, newKey: "Hello, world!" }
     * @example
     * // 2) Let TypeScript infer the new context type from the passed object:
     * const inferredWorkflow = Workflow.create().setContext({ foo: "bar" });
     * // => Workflow<WorkflowBlueprint<..., { foo: string; }>>
     * const updatedWorkflow = inferredWorkflow.mergeContext({ newField: 42 });
     * // => Workflow<WorkflowBlueprint<{ newField: number; }, Merge<{ foo: string; }>>, ...>
     * @example
     * // 3) Call mergeContext with a type parameter, but no context argument:
     * const workflow = Workflow.create().setContext({ key: true });
     * // => Workflow<WorkflowBlueprint<..., { key: boolean; }>>
     * type NewContext = { newKey: boolean };
     * const emptyContextWorkflow = workflow.mergeContext<NewContext>();
     * // => Workflow<WorkflowBlueprint<NewContext, Merge<{ key: boolean; }>>, ...>
     * console.log(emptyContextWorkflow.userContext); // => { key: true }
     */
    public mergeContext<TNewContext extends object>(
        context?: TNewContext,
    ): Workflow<
        /* eslint-disable @stylistic/ts/indent */
        WorkflowBlueprint<
            BlueprintReturnType<T>,
            Merge<BlueprintUserContext<T>, TNewContext>
        >
    > {
        /* eslint-enable @stylistic/ts/indent */
        const newBlueprint = WorkflowBuilder.mergeContext(
            this._blueprint,
            context,
        );
        return new Workflow(newBlueprint) as Workflow<
            WorkflowBlueprint<
                BlueprintReturnType<T>,
                Merge<BlueprintUserContext<T>, TNewContext>
            >
        >;
    }

    /**
     * Updates the current user context with a new context object.
     * This method **won't** change the context type.
     * @param context - The new context object to update.
     * @returns A new Workflow instance with the updated user context.
     * @example
     * const workflow = Workflow.create().setContext({ key: true });
     * console.log(workflow.userContext); // => { key: true }
     * const updatedWorkflow = workflow.updateContext({ key: false });
     * console.log(updatedWorkflow.userContext); // => { key: false }
     */
    public updateContext(context: Partial<BlueprintUserContext<T>>): this {
        this._blueprint = WorkflowBuilder.updateContext(
            this._blueprint,
            context,
        ) as T;
        return this;
    }

    /**
     * Converts the workflow into a step.
     * @param options - Options to configure the step.
     * @returns A new WorkflowAsStep instance.
     * @example
     * const step1 = { run: () => 42 };
     * const step2 = { run: () => "Hello, world!" };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<WorkflowBlueprint<readonly [typeof step1, typeof step2], ...>>
     * const asStep = workflow.asStep();
     * // => WorkflowAsStep<WorkflowBlueprint<readonly [typeof step1, typeof step2], ...>>
     * console.log(asStep.run()); // => "Hello, world!"
     */
    public asStep(options?: Omit<Step, "run">): WorkflowAsStep<T> {
        return new WorkflowAsStep(this._blueprint, options);
    }

    /**
     * Executes all steps in the workflow sequentially.
     * The return type is determined by the last step in the workflow.
     * @returns A WorkflowResult with the success status and result,
     * or error info.
     */
    public run(): WorkflowResult<BlueprintReturnType<T>> {
        const runner = new WorkflowRunner(this._blueprint);
        return runner.run();
    }
}
