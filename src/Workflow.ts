/*
 * This file implements a robust workflow engine that orchestrates a sequence
 * of steps.
 *
 * This module implements the Workflow class which manages the execution of
 * multiple steps defined by the user. It supports operations such as adding,
 * inserting, and removing steps, as well as mapping the return types of these
 * steps. The class ensures type safety through advanced TypeScript generics
 * and tuple manipulation, providing a solid foundation for a robust workflow
 * execution engine.
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
    LastStepReturnType,
    Pop,
    PopN,
    Shift,
    ShiftN,
} from "./types";
import { WorkflowBlueprint, WorkflowBuilder, WorkflowRunner } from ".";
import { Merge } from "@/utils/types";
// Here we put `TUserContext` before `TSteps`, because in most cases we
// want to specify the user context type manually, and let TypeScript infer
// the steps tuple type.
// Same reason for those methods that having `TUserContext` as
// the first type parameter.
/**
 * Executes a sequence of steps.
 * @template TSteps - Tuple type representing the workflow steps.
 * @template TUserContext - Type of the workflow context.
 * @property blueprint - The blueprint of the workflow.
 */
export class Workflow<T extends WorkflowBlueprint> {
    public readonly blueprint: T;

    /**
     * Creates a new Workflow instance with the provided steps.
     * @param steps - Array of workflow steps.
     * @param context - Initial user context.
     * @private
     */
    private constructor(blueprint: T) {
        this.blueprint = blueprint;
    }

    /**
     * Creates an empty Workflow.
     * @returns A new Workflow with no steps.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<DefaultContext, readonly []>
     */
    public static create(): Workflow<WorkflowBlueprint<readonly [], object>> {
        return new Workflow(WorkflowBuilder.createBlueprint());
    }

    /**
     * Type safe method to push a step to the end of the workflow.
     * @template T - Type of the step to add.
     * @param step - The step to add.
     * @returns A new Workflow instance with the added step.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<..., readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.pushStep(step1).pushStep(step2);
     * // => Workflow<..., readonly [typeof step1, typeof step2]>
     */
    public pushStep<K extends Step<unknown>>(
        step: K,
    ): Workflow<
        WorkflowBlueprint<readonly [...T["steps"], K], T["userContext"]>
    >;

    /**
     * Type safe method to push multiple steps to the end of the workflow.
     * @template K - Tuple of steps to add.
     * @param steps - Tuple of steps to add.
     * @returns A new Workflow instance with the added steps.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<..., readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.pushStep(step1).pushStep([step2, step3]);
     * // => Workflow<..., readonly [typeof step1, typeof step2, typeof step3]>
     */
    public pushStep<K extends readonly Step<unknown>[]>(
        steps: readonly [...K],
    ): Workflow<
        WorkflowBlueprint<readonly [...T["steps"], ...K], T["userContext"]>
    >;

    /**
     * Type safe method to push a step or multiple steps to the end of the workflow.
     * @param steps - A single step or an array of steps to add.
     * @returns A new Workflow instance with the added step(s).
     */
    public pushStep(steps: Step<unknown> | readonly Step<unknown>[]) {
        const newBlueprint =
            "run" in steps
                ? WorkflowBuilder.pushStep(this.blueprint, [steps])
                : WorkflowBuilder.pushStep(this.blueprint, steps);
        return new Workflow(newBlueprint);
    }

    /**
     * Type safe method to unshift a step to the beginning of the workflow.
     * @template T - Type of the step to add.
     * @param step - The step to add.
     * @returns A new Workflow instance with the added step.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<..., readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.unshiftStep(step1).unshiftStep(step2);
     * // => Workflow<..., readonly [typeof step2, typeof step1]>
     */
    public unshiftStep<K extends Step<unknown>>(
        step: K,
    ): Workflow<
        WorkflowBlueprint<readonly [K, ...T["steps"]], T["userContext"]>
    >;

