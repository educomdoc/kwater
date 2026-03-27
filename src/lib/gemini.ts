import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,
  }
});

/**
 * 간단한 텍스트 질문에 대한 답변을 생성합니다.
 */
export async function generateAIResponse(prompt: string) {
  if (!apiKey || apiKey === "여기에_GEMINI_API_KEY_입력") {
    return "AI API 키가 설정되지 않았습니다.";
  }
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI가 답변을 생성하는 중 오류가 발생했습니다.";
  }
}
