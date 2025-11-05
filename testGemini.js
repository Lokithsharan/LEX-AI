import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyDKpWbEs8FXRcngg19Vijvt4F7DYMth3N0"; // your key
const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // ✅ this one exists
    const result = await model.generateContent("Write a short sentence about AI in law.");
    console.log("✅ Gemini API test succeeded!");
    console.log("Output:", result.response.text());
  } catch (error) {
    console.error("❌ Gemini API test failed:", error);
  }
}

testGemini();
