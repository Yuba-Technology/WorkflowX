/*
 * This file tests the `Workflow` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { Workflow } from "../..";
import { RuntimeContext } from "../../types";

describe("Workflow", () => {
    describe("create()", () => {
        it("should create an empty workflow", () => {
            const workflow = Workflow.create();
            const { steps } = workflow;
            expect(steps).toEqual([]);
        });
    });

    describe("findMatchingStepIndices()", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let workflow: any;
        beforeEach(() => {
            // Create a new workflow instance using Workflow.create()
            // before each test.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            workflow = (Workflow as any).create();
        });

        it("should return correct indices for a wildcard pattern", () => {
            workflow.steps = [
                { name: "env/install-python" },
                { name: "env/install-node" },
                { name: "checkout" },
                { name: "process" },
            ];
            const indices = workflow.findMatchingStepIndices("env/*");
            expect(indices).toEqual([0, 1]);
        });

        it("should return correct index for an exact match", () => {
            workflow.steps = [
                { name: "env/install-python" },
                { name: "env/install-node" },
                { name: "checkout" },
                { name: "process" },
            ];
            const indices = workflow.findMatchingStepIndices("process");
            expect(indices).toEqual([3]);
        });

        it("should return an empty array when no step names match the pattern", () => {
            workflow.steps = [
                { name: "build" },
                { name: "test" },
                { name: "deploy" },
            ];
            const indices = workflow.findMatchingStepIndices("env/*");
            expect(indices).toEqual([]);
        });

        it("should ignore steps without a name property", () => {
            workflow.steps = [
                { run: () => 1 },
                { name: "env/setup" },
                { run: () => 2 },
                { name: "env/configure" },
            ];
            const indices = workflow.findMatchingStepIndices("env/*");
            expect(indices).toEqual([1, 3]);
        });

        it("should match all steps when using a universal wildcard pattern", () => {
            workflow.steps = [
                { name: "step1" },
                { name: "step2" },
                { name: "step3" },
            ];
            const indices = workflow.findMatchingStepIndices("*");
            expect(indices).toEqual([0, 1, 2]);
        });
    });

    describe("processOption()", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let workflow: any;

        beforeEach(() => {
            // Create a new workflow instance before each test.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            workflow = (Workflow as any).create();
        });

        it("should return null when option is undefined", () => {
            const result = workflow.processOption(undefined, "before");
            expect(result).toBeNull();
        });

        it("should return an array with an object when option is a number", () => {
            const resultBefore = workflow.processOption(1, "before");
            expect(resultBefore).toEqual([{ index: 1, pos: "before" }]);

            const resultAfter = workflow.processOption(2, "after");
            expect(resultAfter).toEqual([{ index: 2, pos: "after" }]);
        });

        it("should return matching step indices when option is a string", () => {
            // Set up steps with names.
            workflow.steps = [
                { name: "env/install-python" },
                { name: "env/install-node" },
                { name: "checkout" },
            ];

            // "env/*" should match first two steps (indices 0 and 1).
            const result = workflow.processOption("env/*", "after");
            expect(result).toEqual([
                { index: 0, pos: "after" },
                { index: 1, pos: "after" },
            ]);
        });

        it("should return an empty array when no steps match the string pattern", () => {
            workflow.steps = [{ name: "checkout" }, { name: "process" }];

            const result = workflow.processOption("env/*", "before");
            expect(result).toEqual([]);
        });
    });

    describe("calcInsertIndex()", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let workflow: any;
        beforeEach(() => {
            // Create a new workflow instance (using Workflow.create())
            // before each test.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            workflow = (Workflow as any).create();
        });

        it("should return default insertion at the end when options is undefined", () => {
            // Empty workflow, so insertion index should be 0 with pos "after"
            const indices = workflow.calcInsertIndex();
            expect(indices).toEqual([{ index: 0, pos: "after" }]);

            // Now with some steps injected.
            workflow.steps = [{ name: "step1" }, { name: "step2" }];
            const indices2 = workflow.calcInsertIndex();
            expect(indices2).toEqual([{ index: 2, pos: "after" }]);
        });

        it("should process numeric option for before and after", () => {
            // Test with numeric before option.
            const beforeOption = workflow.calcInsertIndex({ before: 1 });
            expect(beforeOption).toEqual([{ index: 1, pos: "before" }]);

            // Test with numeric after option.
            const afterOption = workflow.calcInsertIndex({ after: 2 });
            expect(afterOption).toEqual([{ index: 2, pos: "after" }]);
        });

        it("should return matching indices for string option", () => {
            // Set up steps with names.
            workflow.steps = [
                { name: "env/install-python" },
                { name: "env/install-node" },
                { name: "checkout" },
            ];
            // Using a before option with string: should match indices 0 and 1.
            const result = workflow.calcInsertIndex({ before: "env/*" });
            expect(result).toEqual([
                { index: 0, pos: "before" },
                { index: 1, pos: "before" },
            ]);
        });

        it("should combine before and after options and sort correctly", () => {
            // Set up steps with names.
            workflow.steps = [
                { name: "step0" },
                { name: "checkout" },
                { name: "process" },
            ];

            // None-same index options.
            // Should be sorted in order of index.
            const result = workflow.calcInsertIndex({
                before: 0,
                after: "checkout",
            });
            expect(result).toEqual([
                { index: 0, pos: "before" },
                { index: 1, pos: "after" },
            ]);

            // Same index options.
            // `before` should be sorted before `after`.
            const result2 = workflow.calcInsertIndex({
                before: "checkout",
                after: "checkout",
            });
            expect(result2).toEqual([
                { index: 1, pos: "before" },
                { index: 1, pos: "after" },
            ]);
        });

        it("should only return the first matched index when multi is false", () => {
            // Set up steps where string pattern matches multiple steps.
            workflow.steps = [
                { name: "env/install-python" },
                { name: "env/install-node" },
                { name: "env/setup" },
            ];
            // With multi false, should only return the first match.
            const result = workflow.calcInsertIndex({
                before: "env/*",
                multi: false,
            });
            expect(result).toEqual([{ index: 0, pos: "before" }]);
        });

        it("should return a limited number of matches when multi is a number", () => {
            // Set up steps with three matching steps.
            workflow.steps = [
                { name: "env/install-python" },
                { name: "env/install-node" },
                { name: "env/setup" },
            ];

            // When multi > 0, should return that many matches.
            const result = workflow.calcInsertIndex({
                after: "env/*",
                multi: 2,
            });
            expect(result).toEqual([
                { index: 0, pos: "after" },
                { index: 1, pos: "after" },
            ]);

            // When multi < 0, should return that many matches from the end.
            const result2 = workflow.calcInsertIndex({
                after: "env/*",
                multi: -2,
            });
            expect(result2).toEqual([
                { index: 1, pos: "after" },
                { index: 2, pos: "after" },
            ]);

            // When multi is greater than the number of matches, should return all matches.
            const result3 = workflow.calcInsertIndex({
                after: "env/*",
                multi: 5,
            });
            expect(result3).toEqual([
                { index: 0, pos: "after" },
                { index: 1, pos: "after" },
                { index: 2, pos: "after" },
            ]);

            // When multi is zero, should return an empty array.
            const result4 = workflow.calcInsertIndex({
                after: "env/*",
                multi: 0,
            });
            expect(result4).toEqual([]);
        });
    });

    describe("pushStep()", () => {
        it("should add a single step to the end of the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep(step1).pushStep(step2);

            const { steps } = workflow;
            expect(steps).toEqual([step1, step2]);
        });

        it("should add multiple steps to the end of the workflow", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create()
                .pushStep([step1, step1])
                .pushStep([step2, step2]);

            const { steps } = workflow;
            expect(steps).toEqual([step1, step1, step2, step2]);
        });
    });

    describe("unshiftStep()", () => {
        it("should add a single step to the beginning of the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create()
                .unshiftStep(step1)
                .unshiftStep(step2);

            const { steps } = workflow;
            expect(steps).toEqual([step2, step1]);
        });

        it("should add multiple steps to the beginning of the workflow", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create()
                .unshiftStep([step1, step1])
                .unshiftStep([step2, step2]);

            const { steps } = workflow;
            expect(steps).toEqual([step2, step2, step1, step1]);
        });
    });

    describe("addStep()", () => {
        it("should add a single step", () => {
            const step = { run: () => 42 };
            const workflow = Workflow.create().addStep(step);

            const { steps } = workflow;
            expect(steps).toHaveLength(1);
        });

        it("should add multiple steps", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create().addStep([step1, step2]);

            const { steps } = workflow;
            expect(steps).toEqual([step1, step2]);
        });

        it("should add step before/after specified index", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const step3 = { run: () => "third" };
            const step4 = { run: () => "fourth" };
            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: 1 })
                .addStep(step4, { after: 1 });

            const { steps } = workflow;
            expect(steps).toEqual([step1, step3, step4, step2]);
        });

        it("should add step before/after specified step name", () => {
            const step1 = { name: "first", run: () => "first" };
            const step2 = { name: "second", run: () => "second" };
            const step3 = { name: "third", run: () => "third" };
            const step4 = { name: "fourth", run: () => "fourth" };
            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "second" })
                .addStep(step4, { after: "second" });

            const { steps } = workflow;
            expect(steps).toEqual([step1, step3, step2, step4]);
        });

        it("should add step before/after mutiple steps", () => {
            const step1 = { name: "env/install-python", run: () => "first" };
            const step2 = { name: "env/install-node", run: () => "second" };
            const step3 = { name: "checkout", run: () => "third" };
            const step4 = { name: "process", run: () => "fourth" };
            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                // Default multi is true, so this will insert before both steps.
                .addStep(step3, { before: "env/*" })
                .addStep(step4, { after: "env/*" });

            const { steps } = workflow;
            expect(steps).toEqual([step3, step1, step4, step3, step2, step4]);

            // Test with multi false.
            const workflow2 = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/*", multi: false })
                .addStep(step4, { after: "env/*", multi: false });

            const { steps: steps2 } = workflow2;
            expect(steps2).toEqual([step3, step1, step4, step2]);

            // Test with multi 1.
            const workflow3 = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/*", multi: 1 })
                .addStep(step4, { after: "env/*", multi: 1 });

            const { steps: steps3 } = workflow3;
            expect(steps3).toEqual([step3, step1, step4, step2]);

            // Test with multi -1.
            const workflow4 = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/*", multi: -1 })
                .addStep(step4, { after: "env/*", multi: -1 });

            const { steps: steps4 } = workflow4;
            expect(steps4).toEqual([step1, step3, step2, step4]);
        });

        it("should do nothing when matching indices are empty or matched nothing", () => {
            const step1 = { name: "env/install-python", run: () => "first" };
            const step2 = { name: "env/install-node", run: () => "second" };
            const step3 = { name: "checkout", run: () => "third" };
            const step4 = { name: "process", run: () => "fourth" };
            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/setup" })
                .addStep(step4, { after: "" });

            const { steps } = workflow;
            expect(steps).toEqual([step1, step2]);
        });
    });

    describe("popStep()", () => {
        it("should remove the last step from the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.popStep();
            expect(newWorkflow.steps).toEqual([step1]);
        });

        it("should remove multiple steps from the end of the workflow", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create().pushStep([
                step1,
                step1,
                step2,
                step2,
            ]);
            const newWorkflow = workflow.popStep(2);
            expect(newWorkflow.steps).toEqual([step1, step1]);
        });

        it("should do nothing when the workflow is empty", () => {
            const workflow = Workflow.create().popStep();
            expect(workflow.steps).toEqual([]);
        });

        it("should remove all steps when n is greater than the number of steps", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.popStep(3);
            expect(newWorkflow.steps).toEqual([]);
        });
    });

    describe("shiftStep()", () => {
        it("should remove the first step from the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.shiftStep();
            expect(newWorkflow.steps).toEqual([step2]);
        });

        it("should remove multiple steps from the beginning of the workflow", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create().pushStep([
                step1,
                step1,
                step2,
                step2,
            ]);
            const newWorkflow = workflow.shiftStep(2);
            expect(newWorkflow.steps).toEqual([step2, step2]);
        });

        it("should do nothing when the workflow is empty", () => {
            const workflow = Workflow.create().shiftStep();
            expect(workflow.steps).toEqual([]);
        });

        it("should remove all steps when n is greater than the number of steps", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.shiftStep(3);
            expect(newWorkflow.steps).toEqual([]);
        });
    });

    describe("removeStep()", () => {
        it("should remove a single step", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const workflow = Workflow.create().addStep([step1, step2]);
            const newWorkflow = workflow.removeStep(step1);
            expect(newWorkflow.steps).toEqual([step2]);
        });

        it("should remove an array of steps", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const step3 = { name: "step3", run: () => 3 };
            const workflow = Workflow.create().addStep([step1, step2, step3]);
            const newWorkflow = workflow.removeStep([step1, step3]);
            expect(newWorkflow.steps).toEqual([step2]);
        });

        it("should remove steps matching a string pattern", () => {
            const step1 = { name: "test-1", run: () => 1 };
            const step2 = { name: "build", run: () => 2 };
            const step3 = { name: "test-2", run: () => 3 };
            const workflow = Workflow.create().addStep([step1, step2, step3]);
            const newWorkflow = workflow.removeStep("test-*");
            expect(newWorkflow.steps).toEqual([step2]);
        });
    });

    describe("setContext()", () => {
        /**
         * Type safety is tested in the type tests.
         * @see {@link ../__typetests__/Workflow.test-d.ts}
         */
        it("should return a new workflow with the given context", () => {
            const context = { a: 1 };
            const workflow = Workflow.create().setContext<typeof context>();

            expect(workflow).toBeInstanceOf(Workflow);
        });

        it("should replace the existing context with the given context", () => {
            // Properties having the same name with the default context
            // should be ignored.
            const context = { a: 1 };
            const workflow = Workflow.create().setContext(context);

            const expectedContext = {
                a: 1,
            };
            expect(workflow.userContext).toEqual(expectedContext);

            const newContext = { b: 2 };
            const newWorkflow = workflow.setContext(newContext);

            const expectedNewContext = {
                // The old context properties should be deleted.
                // No a: 1 here.
                b: 2,
            };
            expect(newWorkflow.userContext).toEqual(expectedNewContext);
        });
    });

    describe("mergeContext()", () => {
        /**
         * Type safety is tested in the type tests.
         * @see {@link ../__typetests__/Workflow.test-d.ts}
         */
        it("should return a new workflow with the given context", () => {
            const context = { a: 1 };
            const workflow = Workflow.create().mergeContext<typeof context>();

            expect(workflow).toBeInstanceOf(Workflow);
        });

        it("should merge the given context with the existing context", () => {
            const context = { a: 1 };
            const workflow = Workflow.create().setContext(context);

            const newContext = { b: 2, a: "replaced" };
            const newWorkflow = workflow.mergeContext(newContext);

            const expectedContext = {
                a: "replaced",
                b: 2,
            };

            expect(newWorkflow.userContext).toEqual(expectedContext);
        });
    });

    describe("updateContext()", () => {
        it("should update the existing context with the given context", () => {
            const context = { a: 1 };
            const workflow = Workflow.create().setContext(context);

            const newContext = { a: 2 };
            const newWorkflow = workflow.updateContext(newContext);

            const expectedContext = {
                a: 2,
            };

            expect(newWorkflow.userContext).toEqual(expectedContext);
        });
    });

    describe("run()", () => {
        it("should execute steps in order", () => {
            const executionOrder: number[] = [];
            const step1 = {
                run() {
                    executionOrder.push(1);
                    return 1;
                },
            };
            const step2 = {
                run() {
                    executionOrder.push(2);
                    return 2;
                },
            };
            const workflow = Workflow.create().pushStep([step1, step2]);
            workflow.run();
            expect(executionOrder).toEqual([1, 2]);
        });

        it("should pass context to steps", () => {
            const context = { a: 1, called: false };
            const step1 = {
                run(_: RuntimeContext, uc: typeof context) {
                    // Check if the context change can be passed to the next step.
                    uc.called = true;
                    return uc.a;
                },
            };

            const step2 = {
                run(rt: RuntimeContext, uc: typeof context) {
                    // Check if the workflow passed what previous step returned.
                    if (typeof rt.previousStepOutput === "number") {
                        return uc;
                    }

                    return null;
                },
            };

            const workflow = Workflow.create()
                .setContext(context)
                .pushStep([step1, step2]);
            const result = workflow.run();

            expect(result).toEqual({
                status: "success",
                result: {
                    a: 1,
                    called: true,
                },
            });
        });

        it("should handle step failure", () => {
            const error = new Error("Step failed");
            const step1 = {
                run() {
                    throw error;
                },
            };
            const step2 = { run: () => "never reached" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const result = workflow.run();
            expect(result).toEqual({
                status: "failed",
                error: { step: 0, cause: error },
            });
        });

        it("should handle non-Error step failure", () => {
            const step1 = {
                run() {
                    // eslint-disable-next-line no-throw-literal
                    throw "Step failed";
                },
            };
            const step2 = { run: () => "never reached" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const result = workflow.run();
            expect(result).toEqual({
                status: "failed",
                error: { step: 0, cause: new Error("Step failed") },
            });
        });

        it("should maintain type safety with different step return types", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "string" };
            const step3 = { run: () => true };

            const workflow = Workflow.create().pushStep([step1, step2, step3]);

            const result = workflow.run();
            expect(result).toEqual({
                status: "success",
                result: true,
            });
        });

        it("should continue after step failure with on: failure and on: always", () => {
            const error = new Error("Step failed");
            let called = 0;
            const steps = [
                {
                    run() {
                        throw error;
                    },
                },
                {
                    run() {
                        called += 1;
                        return "This step will never be reached";
                    },
                },
                {
                    on: "failure" as const,
                    run() {
                        called += 1;
                    },
                },
                {
                    on: "always" as const,
                    run() {
                        called += 1;
                        return "success";
                    },
                },
            ] as const;

            const workflow = Workflow.create().pushStep(steps);
            const result = workflow.run();

            expect(result).toEqual({
                status: "failed",
                error: { step: 0, cause: error },
            });
            expect(called).toBe(2);
        });
    });
});
