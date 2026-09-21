
async function testLiveRoutes() {
  const baseUrl = "http://localhost:3000";
  const testEmail = `user_${Date.now()}@example.com`;
  const testPassword = "StrongPassword123!";
  const testName = "Live Test User";

  console.log("=========================================");
  console.log("  TESTING LIVE HTTP API ROUTES           ");
  console.log("=========================================\n");

  try {
    // 1. Test Registration
    console.log(`1. Testing POST /api/auth/register with ${testEmail}...`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });

    const regData = await regRes.json();
    console.log(`Registration Response Status: ${regRes.status}`, regData);

    if (!regRes.ok || !regData.success) {
      console.error("❌ Registration Failed!");
      return;
    }
    console.log("✅ Registration Passed!");

    // 2. Test Login
    console.log(`\n2. Testing POST /api/auth/login with ${testEmail}...`);
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginRes.json();
    console.log(`Login Response Status: ${loginRes.status}`, loginData);

    if (!loginRes.ok || !loginData.success) {
      console.error("❌ Login Failed!");
      return;
    }
    console.log("✅ Login Passed!");

    const accessToken = loginData.data.accessToken;

    // 3. Test GET /api/auth/me
    console.log("\n3. Testing GET /api/auth/me...");
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = await meRes.json();
    console.log(`GET /api/auth/me Response Status: ${meRes.status}`, meData);

    if (!meRes.ok || !meData.success) {
      console.error("❌ GET /api/auth/me Failed!");
      return;
    }
    console.log("✅ GET /api/auth/me Passed!");

    // 4. Test Forgot Password
    console.log(`\n4. Testing POST /api/auth/forgot-password for ${testEmail}...`);
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const forgotData = await forgotRes.json();
    console.log(`Forgot Password Response Status: ${forgotRes.status}`, forgotData);
    console.log("✅ Forgot Password Passed!");

    console.log("\n=========================================");
    console.log("  ALL LIVE ROUTE TESTS COMPLETED SUCCESS  ");
    console.log("=========================================");
  } catch (err) {
    console.error("Live test failed error:", err);
  }
}

testLiveRoutes();
