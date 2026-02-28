# npm-quest

Turn `npm install` into a fantasy RPG-style dungeon raid: tiered outcomes, ASCII art, and sound effects.

**Requires:** Node.js 18+

---

## Install

```bash
npm install -g npm-quest
```

Or clone and link:

```bash
git clone https://github.com/adityajha2005/npm-quest.git
cd npm-quest
npm install
npm link
```

---

## Usage

Run from any directory that has a `package.json`:

```bash
npm-quest
```

**Not** `npm quest` (space) — use the hyphen: `npm-quest`.

---

## Tiers

| Tier | When | Sound |
|------|------|--------|
| **LEGENDARY** | Clean install, first try, no warnings/vulns | good_bad_ugly |
| **RARE** | Install OK but has warnings or vulnerabilities | mario_bros |
| **COMMON** | First run failed, retry succeeded | windows_xp_error |
| **FAILED** | Still fails after retry | muffin_man |

---

## Flags

| Flag | Description |
|------|-------------|
| `--epic` | Always show dragon ASCII; use fahhh sound for LEGENDARY/RARE |
| `--silent` | No audio |
| `--hardcore` | No retry on first failure |

**Examples**

```bash
npm-quest --epic
npm-quest --silent
npm-quest --hardcore
```

---

## Demo folders

From the repo root you can try each tier:

| Folder | Tier | Command |
|--------|------|---------|
| `legendary/` | LEGENDARY | `cd legendary && npm-quest` |
| `rare/` | RARE | `cd rare && npm-quest` |
| `common/` | COMMON | `cd common && npm-quest` (first run fails, retry wins) |
| `failed/` | FAILED | `cd failed && npm-quest` |

To re-demo **COMMON**, reset then run again:

```bash
cd common && rm -rf node_modules .common-first-done && npm-quest
```

---

## No package.json

If you run `npm-quest` in a directory without `package.json`, it exits with:

> No package.json found. This land has no dungeon.

---

## License

ISC
