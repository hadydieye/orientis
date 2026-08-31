import { makeListHandler, makeCreateHandler } from "@/lib/api/crud";

export const GET = makeListHandler("academic_units");
export const POST = makeCreateHandler("academic_units");
