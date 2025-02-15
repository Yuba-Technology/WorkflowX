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
import type { ExtractRuntimeContext, ExtractUserContext } from "..";
import type { Equal } from "@/utils/types";

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
    type BluePrint = { blueprint: { runtimeContext: TestContext } };
    type ExtractedContext = ExtractRuntimeContext<BluePrint>;

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
    type BluePrint = { blueprint: { userContext: TestContext } };
    type ExtractedContext = ExtractUserContext<BluePrint>;

    expectType<Equal<ExtractedContext, TestContext>>(true);
}
