import { HUserDocument } from "../../DB";

export interface IUserResponse {
  user: Partial<HUserDocument>;
}