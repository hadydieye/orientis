import {
  makeDeleteHandler,
  makeGetOneHandler,
  makeUpdateHandler,
} from "@/lib/api/crud";

export const GET = makeGetOneHandler("institution_photos");
export const PATCH = makeUpdateHandler("institution_photos");
export const DELETE = makeDeleteHandler("institution_photos");
