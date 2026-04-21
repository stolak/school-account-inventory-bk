import { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: string;
  email: string;
  userType: "Admin" | "Merchant" | "Buyer";
  role:
    | "Visitor"
    | "Admin"
    | "Merchant"
    | "Buyer"
    | "SuperAdmin"
    | "CustomerSupport";
  merchantId?: string;
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload;
    }
  }
}
