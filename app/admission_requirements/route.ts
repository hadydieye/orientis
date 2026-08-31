import { makeListHandler, makeCreateHandler } from "@/lib/api/crud";

export const GET = makeListHandler("admission_requirements");
export const POST = makeCreateHandler("admission_requirements");
