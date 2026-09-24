import { RoleEnum } from "../../DB/models/User.model";

export const endpoint = {
  dashboard: [RoleEnum.admin, RoleEnum.superAdmin],
  restoreAccount: [RoleEnum.admin],
  hardDelete: [RoleEnum.admin],
};