import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from "../utils/env";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    getJwtSecret(),
    (err: any, user: any | JwtPayload | undefined) => {
      if (err) return res.sendStatus(403);
      req.user = user?.user as any;
      next();
    }
  );
};
