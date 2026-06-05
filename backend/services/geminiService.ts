import { GoogleGenAI } from "@google/genai";
import { CONFIG } from "../config/config";

let ai: GoogleGenAI | null = null;
if (CONFIG.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: CONFIG.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const CLINICAL_INSTRUCTIONS = `
You are BloodLink AI Triage Coordinator, a clinical decision support system designed specifically to service the twin cities of Rawalpindi and Islamabad, Pakistan.
Your primary objective is managing, advising on, and triaging patient blood requirements, voluntary donor coordination, and healthcare navigation.

PROMPT DIRECTIVES & CLINICAL COMPLIANCE:
- If the user has a medical emergency or requires immediate blood, classify this as a high urgency case. Advise them to use the SOS request form in our web platform immediately or dial the emergency Helpline +92 51 1122.
- Provide real nearby hospital insights based on Rawalpindi/Islamabad geography (e.g., Holy Family Hospital, BBH, PIMS, Shifa International) and recommend matching blood groups if they specify a recipient blood group!
- Keep your description clear and formatting clean with standard Markdown bullet points.
`;

export async function askGemini(
  message: string,
  history: { sender: 'user' | 'ai'; text: string }[],
  language: "en" | "ur",
  isEmergencyAlert: boolean,
  classifierLabel: string,
  classifierConfidence: number
): Promise<string> {
  if (ai) {
    try {
      const metadataInstruction = `\n[CLASSIFIER METADATA - Patient Intent: "${classifierLabel}" with ${classifierConfidence}% confidence score. Tailor your answer specifically to address this parsed intent with clinical precision].`;
      const instructions = CLINICAL_INSTRUCTIONS + metadataInstruction;

      const historyPrompt = history.slice(-5).map(m => 
        `${m.sender === 'user' ? 'Patient' : 'BloodLink AI'}: ${m.text}`
      ).join("\n");
      const completePrompt = `${historyPrompt}\nPatient: ${message}\nBloodLink AI:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: completePrompt,
        config: {
          systemInstruction: instructions,
          temperature: 0.7,
        }
      });

      return response.text || "I am processing your query. Please locate the donor list or SOS request on our dashboard for immediate matching.";
    } catch (err) {
      console.error("Gemini API generation error:", err);
      return getFallbackResponse(message, language, isEmergencyAlert);
    }
  }

  return getFallbackResponse(message, language, isEmergencyAlert);
}

export function getFallbackResponse(message: string, lang: "en" | "ur", isSOS: boolean): string {
  const lowercase = message.toLowerCase();
  
  if (lang === 'ur') {
    if (isSOS) {
      return `🚨 **فوری ہنگامی امداد کا نوٹس:**\nہمیں ایسا لگتا ہے کہ آپ کو فوری خون کی ضرورت ہے۔ برائے مہربانی فوری طور پر ہمارے ویب پیج پر موجود **SOS Request Emergency** فارم کو پُر کریں یا ہماری ہیلپ لائن **1122** پر کال کریں۔\n\nراولپنڈی اور اسلام آباد میں خون کے عطیات کے لیے پمز اسلام آباد (PIMS) اور ہولی فیملی ہسپتال راولپنڈی 24 گھنٹے دستیاب ہیں۔`;
    }
    return `بونڈلنک AI میں خوش آمدید۔ میں آپ کی کیا مدد کر سکتا ہوں؟ آپ ہمارے ہسپتالوں کی معلومات حاصل کر سکتے ہیں، خون کے گروپ تلاش کر سکتے ہیں، یا عطیہ دہندگان سے رابطہ کر سکتے ہیں۔`;
  }

  // English fallback
  if (isSOS) {
    return `🚨 **EMERGENCY ASSISTANCE TRIAGE ALERT:**\nIt looks like you are describing a critical situation. Please fill out our **SOS Emergency Request Form** on the sidebar instantly to broadcast alert notifications to compatible O-, A-, B+, or other available donors in Twin Cities.\n\n*Recommended Hospitals with 24/7 emergency blood banks:*\n- **PIMS Islamabad:** +92 51 9261170\n- **Holy Family Hospital Rawalpindi:** +92 51 9290321\n- **Shifa International Islamabad:** +92 51 8463000`;
  }

  if (lowercase.includes("compatibility") || lowercase.includes("compatible")) {
    return `💡 **Blood Compatibility Guide:**\n- **O-Negative** is the Universal Red Cell Donor (can donate to all groups).\n- **AB-Positive** is the Universal Recipient (can receive from all groups).\n- A- can donate to A+, A-, AB+ and AB-.\n- B- can donate to B+, B-, AB+ and AB-.\n\nWould you like me to find compatible donors registered in Rawalpindi or Islamabad right now?`;
  }

  return `Welcome to **BloodLink AI**! 🩸\n\nI can assist you with Twin Cities blood donation resources:\n1. **Find compatible donors** in G-11, G-8, Sector F-10, Holy Family or Saddar.\n2. **Triage active emergencies** and broadcast notifications instantly.\n3. **Map upcoming camps** at Centaurus Mall or Giga Mall.\n\nHow can I support your healthcare requirements today?`;
}
