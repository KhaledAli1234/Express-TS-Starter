import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });

import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./DB/connection.db";
import { globalErrorHandling } from "./utils/response/error.response";
import { authRouter, userRouter } from "./modules";

const bootstrap = async (): Promise<void> => {
  const app: Express = express();
  const port: number | string = process.env.PORT || 5000;

  app.use(express.json());
  app.use(cors());
  app.use(helmet());

  await connectDB();

  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Welcome 🚀" });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "invalid application routing ❌" });
  });

  app.use(globalErrorHandling);

  app.listen(port, () => {
    console.log(`server is running on port ${port} 🚀`);
  });
};

export default bootstrap;