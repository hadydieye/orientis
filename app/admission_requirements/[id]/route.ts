import {
  makeGetOneHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/api/crud";

export const GET = makeGetOneHandler("admission_requirements");
export const PATCH = makeUpdateHandler("admission_requirements");
export const DELETE = makeDeleteHandler("admission_requirements");
