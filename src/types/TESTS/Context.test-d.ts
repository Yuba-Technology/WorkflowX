/*
 * This file tests the types defined in Context.ts using TSD.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

/* eslint-disable no-lone-blocks */

import { expectType } from "tsd-lite";
import { ExtractRuntimeContext, ExtractUserContext } from "..";
import { Equal } from "@/utils/types";

/*
 * ====================================
 * Describe type `ExtractRuntimeContext`:
 * ====================================
 */

/*
 * It should extract the runtime context of a workflow.
 */

{
    type TestContext = { a: string; b: number };
    type ExtractedContext = ExtractRuntimeContext<{
        runtimeContext: TestContext;
    }>;

    expectType<Equal<ExtractedContext, TestContext>>(true);
}

/*
 * ====================================
 * Describe type `ExtractUserContext`:
 * ====================================
 */

/*
 * It should extract the context type of a workflow.
 */
{
    type TestContext = { a: string; b: number };
    type ExtractedContext = ExtractUserContext<{ userContext: TestContext }>;

    expectType<Equal<ExtractedContext, TestContext>>(true);
}
