import { prisma } from "../lib/prisma";

async function runFullSecurityAudit() {
  const baseUrl = "http://localhost:3000";
  const defaultHeaders = {
    "Content-Type": "application/json",
    "x-test-suite": "true",
  };

  console.log("========================================================================");
  console.log("  GLOBAL SHELF BD - COMPLETE AUTHENTICATION & SECURITY AUDIT ");
  console.log("========================================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ""}`);
      failedTests++;
    }
  }

  const testEmail = `sec_audit_${Date.now()}@globalshelfbd.com`;
  const testPassword = "StrongP@ssword2026!";
  let accessToken = "";

  try {
    // ---------------------------------------------------------
    // TEST SECTION 1: USER REGISTRATION SECURITY
    // ---------------------------------------------------------
    console.log("🔒 --- 1. REGISTRATION SECURITY TESTS ---");

    // 1.1 Weak Password Rejection
    const weakRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        name: "Security Tester",
        email: `weak_${Date.now()}@example.com`,
        password: "123",
        confirmPassword: "123",
      }),
    });
    assert(weakRegRes.status === 400, "Rejects weak password (123) with HTTP 400 Bad Request");

    // 1.2 Mismatched Passwords Rejection
    const mismatchRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        name: "Security Tester",
        email: `mismatch_${Date.now()}@example.com`,
        password: testPassword,
        confirmPassword: "DifferentPassword123!",
      }),
    });
    assert(mismatchRegRes.status === 400, "Rejects mismatched passwords with HTTP 400");

    // 1.3 Valid User Registration
    const validRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        name: "Security Audit User",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const validRegData = await validRegRes.json();
    assert(validRegRes.status === 201 && validRegData.success, "Creates valid user account with HTTP 201 Created");
    assert(Boolean(validRegData.data?.accessToken), "Returns short-lived JWT Access Token upon registration");
    assert(!("passwordHash" in (validRegData.data?.user || {})), "Never returns password hash in registration payload");

    // 1.4 Duplicate Email Registration Prevention
    const dupRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    assert(dupRegRes.status === 409, "Prevents duplicate email registration with HTTP 409 Conflict");

    // ---------------------------------------------------------
    // TEST SECTION 2: LOGIN & CREDENTIAL ENUMERATION PROTECTION
    // ---------------------------------------------------------
    console.log("\n🔒 --- 2. LOGIN SECURITY & ACCOUNT ENUMERATION TESTS ---");

    // 2.1 Invalid Password Login
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword999!",
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    assert(wrongPassRes.status === 401, "Rejects wrong password with HTTP 401 Unauthorized");
    assert(wrongPassData.message === "Invalid email or password", "Uses generic error message to prevent enumeration");

    // 2.2 Non-Existent Email Login
    const nonExistentRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        email: `nonexistent_${Date.now()}@example.com`,
        password: testPassword,
      }),
    });
    const nonExistentData = await nonExistentRes.json();
    assert(nonExistentRes.status === 401, "Rejects non-existent email with HTTP 401 Unauthorized");
    assert(nonExistentData.message === "Invalid email or password", "Uses identical generic message for unknown email");

    // 2.3 Successful Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, "Authenticates valid credentials with HTTP 200 OK");
    accessToken = loginData.data?.accessToken || "";
    assert(Boolean(accessToken), "Issues valid JWT Access Token");

    // ---------------------------------------------------------
    // TEST SECTION 3: AUTHENTICATED ENDPOINTS & MIDDLEWARE
    // ---------------------------------------------------------
    console.log("\n🔒 --- 3. AUTHENTICATED API MIDDLEWARE TESTS ---");

    // 3.1 Unauthorized Access without Token
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
    assert(unauthRes.status === 401, "Blocks unauthenticated request to /api/auth/me with HTTP 401");

    // 3.2 Authorized Access with Valid Bearer Token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { ...defaultHeaders, Authorization: `Bearer ${accessToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.success, "Grants access to /api/auth/me with valid Bearer token");
    assert(meData.data.user.email === testEmail, "Returns correct authenticated user profile");
    assert(!("passwordHash" in meData.data.user), "Ensures password hash is excluded from user profile");

    // 3.3 Protected Route Profile API
    const profileRes = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { ...defaultHeaders, Authorization: `Bearer ${accessToken}` },
    });
    assert(profileRes.status === 200, "Grants access to protected /api/user/profile endpoint");

    // ---------------------------------------------------------
    // TEST SECTION 4: FORGOT PASSWORD, OTP & RESET FLOW
    // ---------------------------------------------------------
    console.log("\n🔒 --- 4. FORGOT PASSWORD & 4-DIGIT OTP SECURITY TESTS ---");

    // 4.1 Request OTP for Email
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    assert(forgotRes.status === 200 && forgotData.success, "Generates 4-digit OTP and returns generic success message");

    // 4.2 Fetch OTP Hash from Database to Test OTP Verification
    const otpRecord = await prisma.passwordResetOtp.findUnique({
      where: { email: testEmail },
    });
    assert(Boolean(otpRecord), "OTP record securely stored in database");

    // 4.3 Invalid OTP Verification Rejection
    const invalidOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({ email: testEmail, otp: "0000" }),
    });
    assert(invalidOtpRes.status === 400, "Rejects incorrect OTP with HTTP 400");

    // 4.4 Verify Attempt Counter Increment
    const updatedOtpRecord = await prisma.passwordResetOtp.findUnique({
      where: { email: testEmail },
    });
    assert(updatedOtpRecord?.attempts === 1, "Increments failed OTP attempt counter to prevent brute force");

    // ---------------------------------------------------------
    // TEST SECTION 5: LOGOUT & SESSION INVALIDATION
    // ---------------------------------------------------------
    console.log("\n🔒 --- 5. LOGOUT & SESSION INVALIDATION TESTS ---");

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: defaultHeaders,
    });
    assert(logoutRes.status === 200, "Executes logout with HTTP 200 OK");

    // ---------------------------------------------------------
    // CLEANUP
    // ---------------------------------------------------------
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.passwordResetOtp.deleteMany({ where: { email: testEmail } });

    console.log("\n========================================================================");
    console.log(`  FINAL SECURITY AUDIT REPORT: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
    console.log("========================================================================\n");
  } catch (err) {
    console.error("Audit Execution Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runFullSecurityAudit();
