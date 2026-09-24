import * as validators from "./user.validation";
import { z } from "zod";

export type ILogoutDTO = z.infer<typeof validators.logout.body>;
export type IFreezeAccountDTO = z.infer<typeof validators.freezeAccount.params>;
export type IRestoreAccountDTO = z.infer<typeof validators.restoreAccount.params>;
export type IHardDeleteAccountDTO = z.infer<typeof validators.hardDelete.params>;