// Vercel Serverless Function: AI Triage Turn (Nurse Priya)
// Powered by Groq API inference with automatic clinical fallback

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const NURSE_SYSTEM_PROMPT = `You are **Staff Nurse Priya** — a warm, compassionate, and clinically experienced AI Triage Nurse at Sanjeevani Hospital (AIIMS/NABH Standards, India).
You possess vast, up-to-date clinical knowledge of diseases, symptoms, medical guidelines (ICD-11, WHO, Indian National Health Mission protocols), and triage algorithms.

## YOUR CLINICAL PERSONA & BEDSIDE MANNER:
- Introduce yourself gently as "Nurse Priya" if this is the start of the conversation.
- Speak with warmth, reassurance, and empathy — acknowledge the patient's discomfort and anxiety before asking questions.
- Keep explanations simple, reassuring, and free of unnecessary medical jargon so any patient can understand.
- **Ask only ONE clear, focused question per turn** to never overwhelm an ill patient.
- Never make a definitive final diagnosis; your role is clinical triage, safety assessment, symptom characterization, reassurance, and urgent escalation if needed.

## MEDICAL KNOWLEDGE BASE (Covering all major disease categories & symptoms):
1. **Infectious & Tropical Diseases**: Dengue, Malaria, Typhoid, Chikungunya, COVID-19 & Influenza, Tuberculosis, Viral Hepatitis.
2. **Cardiovascular Emergencies & Conditions**: Acute Myocardial Infarction / Angina, Arrhythmias, Congestive Heart Failure, Hypertensive Crisis.
3. **Neurological Conditions**: Acute Stroke (FAST), Meningitis, Migraine, Epilepsy, Vertigo.
4. **Respiratory Disorders**: Bronchial Asthma, COPD Exacerbation, Pneumonia, Acute Bronchitis, Pulmonary Embolism.
5. **Gastroenterology & Abdominal Emergencies**: Acute Appendicitis, Pancreatitis, Cholecystitis, Acid Peptic Disease / GERD, Gastroenteritis.
6. **Musculoskeletal & Orthopedics**: Acute Fractures, Sprains, Osteoarthritis, Sciatica.
7. **Endocrine & Metabolic**: Diabetes Mellitus, Thyroid Disorders.
8. **Obstetrics & Gynecology**: Pregnancy complications, Dysmenorrhea.
9. **Pediatric Illnesses**: High fever with febrile convulsions, dehydration, croup.
10. **Dermatology & Allergies**: Urticaria, Angioedema, Anaphylaxis, Eczema, Psoriasis.
11. **ENT & Ophthalmology**: Acute Otitis Media, Sinusitis, Tonsillitis, Acute glaucoma.
12. **Urology & Nephrology**: Kidney Stones, UTI.
13. **AYUSH & Holistic Integration**: Ayurvedic Prakriti/Vikriti, Agni.

## SOCRATES CLINICAL INTERVIEW PROTOCOL (Ask adaptively, step-by-step):
- Site, Onset, Character, Radiation, Associations, Time course, Exacerbating / Relieving, Severity (1-10).

## RED FLAG CRITICAL EMERGENCIES (Set is_emergency: true immediately!):
- Central crushing chest pain radiating to left arm/jaw, diaphoresis, dyspnea.
- Sudden stroke signs: facial droop, arm weakness, slurred speech.
- Severe acute breathlessness, cyanosis, inability to speak.
- Massive bleeding, convulsions, loss of consciousness.
- High fever >103°F with severe neck stiffness and confusion.

## HOSPITAL DEPARTMENTS FOR ROUTING:
GENERAL_MEDICINE, CARDIOLOGY, EMERGENCY, NEUROLOGY, ORTHOPEDICS,
PULMONOLOGY, GASTROENTEROLOGY, PEDIATRICS, GYNECOLOGY, DERMATOLOGY,
ENT, OPHTHALMOLOGY, UROLOGY, PSYCHIATRY, ENDOCRINOLOGY, AYURVEDA

## STRICT OUTPUT REQUIREMENT:
You MUST ALWAYS respond ONLY in valid JSON with NO commentary outside the JSON object:
{
  "ai_response": "Nurse Priya's compassionate answer and next single question in the patient's language",
  "is_emergency": false,
  "suggested_department": "GENERAL_MEDICINE",
  "socrates_extracted": {
    "site": "",
    "onset": "",
    "character": "",
    "radiation": "",
    "associations": "",
    "time_course": "",
    "exacerbating_relieving": "",
    "severity": ""
  },
  "ayush_extracted": {},
  "quick_replies": ["Short Option 1", "Short Option 2", "Short Option 3"]
}`;

function cleanMarkdownJson(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

function safeParseJson(raw) {
  const cleaned = cleanMarkdownJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        try {
          const repaired = match[0].replace(/'([a-zA-Z0-9_]+)':/g, '"$1":');
          return JSON.parse(repaired);
        } catch (e3) {}
      }
    }
  }
  return null;
}

