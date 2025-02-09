/*
 * This file tests the types defined in Utils.ts using TSD.
 *
 * Copyright (c) 2015-2025 Yuba Technology. All rights reserved.
 * This file is a collaborative effort of the Yuba Technology team
 * and all contributors to the WorkflowX project.
 *
 * Licensed under the AGPLv3 license.
 */

/* eslint-disable no-lone-blocks */

import { expectType } from "tsd-lite";
import type { LastElement, Pop, PopN, Shift, ShiftN, Unreliable } from "..";
import type { Equal } from "@/utils/types";

/*
 * ====================================
 * Describe type `LastElement`:
 * ====================================
 */

/*
 * It should return the last element of a tuple.
 */
{
    expectType<Equal<LastElement<[number, string]>, string>>(true);
}

/*
 * It should return `unknown` for an empty tuple.
 */
{
    expectType<Equal<LastElement<[]>, unknown>>(true);
}

/*
 * ====================================
 * Describe type `Pop`:
 * ====================================
 */

/*
 * It should remove the last element of a tuple.
 */
{
    type Tuple = [1, 2, 3];
    type PoppedTuple = Pop<Tuple>;
    type ExpectedPoppedTuple = readonly [1, 2];

    expectType<Equal<PoppedTuple, ExpectedPoppedTuple>>(true);
}

/*
 * It should return `[]` when the tuple is empty.
 */
{
    type TupleSingle = [];
    type PoppedTupleSingle = Pop<TupleSingle>;

    expectType<Equal<PoppedTupleSingle, readonly []>>(true);
}

/*
 * ====================================
 * Describe type `PopN`:
 * ====================================
 */

/*
 * It should remove the last N elements of a tuple.
 */
{
    type Tuple = [1, 2, 3, 4];
    type PoppedTuple = PopN<Tuple, 2>;
    type ExpectedPoppedTuple = readonly [1, 2];

    expectType<Equal<PoppedTuple, ExpectedPoppedTuple>>(true);
}

/*
 * It should return `[]` when the tuple is empty.
 */
{
    type TupleSingle = [];
    type PoppedTupleSingle = PopN<TupleSingle, 1>;

    expectType<Equal<PoppedTupleSingle, readonly []>>(true);
}

/*
 * It should return `[]` when the number is larger than the length of the tuple.
 */

{
    type Tuple = [1, 2, 3];
    type PoppedTuple = PopN<Tuple, 4>;

    expectType<Equal<PoppedTuple, readonly []>>(true);
}

/*
 * ====================================
 * Describe type `Shift`:
 * ====================================
 */

/*
 * It should remove the first element of a tuple.
 */
{
    type Tuple = [1, 2, 3];
    type ShiftedTuple = Shift<Tuple>;
    type ExpectedShiftedTuple = readonly [2, 3];

    expectType<Equal<ShiftedTuple, ExpectedShiftedTuple>>(true);
}

/*
 * It should return `[]` when the tuple is empty.
 */
{
    type TupleSingle = [];
    type ShiftedTupleSingle = Shift<TupleSingle>;

    expectType<Equal<ShiftedTupleSingle, readonly []>>(true);
}

/*
 * ====================================
 * Describe type `ShiftN`:
 * ====================================
 */

/*
 * It should remove the first N elements of a tuple.
 */
{
    type Tuple = [1, 2, 3, 4];
    type ShiftedTuple = ShiftN<Tuple, 2>;
    type ExpectedShiftedTuple = readonly [3, 4];

    expectType<Equal<ShiftedTuple, ExpectedShiftedTuple>>(true);
}

/*
 * It should return `[]` when the tuple is empty.
 */
{
    type TupleSingle = [];
    type ShiftedTupleSingle = ShiftN<TupleSingle, 1>;

    expectType<Equal<ShiftedTupleSingle, readonly []>>(true);
}

/*
 * It should return `[]` when the number is larger than the length of the tuple.
 */
{
    type Tuple = [1, 2, 3];
    type ShiftedTuple = ShiftN<Tuple, 4>;

    expectType<Equal<ShiftedTuple, readonly []>>(true);
}

/*
 * ====================================
 * Describe type `Unreliable`:
 * ====================================
 */

/*
 * It should add `undefined` and `null` to all properties of an object.
 */
{
    // Test the Unreliable type helper with an object type.
    type ExampleObject = { a: string; b: number };
    type UnreliableObject = Unreliable<ExampleObject>;
    type ExpectedUnreliableObject = {
        a: string | undefined | null;
        b: number | undefined | null;
    };

    expectType<Equal<UnreliableObject, ExpectedUnreliableObject>>(true);
}

/*
 * It should add `undefined` and `null` to the type itself of a non-object type.
 */
{
    // Test the Unreliable type helper with a non-object type.
    type UnreliableString = Unreliable<string>;
    type ExpectedUnreliableString = string | undefined | null;

    expectType<Equal<UnreliableString, ExpectedUnreliableString>>(true);
}

/*
 * It should ignore itself if the type is already unreliable.
 */
{
    // Test the Unreliable type helper with an unreliable type.
    type UnrelPrimitive = Unreliable<string | undefined | null>;
    type ExpectedUnreliableString = string | undefined | null;

    expectType<Equal<UnrelPrimitive, ExpectedUnreliableString>>(true);
}
