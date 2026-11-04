import { auth } from "@/infrastructure/authentication/auth";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "./validation";
import { ValidationError } from "@/shared/errors/domain-error";

/**
 * Generate an internal synthetic email address to satisfy Better Auth's internal schema
 * without exposing email to the user.
 */
export function generateInternalEmail(username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `${sanitized}@telos.internal`;
}

export class AuthService {
  /**
   * Register a user with username and password only.
   */
  static async register(input: RegisterInput) {
    const parseResult = registerSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid registration details", parseResult.error.errors);
    }

    const { username, password } = parseResult.data;
    const internalEmail = generateInternalEmail(username);

    // Call Better Auth to create the user account
    const user = await auth.api.signUpEmail({
      body: {
        name: username,
        email: internalEmail,
        password: password,
        username: username.toLowerCase(),
      },
    });

    return user;
  }

  /**
   * Authenticate a user by username and password.
   */
  static async login(input: LoginInput) {
    const parseResult = loginSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError("Invalid login credentials", parseResult.error.errors);
    }

    const { username, password } = parseResult.data;
    return auth.api.signInUsername({
      body: {
        username: username.toLowerCase(),
        password: password,
      },
    });
  }
}
