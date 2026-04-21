/**
 * Express merges `Request` from `express-serve-static-core`.
 * Augmenting that module ensures `req.user` is typed everywhere (incl. ts-node).
 */
declare module "express-serve-static-core" {
  interface Request {
    /** Set by `authenticateJWT` after verifying the bearer token. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
  }
}

export {};
