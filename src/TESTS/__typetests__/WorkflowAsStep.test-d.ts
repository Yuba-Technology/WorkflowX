import { expectType } from "tsd-lite";
import { Workflow, WorkflowAsStep } from "../..";
import type { Equal } from "@/utils/types";

/*
 * ====================================
 * Describe `WorkflowAsStep.run`:
 * ====================================
 */

/*
 * It should infer the right return type.
 */

{
    const step1 = { run: () => 42 };
    const step2 = { run: () => "Hello, world!" };
    const workflowBlueprint = Workflow.create().pushStep([
        step1,
        step2,
    ]).blueprint;
    const workflowAsStep = new WorkflowAsStep(workflowBlueprint);
    type WorkflowResultType = ReturnType<typeof workflowAsStep.run>;
    expectType<Equal<WorkflowResultType, string | never>>(true);
}
