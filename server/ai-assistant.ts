import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// Build dynamic system prompt from CMS settings + knowledge base + documents
async function buildSystemPrompt(userRole: string): Promise<string> {
  // Get AI settings from CMS
  const aiName = await db.getSetting("ai.name") || "المفتاح الشهري الذكي";
  const aiNameEn = await db.getSetting("ai.nameEn") || "Monthly Key AI";
  const aiPersonality = await db.getSetting("ai.personality") || "professional_friendly";
  const aiWelcome = await db.getSetting("ai.welcomeMessage") || "مرحباً! أنا المفتاح الشهري الذكي، كيف أقدر أساعدك؟";
  const aiCustomInstructions = await db.getSetting("ai.customInstructions") || "";
  const aiMaxTokens = await db.getSetting("ai.maxResponseLength") || "800";
  const aiEnabled = await db.getSetting("ai.enabled") || "true";

  if (aiEnabled !== "true") {
    return "أنت مساعد معطل حالياً. أخبر المستخدم أن المساعد الذكي غير متاح حالياً وسيعود قريباً.";
  }

  // Get live platform stats for context
  let platformContext = "";
  try {
    const propCount = await db.getPropertyCount("active");
    const bookingCount = await db.getBookingCount();
    platformContext = `
## إحصائيات المنصة الحالية (للاستخدام عند السؤال):
- عدد العقارات المتاحة: ${propCount || 0}
- عدد الحجوزات: ${bookingCount || 0}
- المدن المتاحة: الرياض، جدة، الدمام، مكة، المدينة، الخبر، أبها، تبوك`;
  } catch { /* stats are optional context */ }

  // Get uploaded documents context
  let documentsContext = "";
  try {
    const docs = await db.getActiveAiDocumentTexts();
    if (docs.length > 0) {
      documentsContext = "\n\n## مستندات مرجعية مرفوعة من الإدارة:\n";
      for (const doc of docs.slice(0, 10)) {
        const desc = doc.descriptionAr || doc.description || doc.filename;
        const text = doc.extractedText?.substring(0, 2000) || "";
        if (text) {
          documentsContext += `### ${desc}\n${text}\n\n`;
        }
      }
    }
  } catch { /* documents are optional context */ }

  // Get active knowledge base articles
  let knowledgeContext = "";
  try {
    const articles = await db.getKnowledgeArticles();
    if (articles.length > 0) {
      knowledgeContext = "\n\n## قاعدة المعرفة:\n";
      for (const article of articles.slice(0, 15)) {
        knowledgeContext += `### ${article.titleAr}\n${article.contentAr}\n\n`;
      }
    }
  } catch { /* knowledge is optional context */ }

  // Personality mapping
  const personalityMap: Record<string, string> = {
    professional_friendly: "محترف وودود — ترد بأسلوب مهني لكن بلمسة ودية وتستخدم إيموجي باعتدال",
    formal: "رسمي — ترد بأسلوب رسمي ومهني بدون إيموجي",
    casual_saudi: "عامي سعودي — ترد بلهجة سعودية عامية مفهومة وودودة",
    helpful_detailed: "مفصّل ومساعد — تقدم شروحات مفصلة خطوة بخطوة",
  };
  const personalityDesc = personalityMap[aiPersonality] || personalityMap.professional_friendly;

  // Role-specific context
  let roleContext = "";
  if (userRole === "tenant") {
    roleContext = "\n\nالمستخدم الحالي هو مستأجر. ركز على إرشادات المستأجرين: البحث عن عقار، الحجز، الصيانة، المدفوعات.";
  } else if (userRole === "landlord") {
    roleContext = "\n\nالمستخدم الحالي هو مالك عقار. ركز على إرشادات الملاك: إدارة العقارات، طلبات الحجز، الصيانة، الإيرادات.";
  } else if (userRole === "admin") {
    roleContext = "\n\nالمستخدم الحالي هو مدير المنصة. ركز على إرشادات الإدارة: الإحصائيات، المستخدمين، الموافقات، الإعدادات.";
  }

  return `أنت "${aiName}" (${aiNameEn}) — المساعد الذكي الرسمي لمنصة المفتاح الشهري للإيجار الشهري في المملكة العربية السعودية.

## هويتك
- اسمك: ${aiName} (${aiNameEn})
- شخصيتك: ${personalityDesc}
- رسالة الترحيب: "${aiWelcome}"
- تفهم جميع اللهجات العربية (سعودية، مصرية، خليجية، شامية، مغربية) والإنجليزية
- ترد بنفس لغة المستخدم — إذا كتب بالعربية ترد بالعربية، وإذا كتب بالإنجليزية ترد بالإنجليزية
- إذا كتب بلهجة سعودية ترد بلهجة سعودية مفهومة
- الحد الأقصى لطول ردك: ${aiMaxTokens} كلمة تقريباً

## معرفتك الكاملة بالمنصة

### للمستأجرين (Tenants):
1. **البحث عن عقار**: استخدم صفحة البحث — فلتر بالمدينة، السعر، النوع (شقة، فيلا، استوديو، دوبلكس، غرفة مفروشة، كمباوند، شقة فندقية)، عدد الغرف، الحمامات، مستوى التأثيث
2. **تفاصيل العقار**: اضغط على أي عقار لرؤية الصور، الموقع على الخريطة، المرافق، قواعد السكن، السعر الشهري، التأمين
3. **الحجز**: اضغط "احجز الآن" → اختر تاريخ الدخول والمدة → راجع التكلفة (إيجار + تأمين + رسوم خدمة 5%) → أكد الحجز
4. **لوحة التحكم**: من "لوحة التحكم" تشوف حجوزاتك، مدفوعاتك، مفضلاتك، طلبات الصيانة، الإشعارات
5. **المفضلة**: اضغط قلب ❤️ على أي عقار لحفظه في المفضلة
6. **الرسائل**: تواصل مع المالك مباشرة من صفحة العقار أو من قسم الرسائل
7. **طلب صيانة**: من لوحة التحكم → طلبات الصيانة → طلب جديد → اختر العقار والفئة والأولوية → أرفق صور
8. **طلب معاينة**: من صفحة العقار → "طلب معاينة" → اختر التاريخ والوقت
9. **حاسبة التكاليف**: من صفحة العقار → "حاسبة التكاليف" لحساب التكلفة الإجمالية مع الضريبة والتأمين
10. **الخدمات**: طلب خدمات إضافية (تنظيف، صيانة، أثاث، نقل) من قسم الخدمات

### للملاك (Landlords):
1. **إضافة عقار**: اضغط "أضف عقارك" → املأ البيانات بالعربي والإنجليزي → ارفع الصور → أرسل للمراجعة
2. **إدارة العقارات**: من لوحة التحكم → عقاراتي → حالة كل عقار (مسودة، قيد المراجعة، نشط، غير نشط)
3. **طلبات الحجز**: قبول أو رفض مع ذكر السبب
4. **الصيانة**: استلام الطلب → بدء العمل → إكمال الصيانة
5. **المدفوعات**: متابعة الإيرادات والمدفوعات
6. **التواصل**: الرد على رسائل المستأجرين
7. **مدير العقار**: تعيين مدير عقار للتواصل مع المستأجرين

### لمدراء المنصة (Admins):
1. **لوحة الإدارة**: إحصائيات شاملة + رسوم بيانية
2. **إدارة المستخدمين**: عرض، تعديل أدوار، صلاحيات
3. **الموافقة على العقارات**: مراجعة → موافقة/رفض
4. **إدارة الحجوزات**: متابعة جميع الحجوزات
5. **قاعدة المعرفة**: إضافة وتعديل مقالات
6. **إعدادات CMS**: تخصيص المنصة بالكامل
7. **إدارة المدن والأحياء**: إضافة وتعديل المدن والأحياء السعودية
8. **طوارئ الصيانة**: متابعة طلبات الصيانة الطارئة
9. **التحكم بالمساعد الذكي**: تعديل الاسم، الشخصية، قاعدة المعرفة، رفع مستندات

### معلومات عامة:
- **العملة**: ريال سعودي (SAR)
- **رسوم الخدمة**: 5% من قيمة الإيجار
- **ضريبة القيمة المضافة**: 15%
- **المدن المتاحة**: الرياض، جدة، الدمام، مكة، المدينة، الخبر، أبها، تبوك، وغيرها
- **أنواع العقارات**: شقة، فيلا، استوديو، دوبلكس، غرفة مفروشة، كمباوند، شقة فندقية
- **اللغات**: عربي (افتراضي) وإنجليزي
${platformContext}${documentsContext}${knowledgeContext}${roleContext}

${aiCustomInstructions ? `## تعليمات إضافية من الإدارة:\n${aiCustomInstructions}\n` : ""}

## قواعد الرد:
1. رد بشكل مختصر ومفيد — لا تطول بدون فائدة
2. إذا السؤال عن شيء خارج المنصة، قل "هذا خارج نطاق تخصصي، أنا متخصص في منصة المفتاح الشهري فقط"
3. إذا المستخدم يحتاج مساعدة تقنية، وجهه للخطوات بالتفصيل
4. استخدم أمثلة عملية عند الشرح
5. إذا المستخدم غاضب أو محبط، تعامل بلطف واحترافية
6. لا تخترع معلومات — إذا ما تعرف قل "ما عندي معلومة عن هذا، تواصل مع الدعم"
7. عند ذكر أرقام أو إحصائيات، استخدم البيانات الحقيقية من إحصائيات المنصة أعلاه`;
}

export async function getAiResponse(
  userId: number,
  conversationId: number,
  userMessage: string,
  userRole: string,
) {
  // Build dynamic system prompt with all context
  const systemPrompt = await buildSystemPrompt(userRole);

  // Get conversation history
  const history = await db.getAiMessages(conversationId);

  // Search knowledge base for relevant articles specific to this query
  const kbArticles = await db.searchKnowledgeBase(userMessage);
  
  let queryContext = "";
  if (kbArticles.length > 0) {
    queryContext = "\n\n## نتائج بحث ذات صلة بسؤال المستخدم:\n";
    for (const article of kbArticles.slice(0, 3)) {
      queryContext += `### ${article.titleAr}\n${article.contentAr}\n\n`;
    }
  }

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt + queryContext },
  ];

  // Add conversation history (last 20 messages for context)
  const recentHistory = history.slice(-20);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({ role: "user", content: userMessage });

  const response = await invokeLLM({ messages });
  
  const assistantContent = typeof response.choices[0].message.content === "string"
    ? response.choices[0].message.content
    : (response.choices[0].message.content as any[]).map((c: any) => c.text || "").join("");

  return assistantContent;
}

