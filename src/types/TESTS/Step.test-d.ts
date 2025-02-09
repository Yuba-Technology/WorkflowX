/*
 * This file tests the types defined in Step.ts using TSD.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

/* eslint-disable no-lone-blocks */

import { expectType } from "tsd-lite";
import type { StepName, StepReturnType, LastStepReturnType } from "..";
import type { Equal } from "@/utils/types";

/*
 * ====================================
 * Describe type `StepName`:
 * ====================================
 */

/*
 * It should return the name of a step.
 */

{
    type StepWithName = { name: "step1"; run: () => number };
    expectType<Equal<StepName<StepWithName>, "step1">>(true);
}

/*
 * It should return `never` for a step without a name.
 */
{
    type StepWithoutName = { run: () => number };
    expectType<Equal<StepName<StepWithoutName>, never>>(true);
}

/*
 * ====================================
 * Describe type `StepReturnType`:
 * ====================================
 */

/*
 * It should return the return type of a step.
 */
{
    type StepWithReturnType = { run: () => number };
    expectType<Equal<StepReturnType<StepWithReturnType>, number>>(true);
}

/*
 * It should return `unknown` for a step without a run method.
 */
{
    type StepWithoutRun = { name: "step1" };
    expectType<Equal<StepReturnType<StepWithoutRun>, unknown>>(true);
}

/*
 * ====================================
 * Describe type `LastStepReturnType`:
 * ====================================
 */

/*
 * It should return the return type of the last step in a tuple.
 */
{
    type StepsTuple = [{ run: () => string }, { run: () => boolean }];
    expectType<Equal<LastStepReturnType<StepsTuple>, boolean>>(true);
}

/*
 * It should return `undefined` for an empty tuple.
 */
{
    type StepsTupleEmpty = readonly [];
    expectType<Equal<LastStepReturnType<StepsTupleEmpty>, undefined>>(true);
}
