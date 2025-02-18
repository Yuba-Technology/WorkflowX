/*
 * This file stores types related to a blueprint.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

export type BlueprintReturnType<T> = T extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conclude: { run: (...args: any[]) => infer R };
}
    ? R
    : void;

export type BlueprintUserContext<T> = T extends {
    userContext: infer C;
}
    ? C
    : never;
