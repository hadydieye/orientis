import { makeDeleteHandler, makeGetOneHandler, makeUpdateHandler } from "@/lib/api/crud";

export const GET = makeGetOneHandler("institution_sources");
export const PATCH = makeUpdateHandler("institution_sources");
export const DELETE = makeDeleteHandler("institution_sources");