export async function seedDefaultKnowledgeBase() {
  const existing = await db.getAllKnowledgeArticles();
  if (existing.length > 0) return;

  const articles = [
    {
      category: "faq" as const,
      titleEn: "How to search for a property?",
      titleAr: "كيف أبحث عن عقار؟",
      contentEn: "Go to the Search page from the navigation bar. Use filters to narrow down by city, price range, property type, number of bedrooms/bathrooms, and furnishing level. You can switch between grid and list views, or use the map view to find properties by location.",
      contentAr: "اذهب لصفحة البحث من شريط التنقل. استخدم الفلاتر للتصفية حسب المدينة، نطاق السعر، نوع العقار، عدد الغرف/الحمامات، ومستوى التأثيث. يمكنك التبديل بين عرض الشبكة والقائمة، أو استخدام عرض الخريطة للبحث حسب الموقع.",
      tags: ["search", "filter", "بحث", "فلتر"],
    },
    {
      category: "faq" as const,
      titleEn: "How to book a property?",
      titleAr: "كيف أحجز عقار؟",
      contentEn: "1. Find a property you like. 2. Click 'Book Now'. 3. Select your move-in date and duration. 4. Review the cost breakdown (rent + deposit + 5% service fee). 5. Confirm your booking.",
      contentAr: "1. ابحث عن عقار يعجبك. 2. اضغط 'احجز الآن'. 3. اختر تاريخ الدخول والمدة. 4. راجع تفاصيل التكلفة (إيجار + تأمين + رسوم خدمة 5%). 5. أكد الحجز.",
      tags: ["booking", "حجز", "إيجار"],
    },
    {
      category: "faq" as const,
      titleEn: "How to submit a maintenance request?",
      titleAr: "كيف أرسل طلب صيانة؟",
      contentEn: "Go to your Dashboard > Maintenance tab > New Request. Select the property, choose a category, set priority level, describe the issue, and attach photos if needed.",
      contentAr: "اذهب للوحة التحكم > تبويب الصيانة > طلب جديد. اختر العقار، اختر الفئة (سباكة، كهرباء، تكييف، إلخ)، حدد مستوى الأولوية، اوصف المشكلة، وأرفق صور إذا لزم الأمر.",
      tags: ["maintenance", "صيانة", "طلب"],
    },
    {
      category: "tenant_guide" as const,
      titleEn: "Tenant Guide: Getting Started",
      titleAr: "دليل المستأجر: البداية",
      contentEn: "Welcome to Monthly Key! As a tenant, you can search properties, save favorites, book with a simple process, communicate with landlords, submit maintenance requests, and track payments from your dashboard.",
      contentAr: "مرحباً بك في المفتاح الشهري! كمستأجر، يمكنك: البحث عن العقارات، حفظ المفضلات، الحجز بعملية بسيطة، التواصل مع الملاك، إرسال طلبات صيانة، ومتابعة المدفوعات من لوحة التحكم.",
      tags: ["tenant", "guide", "مستأجر", "دليل"],
    },
    {
      category: "landlord_guide" as const,
      titleEn: "Landlord Guide: Listing Your Property",
      titleAr: "دليل المالك: إدراج عقارك",
      contentEn: "To list a property: Click 'Add Property', fill in details in Arabic and English, set pricing, upload photos, set amenities and rules, submit for review. Once approved, your property will be visible.",
      contentAr: "لإدراج عقار: اضغط 'أضف عقارك'، املأ التفاصيل بالعربي والإنجليزي، حدد الأسعار، ارفع صور، حدد المرافق والقواعد، أرسل للمراجعة. بعد الموافقة سيظهر عقارك.",
      tags: ["landlord", "listing", "مالك", "إدراج"],
    },
    {
      category: "policy" as const,
      titleEn: "Cancellation Policy",
      titleAr: "سياسة الإلغاء",
      contentEn: "Bookings can be cancelled before approval. After approval, cancellation follows lease terms. Security deposits are refundable upon inspection. Service fees are non-refundable.",
      contentAr: "يمكن إلغاء الحجوزات قبل الموافقة. بعد الموافقة، يخضع الإلغاء لشروط العقد. التأمين قابل للاسترداد بعد فحص المغادرة. رسوم الخدمة غير قابلة للاسترداد.",
      tags: ["cancellation", "policy", "إلغاء", "سياسة"],
    },
    {
      category: "troubleshooting" as const,
      titleEn: "Common Issues and Solutions",
      titleAr: "مشاكل شائعة وحلولها",
      contentEn: "Can't find properties? Expand search filters. Booking rejected? Contact landlord. Payment issues? Check payment method. Can't upload photos? Ensure files are under 5MB in JPG/PNG format.",
      contentAr: "ما تلقى عقارات؟ وسّع فلاتر البحث. الحجز مرفوض؟ تواصل مع المالك. مشكلة في الدفع؟ تأكد من طريقة الدفع. ما تقدر ترفع صور؟ تأكد إن الملفات أقل من 5 ميقا بصيغة JPG أو PNG.",
      tags: ["troubleshooting", "issues", "مشاكل", "حلول"],
    },
  ];

  for (const article of articles) {
    await db.createKnowledgeArticle(article);
  }
}
