import type { Request, Response } from "express";
import {
  createLoginCredentials,
  createRevokeToken,
  LogoutEnum,
  ITokenPayload,
} from "../../utils/secuirty/token.secuirty";
import {
  IFreezeAccountDTO,
  IHardDeleteAccountDTO,
  ILogoutDTO,
  IRestoreAccountDTO,
} from "./user.dto";
import { Types, UpdateQuery } from "mongoose";
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "../../utils/response/error.response";
import { successResponse } from "../../utils/response/success.response";
import { IUserResponse } from "./user.entities";
import { ILoginResponse } from "../auth/auth.entities";
import { compareHash, generateHash } from "../../utils/secuirty/hash.secuirty";
import {
  HUserDocument,
  IUser,
  RoleEnum,
  UserModel,
  UserRepository,
} from "../../DB";

export class UserService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedException("missing user details");
    }
    const user = await this.userModel.findById({
      id: req.user._id as Types.ObjectId,
    });
    if (!user) {
      throw new NotFoundException("fail to find user profile");
    }
    return successResponse<IUserResponse>({
      res,
      message: "Profile fetched",
      data: { user },
    });
  };

  dashboard = async (req: Request, res: Response): Promise<Response> => {
    const results = await this.userModel.find({ filter: {} });
    return successResponse({ res, data: { results } });
  };

  changeRole = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as unknown as { userId: Types.ObjectId };
    const { role }: { role: RoleEnum } = req.body;
    const denyRoles: RoleEnum[] = [role, RoleEnum.superAdmin];
    if (req.user?.role === RoleEnum.admin) {
      denyRoles.push(RoleEnum.admin);
    }
    const user = await this.userModel.findOneAndUpdate({
      filter: { _id: userId, role: { $nin: denyRoles } },
      update: { role },
    });
    if (!user) {
      throw new NotFoundException("fail to find matching result");
    }
    return successResponse({ res });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogoutDTO = req.body;
    let statusCode = 200;
    const update: UpdateQuery<IUser> = {};

    switch (flag) {
      case LogoutEnum.all:
        update.changeCredentialsTime = new Date();
        break;
      default:
        await createRevokeToken(req.decoded as ITokenPayload);
        statusCode = 201;
        break;
    }

    await this.userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });
    return successResponse({ res, message: "Logout successful", statusCode });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await createLoginCredentials(req.user as HUserDocument);
    await createRevokeToken(req.decoded as ITokenPayload);
    return successResponse<ILoginResponse>({
      res,
      statusCode: 201,
      data: { credentials },
    });
  };

  freezeAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = (req.params as IFreezeAccountDTO) || {};
    if (userId && req.user?.role !== RoleEnum.admin) {
      throw new ForbiddenException("not authorized user");
    }

    const result = await this.userModel.updateOne({
      filter: { _id: userId || req.user?._id, freezedAt: { $exists: false } },
      update: {
        freezedAt: new Date(),
        freezedBy: req.user?._id,
        changeCredentialsTime: new Date(),
        $unset: { restoredAt: 1, restoredBy: 1 },
      },
    });
    if (!result.matchedCount) {
      throw new NotFoundException("user not found or fail to freeze");
    }
    return successResponse({ res, message: "freezed successfully" });
  };

  restoreAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IRestoreAccountDTO;
    const result = await this.userModel.updateOne({
      filter: { _id: userId, freezedBy: { $ne: userId } },
      update: {
        restoredAt: new Date(),
        restoredBy: req.user?._id,
        $unset: { freezedAt: 1, freezedBy: 1 },
      },
    });
    if (!result.matchedCount) {
      throw new NotFoundException("user not found or fail to restore");
    }
    return successResponse({ res, message: "restored successfully" });
  };

  hardDeleteAccount = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { userId } = req.params as IHardDeleteAccountDTO;
    const result = await this.userModel.deleteOne({
      filter: { _id: userId, freezedAt: { $exists: true } },
    });
    if (!result.deletedCount) {
      throw new NotFoundException("user not found or fail to hard delete");
    }
    return successResponse({ res, message: "deleted successfully" });
  };

  updatePassword = async (req: Request, res: Response): Promise<Response> => {
    const { oldPassword, newPassword } = req.body;

    const user = await this.userModel.findById({
      id: req.user?._id as Types.ObjectId,
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isMatch = await compareHash(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid old password");
    }

    user.password = await generateHash(newPassword);
    await user.save();

    return successResponse({ res, message: "Password updated successfully" });
  };

  updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
    const user = await this.userModel.findOneAndUpdate({
      filter: { _id: req.user?._id },
      update: req.body,
    });
    if (!user) {
      throw new NotFoundException("Invalid account");
    }
    return successResponse({
      res,
      message: "User info updated successfully",
      data: { user },
    });
  };
}

export default new UserService();