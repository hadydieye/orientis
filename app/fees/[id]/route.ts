import {
  makeGetOneHandler,
  makeUpdateHandler,
  makeDeleteHandler,
} from "@/lib/api/crud";

export const GET = makeGetOneHandler("fees");
export const PATCH = makeUpdateHandler("fees");
export const DELETE = makeDeleteHandler("fees");
