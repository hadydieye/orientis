import {
  makeGetOneHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/api/crud";

export const GET = makeGetOneHandler("academic_units");
export const PATCH = makeUpdateHandler("academic_units");
export const DELETE = makeDeleteHandler("academic_units");
