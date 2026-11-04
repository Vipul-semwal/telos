export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code = "DOMAIN_ERROR", statusCode = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} with ID '${id}' not found` : `${entity} not found`,
      "NOT_FOUND",
      404,
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized access") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Access forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ValidationError extends DomainError {
  public readonly issues: unknown[];

  constructor(message: string, issues: unknown[] = []) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class CapacityExceededError extends DomainError {
  constructor(message: string) {
    super(message, "CAPACITY_EXCEEDED", 400);
    this.name = "CapacityExceededError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}
