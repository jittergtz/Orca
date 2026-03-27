export function parseArgs(argv: string[]) {
  const [command = "", ...rest] = argv;
  const flags: Record<string, string | boolean> = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = rest[index + 1];

    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return { command, flags };
}

export function readRequiredStringFlag(flags: Record<string, string | boolean>, key: string) {
  const value = flags[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing required flag --${key}`);
  }

  return value;
}

export function readOptionalStringFlag(flags: Record<string, string | boolean>, key: string) {
  const value = flags[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function readBooleanFlag(flags: Record<string, string | boolean>, key: string) {
  return flags[key] === true;
}
