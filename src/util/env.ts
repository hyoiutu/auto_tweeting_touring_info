import fs from "fs";

export function getEnv(envName: string): string {
  const env = process.env[envName];

  if (!env) {
    throw new Error(`${envName} is not exist`);
  }

  return env;
}

export function setSecretsEnvs(path: string) {
  if (!fs.existsSync(path)) {
    throw new Error(`${path} is not exist`);
  }
  const files = fs.readdirSync(path);
  for (const file of files) {
    process.env[file] = fs.readFileSync(`${path}/${file}`, "utf-8");
  }
}

export function overWrittenSecretsEnvs(path: string) {
  const files = fs.readdirSync(path);
  for (const file of files) {
    console.log(`${file} - ${getEnv(file)}`);
    fs.writeFileSync(`${path}/${file}`, getEnv(file));
  }
}
