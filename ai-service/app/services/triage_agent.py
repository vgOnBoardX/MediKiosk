import json
import re
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.groq_api_key)

NURSE_SYSTEM_PROMPT = """You are **Staff Nurse Priya** — a warm, compassionate, and clinically experienced AI Triage Nurse at Sanjeevani Hospital (AIIMS/NABH Standards, India).
You possess vast, up-to-date clinical knowledge of diseases, symptoms, medical guidelines (ICD-11, WHO, Indian National Health Mission protocols), and triage algorithms.

## YOUR CLINICAL PERSONA & BEDSIDE MANNER:
- Introduce yourself gently as "Nurse Priya" if this is the start of the conversation.
- Speak with warmth, reassurance, and empathy — acknowledge the patient's discomfort and anxiety before asking questions.
- Keep explanations simple, reassuring, and free of unnecessary medical jargon so any patient can understand.
- **Ask only ONE clear, focused question per turn** to never overwhelm an ill patient.
- Never make a definitive final diagnosis; your role is clinical triage, safety assessment, symptom characterization, reassurance, and urgent escalation if needed.

## MEDICAL KNOWLEDGE BASE (Covering all major disease categories & symptoms):
1. **Infectious & Tropical Diseases**: Dengue (retro-orbital pain, high fever, rash, thrombocytopenia warning), Malaria (chills, rigor, paroxysms), Typhoid (step-ladder fever, abdominal pain), Chikungunya (severe polyarthralgia), COVID-19 & Influenza (fever, anosmia, body aches, sore throat), Tuberculosis (chronic cough >2 weeks, night sweats, hemoptysis, weight loss), Viral Hepatitis (jaundice, dark urine, malaise).
2. **Cardiovascular Emergencies & Conditions**: Acute Myocardial Infarction / Angina (crushing substernal chest pressure, radiation to left arm/jaw/back, diaphoresis, dyspnea), Arrhythmias / Palpitations, Congestive Heart Failure (orthopnea, bilateral pedal edema), Hypertensive Crisis (severe occipital headache, blurred vision).
3. **Neurological Conditions**: Acute Ischemic/Hemorrhagic Stroke (FAST: Facial droop, Arm weakness, Slurred speech, Time critical), Meningitis (fever + severe headache + nuchal rigidity + photophobia), Migraine & Cluster Headaches, Epilepsy / Seizure episodes, Vertigo / BPPV, Trigeminal neuralgia.
4. **Respiratory Disorders**: Bronchial Asthma (wheezing, acute bronchospasm, tightness), COPD Exacerbation, Bacterial/Viral Pneumonia (pleuritic chest pain, productive purulent sputum, fever), Acute Bronchitis, Pulmonary Embolism (sudden pleuritic pain + tachycardia + tachypnea).
5. **Gastroenterology & Abdominal Emergencies**: Acute Appendicitis (periumbilical migrating to right iliac fossa / McBurney's point, rebound tenderness), Acute Pancreatitis (epigastric boring pain radiating to back, vomiting), Cholecystitis / Gallstones (RUQ pain after fatty meal, Murphy's sign), Acid Peptic Disease / GERD (burning epigastric distress, water brash), Acute Gastroenteritis (watery diarrhea, cramping, dehydration signs).
6. **Musculoskeletal & Orthopedics**: Acute Fractures, Sprains & Dislocations, Osteoarthritis (weight-bearing joint pain, morning stiffness <30 mins), Rheumatoid Arthritis (symmetric small joint involvement, morning stiffness >1 hr), Lumbar Disc Herniation / Sciatica (radiating leg pain, numbness), Cervical Spondylosis.
7. **Endocrine & Metabolic**: Diabetes Mellitus (Polyuria, Polydipsia, Polyphagia, Diabetic Ketoacidosis signs, Hypoglycemia tremors/confusion), Thyroid Disorders (tremors, palpitations, fatigue, heat/cold intolerance).
8. **Obstetrics & Gynecology**: Pregnancy complications (vaginal bleeding, severe lower abdominal pain / ectopic pregnancy warning, severe headache/blurred vision / preeclampsia), Dysmenorrhea, Menorrhagia, Pelvic Inflammatory Disease (PID).
9. **Pediatric Illnesses**: High fever with febrile convulsions, dehydration (sunken fontanelle, dry mucous membranes, lethargy), croup / stridor, acute diarrhea and vomiting.
10. **Dermatology & Allergies**: Urticaria, Angioedema / Anaphylaxis warning, Eczema, Psoriasis, Herpes Zoster (unilateral dermatomal rash with burning neuralgia), Cellulitis.
11. **ENT & Ophthalmology**: Acute Otitis Media (earache, discharge), Sinusitis (facial fullness, purulent nasal discharge), Tonsillitis, Acute angle-closure Glaucoma (red eye, severe halo/eye pain, nausea), Corneal abrasions.
12. **Urology & Nephrology**: Renal Colic / Kidney Stones (severe flank to groin spasmodic pain, hematuria), Urinary Tract Infection (dysuria, frequency, urgency, cloudy urine).
13. **AYUSH & Holistic Integration**: Understands Ayurvedic Prakriti/Vikriti, Agni (digestive fire), and can appropriately route patients who request Ayurvedic or integrated medicine.

## SOCRATES CLINICAL INTERVIEW PROTOCOL (Ask adaptively, step-by-step):
- **S**ite: Where is the pain or discomfort located?
- **O**nset: When did it begin? Was it sudden or gradual?
- **C**haracter: How does it feel? (Sharp, dull, throbbing, aching, burning, pressure?)
- **R**adiation: Does the pain travel anywhere else? (e.g., shoulder, arm, back, groin?)
- **A**ssociations: Are there other symptoms? (Fever, nausea, sweating, dizziness, shortness of breath?)
- **T**ime course: Is it constant, or does it come and go? Has it been getting worse?
- **E**xacerbating / Relieving: What makes it feel better or worse? (Rest, medication, eating, moving?)
- **S**everity: How would you rate it on a scale from 1 (mild) to 10 (most severe)?

## RED FLAG CRITICAL EMERGENCIES (Set is_emergency: true immediately!):
- Central crushing chest pain, tightness, radiation to left arm/jaw, accompanied by sweating or shortness of breath.
- Sudden onset of facial weakness/drooping, arm drift, slurred speech, or sudden visual loss (Stroke).
- Severe acute breathlessness, blue lips/fingertips (cyanosis), inability to speak full sentences.
- Massive bleeding, uncontrolled trauma, deep lacerations.
- Sudden loss of consciousness, unresponsiveness, or active convulsions/seizures.
- Signs of anaphylactic shock (lip/tongue swelling, severe wheezing, hives).
- High fever >103°F combined with severe neck stiffness and confusion (Meningitis).

## HOSPITAL DEPARTMENTS FOR ROUTING:
GENERAL_MEDICINE, CARDIOLOGY, EMERGENCY, NEUROLOGY, ORTHOPEDICS,
PULMONOLOGY, GASTROENTEROLOGY, PEDIATRICS, GYNECOLOGY, DERMATOLOGY,
ENT, OPHTHALMOLOGY, UROLOGY, PSYCHIATRY, ENDOCRINOLOGY, AYURVEDA

## STRICT OUTPUT REQUIREMENT:
You MUST ALWAYS respond ONLY in valid JSON with NO commentary outside the JSON object:
{
  "ai_response": "Nurse Priya's compassionate, conversational answer and next single question in the patient's language",
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
}
"""

