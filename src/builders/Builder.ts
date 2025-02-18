/*
 * This file implements the WorkflowBuilder class, which provides a set of
 * static methods for building and modifying workflows.
 *
 * The WorkflowBuilder class is a utility class that provides a set of static
 * methods for building and modifying workflows. It is used to create and
 * manipulate workflow blueprints, which are used to define the steps and
 * context of a workflow.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { minimatch } from "minimatch";
import type { Step, StepInsertOptions } from "@/types";
import { WorkflowBlueprint } from "@/blueprints";
import { Merge } from "@/utils/types";

/**
 * Utility type for a generic workflow blueprint.
 * Just a shorthand for a workflow blueprint with unknown steps and context,
 * and only used for type checking in the builder.
 */
type GenericBlueprint = WorkflowBlueprint<void, object>;

/**
 * The WorkflowBuilder class provides a set of static methods for building
 * and modifying workflows.
 */
export class WorkflowBuilder {
    /**
     * Creates an empty WorkflowBlueprint with given steps and context.
     * @returns A new WorkflowBlueprint instance.
     * @example
     * const blueprint = WorkflowBuilder.createBlueprint();
     * // => WorkflowBlueprint<void, object>
     */
    public static createBlueprint<
        TReturnType = void,
        TUserContext extends object = object,
    >(
        steps?: Step[],
        conclude?: Step<TReturnType>,
        context?: TUserContext,
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        steps ||= [];
        conclude ||= { run() {} } as unknown as Step<TReturnType>;
        context ||= {} as TUserContext;
        return new WorkflowBlueprint(steps, conclude, context);
    }

    /**
     * Returns indices of steps matching the pattern.
     * @param test - Pattern to match step names.
     * @returns Array of matching step indices.
     * @private
     * @example
     * // Given steps: [ { name: 'test-1' }, { name: 'test-2' }, { name: 'test-3' } ]
     * const blueprint = WorkflowBuilder.createBlueprint(steps);
     * const indices = WorkflowBuilder.findMatchingStepIndices(
     *     blueprint,
     *     'test-*'
     * );
     * // => [0, 1, 2]
     */
    private static findMatchingStepIndices(
        blueprint: GenericBlueprint,
        test: string,
    ): number[] {
        return blueprint.steps
            .map((step, index) =>
                step.name && minimatch(step.name, test) ? index : -1,
            )
            .filter((index) => index !== -1);
    }

    /**
     * Converts an insertion option into concrete insertion points.
     * - If the option is a `number`, it is used as the array index.
     * - If the option is a `string`, it is matched against step names.
     * - If the option is `undefined`, it is ignored, and no insertion is done.
     * @param option - Option value to process.
     * @param pos - Position to insert the step.
     * @returns Array with index and position info, or `null`.
     * @private
     */
    private static processOption(
        blueprint: GenericBlueprint,
        option: number | string | undefined,
        pos: "before" | "after",
    ) {
        switch (typeof option) {
            case "undefined": {
                return null;
            }

            case "number": {
                return [{ index: option, pos }];
            }

            case "string": {
                return WorkflowBuilder.findMatchingStepIndices(
                    blueprint,
                    option,
                ).map((i) => ({
                    index: i,
                    pos,
                }));
            }

            // Make sure all cases are handled.
            /* istanbul ignore next */
            default: {
                const _exhaustiveCheck: never = option;
                throw new Error(`Invalid option: ${_exhaustiveCheck}`);
            }
        }
    }

    /**
     * Provides the default insertion point at the end of the workflow.
     * @returns Array with a point after the last step.
     * @private
     */
    private static defaultInsertIndex(blueprint: GenericBlueprint): {
        index: number;
        pos: "before" | "after";
    }[] {
        return [
            {
                index: blueprint.steps.length,
                pos: "after",
            },
        ];
    }

    /**
     * Merges and sorts insertion points from "before" and "after" options.
     * @param options - Insertion options.
     * @returns Sorted list of insertion points.
     * @private
     */
    private static getSortedIndices(
        blueprint: GenericBlueprint,
        options: StepInsertOptions,
    ): { index: number; pos: "before" | "after" }[] {
        // Get all indices from "before" and "after" options, and merge them.
        const { before, after } = options;
        const indices: { index: number; pos: "before" | "after" }[] = [
            ...(WorkflowBuilder.processOption(blueprint, before, "before") ||
                []),
            ...(WorkflowBuilder.processOption(blueprint, after, "after") ||
                []),
        ];

        // Sorted by: 1. index, 2. position ("before" comes first)
        indices.sort((a, b) => {
            if (a.index !== b.index) {
                return a.index - b.index;
            }

            // Make sure all cases are handled.
            /* istanbul ignore next */
            return a.pos === "before" ? -1 : 1;
        });

        return indices;
    }

