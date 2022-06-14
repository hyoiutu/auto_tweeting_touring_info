import fs from "fs";

export function getEnv(envName: string): string {
  const env = process.env[envName];

  if (!env) {
    throw new Error(`${envName} is not exist`);
  }

  return env;
}

export function setSecretsEnvs(path: string) {
  const files = fs.readdirSync(path);
  for (const file of files) {
    process.env[file] = fs.readFileSync(`${path}/${file}`, "utf-8");
  }
}

export function overWritternSecretsEnvs(path: string) {
  const files = fs.readdirSync(path);
  for (const file of files) {
    fs.writeFileSync(`${path}/${file}`, getEnv(file));
  }
}
