import {
  makeGetOneHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/api/crud";

export const GET = makeGetOneHandler("departments");
export const PATCH = makeUpdateHandler("departments");
export const DELETE = makeDeleteHandler("departments");
