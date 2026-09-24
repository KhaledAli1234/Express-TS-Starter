import type { Request, Response } from "express";
import type {
  IConfirmEmailBodyInputsDTO,
  IForgotPasswordBodyInputsDTO,
  ILoginBodyInputsDTO,
  IResetForgotPasswordBodyInputsDTO,
  ISignupBodyInputsDTO,
  IVerifyForgotPasswordBodyInputsDTO,
} from "./auth.dto";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../utils/response/error.response";
import { compareHash, generateHash } from "../../utils/secuirty/hash.secuirty";
import { generateNumberOtp } from "../../utils/otp";
import { createLoginCredentials } from "../../utils/secuirty/token.secuirty";
import { successResponse } from "../../utils/response/success.response";
import { ILoginResponse } from "./auth.entities";
import { ProviderEnum, UserModel, UserRepository } from "../../DB";
import { emailEvent } from "../../utils/email/email.event";

class AuthenticationService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  signup = async (req: Request, res: Response): Promise<Response> => {
    const { username, email, password }: ISignupBodyInputsDTO = req.body;

    const checkUserExist = await this.userModel.findOne({
      filter: { email },
      select: "email",
      options: { lean: true },
    });
    if (checkUserExist) {
      throw new ConflictException("Email exist");
    }

    const otp = generateNumberOtp();

    await this.userModel.createUser({
      data: [
        {
          username,
          email,
          password,
          confirmEmailOtp: `${otp}`,
        },
      ],
    });

    return successResponse({
      res,
      message: "User created successfully",
      statusCode: 201,
    });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILoginBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: { email, provider: ProviderEnum.system },
    });
    if (!user) {
      throw new NotFoundException("Invalid login data");
    }
    if (!user.confirmAt) {
      throw new BadRequestException("Please verify your email first");
    }

    const isMatch = await compareHash(password, user.password);
    if (!isMatch) {
      throw new BadRequestException("Invalid login data");
    }

    const credentials = await createLoginCredentials(user);
    return successResponse<ILoginResponse>({
      res,
      message: "Login successful",
      data: { credentials },
    });
  };

  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp }: IConfirmEmailBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmailOtp: { $exists: true },
        confirmAt: { $exists: false },
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid account");
    }
    if (!(await compareHash(otp, user.confirmEmailOtp as string))) {
      throw new ConflictException("Invalid confirmation code");
    }

    await this.userModel.updateOne({
      filter: { email },
      update: { confirmAt: new Date(), $unset: { confirmEmailOtp: 1 } },
    });

    return successResponse({ res, message: "Email verified successfully" });
  };

  sendForgotPassword = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { email }: IForgotPasswordBodyInputsDTO = req.body;
    const otp = generateNumberOtp();

    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmAt: { $exists: true },
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid account");
    }

    const result = await this.userModel.updateOne({
      filter: { email },
      update: { resetPasswordOtp: await generateHash(String(otp)) },
    });
    if (!result.matchedCount) {
      throw new BadRequestException("Fail to send reset code");
    }

    emailEvent.emit("resetPassword", { to: email, otp });

    return successResponse({ res, message: "OTP sent successfully" });
  };

  verifyForgotPassword = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { email, otp }: IVerifyForgotPasswordBodyInputsDTO = req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        resetPasswordOtp: { $exists: true },
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid account");
    }
    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid OTP");
    }

    return successResponse({ res, message: "OTP verified successfully" });
  };

  resetForgotPassword = async (
    req: Request,
    res: Response,
  ): Promise<Response> => {
    const { email, otp, password }: IResetForgotPasswordBodyInputsDTO =
      req.body;

    const user = await this.userModel.findOne({
      filter: {
        email,
        resetPasswordOtp: { $exists: true },
        provider: ProviderEnum.system,
      },
    });
    if (!user) {
      throw new NotFoundException("Invalid account");
    }
    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid OTP");
    }

    const result = await this.userModel.updateOne({
      filter: { email },
      update: {
        $unset: { resetPasswordOtp: 1 },
        password: await generateHash(password),
        changeCredentialsTime: new Date(),
      },
    });
    if (!result.matchedCount) {
      throw new BadRequestException("Fail to reset account password");
    }

    return successResponse({ res, message: "Password reset successfully" });
  };
}

export default new AuthenticationService();
