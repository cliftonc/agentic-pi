import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../src/args.js";

describe("parseArgs", () => {
  test("--model is required", () => {
    assert.throws(() => parseArgs([]), /--model is required/);
  });

  test("--model must be 'provider/id'", () => {
    assert.throws(
      () => parseArgs(["--model", "gpt-4"]),
      /must be 'provider\/id'/,
    );
  });

  test("minimal happy path", () => {
    const cfg = parseArgs(["--model", "openai/gpt-4"]);
    assert.equal(cfg.model, "openai/gpt-4");
    assert.equal(cfg.sandbox, "none");
    assert.equal(cfg.noSession, false);
    assert.equal(cfg.dangerouslySkipPermissions, false);
  });

  test("--thinking accepts valid levels", () => {
    for (const level of ["off", "minimal", "low", "medium", "high", "xhigh"]) {
      const cfg = parseArgs(["--model", "openai/gpt-4", "--thinking", level]);
      assert.equal(cfg.thinking, level);
    }
  });

  test("--variant is an alias for --thinking", () => {
    const cfg = parseArgs(["--model", "openai/gpt-4", "--variant", "high"]);
    assert.equal(cfg.thinking, "high");
  });

  test("--thinking rejects invalid levels", () => {
    assert.throws(
      () => parseArgs(["--model", "openai/gpt-4", "--thinking", "extreme"]),
      /invalid --thinking/,
    );
  });

  test("--sandbox accepts none and gondolin", () => {
    assert.equal(
      parseArgs(["--model", "openai/gpt-4", "--sandbox", "none"]).sandbox,
      "none",
    );
    assert.equal(
      parseArgs(["--model", "openai/gpt-4", "--sandbox", "gondolin"]).sandbox,
      "gondolin",
    );
  });

  test("--sandbox rejects unknown values", () => {
    assert.throws(
      () => parseArgs(["--model", "openai/gpt-4", "--sandbox", "firecracker"]),
      /invalid --sandbox/,
    );
  });

  test("--dangerously-skip-permissions is accepted (no-op)", () => {
    const cfg = parseArgs([
      "--model",
      "openai/gpt-4",
      "--dangerously-skip-permissions",
    ]);
    assert.equal(cfg.dangerouslySkipPermissions, true);
  });

  test("--tools parses comma-separated list", () => {
    const cfg = parseArgs(["--model", "openai/gpt-4", "--tools", "read,bash,github_get_repository"]);
    assert.deepEqual(cfg.tools, ["read", "bash", "github_get_repository"]);
  });

  test("--no-session and --no-builtin-tools are boolean", () => {
    const cfg = parseArgs([
      "--model",
      "openai/gpt-4",
      "--no-session",
      "--no-builtin-tools",
    ]);
    assert.equal(cfg.noSession, true);
    assert.equal(cfg.noBuiltinTools, true);
  });

  test("--sandbox-env captures one KEY=VAL pair", () => {
    const cfg = parseArgs(["--model", "openai/gpt-4", "--sandbox-env", "FOO=bar"]);
    assert.deepEqual(cfg.sandboxEnv, { FOO: "bar" });
  });

  test("--sandbox-env is repeatable and accumulates", () => {
    const cfg = parseArgs([
      "--model", "openai/gpt-4",
      "--sandbox-env", "A=1",
      "--sandbox-env", "B=2",
      "--sandbox-env", "C=three=with=equals",
    ]);
    assert.deepEqual(cfg.sandboxEnv, { A: "1", B: "2", C: "three=with=equals" });
  });

  test("--sandbox-env allows empty value", () => {
    const cfg = parseArgs(["--model", "openai/gpt-4", "--sandbox-env", "EMPTY="]);
    assert.deepEqual(cfg.sandboxEnv, { EMPTY: "" });
  });

  test("--sandbox-env rejects values without '='", () => {
    assert.throws(
      () => parseArgs(["--model", "openai/gpt-4", "--sandbox-env", "JUSTKEY"]),
      /must be KEY=VAL/,
    );
  });

  test("--sandbox-env rejects empty KEY", () => {
    assert.throws(
      () => parseArgs(["--model", "openai/gpt-4", "--sandbox-env", "=value"]),
      /must be KEY=VAL/,
    );
  });

  test("--sandbox-env rejects invalid identifier characters", () => {
    for (const bad of ["FOO-BAR", "foo bar", "1FOO", "foo.bar"]) {
      assert.throws(
        () => parseArgs(["--model", "openai/gpt-4", "--sandbox-env", `${bad}=x`]),
        /POSIX identifier/,
        `expected reject: ${bad}`,
      );
    }
  });

  test("--sandbox-env later key overrides earlier", () => {
    const cfg = parseArgs([
      "--model", "openai/gpt-4",
      "--sandbox-env", "X=first",
      "--sandbox-env", "X=second",
    ]);
    assert.deepEqual(cfg.sandboxEnv, { X: "second" });
  });

  test("--sandbox-image captures a path", () => {
    const cfg = parseArgs([
      "--model", "openai/gpt-4",
      "--sandbox-image", "/abs/path/to/image",
    ]);
    assert.equal(cfg.sandboxImage, "/abs/path/to/image");
  });

  test("--sandbox-image accepts named selectors (resolution deferred)", () => {
    const cfg = parseArgs([
      "--model", "openai/gpt-4",
      "--sandbox-image", "default",
    ]);
    assert.equal(cfg.sandboxImage, "default");
  });

  test("--sandbox-image rejects empty value", () => {
    assert.throws(
      () => parseArgs(["--model", "openai/gpt-4", "--sandbox-image", ""]),
      /requires a non-empty value/,
    );
  });

  test("unknown flag throws", () => {
    assert.throws(
      () => parseArgs(["--model", "openai/gpt-4", "--bogus"]),
      /unknown flag/,
    );
  });

  test("flag without value throws", () => {
    assert.throws(
      () => parseArgs(["--model"]),
      /requires a value/,
    );
  });
});