    /**
     * Type safe method to unshift multiple steps to the beginning of the workflow.
     * @template K - Tuple of steps to add.
     * @param steps - Tuple of steps to add.
     * @returns A new Workflow instance with the added steps.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<..., readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * workflow.unshiftStep(step1).unshiftStep([step2, step3]);
     * // => Workflow<..., readonly [typeof step2, typeof step3, typeof step1]>
     */
    public unshiftStep<K extends readonly Step<unknown>[]>(
        steps: readonly [...K],
    ): Workflow<
        WorkflowBlueprint<readonly [...K, ...T["steps"]], T["userContext"]>
    >;

    /**
     * Type safe method to unshift a step or multiple steps to the beginning of the workflow.
     * @param steps - A single step or an array of steps to add.
     * @returns A new Workflow instance with the added step(s).
     */
    public unshiftStep(steps: Step<unknown> | readonly Step<unknown>[]) {
        const newBlueprint =
            "run" in steps
                ? WorkflowBuilder.unshiftStep(this.blueprint, [steps])
                : WorkflowBuilder.unshiftStep(this.blueprint, steps);
        return new Workflow(newBlueprint);
    }

    /**
     * Inserts a single step to the workflow.
     * Notice that this method is **type unsafe**, and it is recommended to use
     * `pushStep` or `unshiftStep` for better type inference.
     * @template T - Type of the step result.
     * @param step - A single step.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the added step
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<..., readonly []>
     * workflow.addStep(step, { index: 0, position: 'before' });
     * // => Workflow<..., readonly Step<unknown, unknown>[]>
     */
    public addStep<K extends Step<unknown>>(
        step: K,
        options?: StepInsertOptions,
    ): Workflow<WorkflowBlueprint<readonly Step<unknown>[], T["userContext"]>>;

    /**
     * Inserts an array of steps to the workflow.
     * Notice that this method is **type unsafe**, and it is recommended to use
     * `pushStep` or `unshiftStep` for better type inference.
     * @template T - Type of the step result.
     * @param steps - Readonly array of steps.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the steps inserted.
     * @example
     * const workflow = Workflow.create();
     * // => Workflow<..., readonly []>
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * workflow.addStep([step1, step2]);
     * // => Workflow<..., readonly Step<unknown, unknown>[]>
     */
    public addStep<K extends Step<unknown>[]>( // 改为 readonly 约束
        steps: [...K] | readonly [...K],
        options?: StepInsertOptions,
    ): Workflow<WorkflowBlueprint<readonly Step<unknown>[], T["userContext"]>>;

    /**
     * Inserts a single step or an array of steps to the workflow.
     * @param steps - A single step or an array of steps to add.
     * @param options - Insertion configuration.
     * @returns A new Workflow instance with the added step(s).
     */
    public addStep(
        steps: Step<unknown> | Step<unknown>[] | readonly Step<unknown>[],
        options: StepInsertOptions = {},
    ) {
        const stepsArray: Step<unknown>[] = Array.isArray(steps)
            ? ([...steps] as Step<unknown>[])
            : ([steps] as Step<unknown>[]);
        const newBlueprint = WorkflowBuilder.addStep(
            this.blueprint,
            stepsArray,
            options,
        );
        return new Workflow(newBlueprint);
    }

    /**
     * Type safe method to pop a step from the end of the workflow.
     * @returns A new Workflow instance with the last step removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<..., readonly [typeof step1, typeof step2]>
     * workflow.popStep();
     * // => Workflow<..., readonly [typeof step1]>
     */
    public popStep(): Workflow<
        WorkflowBlueprint<Pop<T["steps"]>, T["userContext"]>
    >;

