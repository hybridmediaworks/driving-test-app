import {
  PASSWORD_MIN_LENGTH,
  collectErrors,
  validateEmail,
  validateMatch,
  validateNewPassword,
  validatePasswordPresent,
  validateRequired,
} from "./validation";

describe("validateRequired", () => {
  it("returns undefined for non-empty values", () => {
    expect(validateRequired("Ada", "Name")).toBeUndefined();
  });

  it("flags empty and whitespace-only values, using the label", () => {
    expect(validateRequired("", "Name")).toBe("Name is required");
    expect(validateRequired("   ", "Reset code")).toBe("Reset code is required");
  });
});

describe("validateEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(validateEmail("user@example.com")).toBeUndefined();
    expect(validateEmail("a.b+tag@sub.domain.io")).toBeUndefined();
  });

  it("trims surrounding whitespace before validating", () => {
    expect(validateEmail("  user@example.com  ")).toBeUndefined();
  });

  it("requires a value", () => {
    expect(validateEmail("")).toBe("Email is required");
    expect(validateEmail("   ")).toBe("Email is required");
  });

  it("rejects malformed addresses", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address");
    expect(validateEmail("missing@domain")).toBe("Enter a valid email address");
    expect(validateEmail("@no-local.com")).toBe("Enter a valid email address");
    expect(validateEmail("spaces in@email.com")).toBe("Enter a valid email address");
  });
});

describe("validatePasswordPresent", () => {
  it("only checks presence — never length (existing passwords)", () => {
    expect(validatePasswordPresent("x")).toBeUndefined();
    expect(validatePasswordPresent("short")).toBeUndefined();
  });

  it("flags an empty password", () => {
    expect(validatePasswordPresent("")).toBe("Password is required");
  });
});

describe("validateNewPassword", () => {
  it("accepts a password at or above the minimum length", () => {
    expect(validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH))).toBeUndefined();
  });

  it("requires a value", () => {
    expect(validateNewPassword("")).toBe("Password is required");
  });

  it("enforces the minimum length for new passwords", () => {
    expect(validateNewPassword("a".repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    );
  });
});

describe("validateMatch", () => {
  it("passes when the two values are identical", () => {
    expect(validateMatch("secret123", "secret123")).toBeUndefined();
  });

  it("fails with the default message when they differ", () => {
    expect(validateMatch("secret123", "secret124")).toBe("Passwords do not match");
  });

  it("accepts a custom message", () => {
    expect(validateMatch("a", "b", "Nope")).toBe("Nope");
  });
});

describe("collectErrors", () => {
  it("keeps only the fields whose validator produced a message, wrapped in arrays", () => {
    const errors = collectErrors({
      email: validateEmail("bad"),
      password: validatePasswordPresent(""),
      name: validateRequired("Ada", "Name"), // valid -> dropped
    });

    expect(errors).toEqual({
      email: ["Enter a valid email address"],
      password: ["Password is required"],
    });
    expect(errors).not.toHaveProperty("name");
  });

  it("returns an empty object when everything is valid", () => {
    expect(
      collectErrors({
        email: validateEmail("user@example.com"),
        password: validatePasswordPresent("pw"),
      }),
    ).toEqual({});
  });
});
