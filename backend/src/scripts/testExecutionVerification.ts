import { evaluateCodeSubmission } from "../services/codeExecutionService.js";
import { mbppCuratedQuestions } from "../data/mbppQuestions.js";

async function runVerification() {
  console.log("🧪 Running MultiPL-E & Code Execution Engine Verifications...\n");

  const q1 = mbppCuratedQuestions[0]; // MBPP 8: Square Numbers
  console.log(`Testing Question: ${q1.title}`);

  // Test 1: Correct C++ submission
  console.log("\n[1] Testing C++ with Correct Solution...");
  const validCppCode = `
std::vector<long> square_nums(std::vector<long> nums) {
    std::vector<long> res;
    for (auto x : nums) res.push_back(x * x);
    return res;
}
`;
  const res1 = await evaluateCodeSubmission({
    question: q1,
    language: "cpp",
    code: validCppCode,
    isSubmit: true
  });
  console.log("Result 1:", res1.success ? "✅ PASSED" : "❌ FAILED", "-", res1.message);
  if (!res1.success) throw new Error("Expected valid C++ to pass!");

  // Test 2: Incorrect C++ submission (should fail assertion)
  console.log("\n[2] Testing C++ with Incorrect Solution...");
  const wrongCppCode = `
std::vector<long> square_nums(std::vector<long> nums) {
    return nums; // Wrong logic
}
`;
  const res2 = await evaluateCodeSubmission({
    question: q1,
    language: "cpp",
    code: wrongCppCode,
    isSubmit: true
  });
  console.log("Result 2:", !res2.success ? "✅ CORRECTLY CAUGHT" : "❌ UNEXPECTED PASS", "-", res2.message);
  if (res2.success) throw new Error("Expected wrong C++ to fail!");

  // Test 3: Correct Python submission
  console.log("\n[3] Testing Python with Correct Solution...");
  const validPyCode = `
def square_nums(nums: list[int]) -> list[int]:
    return [x * x for x in nums]
`;
  const res3 = await evaluateCodeSubmission({
    question: q1,
    language: "python",
    code: validPyCode,
    isSubmit: true
  });
  console.log("Result 3:", res3.success ? "✅ PASSED" : "❌ FAILED", "-", res3.message);
  if (!res3.success) throw new Error("Expected valid Python to pass!");

  // Test 4: Incorrect Python submission
  console.log("\n[4] Testing Python with Incorrect Solution...");
  const wrongPyCode = `
def square_nums(nums: list[int]) -> list[int]:
    return nums
`;
  const res4 = await evaluateCodeSubmission({
    question: q1,
    language: "python",
    code: wrongPyCode,
    isSubmit: true
  });
  console.log("Result 4:", !res4.success ? "✅ CORRECTLY CAUGHT" : "❌ UNEXPECTED PASS", "-", res4.message);
  if (res4.success) throw new Error("Expected wrong Python to fail!");

  // Test 5: Correct JavaScript submission
  console.log("\n[5] Testing JavaScript with Correct Solution...");
  const validJsCode = `
function square_nums(nums) {
    return nums.map(x => x * x);
}
`;
  const res5 = await evaluateCodeSubmission({
    question: q1,
    language: "javascript",
    code: validJsCode,
    isSubmit: true
  });
  console.log("Result 5:", res5.success ? "✅ PASSED" : "❌ FAILED", "-", res5.message);
  if (!res5.success) throw new Error("Expected valid JavaScript to pass!");

  // Test 6: Sample test mode (Run Code vs Submit Solution)
  console.log("\n[6] Testing Sample Test Run (isSubmit = false)...");
  const res6 = await evaluateCodeSubmission({
    question: q1,
    language: "cpp",
    code: validCppCode,
    isSubmit: false
  });
  console.log("Result 6:", res6.success ? "✅ PASSED" : "❌ FAILED", "-", res6.message);
  if (!res6.success || !res6.message.includes("Sample")) throw new Error("Expected sample test message!");

  // Test 7: Testing Question 2 (MBPP 3 - Non Prime) in C++
  const q2 = mbppCuratedQuestions[1];
  console.log(`\n[7] Testing ${q2.title} in C++...`);
  const validCppQ2 = `
bool is_not_prime(long n) {
    if (n <= 1) return true;
    for (long i = 2; i * i <= n; ++i) {
        if (n % i == 0) return true;
    }
    return false;
}
`;
  const res7 = await evaluateCodeSubmission({
    question: q2,
    language: "cpp",
    code: validCppQ2,
    isSubmit: true
  });
  console.log("Result 7:", res7.success ? "✅ PASSED" : "❌ FAILED", "-", res7.message);
  if (!res7.success) throw new Error("Expected valid C++ Q2 to pass!");

  // Test 8: Testing Question 2 (MBPP 3 - Non Prime) in Python
  console.log(`\n[8] Testing ${q2.title} in Python...`);
  const validPyQ2 = `
def is_not_prime(n: int) -> bool:
    if n <= 1:
        return True
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return True
    return False
`;
  const res8 = await evaluateCodeSubmission({
    question: q2,
    language: "python",
    code: validPyQ2,
    isSubmit: true
  });
  console.log("Result 8:", res8.success ? "✅ PASSED" : "❌ FAILED", "-", res8.message);
  if (!res8.success) throw new Error("Expected valid Python Q2 to pass!");

  console.log("\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
