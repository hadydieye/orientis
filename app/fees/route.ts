import { makeListHandler, makeCreateHandler } from "@/lib/api/crud";

export const GET = makeListHandler("fees");
export const POST = makeCreateHandler("fees");