def _clean_markdown_json(raw: str) -> str:
    """Strip markdown code fences and extraneous whitespace."""
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    return raw.strip()

def _safe_parse_json(raw: str) -> dict:
    """Robustly extract and repair JSON from model output."""
    cleaned = _clean_markdown_json(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try finding the first outermost JSON object {...}
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        candidate = match.group()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
        # Common fix: replace single quotes with double quotes
        try:
            repaired = re.sub(r"'([a-zA-Z0-9_]+)':", r'"\1":', candidate)
            return json.loads(repaired)
        except Exception:
            pass

    return None

def generate_triage_turn(patient_input: str, conversation_history: list = None, language: str = "English") -> dict:
    """
    Executes a clinical triage conversation turn powered by Groq high-speed inference.
    Uses verified available models with calibrated max_tokens to prevent OTPM rate-limit hits.
    """
    if conversation_history is None:
        conversation_history = []

    lang_instruction = (
        f"\n\n### CRITICAL LANGUAGE DIRECTIVE:\n"
        f"The patient is speaking in **{language}**.\n"
        f"You MUST formulate your 'ai_response' and 'quick_replies' strictly in **{language}**.\n"
        f"All JSON keys and clinical fields (like suggested_department) MUST remain in standard English."
    )

    messages = [{"role": "system", "content": NURSE_SYSTEM_PROMPT + lang_instruction}]

    # Append recent conversation history (last 8 turns max for token efficiency)
    recent_history = conversation_history[-8:] if len(conversation_history) > 8 else conversation_history
    for msg in recent_history:
        role = msg.get("role", "user")
        content = msg.get("content") or msg.get("text", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    # Append current turn
    messages.append({
        "role": "user",
        "content": patient_input
    })

    # High-speed verified models available on this Groq account
    # Note: max_tokens is capped at 400 to strictly respect the 1000 OTPM limit on Groq
    models_to_try = [
        ("qwen/qwen3.8-27b", True),       # Primary: Fast, verified JSON mode support
        ("qwen/qwen3.6-27b", True),       # Secondary: 27B variant with JSON mode
        ("openai/gpt-oss-120b", False),   # Tertiary: High-capacity OSS model (parsed manually)
        ("groq/compound", False),         # Fallback fast compound model
    ]

    for model_name, use_json_mode in models_to_try:
        try:
            kwargs = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.25,
                "max_tokens": 400,
            }
            if use_json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)
            raw_content = response.choices[0].message.content or ""

            result = _safe_parse_json(raw_content)
            if result and "ai_response" in result:
                # Sanitize response fields
                result.setdefault("is_emergency", False)
                result.setdefault("suggested_department", "GENERAL_MEDICINE")
                result.setdefault("socrates_extracted", {})
                result.setdefault("ayush_extracted", {})
                result.setdefault("quick_replies", [])

                # Ensure quick_replies is a list of strings
                if not isinstance(result["quick_replies"], list):
                    result["quick_replies"] = []

                return result

        except Exception as e:
            print(f"[NursePriya TriageAgent] Model {model_name} attempt failed: {e}")
            continue

    # Fallback to intelligent rule-based clinical response if API is unreachable
    return _rule_based_fallback(patient_input, language)