    /**
     * Filters insertion points based on the `multi` option.
     * - If `multi` is undefined, all indices are returned.
     * - If `multi` is a boolean:
     *   - If `multi` is true, all indices are returned.
     *   - If `multi` is false, only the first index is returned.
     * - If `multi` is a number, the specified number of indices are returned:
     *   - If the number is positive, the first n indices are returned.
     *   - If the number is negative, the last n indices are returned.
     * @param indices - Sorted insertion points.
     * @param multi - Controls multiple insertions.
     * @returns Array of objects containing the index and position
     */
    private static handleMultiOption(
        indices: { index: number; pos: "before" | "after" }[],
        multi: boolean | number | undefined,
    ): { index: number; pos: "before" | "after" }[] {
        if (multi === true || multi === undefined) {
            return indices;
        }

        if (multi === false) {
            return indices.slice(0, 1);
        }

        if (typeof multi === "number") {
            return multi > 0
                ? indices.slice(0, multi)
                : indices.slice(Math.max(indices.length + multi, 0));
        }

        // Make sure all cases are handled.
        /* istanbul ignore next */
        const _exhaustiveCheck: never = multi;
        /* istanbul ignore next */
        throw new Error(`Invalid multi option: ${_exhaustiveCheck}`);
    }

    /**
     * Computes the final insertion points based on provided options.
     * @param options - Insertion options.
     * @returns List of insertion index and position objects.
     * @private
     */
    private static calcInsertIndex(
        blueprint: GenericBlueprint,
        options: StepInsertOptions,
    ) {
        // If no options are provided, insert at the end of the workflow by default.
        if (!options || Object.keys(options).length === 0) {
            return WorkflowBuilder.defaultInsertIndex(blueprint);
        }

        // Else, calculate the index to insert the step based on the options.
        const indices = WorkflowBuilder.getSortedIndices(blueprint, options);

        // Finally filter the indices based on the `multi` option.
        return WorkflowBuilder.handleMultiOption(indices, options.multi);
    }

