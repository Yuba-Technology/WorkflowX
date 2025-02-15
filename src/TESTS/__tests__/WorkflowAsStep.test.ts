import type { RuntimeContext } from "../../types";
import { WorkflowAsStep, WorkflowBuilder } from "../..";

describe("WorkflowAsStep", () => {
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const initialBlueprint = WorkflowBuilder.createBlueprint();
    const blueprint = WorkflowBuilder.pushStep(initialBlueprint, [
        step1,
        step2,
    ]);

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

        const newStep = {
            run() {
                throw new Error("Fail");
            },
        };
        const blueprintToBeExpectedToFail = WorkflowBuilder.pushStep(
            initialBlueprint,
            [newStep],
        );

        const newInstance = new WorkflowAsStep(blueprintToBeExpectedToFail);
        expect(() => newInstance.run(runtimeContext, {})).toThrow("Fail");
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

        // !Warning: If the workflow needs to return a value,
        // !then a step without on = "always" should placed at the end.
        // !This could break the type safety of the workflow, because
        // !the last step could not be reached, and the return type
        // !could be different than expected.
        // !DO NOT USE THIS PATTERN IN PRODUCTION CODE.
        // !This is just for testing purposes.
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
