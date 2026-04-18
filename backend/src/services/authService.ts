import { createNotImplementedResponse } from "../lib/notImplemented";
import type { NotImplementedResponse } from "../types/notImplemented";

export const authService = {
  getSession(): NotImplementedResponse {
    return createNotImplementedResponse("auth", "getSession");
  },

  login(): NotImplementedResponse {
    return createNotImplementedResponse("auth", "login");
  },

  register(): NotImplementedResponse {
    return createNotImplementedResponse("auth", "register");
  },
};