    /**
     * Type safe method to pop multiple steps from the end of the workflow.
     * @template N - Number of steps to remove.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the last N steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3]);
     * // => Workflow<..., readonly [typeof step1, typeof step2, typeof step3]>
     * workflow.popStep(2);
     * // => Workflow<..., readonly [typeof step1]>
     */
    public popStep<N extends number>(
        n: N,
    ): Workflow<WorkflowBlueprint<PopN<T["steps"], N>, T["userContext"]>>;

    /**
     * Type safe method to pop a single step or multiple steps from the end of the workflow.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the last N steps removed.
     */
    public popStep(n?: number) {
        const count = n === undefined ? 1 : n;
        const newBlueprint = WorkflowBuilder.popStep(this.blueprint, count);
        return new Workflow(newBlueprint);
    }

    /**
     * Type safe method to shift a step from the beginning of the workflow.
     * @returns A new Workflow instance with the first step removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<..., readonly [typeof step1, typeof step2]>
     * workflow.shiftStep();
     * // => Workflow<..., readonly [typeof step2]>
     */
    public shiftStep(): Workflow<
        WorkflowBlueprint<Shift<T["steps"]>, T["userContext"]>
    >;

    /**
     * Type safe method to shift multiple steps from the beginning of the workflow.
     * @template N - Number of steps to remove.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the first N steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3]);
     * // => Workflow<..., readonly [typeof step1, typeof step2, typeof step3]>
     * workflow.shiftStep(2);
     * // => Workflow<..., readonly [typeof step3]>
     */
    public shiftStep<N extends number>(
        n: N,
    ): Workflow<WorkflowBlueprint<ShiftN<T["steps"], N>, T["userContext"]>>;

    /**
     * Type safe method to shift a single step or multiple steps from the
     * beginning of the workflow.
     * @param n - Number of steps to remove.
     * @returns A new Workflow instance with the first N steps removed.
     */
    public shiftStep(n?: number) {
        const count = n === undefined ? 1 : n;
        const newBlueprint = WorkflowBuilder.shiftStep(this.blueprint, count);
        return new Workflow(newBlueprint);
    }

    /**
     * Removes a single step from the workflow.
     * Notice that this method is **type unsafe**, and it is recommended to use
     * `popStep` or `shiftStep` for better type inference.
     * @param step - The step to remove.
     * @returns A new Workflow instance with the step removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<..., readonly [typeof step1, typeof step2]>
     * workflow.removeStep(step1);
     * // => Workflow<..., readonly Step<unknown, unknown>[]>
     */
    public removeStep(
        steps: Step<unknown>,
    ): Workflow<WorkflowBlueprint<Step<unknown>[], T["userContext"]>>;

    /**
     * Removes an array of steps from the workflow.
     * @param steps - Readonly array of steps to remove.
     * @returns A new Workflow instance with the steps removed.
     * @example
     * const step1 = { name: 'step-1', run: () => 'step-1' };
     * const step2 = { name: 'step-2', run: () => 'step-2' };
     * const step3 = { name: 'step-3', run: () => 'step-3' };
     * const workflow = Workflow.create().pushStep([step1, step2, step3]);
     * // => Workflow<..., readonly [typeof step1, typeof step2, typeof step3]>
     * workflow.removeStep([step1, step3]);
     * // => Workflow<..., readonly Step<unknown, unknown>[]>
     */
    public removeStep(
        steps: readonly Step<unknown>[],
    ): Workflow<WorkflowBlueprint<Step<unknown>[], T["userContext"]>>;

    /**
     * Removes steps matching the provided pattern from the workflow.
     * @param steps - Pattern to match step names.
     * @returns A new Workflow instance with the steps removed.
     * @example
     * const step1 = { name: 'test-1', run: () => 'step-1' };
     * const step2 = { name: 'test-2', run: () => 'step-2' };
     * const workflow = Workflow.create().pushStep([step1, step2]);
     * // => Workflow<..., readonly [typeof step1, typeof step2]>
     * workflow.removeStep('test-*');
     * // => Workflow<..., readonly Step<unknown, unknown>[]>
     */
    public removeStep(
        steps: string,
    ): Workflow<WorkflowBlueprint<Step<unknown>[], T["userContext"]>>;

