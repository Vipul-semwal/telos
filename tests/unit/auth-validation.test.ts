import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/modules/auth/validation";
import { generateInternalEmail } from "@/modules/auth/service";

describe("Authentication Validation & Username Strategy", () => {
  it("validates valid username registration without email field", () => {
    const valid = registerSchema.safeParse({
      username: "operator_01",
      password: "secure_password_123",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects usernames that are too short or contain invalid characters", () => {
    // Too short (< 3 chars)
    expect(registerSchema.safeParse({ username: "op", password: "password123" }).success).toBe(false);

    // Invalid characters (spaces, symbols)
    expect(
      registerSchema.safeParse({ username: "user@domain.com", password: "password123" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ username: "user name", password: "password123" }).success,
    ).toBe(false);
  });

  it("rejects passwords under 8 characters", () => {
    const res = registerSchema.safeParse({
      username: "validuser",
      password: "short",
    });
    expect(res.success).toBe(false);
  });

  it("generates deterministic synthetic internal emails without exposing to user", () => {
    expect(generateInternalEmail("Vipul_S")).toBe("vipul_s@telos.internal");
    expect(generateInternalEmail("operator-99")).toBe("operator-99@telos.internal");
  });
});
