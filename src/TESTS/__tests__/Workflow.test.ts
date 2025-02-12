/*
 * This file tests the `Workflow` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import {
    Workflow,
    WorkflowBuilder,
    WorkflowRunner,
    WorkflowAsStep,
} from "../..";

const runMock = jest.fn();

jest.mock("../../Runner", () => {
    return {
        WorkflowRunner: jest.fn().mockImplementation(() => {
            return {
                run: runMock,
            };
        }),
    };
});

jest.mock("../../WorkflowAsStep", () => {
    return {
        WorkflowAsStep: jest.fn(),
    };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spyOnAllMethods = (obj: any) => {
    const spies: { [key: string]: jest.SpyInstance } = {};
    const propertyNames = Object.getOwnPropertyNames(obj);
    for (const propertyName of propertyNames) {
        if (!(typeof obj[propertyName] === "function")) {
            continue;
        }

        spies[propertyName] = jest.spyOn(obj, propertyName);
    }

    return spies;
};

const resetAllSpies = (spies: {
    [key: string]: { [key: string]: jest.SpyInstance };
}) => {
    if (Object.keys(spies).length === 0) {
        return {};
    }

    for (const spied of Object.values(spies)) {
        const propertyNames = Object.getOwnPropertyNames(spied);
        for (const propertyName of propertyNames) {
            spied[propertyName].mockClear();
        }
    }

    return {};
};

let spies: { [key: string]: { [key: string]: jest.SpyInstance } } = {};

describe("Workflow", () => {
    beforeEach(() => {
        spies = {
            builder: spyOnAllMethods(WorkflowBuilder),
        };
    });

    afterEach(() => {
        spies = resetAllSpies(spies);
        jest.clearAllMocks();
    });

    describe("create()", () => {
        it("should create an empty workflow", () => {
            Workflow.create();
            expect(spies.builder.createBlueprint).toHaveBeenCalled();
        });
    });

    describe("pushStep()", () => {
        it("should auto wrap single step in an array", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            Workflow.create().pushStep(step1).pushStep(step2);

            expect(spies.builder.pushStep.mock.calls).toEqual([
                [expect.anything(), [step1]],
                [expect.anything(), [step2]],
            ]);
        });

        it("should add multiple steps from an array", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            Workflow.create()
                .pushStep([step1, step1])
                .pushStep([step2, step2]);

            expect(spies.builder.pushStep.mock.calls).toEqual([
                [expect.anything(), [step1, step1]],
                [expect.anything(), [step2, step2]],
            ]);
        });
    });

    describe("unshiftStep()", () => {
        it("should auto wrap single step in an array", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            Workflow.create().unshiftStep(step1).unshiftStep(step2);

            expect(spies.builder.unshiftStep.mock.calls).toEqual([
                [expect.anything(), [step1]],
                [expect.anything(), [step2]],
            ]);
        });

        it("should add multiple steps from an array", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            Workflow.create()
                .unshiftStep([step1, step1])
                .unshiftStep([step2, step2]);

            expect(spies.builder.unshiftStep.mock.calls).toEqual([
                [expect.anything(), [step1, step1]],
                [expect.anything(), [step2, step2]],
            ]);
        });
    });

    describe("addStep()", () => {
        it("should auto wrap single step in an array", () => {
            const step = { run: () => 42 };
            Workflow.create().addStep(step);

            expect(spies.builder.addStep.mock.calls).toEqual([
                [expect.anything(), [step], {}],
            ]);
        });

        it("should add multiple steps from an array", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            Workflow.create().addStep([step1, step2]);

            expect(spies.builder.addStep.mock.calls).toEqual([
                [expect.anything(), [step1, step2], {}],
            ]);
        });

        it("should add step using options", () => {
            const step1 = { name: "first", run: () => "first" };
            const step2 = { name: "second", run: () => "second" };
            const step3 = { name: "third", run: () => "third" };
            const step4 = { name: "fourth", run: () => "fourth" };
            Workflow.create()
                .addStep(step1)
                .addStep(step2, { before: 1 })
                .addStep(step3, { before: "second", multi: 1 })
                .addStep(step4, { after: "*", multi: true });

            expect(spies.builder.addStep.mock.calls).toEqual([
                [expect.anything(), [step1], {}],
                [expect.anything(), [step2], { before: 1 }],
                [expect.anything(), [step3], { before: "second", multi: 1 }],
                [expect.anything(), [step4], { after: "*", multi: true }],
            ]);
        });
    });

    describe("clearSteps", () => {
        it("should remove all steps from the blueprint", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            Workflow.create().pushStep([step1, step2]).clearSteps();

            expect(spies.builder.clearSteps).toHaveBeenCalled();
        });
    });

    describe("popStep()", () => {
        it("should auto use 1 as the default delete count", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            Workflow.create().pushStep([step1, step2]).popStep();

            expect(spies.builder.popStep.mock.calls).toEqual([
                [expect.anything(), 1],
            ]);
        });

        it("should use the given delete count", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            Workflow.create()
                .pushStep([step1, step1, step2, step2])
                .popStep(2);

            expect(spies.builder.popStep.mock.calls).toEqual([
                [expect.anything(), 2],
            ]);
        });
    });

    describe("shiftStep()", () => {
        it("should auto use 1 as the default delete count", () => {
            const step1 = { run: () => 42 };
            const step2 = { run: () => "Hello, world!" };
            Workflow.create().pushStep([step1, step2]).shiftStep();

            expect(spies.builder.shiftStep.mock.calls).toEqual([
                [expect.anything(), 1],
            ]);
        });

        it("should use the given delete count", () => {
            const step1 = { run: () => "first" };
            const step2 = { run: () => "second" };
            Workflow.create()
                .pushStep([step1, step1, step2, step2])
                .shiftStep(2);

            expect(spies.builder.shiftStep.mock.calls).toEqual([
                [expect.anything(), 2],
            ]);
        });
    });

    describe("removeStep()", () => {
        it("should rauto wrap single step in an array", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            Workflow.create().addStep([step1, step2]).removeStep(step1);

            expect(spies.builder.removeStep.mock.calls).toEqual([
                [expect.anything(), [step1]],
            ]);
        });

        it("should remove an array of steps", () => {
            const step1 = { name: "step1", run: () => 1 };
            const step2 = { name: "step2", run: () => 2 };
            const step3 = { name: "step3", run: () => 3 };
            Workflow.create()
                .addStep([step1, step2, step3])
                .removeStep([step1, step3]);

            expect(spies.builder.removeStep.mock.calls).toEqual([
                [expect.anything(), [step1, step3]],
            ]);
        });

        it("should remove steps matching a string pattern", () => {
            const step1 = { name: "test-1", run: () => 1 };
            const step2 = { name: "build", run: () => 2 };
            const step3 = { name: "test-2", run: () => 3 };
            Workflow.create()
                .addStep([step1, step2, step3])
                .removeStep("test-*");

            expect(spies.builder.removeStep.mock.calls).toEqual([
                [expect.anything(), "test-*"],
            ]);
        });
    });

    describe("setContext()", () => {
        /**
         * Type safety is tested in the type tests.
         * @see {@link ../__typetests__/Workflow.test-d.ts}
         */
        it("should use undefined if no context is given", () => {
            const context = { a: 1 };
            Workflow.create().setContext<typeof context>();

            expect(spies.builder.setContext.mock.calls).toEqual([
                [expect.anything(), undefined],
            ]);
        });

        it("should set the given context", () => {
            // Properties having the same name with the default context
            // should be ignored.
            const context = { a: 1 };
            Workflow.create().setContext(context);

            expect(spies.builder.setContext.mock.calls).toEqual([
                [expect.anything(), context],
            ]);
        });
    });

    describe("mergeContext()", () => {
        /**
         * Type safety is tested in the type tests.
         * @see {@link ../__typetests__/Workflow.test-d.ts}
         */
        it("should use undefined if no context is given", () => {
            const context = { a: 1 };
            Workflow.create().mergeContext<typeof context>();

            expect(spies.builder.mergeContext.mock.calls).toEqual([
                [expect.anything(), undefined],
            ]);
        });

        it("should merge the given context", () => {
            const context = { a: 1 };
            const newContext = { b: 2 };
            Workflow.create().setContext(context).mergeContext(newContext);

            expect(spies.builder.mergeContext.mock.calls).toEqual([
                [expect.anything(), newContext],
            ]);
        });
    });

    describe("updateContext()", () => {
        it("should update the existing context with the given context", () => {
            const context = { a: 1 };
            const newContext = { a: 2 };
            Workflow.create().setContext(context).updateContext(newContext);

            expect(spies.builder.updateContext.mock.calls).toEqual([
                [expect.anything(), newContext],
            ]);
        });
    });

    describe("asStep()", () => {
        it("should be called with default options", () => {
            Workflow.create().asStep();

            expect(WorkflowAsStep).toHaveBeenCalledWith(
                WorkflowBuilder.createBlueprint(),
                undefined,
            );
        });

        it("should use provided options", () => {
            Workflow.create().asStep({
                on: "failure",
                name: "TestStep",
            });

            expect(WorkflowAsStep).toHaveBeenCalledWith(
                WorkflowBuilder.createBlueprint(),
                {
                    on: "failure",
                    name: "TestStep",
                },
            );
        });
    });

    describe("run()", () => {
        it("should call the runner with the blueprint", () => {
            const blueprint = WorkflowBuilder.createBlueprint();
            Workflow.create().run();

            expect(WorkflowRunner).toHaveBeenCalledWith(blueprint);
            expect(runMock).toHaveBeenCalledTimes(1);
        });
    });
});
