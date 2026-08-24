import { BadRequestError } from "./errors";

export function paramId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) throw new BadRequestError("Missing id");
  return id;
}
