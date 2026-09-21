import { prisma } from "../lib/prisma";
import { hashPassword, comparePassword, generate4DigitOtp, hashOtp, verifyOtp, hashToken } from "../lib/security";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken, signResetToken, verifyResetToken } from "../lib/jwt";
import { registerSchema } from "../lib/validation";

async function runTests() {
  console.log("=================================================");
  console.log("  STARTING AUTOMATED AUTHENTICATION TEST SUITE  ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Password Hashing & Comparison Test
    console.log("--- 1. Security & Hashing Tests ---");
    const rawPassword = "P@ssword123!";
    const hashedPassword = await hashPassword(rawPassword);
    assert(hashedPassword !== rawPassword, "Password should be hashed securely");
    const isValidPassword = await comparePassword(rawPassword, hashedPassword);
    assert(isValidPassword, "Password comparison should return true for valid password");
    const isInvalidPassword = await comparePassword("WrongPassword123!", hashedPassword);
    assert(!isInvalidPassword, "Password comparison should return false for invalid password");

    // 2. OTP Generation & Verification Test
    console.log("\n--- 2. OTP Generation & Verification Tests ---");
    const otp = generate4DigitOtp();
    assert(/^\d{4}$/.test(otp), "OTP should be a 4-digit numeric code");
    const otpHash = hashOtp(otp);
    assert(verifyOtp(otp, otpHash), "OTP verification should succeed for valid OTP");
    assert(!verifyOtp("0000", otpHash === hashOtp("0000") ? "1111" : otpHash), "OTP verification should fail for invalid OTP");

    // 3. JWT Access, Refresh & Reset Token Tests
    console.log("\n--- 3. JWT Token Tests ---");
    const samplePayload = { userId: "user_test_123", email: "test@example.com" };
    const accessToken = signAccessToken(samplePayload);
    const decodedAccess = verifyAccessToken(accessToken);
    assert(decodedAccess !== null && decodedAccess.userId === samplePayload.userId, "Access token verification succeeded");

    const refreshToken = signRefreshToken(samplePayload);
    const decodedRefresh = verifyRefreshToken(refreshToken);
    assert(decodedRefresh !== null && decodedRefresh.email === samplePayload.email, "Refresh token verification succeeded");

    const resetToken = signResetToken(samplePayload.email);
    const decodedReset = verifyResetToken(resetToken);
    assert(decodedReset !== null && decodedReset.email === samplePayload.email, "Reset token verification succeeded");

    // 4. Validation Schema Tests
    console.log("\n--- 4. Zod Input Validation Tests ---");
    const validReg = registerSchema.safeParse({
      name: "Test User",
      email: "testuser@example.com",
      password: "StrongP@ssword1",
      confirmPassword: "StrongP@ssword1",
    });
    assert(validReg.success, "Registration schema passes for valid payload");

    const invalidReg = registerSchema.safeParse({
      name: "",
      email: "not-an-email",
      password: "weak",
      confirmPassword: "different",
    });
    assert(!invalidReg.success, "Registration schema fails for invalid payload");

    // 5. Database Integration & Workflow Test
    console.log("\n--- 5. Database & Flow Tests ---");
    const testEmail = `authtest_${Date.now()}@example.com`;

    // Clean up any existing test user
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Create Test User
    const user = await prisma.user.create({
      data: {
        name: "Test Automation User",
        email: testEmail,
        passwordHash: hashedPassword,
        provider: "local",
      },
    });
    assert(Boolean(user.id), "Database user creation succeeded");

    // Create Refresh Session
    const rToken = signRefreshToken({ userId: user.id, email: user.email });
    const rTokenHash = hashToken(rToken);
    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: rTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    assert(Boolean(session.id), "Database refresh session created");

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    console.log("Database test user cleaned up.");

    console.log("\n=================================================");
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
    console.log("=================================================");
  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
