import type { NotImplementedResponse } from "../types/notImplemented";

export const createNotImplementedResponse = (
  area: string,
  action: string,
): NotImplementedResponse => ({
  message: "Not implemented yet",
  area,
  action,
});
