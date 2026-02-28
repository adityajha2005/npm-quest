#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import { program } from "commander";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOUNDS = {
  COMMON: "error_windows_xp_song.mp3",
  RARE: "mario_bros.mp3",
  LEGENDARY: "good_bad_ugly_short.mp3",
  FAILED: "muffin_man.mp3",
  EPIC: "fahhhhh.mp3",
};

program
  .option("--epic", "Always show dragon ASCII + use fahhh sound for legendary")
  .option("--silent", "No audio playback")
  .option("--hardcore", "Do not retry on first install failure")
  .parse();

const opts = program.opts();

async function runInstall() {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const proc = spawn("npm", ["install"], {
        stdio: ["inherit", "pipe", "pipe"],
    });
    proc.stdout?.on("data", (d) => (stdout += d.toString()));
    proc.stderr?.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      resolve({ code, stdout, stderr, output: stdout + stderr });
    });
  });
}

function classifyResult(result, retryCount) {
  const { code, output } = result;
  const hasWarning =
    /warning/i.test(output) && !/\b0 warnings?\b/i.test(output);
  const hasVuln =
    /vulnerabilit(y|ies)/i.test(output) && !/found 0 vulnerabilities/i.test(output);
  const firstTry = retryCount === 0;

  if (code !== 0) return "FAILED";
  if (!firstTry && code === 0) return "COMMON";
  if (hasWarning || hasVuln) return "RARE";
  return "LEGENDARY";
}

function playSound(tier) {
  if (opts.silent) return;
  const useEpicSound = opts.epic && (tier === "LEGENDARY" || tier === "RARE");
  const file = useEpicSound ? SOUNDS.EPIC : SOUNDS[tier];
  const path = join(__dirname, "sounds", file);
  if (!existsSync(path)) return;
  const plat = process.platform;
  let cmd, args;
  if (plat === "darwin") {
    cmd = "afplay";
    args = [path];
  } else if (plat === "win32") {
    cmd = "cmd";
    args = ["/c", "start", " ", path];
  } else {
    cmd = "mpg123";
    args = ["-q", path];
  }
  spawn(cmd, args, { detached: true, stdio: "ignore" }).unref();
}

async function showResult(tier) {
  const clear = "\x1Bc";
  process.stdout.write(clear);

  const colors = {
    LEGENDARY: chalk.green,
    RARE: chalk.yellow,
    COMMON: chalk.blue,
    FAILED: chalk.red,
  };
  const color = colors[tier] ?? chalk.white;
  const text = figlet.textSync(tier, { font: "Standard" });
  console.log(color(text));

  if (tier === "LEGENDARY") {
    console.log(chalk.green("\n🔥 The dependency gods are pleased.\n"));
  }
  if (tier === "RARE") {
    console.log(chalk.yellow("\n⚠ Warnings linger in the shadows...\n"));
  }
  if (tier === "COMMON") {
    console.log(chalk.blue("\n🟡 It worked... eventually.\n\n"));
  }
  if (tier === "FAILED") {
    console.log(chalk.red("\n☠ The dragon has defeated you.\n"));
  }

  if (tier === "LEGENDARY" || opts.epic) {
    const dragonPath = join(__dirname, "ascii", "dragon.txt");
    if (existsSync(dragonPath)) {
      const dragon = readFileSync(dragonPath, "utf-8");
      console.log(chalk.cyan(dragon));
    }
  }
  if (tier === "COMMON") {
    await animateCommon();
  }
}

const COMMON_FRAMES = [
  `   ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫
  (•‿•)  (•‿•)  (•‿•)
   /|\\    /|\\    /|\\
   / \\    / \\    / \\
  loot!  loot!  loot!`,
  `  ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪
  (‿•)  (•‿)  (•‿•)
  <|>   <|>   <|>
  / \\   / \\   / \\
  loot! loot! loot!`,
  `   ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫
  (•‿•)  (•‿•)  (•‿•)
   \\|/    \\|/    \\|/
   / \\    / \\    / \\
  loot!  loot!  loot!`,
  `  ♫ ♪ ♫ ♪ ♫ ♪ ♫ ♪
  (‿•)  (•‿)  (•‿•)
   |     |     |
  / \\   / \\   / \\
  loot! loot! loot!`,
];

async function animateCommon() {
  const lines = 6;
  const up = (n) => `\x1b[${n}A`;
  const clearLine = "\x1b[2K";
  const down = "\x1b[1B";
  const clearBlock = up(lines) + Array(lines).fill(clearLine + down).join("") + up(lines);
  let frameIdx = 0;

  const draw = () => {
    const frame = COMMON_FRAMES[frameIdx];
    const colored = chalk.blue(frame);
    process.stdout.write(colored);
  };

  process.stdout.write("\n"); // keep animation below COMMON, never override
  draw();
  await new Promise((resolve) => {
    const id = setInterval(() => {
      process.stdout.write(clearBlock);
      frameIdx = (frameIdx + 1) % COMMON_FRAMES.length;
      draw();
    }, 280);
    setTimeout(() => {
      clearInterval(id);
      resolve();
    }, 8000);
  });
}

async function main() {
  if (!existsSync(join(process.cwd(), "package.json"))) {
    console.log(chalk.red("No package.json found. This land has no dungeon."));
    process.exit(1);
  }
  const spinner = ora("Running npm install...").start();
  let result = await runInstall();
  let retryCount = 0;

  if (result.code !== 0 && !opts.hardcore) {
    spinner.text = "Retrying npm install...";
    retryCount = 1;
    result = await runInstall();
  }

  spinner.stopAndPersist({
    symbol: "⚔",
    text: "Battle concluded.",
  });
  const tier = classifyResult(result, retryCount);
  playSound(tier);
  await new Promise((r) => setTimeout(r, 800));
  await showResult(tier);
  if (tier === "FAILED") process.exit(result.code ?? 1);
}

main().catch((err) => {
  console.error(chalk.red("Error:"), err.message);
  process.exit(1);
});
