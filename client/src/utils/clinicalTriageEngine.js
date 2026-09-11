// Clinical Rule-Based Triage Engine (Client-Side)
// Compliant with AIIMS / WHO / Indian National Health Mission protocols
// Provides instant, offline-capable clinical triage when cloud AI is unreachable.

export function evaluateClinicalTriage(patientInput = '', language = 'English', conversationHistory = []) {
  const text = (patientInput || '').toLowerCase().trim();

  // 1. Red Flag / Emergency Detection
  const emergencyKeywords = [
    'chest pain', 'heart attack', 'stroke', 'unconscious', 'fainted',
    'cannot breathe', "can't breathe", 'breathless', 'severe bleeding',
    'seizure', 'convulsion', 'cyanosis', 'paralysis',
    'छाती में दर्द', 'सांस नहीं', 'बेहोश', 'दौरा', 'खून बह रहा',
    'বুকে ব্যথা', 'শ্বাসকষ্ট', 'অজ্ঞান', 'খিঁচুনি', 'রক্তক্ষরণ'
  ];
  const isEmergency = emergencyKeywords.some(kw => text.includes(kw));

  // 2. Department & Body System Mapping
  let suggestedDepartment = 'GENERAL_MEDICINE';
  let detectedSite = '';

  if (isEmergency) {
    suggestedDepartment = 'EMERGENCY';
    detectedSite = 'Emergency Escalation';
  } else if (/chest|heart|palpitation|छाती|दिल|বুক|হৃদস্পন্দন/i.test(text)) {
    suggestedDepartment = 'CARDIOLOGY';
    detectedSite = 'Chest / Cardiovascular';
  } else if (/head|headache|migraine|dizzy|vertigo|सिर|चक्कर|মাথা|মাথা ঘোরা/i.test(text)) {
    suggestedDepartment = 'NEUROLOGY';
    detectedSite = 'Head / Neurological';
  } else if (/bone|joint|fracture|knee|back|spine|हड्डी|घुटने|कमर|হাড়|হাঁটু|কোমর/i.test(text)) {
    suggestedDepartment = 'ORTHOPEDICS';
    detectedSite = 'Musculoskeletal / Joint';
  } else if (/skin|rash|itch|allergy|boil|त्वचा|खुजली|দাদ|চুলকানি/i.test(text)) {
    suggestedDepartment = 'DERMATOLOGY';
    detectedSite = 'Skin / Dermatological';
  } else if (/stomach|abdomen|vomit|nausea|acid|motion|loose|पेट|उल्टी|दस्त|পেট|বমি/i.test(text)) {
    suggestedDepartment = 'GASTROENTEROLOGY';
    detectedSite = 'Abdomen / Gastrointestinal';
  } else if (/breath|asthma|cough|cold|fever|lung|phlegm|खांसी|दमा|बुखार|কাশি|জ্বর/i.test(text)) {
    suggestedDepartment = 'PULMONOLOGY';
    detectedSite = 'Respiratory / Lungs';
  } else if (/child|baby|infant|kid|बच्चा|শিশু/i.test(text)) {
    suggestedDepartment = 'PEDIATRICS';
    detectedSite = 'Pediatric Care';
  } else if (/period|pregnancy|menstrual|cramp|गर्भवती|माहवारी|গর্ভবতী/i.test(text)) {
    suggestedDepartment = 'GYNECOLOGY';
    detectedSite = 'Obstetrics & Gynecology';
  } else if (/eye|vision|red eye|आंख|চোখ/i.test(text)) {
    suggestedDepartment = 'OPHTHALMOLOGY';
    detectedSite = 'Eyes / Vision';
  } else if (/ear|throat|sore throat|कान|गला|কান|গলা/i.test(text)) {
    suggestedDepartment = 'ENT';
    detectedSite = 'Ear, Nose & Throat';
  }

  // 3. Conversational Progression (SOCRATES Framework step detection)
  const turnCount = (conversationHistory || []).filter(m => m.role === 'user').length;

  let aiResponse = '';
  let quickReplies = [];
  const socratesExtracted = {};

  if (isEmergency) {
    if (language === 'Hindi') {
      aiResponse = "यह एक गंभीर आपातकालीन स्थिति लग रही है। कृपया शांत रहें — हम तुरंत इमरजेंसी टीम को अलर्ट कर रहे हैं। क्या कोई आपके साथ मौजूद है?";
      quickReplies = ["हाँ, कोई साथ है", "नहीं, मैं अकेला हूँ", "तुरंत नर्स को बुलाएं", "इमरजेंसी वार्ड जा रहा हूँ"];
    } else if (language === 'Bengali') {
      aiResponse = "এটি একটি গুরুতর জরুরি অবস্থা মনে হচ্ছে। অনুগ্রহ করে শান্ত থাকুন — আমরা অবিলম্বে ইমার্জেন্সি টিমকে জানাচ্ছি। আপনার সাথে কি কেউ আছেন?";
      quickReplies = ["হ্যাঁ, কেউ সাথে আছেন", "না, আমি একা", "জরুরি নার্স ডাকুন", "ইমার্জেন্সি বে-তে যাচ্ছি"];
    } else {
      aiResponse = "This sounds like a serious medical emergency. Please stay calm — I am escalating this directly to our Emergency Department. Is someone with you right now?";
      quickReplies = ["Yes, someone is with me", "No, I am alone", "Call Emergency Nurse", "Go to Emergency Bay"];
    }
  } else {
    // Stage 1: Onset & Duration inquiry
    if (turnCount <= 1) {
      if (language === 'Hindi') {
        aiResponse = "नमस्ते, मैं सिस्टर प्रिया हूँ। मैंने आपकी परेशानी समझ ली है। कृपया बताएं कि यह समस्या कब से शुरू हुई है?";
        quickReplies = ["आज सुबह से", "कल से", "2-3 दिनों से", "एक हफ्ते से ज्यादा"];
      } else if (language === 'Bengali') {
        aiResponse = "নমস্কার, আমি সিস্টার প্রিয়া। আমি আপনার সমস্যার কথা বুঝতে পেরেছি। দয়া করে বলুন, এই উপসর্গ কবে থেকে শুরু হয়েছে?";
        quickReplies = ["আজ সকাল থেকে", "গতকাল থেকে", "২-৩ দিন ধরে", "এক সপ্তাহের বেশি"];
      } else {
        aiResponse = "Namaste, I am Nurse Priya. I have noted your concern. Could you please tell me — when did this first start?";
        quickReplies = ["Started today", "Started yesterday", "2-3 days ago", "More than a week"];
      }
      socratesExtracted.site = detectedSite || 'General';
    } 
    // Stage 2: Character / Quality of sensation
    else if (turnCount === 2) {
      if (language === 'Hindi') {
        aiResponse = "समझ गई। यह दर्द या तकलीफ किस प्रकार की महसूस हो रही है? क्या यह तेज चुभन है, भारीपन है, या लगातार हल्का दर्द है?";
        quickReplies = ["तेज़ चुभन जैसा", "भारी दबाव", "हल्का लेकिन लगातार", "रुक-रुक कर आने वाला"];
      } else if (language === 'Bengali') {
        aiResponse = "বুঝতে পেরেছি। এই ব্যথা বা অস্বস্তি কেমন ধরনের মনে হচ্ছে? তীব্র যন্ত্রণা, ভারী চাপ, নাকি হালকা একটানা ব্যথা?";
        quickReplies = ["তীব্র যন্ত্রণাদায়ক", "ভারী চাপ লাগা", "হালকা কিন্তু একটানা", "মাঝে মাঝে বাড়ছে"];
      } else {
        aiResponse = "Understood. How would you describe the feeling? Is it sharp, heavy pressure, dull aching, or burning?";
        quickReplies = ["Sharp / Stabbing", "Heavy pressure", "Dull continuous ache", "Burning sensation"];
      }
      socratesExtracted.onset = patientInput;
    }
    // Stage 3: Severity Rating (1 to 10)
    else if (turnCount === 3) {
      if (language === 'Hindi') {
        aiResponse = "कृपया 1 से 10 के पैमाने पर बताएं कि यह तकलीफ कितनी गंभीर है? (1 बहुत हल्की और 10 सबसे असहनीय)";
        quickReplies = ["हल्की (1 - 3)", "मध्यम (4 - 6)", "गंभीर (7 - 8)", "बहुत तेज (9 - 10)"];
      } else if (language === 'Bengali') {
        aiResponse = "১ থেকে ১০ এর মধ্যে এই কষ্ট কতটা তীব্র বলে মনে হচ্ছে? (১ খুব সামান্য এবং ১০ অসহ্য)";
        quickReplies = ["সামান্য (১ - ৩)", "মাঝারি (৪ - ৬)", "তীব্র (৭ - ৮)", "খুব বেশি (৯ - ১০)"];
      } else {
        aiResponse = "On a scale from 1 to 10, how severe is this discomfort? (1 is very mild, 10 is unbearable)";
        quickReplies = ["Mild (1 - 3)", "Moderate (4 - 6)", "Severe (7 - 8)", "Unbearable (9 - 10)"];
      }
      socratesExtracted.character = patientInput;
    }
    // Stage 4: Associated symptoms & Wrap-up
    else {
      if (language === 'Hindi') {
        aiResponse = "बहुत धन्यवाद। मैंने आपकी सभी जानकारियां ट्राइएज रिकॉर्ड में दर्ज कर ली हैं। क्या इसके अलावा बुखार, उल्टी या चक्कर जैसे कोई और लक्षण हैं?";
        quickReplies = ["कोई अन्य लक्षण नहीं", "बुखार भी है", "चक्कर आ रहे हैं", "कमजोरी महसूस हो रही है"];
      } else if (language === 'Bengali') {
        aiResponse = "ধন্যবাদ। আপনার উপসর্গগুলি ট্রায়াজ রেকর্ডে যুক্ত করা হয়েছে। এর পাশাপাশি জ্বর, বমি বা মাথা ঘোরার মতো অন্য কোনো সমস্যা আছে কি?";
        quickReplies = ["অন্য কোনো উপসর্গ নেই", "জ্বরও আছে", "মাথা ঘুরছে", "দুর্বল লাগছে"];
      } else {
        aiResponse = "Thank you. I have recorded your clinical information for the doctor. Are you experiencing any other symptoms like fever, nausea, or dizziness?";
        quickReplies = ["No other symptoms", "Also have fever", "Feeling dizzy", "Severe weakness"];
      }
      socratesExtracted.severity = patientInput;
    }
  }

  return {
    ai_response: aiResponse,
    is_emergency: isEmergency,
    suggested_department: suggestedDepartment,
    socrates_extracted: socratesExtracted,
    ayush_extracted: {},
    quick_replies: quickReplies
  };
}
