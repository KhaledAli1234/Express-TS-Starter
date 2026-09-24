import { Router } from "express";
import userService from "./user.service";
import { authentication, authorization } from "../../middleware/authentication.middleware";
import { validation } from "../../middleware/validation.middleware";
import * as validators from "./user.validation";
import { TokenEnum } from "../../utils/secuirty/token.secuirty";
import { endpoint } from "./user.authorization";

const router = Router();

router.get("/", authentication(), userService.profile);
router.get("/dashboard", authorization(endpoint.dashboard), userService.dashboard);
router.patch("/:userId/change-role", authorization(endpoint.dashboard), validation(validators.changeRole), userService.changeRole);
router.delete("{/:userId}/freeze-account", authentication(), validation(validators.freezeAccount), userService.freezeAccount);
router.patch("/:userId/restore-account", authorization(endpoint.restoreAccount), validation(validators.restoreAccount), userService.restoreAccount);
router.delete("/:userId", authorization(endpoint.hardDelete), validation(validators.hardDelete), userService.hardDeleteAccount);
router.post("/refresh-token", authentication(TokenEnum.refresh), userService.refreshToken);
router.post("/logout", authentication(), validation(validators.logout), userService.logout);
router.patch("/update-password", authentication(), validation(validators.updatePassword), userService.updatePassword);
router.patch("/update-basic-info", authentication(), validation(validators.updateBasicInfo), userService.updateBasicInfo);

export default router;