import * as dotenv from "dotenv";
dotenv.config();
import express from "express"; // eslint-disable-line
import "express-async-errors"; // eslint-disable-line

import cors from "cors";
import { expressjwt } from "express-jwt";
import { expressJwtSecret } from "jwks-rsa";

import { UserInformationMiddleware } from "./middleware/user-information-middleware";
import { FormSubmissionRouter } from "./routers/form-submission";
import { HealthRouter } from "./routers/health";
import { TokenRouter } from "./routers/token";
import { UserRouter } from "./routers/user";
import { Auth0Service } from "./services/auth0/auth0-service";
import { PsqlFormSubmissionService } from "./services/form-submission-service";
import { HealthService } from "./services/health-service";
import { PsqlUserService } from "./services/psql-user-service";
import { SETTINGS } from "./settings";
import { POOL } from "./sql";
import { errorLogger } from "./middleware/error-logger";
import { errorResponder } from "./middleware/error-responder";
import { invalidPathHandler } from "./middleware/invalid-path-handler";

console.log("Booting application!");

const jwtCheck = expressjwt({
  secret: expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: SETTINGS.auth.jwksUri,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,
  audience: SETTINGS.auth.audience,
  issuer: SETTINGS.auth.issuer,
  algorithms: ["RS256"],
});

async function start() {
  const app = express();

  const pool = await POOL;

  app.use(
    express.json({
      verify: function (req, _, buf) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(cors({ origin: "*" }));

  const healthService = new HealthService(pool);
  const formSubmissionService = new PsqlFormSubmissionService(pool);

  const auth0Service = new Auth0Service(
    SETTINGS.auth.issuerBaseUrl,
    SETTINGS.auth.machineSecret,
    SETTINGS.auth.machineClientId,
    SETTINGS.auth.machineAudience,
    SETTINGS.auth.domain
  );

  const userService = new PsqlUserService(pool);

  const healthRouter = new HealthRouter(healthService).init();
  const formSubmissionRouter = new FormSubmissionRouter(
    formSubmissionService
  ).init();

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/form-submission", formSubmissionRouter);

  const userInformationMiddleware = new UserInformationMiddleware(
    userService,
    auth0Service
  );

  const userIsVerified = userInformationMiddleware.ensureUserVerified();
  const addUser = userInformationMiddleware.addUser();

  app.use(
    "/api/v1/users",
    jwtCheck,
    addUser,
    userIsVerified,
    new UserRouter(auth0Service).init()
  );
  app.use(
    "/api/v1/token",
    jwtCheck,
    addUser,
    userIsVerified,
    new TokenRouter().init()
  );

  app.use(errorLogger);
  app.use(errorResponder);
  app.use(invalidPathHandler);

  app.listen(SETTINGS.port, SETTINGS.host);
}

start();
