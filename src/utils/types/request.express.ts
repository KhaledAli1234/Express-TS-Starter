import { HUserDocument } from "../../DB/models/User.model";
import { ITokenPayload } from "../../utils/secuirty/token.secuirty";
import "multer"; 

declare module "express-serve-static-core" {
  interface Request {
    user?: HUserDocument;
    decoded?: ITokenPayload;
  }
}