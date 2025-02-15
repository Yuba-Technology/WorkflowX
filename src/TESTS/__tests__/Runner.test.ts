/*
 * This file tests the `WorkflowRunner` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import type { RuntimeContext } from "../../types";
import { WorkflowBuilder, WorkflowRunner } from "../..";

describe("Runner", () => {
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
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const runner = new WorkflowRunner(blueprintWithContext);
            runner.run();

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

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithContext = WorkflowBuilder.setContext(
                initialBlueprint,
                context,
            );
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                blueprintWithContext,
                [step1, step2],
            );
            const runner = new WorkflowRunner(blueprintWithSteps);
            const result = runner.run();

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
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const runner = new WorkflowRunner(blueprintWithSteps);
            const result = runner.run();

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
            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2],
            );
            const runner = new WorkflowRunner(blueprintWithSteps);
            const result = runner.run();

            expect(result).toEqual({
                status: "failed",
                error: { step: 0, cause: new Error("Step failed") },
            });
        });

        it("should maintain type safety with different step return types", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "string" };
            const step3 = { run: () => true };

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                [step1, step2, step3],
            );
            const runner = new WorkflowRunner(blueprintWithSteps);
            const result = runner.run();

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

            const initialBlueprint = WorkflowBuilder.createBlueprint();
            const blueprintWithSteps = WorkflowBuilder.pushStep(
                initialBlueprint,
                steps,
            );
            const runner = new WorkflowRunner(blueprintWithSteps);
            const result = runner.run();

            expect(result).toEqual({
                status: "failed",
                error: { step: 0, cause: error },
            });
            expect(called).toBe(2);
        });
    });
});