function clinicalFallback(patientInput = '', language = 'English') {
  const text = (patientInput || '').toLowerCase();
  const isEmergency = /chest pain|heart attack|stroke|unconscious|cannot breathe|can't breathe|breathless|severe bleeding|seizure|convulsion|छाती में दर्द|सांस नहीं|बेहोश|দাঁতে दर्द/i.test(text);

  let dept = 'GENERAL_MEDICINE';
  if (isEmergency) dept = 'EMERGENCY';
  else if (/chest|heart|palpitation|छाती|दिल/i.test(text)) dept = 'CARDIOLOGY';
  else if (/head|headache|migraine|dizzy|vertigo|सिर|चक्कर/i.test(text)) dept = 'NEUROLOGY';
  else if (/bone|joint|fracture|knee|back|हड्डी|घुटने|कमर/i.test(text)) dept = 'ORTHOPEDICS';
  else if (/skin|rash|itch|त्वचा|खुजली/i.test(text)) dept = 'DERMATOLOGY';
  else if (/stomach|abdomen|vomit|nausea|acid|पेट|उल्टी|दस्त/i.test(text)) dept = 'GASTROENTEROLOGY';
  else if (/breath|asthma|cough|cold|fever|lung|खांसी|दमा|बुखार/i.test(text)) dept = 'PULMONOLOGY';
  else if (/child|baby|infant|बच्चा/i.test(text)) dept = 'PEDIATRICS';
  else if (/period|pregnancy|menstrual|गर्भवती/i.test(text)) dept = 'GYNECOLOGY';
  else if (/eye|vision|आंख/i.test(text)) dept = 'OPHTHALMOLOGY';
  else if (/ear|throat|कान|गला/i.test(text)) dept = 'ENT';

  let response = "Namaste, I am Nurse Priya. I understand your discomfort. Could you please let me know — when did this symptom first start?";
  let replies = ["Started today", "Started yesterday", "2-3 days ago", "More than a week"];

  if (isEmergency) {
    if (language === 'Hindi') {
      response = "यह एक गंभीर आपातकालीन स्थिति हो सकती है। कृपया शांत रहें, हम तुरंत इमरजेंसी टीम को सूचित कर रहे हैं। क्या कोई आपके साथ मौजूद है?";
      replies = ["हाँ, कोई साथ है", "नहीं, मैं अकेला हूँ", "इमरजेंसी में हूँ"];
    } else if (language === 'Bengali') {
      response = "এটি একটি জরুরি অবস্থা হতে পারে। অনুগ্রহ করে শান্ত থাকুন, আমরা অবিলম্বে ইমার্জেন্সি টিমে জানাচ্ছি। আপনার সাথে কি কেউ আছেন?";
      replies = ["হ্যাঁ, কেউ সাথে আছেন", "না, আমি একা", "জরুরি বিভাগে আছি"];
    } else {
      response = "This sounds like a serious emergency. Please stay calm — I am escalating this directly to our Emergency department. Is someone with you right now?";
      replies = ["Yes, someone is with me", "No, I am alone", "I need immediate help"];
    }
  } else {
    if (language === 'Hindi') {
      response = "नमस्ते, मैं सिस्टर प्रिया हूँ। मैंने आपकी समस्या नोट कर ली है। क्या आप बता सकते हैं कि यह परेशानी कब से शुरू हुई है?";
      replies = ["आज से शुरू हुआ", "कल से शुरू हुआ", "कुछ दिनों से", "एक हफ्ते से ज़्यादा"];
    } else if (language === 'Bengali') {
      response = "নমস্কার, আমি সিস্টার প্রিয়া। আমি আপনার সমস্যার কথা বুঝতে পেরেছি। বলতে পারবেন এই সমস্যাটি কবে থেকে শুরু হয়েছে?";
      replies = ["আজ থেকে", "গতকাল থেকে", "কয়েক দিন ধরে", "এক সপ্তাহের বেশি"];
    }
  }

  return {
    ai_response: response,
    is_emergency: isEmergency,
    suggested_department: dept,
    socrates_extracted: { onset: "Recent" },
    ayush_extracted: {},
    quick_replies: replies
  };
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { patient_input = '', language = 'English', conversation_history = [] } = req.body || {};

  const langInstruction = `\n\n### CRITICAL LANGUAGE DIRECTIVE:\nThe patient is speaking in **${language}**.\nYou MUST formulate your 'ai_response' and 'quick_replies' strictly in **${language}**.\nAll JSON keys and clinical fields (like suggested_department) MUST remain in standard English.`;

  const messages = [
    { role: 'system', content: NURSE_SYSTEM_PROMPT + langInstruction }
  ];

  const recentHistory = Array.isArray(conversation_history) ? conversation_history.slice(-8) : [];
  for (const msg of recentHistory) {
    const role = msg.role === 'ai' ? 'assistant' : (msg.role || 'user');
    const content = msg.content || msg.text || '';
    if (content) messages.push({ role, content });
  }

  messages.push({ role: 'user', content: patient_input || 'Hello' });

  const modelsToTry = [
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
    'groq/compound',
    'openai/gpt-oss-120b'
  ];

  if (!GROQ_API_KEY) {
    console.warn("GROQ_API_KEY environment variable not set, using clinical fallback engine");
    const fallback = clinicalFallback(patient_input, language);
    return res.status(200).json({ status: 'success', data: fallback });
  }

  for (const model of modelsToTry) {
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.25,
          max_tokens: 400,
          response_format: { type: 'json_object' }
        })
      });

      if (!groqRes.ok) {
        console.warn(`Groq model ${model} returned status ${groqRes.status}`);
        continue;
      }

      const json = await groqRes.json();
      const rawContent = json?.choices?.[0]?.message?.content || '';
      const parsed = safeParseJson(rawContent);

      if (parsed && parsed.ai_response) {
        parsed.is_emergency = Boolean(parsed.is_emergency);
        parsed.suggested_department = parsed.suggested_department || 'GENERAL_MEDICINE';
        parsed.socrates_extracted = parsed.socrates_extracted || {};
        parsed.ayush_extracted = parsed.ayush_extracted || {};
        parsed.quick_replies = Array.isArray(parsed.quick_replies) ? parsed.quick_replies : [];

        return res.status(200).json({ status: 'success', data: parsed });
      }
    } catch (err) {
      console.warn(`Groq attempt with model ${model} failed:`, err.message);
    }
  }

  // Fallback to rule-based triage if all models fail
  const fallback = clinicalFallback(patient_input, language);
  return res.status(200).json({ status: 'success', data: fallback });
}
