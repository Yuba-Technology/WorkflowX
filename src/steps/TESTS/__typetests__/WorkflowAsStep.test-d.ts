/*
 * This file tests the type inference of `WorkflowAsStep` class.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import { expectType } from "tsd-lite";
import { WorkflowAsStep } from "../..";
import { Workflow } from "@/workflows";
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
    const workflowBlueprint = Workflow.create()
        .pushStep(step1)
        .setConclude(step2).blueprint;
    const workflowAsStep = new WorkflowAsStep(workflowBlueprint);
    type WorkflowResultType = ReturnType<typeof workflowAsStep.run>;
    expectType<Equal<WorkflowResultType, string | never>>(true);
}
