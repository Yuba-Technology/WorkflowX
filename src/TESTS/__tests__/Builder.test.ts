/*
 * This file tests the `WorkflowBuilder` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { WorkflowBuilder, WorkflowBlueprint } from "../..";

describe("WorkflowBuilder", () => {
    describe("createBlueprint()", () => {
        it("should create an empty blueprint", () => {
            const blueprint = WorkflowBuilder.createBlueprint();

            const { steps } = blueprint;
            expect(steps).toEqual([]);

            const { userContext } = blueprint;
            expect(userContext).toEqual({});
        });
    });

    describe("findMatchingStepIndices()", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder = WorkflowBuilder as any;

        it("should return correct indices for a wildcard pattern", () => {
            const blueprint = {
                steps: [
                    { name: "env/install-python" },
                    { name: "env/install-node" },
                    { name: "checkout" },
                    { name: "process" },
                ],
            };
            const indices = builder.findMatchingStepIndices(
                blueprint,
                "env/*",
            );
            expect(indices).toEqual([0, 1]);
        });

        it("should return correct index for an exact match", () => {
            const blueprint = {
                steps: [
                    { name: "env/install-python" },
                    { name: "env/install-node" },
                    { name: "checkout" },
                    { name: "process" },
                ],
            };
            const indices = builder.findMatchingStepIndices(
                blueprint,
                "process",
            );
            expect(indices).toEqual([3]);
        });

        it("should return an empty array when no step names match the pattern", () => {
            const blueprint = {
                steps: [
                    { name: "build" },
                    { name: "test" },
                    { name: "deploy" },
                ],
            };
            const indices = builder.findMatchingStepIndices(
                blueprint,
                "env/*",
            );
            expect(indices).toEqual([]);
        });

        it("should ignore steps without a name property", () => {
            const blueprint = {
                steps: [
                    { run: () => 1 },
                    { name: "env/setup" },
                    { run: () => 2 },
                    { name: "env/configure" },
                ],
            };
            const indices = builder.findMatchingStepIndices(
                blueprint,
                "env/*",
            );
            expect(indices).toEqual([1, 3]);
        });

        it("should match all steps when using a universal wildcard pattern", () => {
            const blueprint = {
                steps: [
                    { name: "step1" },
                    { name: "step2" },
                    { name: "step3" },
                ],
            };
            const indices = builder.findMatchingStepIndices(blueprint, "*");
            expect(indices).toEqual([0, 1, 2]);
        });
    });

    describe("processOption()", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder = WorkflowBuilder as any;

        it("should return null when option is undefined", () => {
            const blueprint = { steps: [] };

            const result = builder.processOption(
                blueprint,
                undefined,
                "before",
            );
            expect(result).toBeNull();
        });

        it("should return an array with an object when option is a number", () => {
            const blueprint = { steps: [] };

            const resultBefore = builder.processOption(blueprint, 1, "before");
            expect(resultBefore).toEqual([{ index: 1, pos: "before" }]);

            const resultAfter = builder.processOption(blueprint, 2, "after");
            expect(resultAfter).toEqual([{ index: 2, pos: "after" }]);
        });

        it("should return matching step indices when option is a string", () => {
            const blueprint = {
                steps: [
                    { name: "env/install-python" },
                    { name: "env/install-node" },
                    { name: "checkout" },
                ],
            };

            // "env/*" should match first two steps (indices 0 and 1).
            const result = builder.processOption(blueprint, "env/*", "after");
            expect(result).toEqual([
                { index: 0, pos: "after" },
                { index: 1, pos: "after" },
            ]);
        });

        it("should return an empty array when no steps match the string pattern", () => {
            const blueprint = {
                steps: [{ name: "checkout" }, { name: "process" }],
            };

            const result = builder.processOption(blueprint, "env/*", "before");
            expect(result).toEqual([]);
        });
    });

    describe("calcInsertIndex()", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const builder = WorkflowBuilder as any;

        it("should return default insertion at the end when options is undefined", () => {
            // Empty blueprint, so insertion index should be 0 with pos "after"
            const blueprint = { steps: [] };
            const indices = builder.calcInsertIndex(blueprint);
            expect(indices).toEqual([{ index: 0, pos: "after" }]);

            // Now with some steps injected.
            const blueprint2 = {
                steps: [{ name: "step1" }, { name: "step2" }],
            };
            const indices2 = builder.calcInsertIndex(blueprint2);
            expect(indices2).toEqual([{ index: 2, pos: "after" }]);
        });

        it("should process numeric option for before and after", () => {
            // Test with numeric before option.
            const blueprint = { steps: [] };

            const beforeOption = builder.calcInsertIndex(blueprint, {
                before: 1,
            });
            expect(beforeOption).toEqual([{ index: 1, pos: "before" }]);

            // Test with numeric after option.
            const afterOption = builder.calcInsertIndex(blueprint, {
                after: 2,
            });
            expect(afterOption).toEqual([{ index: 2, pos: "after" }]);
        });

        it("should return matching indices for string option", () => {
            const blueprint = {
                steps: [
                    { name: "env/install-python" },
                    { name: "env/install-node" },
                    { name: "checkout" },
                ],
            };

            // Using a before option with string: should match indices 0 and 1.
            const result = builder.calcInsertIndex(blueprint, {
                before: "env/*",
            });
            expect(result).toEqual([
                { index: 0, pos: "before" },
                { index: 1, pos: "before" },
            ]);
        });

        it("should combine before and after options and sort correctly", () => {
            const blueprint = {
                steps: [
                    { name: "step0" },
                    { name: "checkout" },
                    { name: "process" },
                ],
            };

            // None-same index options.
            // Should be sorted in order of index.
            const result = builder.calcInsertIndex(blueprint, {
                before: 0,
                after: "checkout",
            });
            expect(result).toEqual([
                { index: 0, pos: "before" },
                { index: 1, pos: "after" },
            ]);

            // Same index options.
            // `before` should be sorted before `after`.
            const result2 = builder.calcInsertIndex(blueprint, {
                before: "checkout",
                after: "checkout",
            });
            expect(result2).toEqual([
                { index: 1, pos: "before" },
                { index: 1, pos: "after" },
            ]);
        });

        it("should only return the first matched index when multi is false", () => {
            const blueprint = {
                steps: [
                    { name: "env/install-python" },
                    { name: "env/install-node" },
                    { name: "env/setup" },
                ],
            };

            // With multi false, should only return the first match.
            const result = builder.calcInsertIndex(blueprint, {
                before: "env/*",
                multi: false,
            });
            expect(result).toEqual([{ index: 0, pos: "before" }]);
        });

        it("should return a limited number of matches when multi is a number", () => {
            const blueprint = {
                steps: [
                    { name: "env/install-python" },
                    { name: "env/install-node" },
                    { name: "env/setup" },
                ],
            };

            // When multi > 0, should return that many matches.
            const result = builder.calcInsertIndex(blueprint, {
                after: "env/*",
                multi: 2,
            });
            expect(result).toEqual([
                { index: 0, pos: "after" },
                { index: 1, pos: "after" },
            ]);

            // When multi < 0, should return that many matches from the end.
            const result2 = builder.calcInsertIndex(blueprint, {
                after: "env/*",
                multi: -2,
            });
            expect(result2).toEqual([
                { index: 1, pos: "after" },
                { index: 2, pos: "after" },
            ]);

            // When multi is greater than the number of matches, should return all matches.
            const result3 = builder.calcInsertIndex(blueprint, {
                after: "env/*",
                multi: 5,
            });
            expect(result3).toEqual([
                { index: 0, pos: "after" },
                { index: 1, pos: "after" },
                { index: 2, pos: "after" },
            ]);

            // When multi is zero, should return an empty array.
            const result4 = builder.calcInsertIndex(blueprint, {
                after: "env/*",
                multi: 0,
            });
            expect(result4).toEqual([]);
        });
    });

    describe("pushStep()", () => {
        it("should add steps to the end of the blueprint", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1],
            );
            const finalBlueprint = WorkflowBuilder.pushStep(
                blueprintWithSteps,
                [step2],
            );

            const { steps } = finalBlueprint;
            expect(steps).toEqual([step1, step2]);
        });
    });

    describe("unshiftStep()", () => {
        it("should add steps to the beginning of the blueprint", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithStep1 = WorkflowBuilder.unshiftStep(
                initialBlueprint,
                [step1],
            );
            const finalBlueprint = WorkflowBuilder.unshiftStep(
                blueprintWithStep1,
                [step2],
            );

            const { steps } = finalBlueprint;
            expect(steps).toEqual([step2, step1]);
        });
    });

    describe("addStep()", () => {
        it("should add steps defaulting to the end of the blueprint", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithStep1 = WorkflowBuilder.addStep(
                initialBlueprint,
                [step1, step1],
            );
            const finalBlueprint = WorkflowBuilder.addStep(
                blueprintWithStep1,
                [step2, step2],
            );

            const { steps } = finalBlueprint;
            expect(steps).toEqual([step1, step1, step2, step2]);
        });

        it("should add step before/after specified index", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const step3 = { run: () => "third" };
            const step4 = { run: () => "fourth" };

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithStep1 = WorkflowBuilder.addStep(
                initialBlueprint,
                [step1],
            );
            const blueprintWithStep2 = WorkflowBuilder.addStep(
                blueprintWithStep1,
                [step2],
            );
            const blueprintWithStep3 = WorkflowBuilder.addStep(
                blueprintWithStep2,
                [step3],
                { before: 1 },
            );
            const finalBlueprint = WorkflowBuilder.addStep(
                blueprintWithStep3,
                [step4],
                { after: 1 },
            );

            const { steps } = finalBlueprint;
            expect(steps).toEqual([step1, step3, step4, step2]);
        });

        it("should add step before/after specified step name", () => {
            const step1 = { name: "first", run: () => "first" };
            const step2 = { name: "second", run: () => "second" };
            const step3 = { name: "third", run: () => "third" };
            const step4 = { name: "fourth", run: () => "fourth" };

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithStep1 = WorkflowBuilder.addStep(
                initialBlueprint,
                [step1],
            );
            const blueprintWithStep2 = WorkflowBuilder.addStep(
                blueprintWithStep1,
                [step2],
            );
            const blueprintWithStep3 = WorkflowBuilder.addStep(
                blueprintWithStep2,
                [step3],
                { before: "second" },
            );
            const finalBlueprint = WorkflowBuilder.addStep(
                blueprintWithStep3,
                [step4],
                { after: "second" },
            );

            const { steps } = finalBlueprint;
            expect(steps).toEqual([step1, step3, step2, step4]);
        });

        it("should add step before/after mutiple steps", () => {
            const step1 = { name: "env/install-python", run: () => "first" };
            const step2 = { name: "env/install-node", run: () => "second" };
            const step3 = { name: "checkout", run: () => "third" };
            const step4 = { name: "process", run: () => "fourth" };

            // Default multi is true.
            {
                const initialBlueprint = WorkflowBuilder.createBlueprint();
                const blueprintWithStep1 = WorkflowBuilder.addStep(
                    initialBlueprint,
                    [step1],
                );
                const blueprintWithStep2 = WorkflowBuilder.addStep(
                    blueprintWithStep1,
                    [step2],
                );
                // Default multi is true, so this will insert before both steps.
                const blueprintWithStep3 = WorkflowBuilder.addStep(
                    blueprintWithStep2,
                    [step3],
                    { before: "env/*" },
                );
                const finalBlueprint = WorkflowBuilder.addStep(
                    blueprintWithStep3,
                    [step4],
                    { after: "env/*" },
                );

                const { steps } = finalBlueprint;
                expect(steps).toEqual([
                    step3,
                    step1,
                    step4,
                    step3,
                    step2,
                    step4,
                ]);
            }

            // Test with multi false.
            {
                const initialBlueprint = WorkflowBuilder.createBlueprint();
                const blueprintWithStep1 = WorkflowBuilder.addStep(
                    initialBlueprint,
                    [step1],
                );
                const blueprintWithStep2 = WorkflowBuilder.addStep(
                    blueprintWithStep1,
                    [step2],
                );
                const blueprintWithStep3 = WorkflowBuilder.addStep(
                    blueprintWithStep2,
                    [step3],
                    { before: "env/*", multi: false },
                );
                const finalBlueprint = WorkflowBuilder.addStep(
                    blueprintWithStep3,
                    [step4],
                    { after: "env/*", multi: false },
                );

                const { steps } = finalBlueprint;
                expect(steps).toEqual([step3, step1, step4, step2]);
            }

            // Test with multi 1.
            {
                const initialBlueprint = WorkflowBuilder.createBlueprint();
                const blueprintWithStep1 = WorkflowBuilder.addStep(
                    initialBlueprint,
                    [step1],
                );
                const blueprintWithStep2 = WorkflowBuilder.addStep(
                    blueprintWithStep1,
                    [step2],
                );
                const blueprintWithStep3 = WorkflowBuilder.addStep(
                    blueprintWithStep2,
                    [step3],
                    { before: "env/*", multi: 1 },
                );
                const finalBlueprint = WorkflowBuilder.addStep(
                    blueprintWithStep3,
                    [step4],
                    { after: "env/*", multi: 1 },
                );

                const { steps } = finalBlueprint;
                expect(steps).toEqual([step3, step1, step4, step2]);
            }

            // Test with multi -1.
            {
                const initialBlueprint = WorkflowBuilder.createBlueprint();
                const blueprintWithStep1 = WorkflowBuilder.addStep(
                    initialBlueprint,
                    [step1],
                );
                const blueprintWithStep2 = WorkflowBuilder.addStep(
                    blueprintWithStep1,
                    [step2],
                );
                const blueprintWithStep3 = WorkflowBuilder.addStep(
                    blueprintWithStep2,
                    [step3],
                    { before: "env/*", multi: -1 },
                );
                const finalBlueprint = WorkflowBuilder.addStep(
                    blueprintWithStep3,
                    [step4],
                    { after: "env/*", multi: -1 },
                );

                const { steps } = finalBlueprint;
                expect(steps).toEqual([step1, step3, step2, step4]);
            }
        });

        it("should do nothing when matching indices are empty or matched nothing", () => {
            const step1 = { name: "env/install-python", run: () => "first" };
            const step2 = { name: "env/install-node", run: () => "second" };
            const step3 = { name: "checkout", run: () => "third" };
            const step4 = { name: "process", run: () => "fourth" };

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithStep1 = WorkflowBuilder.addStep(
                initialBlueprint,
                [step1],
            );
            const blueprintWithStep2 = WorkflowBuilder.addStep(
                blueprintWithStep1,
                [step2],
            );
            const blueprintWithStep3 = WorkflowBuilder.addStep(
                blueprintWithStep2,
                [step3],
                { before: "env/setup" },
            );
            const finalBlueprint = WorkflowBuilder.addStep(
                blueprintWithStep3,
                [step4],
                { after: "" },
            );

            const { steps } = finalBlueprint;
            expect(steps).toEqual([step1, step2]);
        });
    });

    describe("clearSteps", () => {
        it("should remove all steps from the blueprint", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const finalBlueprint =
                WorkflowBuilder.clearSteps(blueprintWithSteps);

            expect(finalBlueprint.steps).toEqual([]);
        });
    });

    describe("popStep()", () => {
        it("should remove steps from the end of the blueprint", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const step3 = { run: () => true };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2, step3],
            );
            const finalBlueprint = WorkflowBuilder.popStep(
                blueprintWithSteps,
                2,
            );
            expect(finalBlueprint.steps).toEqual([step1]);
        });

        it("should do nothing when the blueprint is empty", () => {
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const finalBlueprint = WorkflowBuilder.popStep(
                initialBlueprint,
                1,
            );
            expect(finalBlueprint.steps).toEqual([]);
        });

        it("should remove all steps when n is greater than the number of steps", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const finalBlueprint = WorkflowBuilder.popStep(
                blueprintWithSteps,
                3,
            );
            expect(finalBlueprint.steps).toEqual([]);
        });
    });

    describe("shiftStep()", () => {
        it("should remove steps from the start of the blueprint", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const finalBlueprint = WorkflowBuilder.shiftStep(
                blueprintWithSteps,
                1,
            );

            expect(finalBlueprint.steps).toEqual([step2]);
        });

        it("should do nothing when the blueprint is empty", () => {
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const finalBlueprint = WorkflowBuilder.shiftStep(
                initialBlueprint,
                1,
            );
            expect(finalBlueprint.steps).toEqual([]);
        });

        it("should remove all steps when n is greater than the number of steps", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const finalBlueprint = WorkflowBuilder.shiftStep(
                blueprintWithSteps,
                3,
            );
            expect(finalBlueprint.steps).toEqual([]);
        });
    });

    describe("removeStep()", () => {
        it("should remove a single step", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const blueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(blueprint, [
                step1,
                step2,
            ]);
            const newBlueprint = WorkflowBuilder.removeStep(
                blueprintWithSteps,
                [step1],
            );
            expect(newBlueprint.steps).toEqual([step2]);
        });

        it("should remove an array of steps", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const step3 = { name: "step3", run: () => 3 };

            const blueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(blueprint, [
                step1,
                step2,
                step3,
            ]);
            const newBlueprint = WorkflowBuilder.removeStep(
                blueprintWithSteps,
                [step1, step3],
            );
            expect(newBlueprint.steps).toEqual([step2]);
        });

        it("should remove steps matching a string pattern", () => {
            const step1 = { name: "test-1", run: () => 1 };
            const step2 = { name: "build", run: () => 2 };
            const step3 = { name: "test-2", run: () => 3 };

            const blueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(blueprint, [
                step1,
                step2,
                step3,
            ]);
            const newBlueprint = WorkflowBuilder.removeStep(
                blueprintWithSteps,
                "test-*",
            );
            expect(newBlueprint.steps).toEqual([step2]);
        });
    });

    describe("setContext()", () => {
        /**
         * Type safety is tested in the type tests.
         * @see {@link ../__typetests__/Builder.test-d.ts}
         */
        it("should return a new blueprint with the given context", () => {
            const context = { a: 1 };

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.setContext(
                initialBlueprint,
                context,
            );

            expect(blueprintWithContext).toBeInstanceOf(WorkflowBlueprint);
        });

        it("should replace the existing context with the given context", () => {
            // Properties having the same name with the default context
            // should be ignored.
            const context = { a: 1 };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.setContext(
                initialBlueprint,
                context,
            );

            const expectedContext = {
                a: 1,
            };
            expect(blueprintWithContext.userContext).toEqual(expectedContext);

            const newContext = { b: 2 };
            const newBlueprint = WorkflowBuilder.setContext(
                blueprintWithContext,
                newContext,
            );

            const expectedNewContext = {
                // The old context properties should be deleted.
                // No { a: 1 } here.
                b: 2,
            };
            expect(newBlueprint.userContext).toEqual(expectedNewContext);
        });
    });

    describe("mergeContext()", () => {
        /**
         * Type safety is tested in the type tests.
         * @see {@link ../__typetests__/Builder.test-d.ts}
         */
        it("should return a new blueprint with the given context", () => {
            const context = { a: 1 };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.setContext(
                initialBlueprint,
                context,
            );

            expect(blueprintWithContext).toBeInstanceOf(WorkflowBlueprint);
        });

        it("should merge the given context with the existing context", () => {
            const context = { a: 1 };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.setContext(
                initialBlueprint,
                context,
            );

            const newContext = { b: 2, a: "replaced" };
            const newBlueprint = WorkflowBuilder.mergeContext(
                blueprintWithContext,
                newContext,
            );

            const expectedContext = {
                a: "replaced",
                b: 2,
            };

            expect(newBlueprint.userContext).toEqual(expectedContext);
        });
    });

    describe("updateContext()", () => {
        it("should update the existing context with the given context", () => {
            const context = { a: 1 };
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.setContext(
                initialBlueprint,
                context,
            );

            const newContext = { a: 2 };
            const newBlueprint = WorkflowBuilder.updateContext(
                blueprintWithContext,
                newContext,
            );

            const expectedContext = {
                a: 2,
            };

            expect(newBlueprint.userContext).toEqual(expectedContext);
        });
    });
});