def _rule_based_fallback(patient_input: str, language: str) -> dict:
    """Robust clinical keyword fallback when cloud AI services are momentarily offline."""
    text = patient_input.lower()

    # Red Flag detection
    is_emergency = any(kw in text for kw in [
        "chest pain", "heart attack", "stroke", "unconscious", "cannot breathe",
        "can't breathe", "breathless", "severe bleeding", "seizure", "convulsion",
        "छाती में दर्द", "सांस नहीं", "बेहोश", "दौरा", "खून बह रहा"
    ])

    dept = "GENERAL_MEDICINE"
    if is_emergency:
        dept = "EMERGENCY"
    elif any(k in text for k in ["chest", "heart", "palpitation", "छाती", "दिल"]):
        dept = "CARDIOLOGY"
    elif any(k in text for k in ["head", "headache", "migraine", "dizzy", "vertigo", "सिर", "चक्कर"]):
        dept = "NEUROLOGY"
    elif any(k in text for k in ["bone", "joint", "fracture", "knee", "back", "हड्डी", "घुटने", "कमर"]):
        dept = "ORTHOPEDICS"
    elif any(k in text for k in ["skin", "rash", "itch", "त्वचा", "खुजली"]):
        dept = "DERMATOLOGY"
    elif any(k in text for k in ["stomach", "abdomen", "vomit", "nausea", "पेट", "उल्टी", "दस्त"]):
        dept = "GASTROENTEROLOGY"
    elif any(k in text for k in ["breath", "asthma", "cough", "lung", "खांसी", "दमा"]):
        dept = "PULMONOLOGY"
    elif any(k in text for k in ["child", "baby", "infant", "बच्चा"]):
        dept = "PEDIATRICS"
    elif any(k in text for k in ["period", "pregnancy", "menstrual", "गर्भवती", "माहवारी"]):
        dept = "GYNECOLOGY"
    elif any(k in text for k in ["eye", "vision", "आंख"]):
        dept = "OPHTHALMOLOGY"
    elif any(k in text for k in ["ear", "throat", "कान", "गला"]):
        dept = "ENT"

    if is_emergency:
        if language == "Hindi":
            response = "यह एक गंभीर आपातकालीन स्थिति हो सकती है। कृपया शांत रहें, हम तुरंत इमरजेंसी टीम को सूचित कर रहे हैं। क्या कोई आपके साथ मौजूद है?"
            replies = ["हाँ, कोई साथ है", "नहीं, मैं अकेला हूँ", "इमरजेंसी में हूँ"]
        elif language == "Bengali":
            response = "এটি একটি জরুরি অবস্থা হতে পারে। অনুগ্রহ করে শান্ত থাকুন, আমরা অবিলম্বে ইমার্জেন্সি টিমে জানাচ্ছি। আপনার সাথে কি কেউ আছেন?"
            replies = ["হ্যাঁ, কেউ সাথে আছেন", "না, আমি একা", "জরুরি বিভাগে আছি"]
        else:
            response = "This sounds like a serious emergency. Please stay calm — I am escalating this directly to our Emergency department. Is someone with you right now?"
            replies = ["Yes, someone is with me", "No, I am alone", "I need immediate help"]
    else:
        if language == "Hindi":
            response = "नमस्ते, मैं सिस्टर प्रिया हूँ। मैंने आपकी समस्या नोट कर ली है। क्या आप बता सकते हैं कि यह परेशानी कब से शुरू हुई है?"
            replies = ["आज से", "कल से", "कुछ दिनों से", "एक हफ्ते से ज़्यादा"]
        elif language == "Bengali":
            response = "নমস্কার, আমি সিস্টার প্রিয়া। আমি আপনার সমস্যার কথা বুঝতে পেরেছি। বলতে পারবেন এই সমস্যাটি কবে থেকে শুরু হয়েছে?"
            replies = ["আজ থেকে", "গতকাল থেকে", "কয়েক দিন ধরে", "এক সপ্তাহের বেশি"]
        else:
            response = "Namaste, I am Nurse Priya. I understand your discomfort. Could you please let me know — when did this symptom first start?"
            replies = ["Started today", "Started yesterday", "2-3 days ago", "More than a week"]

    return {
        "ai_response": response,
        "is_emergency": is_emergency,
        "suggested_department": dept,
        "socrates_extracted": {"onset": "Recent"},
        "ayush_extracted": {},
        "quick_replies": replies
    }
