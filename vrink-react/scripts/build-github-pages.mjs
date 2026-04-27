import { existsSync } from "node:fs";
import { rm, rename } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const apiDirectory = path.join(projectRoot, "src", "app", "api");
const disabledApiDirectory = path.join(projectRoot, "src", ".api-github-pages-disabled");

function runNextBuild() {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const child = spawn(command, ["next", "build", "--webpack"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
      NEXT_PUBLIC_STATIC_EXPORT: "true",
    },
    stdio: "inherit",
  });

  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`next build exited with code ${code}`));
    });
  });
}

async function main() {
  let apiWasMoved = false;

  try {
    if (existsSync(disabledApiDirectory)) {
      await rm(disabledApiDirectory, { force: true, recursive: true });
    }

    if (existsSync(apiDirectory)) {
      await rename(apiDirectory, disabledApiDirectory);
      apiWasMoved = true;
    }

    await runNextBuild();
  } finally {
    if (apiWasMoved && existsSync(disabledApiDirectory)) {
      await rename(disabledApiDirectory, apiDirectory);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