    /**
     * Pushes steps to the end of the workflow blueprint.
     * @param blueprint The blueprint to push the steps to
     * @param steps The steps to push
     * @returns A new blueprint with the steps pushed
     */
    public static pushStep<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        steps: Step<unknown>[],
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        blueprint.steps.push(...steps);
        return blueprint;
    }

    /**
     * Unshifts steps to the beginning of the workflow blueprint.
     * @param blueprint The blueprint to unshift the steps to
     * @param steps The steps to unshift
     * @returns A new blueprint with the steps unshifted
     */
    public static unshiftStep<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        steps: Step<unknown>[],
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        blueprint.steps.unshift(...steps);
        return blueprint;
    }

    /**
     * Adds steps to the workflow blueprint at the specified index.
     * @param blueprint The blueprint to add the steps to
     * @param steps The steps to add
     * @param options The options for adding the steps
     * @returns A new blueprint with the steps added
     */
    public static addStep<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        steps: Step<unknown>[],
        options: StepInsertOptions = {},
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        // Reverse the order of insert index array, so that we can insert the steps
        // from the last index to the first index, to keep the order of the steps array
        const insertIndex = WorkflowBuilder.calcInsertIndex(
            blueprint,
            options,
        )?.reverse();
        const newSteps: Step<unknown>[] = [...blueprint.steps];

        for (const { index, pos } of insertIndex) {
            switch (pos) {
                case "before": {
                    newSteps.splice(index, 0, ...steps);
                    break;
                }

                case "after": {
                    newSteps.splice(index + 1, 0, ...steps);
                    break;
                }

                // Make sure all cases are handled.
                /* istanbul ignore next */
                default: {
                    const _exhaustiveCheck: never = pos;
                    throw new Error(`Invalid position: ${_exhaustiveCheck}`);
                }
            }
        }

        blueprint.steps = newSteps;
        return blueprint;
    }

    /**
     * Clears all steps from the workflow blueprint.
     * @param blueprint The blueprint to clear the steps from
     * @returns A new blueprint with the steps cleared
     */
    public static clearSteps<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        blueprint.steps = [];
        return blueprint;
    }

    /**
     * Pops the last N steps from the workflow blueprint.
     * @param blueprint The blueprint to pop the steps from
     * @param n The number of steps to pop
     * @returns A new blueprint with the steps popped
     */
    public static popStep<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        n: number = 1,
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        const newSteps = blueprint.steps.slice(
            0,
            Math.max(0, blueprint.steps.length - n),
        );
        blueprint.steps = newSteps;
        return blueprint;
    }

    /**
     * Shifts the first N steps from the workflow blueprint.
     * @param blueprint The blueprint to shift the steps from
     * @param n The number of steps to shift
     * @returns A new blueprint with the steps shifted
     */
    public static shiftStep<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        n: number = 1,
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        const newSteps = blueprint.steps.slice(n);
        blueprint.steps = newSteps;
        return blueprint;
    }

    /**
     * Removes steps from the workflow blueprint.
     * @param blueprint The blueprint to remove the steps from
     * @param steps The steps to remove
     * @returns A new blueprint with the steps removed
     */
    public static removeStep<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        steps: Step<unknown>[] | string,
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        let testFn: (step: Step<unknown>) => boolean;

        if (typeof steps === "string") {
            // If a string is provided, treat it as a minimatch pattern on the step's name.
            testFn = (step) => {
                // Only remove the step if it has a name and the pattern matches.
                return step.name !== undefined && minimatch(step.name, steps);
            };
        } else if (Array.isArray(steps)) {
            // If an array is provided, remove steps that are strictly equal.
            testFn = (step) => steps.includes(step);
        } else {
            // Make sure all cases are handled.
            /* istanbul ignore next */
            const _exhaustiveCheck: never = steps;
            /* istanbul ignore next */
            throw new Error(`Invalid steps: ${_exhaustiveCheck}`);
        }

        // Filter out steps that match the test.
        const newSteps = blueprint.steps.filter((step) => !testFn(step));
        blueprint.steps = newSteps;
        return blueprint;
    }

    /**
     * Sets the conclude of the workflow blueprint.
     * @param blueprint The blueprint to set the conclude of
     * @param conclude The conclude to set
     * @returns A new blueprint with the conclude set
     */
    public static setConclude<TNewReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<unknown, TUserContext>,
        conclude: Step<TNewReturnType>,
    ): WorkflowBlueprint<TNewReturnType, TUserContext> {
        blueprint.conclude = conclude;
        return blueprint as unknown as WorkflowBlueprint<
            TNewReturnType,
            TUserContext
        >;
    }

    /**
     * Sets the context of the workflow blueprint.
     * @param blueprint The blueprint to set the context of
     * @param context The context to set
     * @returns A new blueprint with the context set
     */
    public static setContext<TReturnType, TNewContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, object>,
        context?: TNewContext,
    ): WorkflowBlueprint<TReturnType, TNewContext> {
        const safeContext = context || ({} as TNewContext);
        blueprint.userContext = safeContext;
        return blueprint as unknown as WorkflowBlueprint<
            TReturnType,
            TNewContext
        >;
    }

    /**
     * Merges the context of the workflow blueprint with the provided context.
     * @param blueprint The blueprint to merge the context of
     * @param context The context to merge
     * @returns A new blueprint with the context merged
     */
    public static mergeContext<
        TReturnType,
        TOldContext extends object,
        TNewContext extends object,
    >(
        blueprint: WorkflowBlueprint<TReturnType, TOldContext>,
        context?: TNewContext,
    ): WorkflowBlueprint<TReturnType, Merge<TOldContext, TNewContext>> {
        const newContext = {
            ...blueprint.userContext,
            ...context,
        };
        blueprint.userContext = newContext;

        return blueprint as unknown as WorkflowBlueprint<
            TReturnType,
            Merge<TOldContext, TNewContext>
        >;
    }

    /**
     * Updates the context of the workflow blueprint with the provided context.
     * @param blueprint The blueprint to update the context of
     * @param context The context to update
     * @returns A new blueprint with the context updated
     */
    public static updateContext<TReturnType, TUserContext extends object>(
        blueprint: WorkflowBlueprint<TReturnType, TUserContext>,
        context: Partial<TUserContext>,
    ): WorkflowBlueprint<TReturnType, TUserContext> {
        blueprint.userContext = {
            ...blueprint.userContext,
            ...context,
        };
        return blueprint;
    }
}
