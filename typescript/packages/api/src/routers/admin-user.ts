import { ZChangeRoleRequest } from "@songbird/precedent-iso";
import express from "express";

import type { UserService } from "../services/user-service";

export class AdminUserRouter {
  constructor(private readonly userService: UserService) {}

  init() {
    const router = express.Router();

    router.get(
      "/list-users",
      async (_: express.Request, res: express.Response) => {
        const users = await this.userService.list();
        res.json({ data: users });
      }
    );

    router.put(
      "/change-role",
      async (req: express.Request, res: express.Response) => {
        const body = ZChangeRoleRequest.parse(req.body);
        if (body.userId === req.user.id) {
          throw new Error("cannot change your own role");
        }
        const user = await this.userService.changeRole(body.userId, body.role);
        res.json({ data: user });
      }
    );

    router.put(
      "/impersonate",
      async (req: express.Request, res: express.Response) => {
        req.cookies.set("X-Impersonate", req.body.userId, { httpOnly: true });

        const body = ZChangeRoleRequest.parse(req.body);
        if (body.userId === req.user.id) {
          throw new Error("cannot change your own role");
        }
        const user = await this.userService.changeRole(body.userId, body.role);
        res.json({ data: user });
      }
    );

    return router;
  }
}