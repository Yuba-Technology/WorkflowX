/*
 * This file stores workflow result types.
 * These types represent the result of a workflow run.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

import type { ErrorContext } from "./Context";

/**
 * Output of a successful workflow.
 */
type WorkflowSuccessOutput<TResult> = { status: "success"; result: TResult };

/**
 * Output of a failed workflow.
 */
type WorkflowFailedOutput = { status: "failed"; error: ErrorContext };

/**
 * Result of a workflow.
 * @template TResult - The result type of the workflow.
 */
export type WorkflowResult<TResult> =
    | WorkflowSuccessOutput<TResult>
    | WorkflowFailedOutput;
