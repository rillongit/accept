import {
  enforceRillPaywall,
  type RillPaywallOptions,
} from "./middleware.js";

type ExpressLikeReq = {
  headers: Record<string, string | string[] | undefined>;
};

type ExpressLikeRes = {
  status: (code: number) => { json: (body: unknown) => unknown };
};

type NextFn = () => void;

/**
 * Express middleware factory for sellers protecting an HTTP route with Rill.
 */
export function rillPaywallExpress(
  options: Omit<RillPaywallOptions, "verifyReceipt"> & {
    verifyReceipt: RillPaywallOptions["verifyReceipt"];
  },
) {
  return async function rillPaywall(
    req: ExpressLikeReq,
    res: ExpressLikeRes,
    next: NextFn,
  ) {
    const result = await enforceRillPaywall(req.headers, options);
    if (!result) {
      next();
      return;
    }
    res.status(result.status).json(result.body);
  };
}
