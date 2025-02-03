import { Workflow } from "..";

describe("Workflow", () => {
    describe("create()", () => {
        it("should create an empty workflow", () => {
            const workflow = Workflow.create();
            const result = workflow.run();
            expect(result).toEqual({ status: "success", result: undefined });
        });
    });

    describe("addStep()", () => {
        it("should add a single step", () => {
            const step = { run: () => 42 };
            const workflow = Workflow.create().addStep(step);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { steps } = workflow as any;
            expect(steps).toHaveLength(1);
        });

        it("should add multiple steps", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const workflow = Workflow.create().addStep([step1, step2]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { steps } = workflow as any;
            expect(steps).toEqual([step1, step2]);
        });

        it("should add step before specified index", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const step3 = { run: () => "third" };
            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { index: 1, position: "before" });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { steps } = workflow as any;
            expect(steps).toEqual([step1, step3, step2]);
        });

        it("should add step after specified index", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            const step3 = { run: () => "third" };
            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3, { index: 0, position: "after" });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { steps } = workflow as any;
            expect(steps).toEqual([step1, step3, step2]);
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
            const workflow = Workflow.create().addStep([step1, step2]);
            workflow.run();
            expect(executionOrder).toEqual([1, 2]);
        });

        it("should handle step failure", () => {
            const error = new Error("Step failed");
            const step1 = {
                run() {
                    throw error;
                },
            };
            const step2 = { run: () => "never reached" };
            const workflow = Workflow.create().addStep([step1, step2]);
            const result = workflow.run();
            expect(result).toEqual({
                status: "failed",
                step: 0,
                error,
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
            const workflow = Workflow.create().addStep([step1, step2]);
            const result = workflow.run();
            expect(result).toEqual({
                status: "failed",
                step: 0,
                error: new Error("Step failed"),
            });
        });

        it("should maintain type safety with different step return types", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "string" };
            const step3 = { run: () => true };

            const workflow = Workflow.create()
                .addStep(step1)
                .addStep(step2)
                .addStep(step3);

            const result = workflow.run();
            expect(result).toEqual({
                status: "success",
                result: true,
            });
        });
    });
});