    /**
     * Removes a single step, an array of steps, or steps matching a pattern
     * from the workflow.
     * @param steps - A single step, an array of steps, or a pattern to match step names.
     * @returns A new Workflow instance with the steps removed.
     */
    public removeStep(
        steps: Step<unknown> | readonly Step<unknown>[] | string,
    ) {
        const newBlueprint = WorkflowBuilder.removeStep(this.blueprint, steps);
        return new Workflow(newBlueprint);
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
     * // => Workflow<Context, ...>
     * console.log(workflow.userContext); // => { key: true }
     * @example
     * // 2) Let TypeScript infer the new context type from the passed object:
     * const inferredWorkflow = Workflow.create().setContext({ foo: "bar" });
     * // => Workflow<{ foo: string; }, ...>
     * const updatedWorkflow = inferredWorkflow.setContext({ newField: 42 });
     * // => Workflow<{ newField: number; }, ...>
     * @example
     * // 3) Call setContext with a type parameter, but no context argument:
     * const workflow = Workflow.create().setContext({ key: true });
     * // => Workflow<{ key: boolean; }, ...>
     * const emptyContextWorkflow = workflow.setContext();
     * // => Workflow<object, ...>
     * console.log(emptyContextWorkflow.userContext); // => {}
     */
    public setContext<TNewContext extends object>(
        context?: TNewContext,
    ): Workflow<WorkflowBlueprint<T["steps"], TNewContext>> {
        const newBlueprint = WorkflowBuilder.setContext(
            this.blueprint,
            context,
        );
        return new Workflow(newBlueprint);
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
     * // => Workflow<Merge<Context, newContext>, ...>
     * console.log(workflow.userContext); // => { key: true, newKey: "Hello, world!" }
     * @example
     * // 2) Let TypeScript infer the new context type from the passed object:
     * const inferredWorkflow = Workflow.create().setContext({ foo: "bar" });
     * // => Workflow<{ foo: string; }, ...>
     * const updatedWorkflow = inferredWorkflow.mergeContext({ newField: 42 });
     * // => Workflow<Merge<{ foo: string; }, { newField: number; }>, ...>
     * @example
     * // 3) Call mergeContext with a type parameter, but no context argument:
     * const workflow = Workflow.create().setContext({ key: true });
     * // => Workflow<{ key: boolean; }, ...>
     * type NewContext = { newKey: boolean };
     * const emptyContextWorkflow = workflow.mergeContext<NewContext>();
     * // => Workflow<Merge<{ key: boolean; }, NewContext>, ...>
     * console.log(emptyContextWorkflow.userContext); // => { key: true }
     */
    public mergeContext<TNewContext extends object>(
        context?: TNewContext,
    ): Workflow<
        // eslint-disable-next-line @stylistic/ts/indent
        WorkflowBlueprint<T["steps"], Merge<T["userContext"], TNewContext>>
        // eslint-disable-next-line @stylistic/ts/indent
    > {
        const newBlueprint = WorkflowBuilder.mergeContext(
            this.blueprint,
            context,
        );
        return new Workflow(newBlueprint);
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
    public updateContext(
        context?: Partial<T["userContext"]>,
    ): Workflow<WorkflowBlueprint<T["steps"], T["userContext"]>> {
        const newBlueprint = WorkflowBuilder.updateContext(
            this.blueprint,
            context,
        );
        return new Workflow(newBlueprint);
    }

    /**
     * Executes all steps in the workflow sequentially.
     * The return type is determined by the last step in the workflow.
     * @returns A WorkflowResult with the success status and result,
     * or error info.
     */
    public run(): WorkflowResult<LastStepReturnType<T["steps"]>> {
        const runner = new WorkflowRunner(this.blueprint);
        return runner.run();
    }
}
