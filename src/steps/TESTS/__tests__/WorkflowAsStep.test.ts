/*
 * This file tests the `WorkflowAsStep` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { WorkflowAsStep } from "../..";
import type { RuntimeContext } from "@/types";
import { WorkflowBuilder } from "@/builders";

describe("WorkflowAsStep", () => {
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const initialBlueprint = WorkflowBuilder.createBlueprint();
    const blueprintWithSteps = WorkflowBuilder.pushStep(initialBlueprint, [
        step1,
    ]);
    const blueprint = WorkflowBuilder.setConclude(blueprintWithSteps, step2);

    it("should use default values", () => {
        const instance = new WorkflowAsStep(blueprint);
        expect(instance.blueprint).toBe(blueprint);
        expect(instance.on).toBe("success");
        expect(instance.name).toBe("");
    });

    it("should use provided options", () => {
        const instance = new WorkflowAsStep(blueprint, {
            on: "failure",
            name: "TestStep",
        });
        expect(instance.on).toBe("failure");
        expect(instance.name).toBe("TestStep");
    });

    it("should run workflow and return result", () => {
        const runtimeContext: RuntimeContext = {
            status: "success",
            previousStepOutput: undefined,
            error: undefined,
        };
        const instance = new WorkflowAsStep(blueprint);
        const result = instance.run(runtimeContext, {});
        expect(result).toBe("Hello, world!");
    });

    it("should handle step failure", () => {
        const runtimeContext: RuntimeContext = {
            status: "success",
            previousStepOutput: undefined,
            error: undefined,
        };
        const newStep = {
            run() {
                throw new Error("Fail");
            },
        };
        const blueprintToBeExpectedToFail = WorkflowBuilder.pushStep(
            initialBlueprint,
            [newStep],
        );

        const instance = new WorkflowAsStep(blueprintToBeExpectedToFail);
        expect(() => instance.run(runtimeContext, {})).toThrow("Fail");
    });

    it("should use the given runtime context and user context", () => {
        const runtimeContext: RuntimeContext = {
            status: "failed",
            previousStepOutput: undefined,
            error: undefined,
        };
        const userContext = { test: 42 };

        // Test if the user context is passed to the workflow.
        const step1 = {
            on: "always" as const,
            run: (_: RuntimeContext, uc: typeof userContext) => uc.test,
        };
        // Test if the runtime context is changed by the workflow.
        const step2 = {
            on: "always" as const,
            run: (rt: RuntimeContext, _: typeof userContext) =>
                rt.previousStepOutput,
        };

        // Test if the runtime context is provided by outside.
        // Because we manually set the runtime context status to "failed",
        // This step should not be reached.
        // And return value should be 42 instead of what the step returns.
        const step3 = { run: () => "This should never be reached" };
        const initialBlueprint = WorkflowBuilder.createBlueprint();
        const blueprint = WorkflowBuilder.pushStep(initialBlueprint, [
            step1,
            step2,
            step3,
        ]);

        const instance = new WorkflowAsStep(blueprint);
        const result = instance.run(runtimeContext, userContext);
        expect(result).toBe(42);
    });
});
