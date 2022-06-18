import { execSync } from "child_process";

export default () => {
  execSync("rm -rf ./testFiles");
};
