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
import type { RuntimeContext } from "../../types";

describe("Workflow", () => {
    describe("create()", () => {
        it("should create an empty workflow", () => {
            const workflow = Workflow.create();
            const { steps } = workflow.blueprint;
            expect(steps).toEqual([]);
        });
    });

    describe("pushStep()", () => {
        it("should add a single step to the end of the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep(step1).pushStep(step2);

            const { steps } = workflow.blueprint;
            expect(steps).toEqual([step1, step2]);
        });

        it("should add multiple steps to the end of the workflow", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create()
                .pushStep([step1, step1])
                .pushStep([step2, step2]);

            const { steps } = workflow.blueprint;
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

            const { steps } = workflow.blueprint;
            expect(steps).toEqual([step2, step1]);
        });

        it("should add multiple steps to the beginning of the workflow", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create()
                .unshiftStep([step1, step1])
                .unshiftStep([step2, step2]);

            const { steps } = workflow.blueprint;
            expect(steps).toEqual([step2, step2, step1, step1]);
        });
    });

    describe("addStep()", () => {
        it("should add a single step", () => {
            const step = { run: () => 42 };
            const workflow = Workflow.create().addStep(step);

            const { steps } = workflow.blueprint;
            expect(steps).toHaveLength(1);
        });

        it("should add multiple steps", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create().addStep([step1, step2]);

            const { steps } = workflow.blueprint;
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

            const { steps } = workflow.blueprint;
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

            const { steps } = workflow.blueprint;
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

            const { steps } = workflow.blueprint;
            expect(steps).toEqual([step3, step1, step4, step3, step2, step4]);

            // Test with multi false.
            const workflow2 = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/*", multi: false })
                .addStep(step4, { after: "env/*", multi: false });

            const { steps: steps2 } = workflow2.blueprint;
            expect(steps2).toEqual([step3, step1, step4, step2]);

            // Test with multi 1.
            const workflow3 = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/*", multi: 1 })
                .addStep(step4, { after: "env/*", multi: 1 });

            const { steps: steps3 } = workflow3.blueprint;
            expect(steps3).toEqual([step3, step1, step4, step2]);

            // Test with multi -1.
            const workflow4 = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { before: "env/*", multi: -1 })
                .addStep(step4, { after: "env/*", multi: -1 });

            const { steps: steps4 } = workflow4.blueprint;
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

            const { steps } = workflow.blueprint;
            expect(steps).toEqual([step1, step2]);
        });
    });

    describe("popStep()", () => {
        it("should remove the last step from the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.popStep();
            expect(newWorkflow.blueprint.steps).toEqual([step1]);
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
            expect(newWorkflow.blueprint.steps).toEqual([step1, step1]);
        });

        it("should do nothing when the workflow is empty", () => {
            const workflow = Workflow.create().popStep();
            expect(workflow.blueprint.steps).toEqual([]);
        });

        it("should remove all steps when n is greater than the number of steps", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.popStep(3);
            expect(newWorkflow.blueprint.steps).toEqual([]);
        });
    });

    describe("shiftStep()", () => {
        it("should remove the first step from the workflow", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.shiftStep();
            expect(newWorkflow.blueprint.steps).toEqual([step2]);
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
            expect(newWorkflow.blueprint.steps).toEqual([step2, step2]);
        });

        it("should do nothing when the workflow is empty", () => {
            const workflow = Workflow.create().shiftStep();
            expect(workflow.blueprint.steps).toEqual([]);
        });

        it("should remove all steps when n is greater than the number of steps", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            const workflow = Workflow.create().pushStep([step1, step2]);
            const newWorkflow = workflow.shiftStep(3);
            expect(newWorkflow.blueprint.steps).toEqual([]);
        });
    });

    describe("removeStep()", () => {
        it("should remove a single step", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const workflow = Workflow.create().addStep([step1, step2]);
            const newWorkflow = workflow.removeStep(step1);
            expect(newWorkflow.blueprint.steps).toEqual([step2]);
        });

        it("should remove an array of steps", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const step3 = { name: "step3", run: () => 3 };
            const workflow = Workflow.create().addStep([step1, step2, step3]);
            const newWorkflow = workflow.removeStep([step1, step3]);
            expect(newWorkflow.blueprint.steps).toEqual([step2]);
        });

        it("should remove steps matching a string pattern", () => {
            const step1 = { name: "test-1", run: () => 1 };
            const step2 = { name: "build", run: () => 2 };
            const step3 = { name: "test-2", run: () => 3 };
            const workflow = Workflow.create().addStep([step1, step2, step3]);
            const newWorkflow = workflow.removeStep("test-*");
            expect(newWorkflow.blueprint.steps).toEqual([step2]);
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
            expect(workflow.blueprint.userContext).toEqual(expectedContext);

            const newContext = { b: 2 };
            const newWorkflow = workflow.setContext(newContext);

            const expectedNewContext = {
                // The old context properties should be deleted.
                // No a: 1 here.
                b: 2,
            };
            expect(newWorkflow.blueprint.userContext).toEqual(
                expectedNewContext,
            );
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

            expect(newWorkflow.blueprint.userContext).toEqual(expectedContext);
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

            expect(newWorkflow.blueprint.userContext).toEqual(expectedContext);
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
