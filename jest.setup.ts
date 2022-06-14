import { setSecretsEnvs } from "./src/util/env";
import dotenv from "dotenv";

dotenv.config();
setSecretsEnvs("./secrets");
