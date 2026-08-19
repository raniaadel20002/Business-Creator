const LOGO_URL = "https://businesscreator.app/logoo.png";

const isFemaleUser = (gender?: string) => {
  if (!gender) return false;
  const g = gender.trim().toLowerCase();
  return g === "أنثى" || g === "انثى" || g === "female";
};

const gText = (isFemale: boolean, femaleText: string, maleText: string) =>
  isFemale ? femaleText : maleText;

const getEmailEnv = (gender?: string) => ({
  appUrl: typeof window !== "undefined" ? window.location.origin : "",
  isFemale: isFemaleUser(gender),
});

const getEmailLayout = (
  contentHtml: string,
  button?: { text: string; url: string },
) => {
  const buttonHtml = button
    ? `
    <div style="text-align: center; margin: 32px 0 15px 0;">
      <a href="${button.url}" target="_blank" style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block; font-size: 15px; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Arial, sans-serif; border: 1px solid rgba(255, 255, 255, 0.2); letter-spacing: -0.2px;">
        ${button.text}
      </a>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Business Creator AI</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@600;700;800&display=swap');
        * {
          box-sizing: border-box;
          font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          color: #1e293b;
          text-align: right;
          direction: rtl;
        }
        a {
          color: #ea580c;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; color: #1e293b; text-align: right; direction: rtl;" dir="rtl">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="direction: rtl; text-align: right; background-color: #ffffff; padding: 20px 10px;">
        <tr>
          <td align="center">
            <!-- Completely borderless & cardless flat layout -->
            <div style="max-width: 600px; width: 100%; text-align: right; background-color: #ffffff;">
              
              <!-- Logo Header (No card, no borders) -->
              <div style="text-align: center; padding: 25px 0 15px 0;">
                <img src="${LOGO_URL}" alt="Business Creator Logo" style="height: 55px; max-height: 55px; width: auto; display: inline-block;" />
              </div>

              <!-- Content Body (Flat, elegant) -->
              <div style="padding: 10px 0 30px 0; font-size: 16px; line-height: 1.85; color: #1e293b; font-family: 'Tajawal', sans-serif;">
                ${contentHtml}
                ${buttonHtml}
              </div>

              <!-- Simple plain divider -->
              <div style="height: 1px; background-color: #f1f5f9; margin: 30px 0 20px 0;"></div>

              <!-- Footer Section (Plain text, no dark box) -->
              <div style="padding: 10px 0 20px 0; text-align: center;">
                <p style="font-size: 14px; color: #ea580c; font-weight: 800; margin: 0 0 8px 0; font-family: 'Tajawal', sans-serif;">
                  نحن هنا لدعم طموحك وتحويل رؤيتك إلى واقع ريادي متكامل.
                </p>
                <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">
                  &copy; ${new Date().getFullYear()} Business Creator AI. جميع الحقوق محفوظة.
                </p>
                <div style="font-size: 11px; color: #94a3b8;">
                  رسالة آليّة مُرسلة من نظام الإشعارات لمنصة Business Creator
                </div>
              </div>

            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const sendEmailNotification = async (
  to: string,
  subject: string,
  html: string,
  button?: { text: string; url: string },
) => {
  if (!to || !to.includes("@")) {
    console.warn("[Email Service] Invalid or missing recipient email address:", to);
    return false;
  }

  const fullHtml = getEmailLayout(html, button);
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, html: fullHtml }),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok || !resData.success) {
      console.warn("[Email Service] Email notification warning:", resData);
      return false;
    }

    console.log("[Email Service] Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.warn("[Email Service] Network error sending email notification:", error);
    return false;
  }
};

// 1. Welcome / Login Email
const sendWelcomeLoginEmail = async (to: string, userName?: string, gender?: string) => {
  const { appUrl, isFemale } = getEmailEnv(gender);
  
  const titleText = gText(isFemale, "رائدة الأعمال المتميزة", "رائد الأعمال المتميز");
  const welcomeText = gText(isFemale, `أهلاً بكِ يا رائدة الأعمال ${userName || ""}! 👋`, `أهلاً بك يا رائد الأعمال ${userName || ""}! 👋`);
  const textBody = gText(
    isFemale,
    "يسعدنا جداً انضمامكِ إلينا ومرافقتكِ في هذه الرحلة! نحن هنا لنمكّنكِ من صياغة وتطوير رؤيتكِ الاستثمارية بنجاح واحترافية كاملة.",
    "يسعدنا جداً انضمامك إلينا ومرافقتك في هذه الرحلة! نحن هنا لنمكّنك من صياغة وتطوير رؤيتك الاستثمارية بنجاح واحترافية كاملة."
  );
  const selectText = gText(isFemale, "يمكنكِ الآن:", "يمكنك الآن:");
  const readyText = gText(
    isFemale,
    "جاهزة للانطلاق الاستراتيجي؟ اضغطي على الزر أدناه لبدء بناء مشروعكِ فوراً.",
    "جاهز للانطلاق الاستراتيجي؟ اضغط على الزر أدناه لبدء بناء مشروعك فوراً."
  );

  const contentHtml = `
    <h2 style="color: #ea580c; font-size: 21px; font-weight: 800; margin: 0 0 10px 0;">${welcomeText}</h2>
    <p style="margin: 0 0 20px 0; color: #9a3412; font-weight: 700; font-size: 14px;">تم تسجيل الدخول بنجاح إلى حسابكِ في Business Creator AI.</p>

    <p style="font-size: 15px; color: #334155;">
      ${textBody}
    </p>

    <h3 style="color: #0f172a; margin-top: 25px; margin-bottom: 12px; font-size: 16px; font-weight: 800;">${selectText}</h3>
    <ul style="margin: 0 0 25px 0; padding-right: 18px; color: #475569; font-size: 14px; line-height: 1.85;">
      <li style="margin-bottom: 8px;">توليد خطة عمل استراتيجية متكاملة بضغطة زر واحدة.</li>
      <li style="margin-bottom: 8px;">تصميم هويتكِ التجارية وبناء اللوجو الاحترافي بالذكاء الاصطناعي.</li>
      <li style="margin-bottom: 8px;">استشارة المستشار الأكاديمي والمالي وتحديد مراحل التنفيذ بدقة.</li>
    </ul>

    <p style="font-size: 15px; color: #64748b;">
      ${readyText}
    </p>
  `;

  return sendEmailNotification(
    to,
    `${titleText} - أهلاً بكِ في Business Creator AI`,
    contentHtml,
    { text: gText(isFemale, "ابدئي بتخطيط مشروعكِ الآن", "ابدأ بتخطيط مشروعك الآن"), url: appUrl },
  );
};

// 2. Project Ready Email
export const sendProjectReadyEmail = async (to: string, projectName: string, concept?: string, gender?: string) => {
  const { appUrl, isFemale } = getEmailEnv(gender);

  const titleText = `خطة مشروعك${gText(isFemale, 'ِ', '')} "${projectName}" جاهزة بالكامل`;
  const headingText = `تهانينا يا ${gText(isFemale, 'رائدة الأعمال! خطة مشروعكِ', 'رائد الأعمال! خطة مشروعك')} "${projectName}" مكتملة الآن ✨`;
  const subHeadingText = `لقد انتهى الذكاء الاصطناعي بنجاح من تحليل معطياتك${gText(isFemale, 'ِ', '')} لبناء خارطة طريق استراتيجية مخصصة لك${gText(isFemale, 'ِ', '')}.`;
  const listHeading = `أصبحت لوحة التحكم الخاصة بمشروعك${gText(isFemale, 'ِ', '')} تحتوي الآن على:`;
  const footerText = `الأفكار العظيمة تتحول لقصص نجاح ملهمة عندما تقترن بالتخطيط السليم والبدء الفعلي. ${gText(isFemale, 'تفضلي بمراجعة وتعديل خطتكِ الآن!', 'تفضل بمراجعة وتعديل خطتك الآن!')}`;

  const contentHtml = `
    <span style="color: #10b981; font-size: 13px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px;">✓ جاهز للتنفيذ</span>
    <h2 style="color: #065f46; font-size: 21px; font-weight: 800; margin: 0 0 10px 0;">${headingText}</h2>
    <p style="margin: 0 0 20px 0; color: #047857; font-weight: 700; font-size: 14px;">${subHeadingText}</p>

    ${
      concept
        ? `<p style="font-size: 15px; color: #475569; margin-bottom: 20px;">
        <strong>فكرة المشروع المقترحة:</strong> ${concept}
      </p>`
        : ""
    }

    <p style="font-size: 15px; color: #1e293b; font-weight: 700; margin-bottom: 12px;">
      ${listHeading}
    </p>

    <ul style="margin: 0 0 25px 0; padding-right: 18px; color: #334155; font-size: 14px; line-height: 1.85;">
      <li style="margin-bottom: 10px;"><strong>تحليل السوق والمنافسين (SWOT):</strong> لتحديد ميزتكِ التنافسية بدقة.</li>
      <li style="margin-bottom: 10px;"><strong>الخطة المالية المتكاملة:</strong> تقديرات رأس المال، التكاليف، والإيرادات التشغيلية.</li>
      <li style="margin-bottom: 10px;"><strong>الجدول الزمني والخطوات التنفيذية:</strong> مهام عملية واضحة لكل مرحلة لبدء التشغيل الفعلي.</li>
    </ul>

    <p style="font-size: 15px; color: #475569;">
      ${footerText}
    </p>
  `;

  return sendEmailNotification(
    to,
    `${titleText} - Business Creator AI`,
    contentHtml,
    { text: gText(isFemale, "استعرضي خطة مشروعكِ الآن", "استعرض خطة مشروعك الآن"), url: appUrl },
  );
};

// 3. Execution Decision Email
export const sendExecutionDecisionEmail = async (to: string, projectName: string, gender?: string) => {
  const { appUrl, isFemale } = getEmailEnv(gender);

  const titleText = `خطوة رائعة! بدأ تنفيذ مشروعك${gText(isFemale, 'ِ', '')} "${projectName}"`;
  const headingText = `خطوة استثنائية! بدأت${gText(isFemale, 'ِ', '')} رحلة تنفيذ مشروعك${gText(isFemale, 'ِ', '')} "${projectName}" 🚀`;
  const subHeadingText = `تهانينا الحارة لك${gText(isFemale, 'ِ رائدة الأعمال الشجاعة', ' رائد الأعمال الشجاع')}! الانتقال من مرحلة التخطيط والدراسة إلى حيز التنفيذ هو الفارق الحقيقي بين الرؤية والواقع الريادي.`;
  const bodyText = `لقد تم بنجاح تحديث حالة مشروعك${gText(isFemale, 'ِ', '')} الاستراتيجي على المنصة إلى <strong>"قيد التنفيذ الفعلي"</strong>.`;
  const sectionHeading = `كيف نرافقك${gText(isFemale, 'ِ وندعمكِ', ' وندعمك')} في مرحلة التنفيذ؟`;
  const pointsText = `1. يمكنك${gText(isFemale, 'ِ', '')} متابعة وتنفيذ المهام اليومية والأسبوعية خطوة بخطوة عبر لوحة تحكم التنفيذ الخاصة بك${gText(isFemale, 'ِ', '')}.<br>
       2. يمكنك${gText(isFemale, 'ِ', '')} استشارة المستشار الذكي لحل أي معضلات تشغيلية أو مالية فوراً في الميدان.<br>
       3. تظل أدوات توليد الهوية والشعار وخطط العرض والتسويق متاحة لتعديلها حسب الحاجة.`;
  const footerText = `فريق Business Creator AI يفخر بكونه الشريك الاستراتيجي لك${gText(isFemale, 'ِ في كل خطوة ومرحلة. واصلي شغفكِ وسنكون معكِ', ' في كل خطوة ومرحلة. واصل شغفك وسنكون معك')} دائماً!`;

  const contentHtml = `
    <span style="color: #ea580c; font-size: 13px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px;">🎯 قرار التنفيذ</span>
    <h2 style="color: #ea580c; font-size: 21px; font-weight: 800; margin: 0 0 10px 0;">${headingText}</h2>
    <p style="margin: 0 0 20px 0; color: #9a3412; font-weight: 700; font-size: 14px;">${subHeadingText}</p>

    <p style="font-size: 15px; color: #1e293b; margin-bottom: 20px;">
      ${bodyText}
    </p>

    <h3 style="color: #ea580c; margin-top: 25px; margin-bottom: 12px; font-size: 16px; font-weight: 800;">
      ${sectionHeading}
    </h3>
    <p style="font-size: 14px; color: #334155; line-height: 1.85; margin: 0 0 20px 0;">
      ${pointsText}
    </p>

    <p style="font-size: 15px; color: #475569;">
      ${footerText}
    </p>
  `;

  return sendEmailNotification(
    to,
    titleText,
    contentHtml,
    { text: gText(isFemale, "تابعي خطوات التنفيذ الآن", "تابع خطوات التنفيذ الآن"), url: appUrl },
  );
};

// 4. Subscription / Renewal Confirmation Email
export const sendPlanConfirmationEmail = async (
  to: string,
  planTier: string,
  price: string,
  gender?: string
) => {
  const { appUrl, isFemale } = getEmailEnv(gender);
  const planNames: Record<string, string> = {
    FREE: "خطة البداية",
    PRO: "خطة رائد الأعمال الشاملة",
  };

  const planFeatures: Record<string, string[]> = {
    FREE: [
      "إنشاء خطة عمل وتحليل مبدئي",
      "النظرة العامة والاستراتيجية للمشروع",
      "التحقق من السوق وتحليل سوات (SWOT)",
      "خطة التنفيذ والماليات المبدئية",
    ],
    PRO: [
      "كل الأقسام بما فيها الهوية التجارية وبناء الشعار بالذكاء الاصطناعي",
      "تحليل المنافسين والجمهور المستهدف بدقة متناهية",
      "نموذج العمل والاستثمار وخطط العرض والتسويق",
      "رصيد 100,000 نقطة لاستخدامها في كافة الخدمات المتقدمة",
      "إعادة بناء الشعار والمشروع بمرونة تامة مع المستشار الأكاديمي",
    ],
  };

  const featuresHtml =
    planFeatures[planTier]
      ?.map((f) => `<li style="margin-bottom: 8px; color: #334155;"><span style="color: #ea580c; font-weight: 900;">✓</span> ${f}</li>`)
      .join("") || "";

  const headingText = gText(
    isFemale,
    "شكراً لكِ رائدة الأعمال المتميزة على ثقتكِ الغالية! 🌟",
    "شكراً لك رائد الأعمال المتميز على ثقتك الغالية! 🌟"
  );
  const subHeadingText = gText(
    isFemale,
    "تم تفعيل وتحديث اشتراككِ وتأكيد نجاح العملية الاستثمارية.",
    "تم تفعيل وتحديث اشتراكك وتأكيد نجاح العملية الاستثمارية."
  );
  const bodyText = gText(
    isFemale,
    `تم بنجاح تفعيل / تجديد اشتراككِ في <strong>${planNames[planTier] || planTier}</strong> بقيمة <strong>${price} جنيه</strong>.`,
    `تم بنجاح تفعيل / تجديد اشتراكك في <strong>${planNames[planTier] || planTier}</strong> بقيمة <strong>${price} جنيه</strong>.`
  );
  const proText = gText(
    isFemale,
    `تمت إضافة 100,000 نقطة إلى حسابكِ الشخصي فوراً! يمكنكِ الآن استغلالها لإنشاء مشاريعكِ وتوليد الشعارات ومحاورة المستشار.`,
    `تمت إضافة 100,000 نقطة إلى حسابك الشخصي فوراً! يمكنك الآن استغلالها لإنشاء مشاريعك وتوليد الشعارات ومحاورة المستشار.`
  );
  const listHeading = gText(isFemale, "الميزات والصلاحيات النشطة بحسابكِ الآن:", "الميزات والصلاحيات النشطة بحسابك الآن:");
  const footerText = gText(
    isFemale,
    "استثماركِ المستمر في أفكاركِ وطموحكِ هو الفارق الفعلي لتأسيس مشاريع استثنائية. تمنياتنا لكِ برحلة ريادية مبهرة!",
    "استثمارك المستمر في أفكارك وطموحك هو الفارق الفعلي لتأسيس مشاريع استثنائية. تمنياتنا لك برحلة ريادية مبهرة!"
  );

  const contentHtml = `
    <span style="color: #ea580c; font-size: 13px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px;">💼 تأكيد الاشتراك</span>
    <h2 style="color: #ea580c; font-size: 21px; font-weight: 800; margin: 0 0 10px 0;">${headingText}</h2>
    <p style="margin: 0 0 20px 0; color: #9a3412; font-weight: 700; font-size: 14px;">${subHeadingText}</p>

    <p style="font-size: 15px; color: #1e293b; margin-bottom: 20px;">
      ${bodyText}
    </p>

    ${
      planTier === "PRO"
        ? `
      <div style="margin: 25px 0; padding: 15px 0;">
        <span style="color: #ea580c; font-size: 12px; font-weight: 800; display: block; margin-bottom: 6px;">✨ تحديث الرصيد</span>
        <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0;">${proText}</p>
      </div>
    `
        : ""
    }

    <h3 style="color: #0f172a; margin-top: 25px; margin-bottom: 12px; font-size: 15px; font-weight: 800;">
      ${listHeading}
    </h3>
    <ul style="line-height: 1.8; color: #334155; font-size: 13px; padding: 0; margin: 0 0 25px 0; list-style-type: none;">
      ${featuresHtml}
    </ul>

    <p style="font-size: 15px; color: #475569;">
      ${footerText}
    </p>
  `;

  return sendEmailNotification(
    to,
    gText(
      isFemale,
      `تأكيد تفعيل اشتراككِ في ${planNames[planTier] || planTier} - Business Creator AI`,
      `تأكيد تفعيل اشتراكك في ${planNames[planTier] || planTier} - Business Creator AI`
    ),
    contentHtml,
    { text: "انتقل إلى لوحة التحكم", url: appUrl },
  );
};

// 5. Balance Depleted Email
export const sendBalanceDepletedEmail = async (to: string, currentTokens: number = 0, gender?: string) => {
  const { appUrl, isFemale } = getEmailEnv(gender);

  const titleText = gText(isFemale, "تنبيه: رصيد نقاطكِ شارف على الانتهاء", "تنبيه: رصيد نقاطك شارف على الانتهاء");
  const headingText = gText(
    isFemale,
    `رصيد نقاطكِ قد انتهى حالياً (${currentTokens} نقطة) ⚡`,
    `رصيد نقاطك قد انتهى حالياً (${currentTokens} نقطة) ⚡`
  );
  const subHeadingText = gText(
    isFemale,
    "لا تدعي شغفكِ الاستثماري وطموحكِ الريادي يتوقف عند هذه الخطوة!",
    "لا تدع شغفك الاستثماري وطموحك الريادي يتوقف عند هذه الخطوة!"
  );
  const bodyText1 = gText(
    isFemale,
    "مرحباً بكِ رائدة الأعمال! لقد لاحظنا نفاد رصيد نقاطكِ النشطة أثناء رحلة ابتكاركِ وتصميم مشروعكِ الاستراتيجي.",
    "مرحباً بك رائد الأعمال! لقد لاحظنا نفاد رصيد نقاطك النشطة أثناء رحلة ابتكارك وتصميم مشروعك الاستراتيجي."
  );
  const bodyText2 = gText(
    isFemale,
    "هذا المؤشر هو أكبر دليل ملموس على جديتكِ وإصراركِ على بناء فكرة عظيمة وتأسيس مشروع حقيقي! لإكمال توليد خطط العمل، تصميم الهوية التجارية، أو تفعيل المستشار الأكاديمي، يمكنكِ بسهولة إعادة تعبئة رصيدكِ بمرونة وبسعر رمزي للغاية.",
    "هذا المؤشر هو أكبر دليل ملموس على جديتك وإصرارك على بناء فكرة عظيمة وتأسيس مشروع حقيقي! لإكمال توليد خطط العمل، تصميم الهوية التجارية، أو تفعيل المستشار الأكاديمي، يمكنك بسهولة إعادة تعبئة رصيدك بمرونة وبسعر رمزي للغاية."
  );
  const actionText = gText(
    isFemale,
    "💡 يمكنكِ الآن الترقية إلى باقة رائد الأعمال الشاملة والحصول على 100,000 نقطة جديدة فوراً لترقية كافة خدماتكِ!",
    "💡 يمكنك الآن الترقية إلى باقة رائد الأعمال الشاملة والحصول على 100,000 نقطة جديدة فوراً لترقية كافة خدماتك!"
  );

  const contentHtml = `
    <span style="color: #ef4444; font-size: 13px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px;">⚡ تنبيه الرصيد</span>
    <h2 style="color: #991b1b; font-size: 21px; font-weight: 800; margin: 0 0 10px 0;">${headingText}</h2>
    <p style="margin: 0 0 20px 0; color: #b91c1c; font-weight: 700; font-size: 14px;">${subHeadingText}</p>

    <p style="font-size: 15px; color: #1e293b; margin-bottom: 15px; line-height: 1.8;">
      ${bodyText1}
    </p>

    <p style="font-size: 15px; color: #475569; margin-bottom: 25px; line-height: 1.8;">
      ${bodyText2}
    </p>

    <p style="margin: 0; font-size: 15px; font-weight: 800; color: #ea580c; line-height: 1.85;">
      ${actionText}
    </p>
  `;

  return sendEmailNotification(
    to,
    titleText,
    contentHtml,
    { text: "شحن الرصيد والترقية الآن", url: `${appUrl}?view=pricing` },
  );
};

// 6. Feedback Received Email
export const sendFeedbackReceivedEmail = async (
  to: string,
  feedbackType: string,
  text: string,
  gender?: string
) => {
  const { appUrl, isFemale } = getEmailEnv(gender);

  const typeLabels: Record<string, string> = {
    suggestion: "اقتراح تطوير",
    problem: "بلاغ عن مشكلة",
    other: "استفسار ومشاركة"
  };

  const label = typeLabels[feedbackType] || "مشاركة";

  const subHeadingText = gText(
    isFemale,
    `شكراً جزيلاً رائدة الأعمال المتميزة على مشاركتكِ معنا وتطوير المنصة.`,
    `شكراً جزيلاً رائد الأعمال المتميز على مشاركتك معنا وتطوير المنصة.`
  );
  const bodyText1 = gText(
    isFemale,
    `نقدّر كثيراً الوقت الثمين الذي خصصتيه لمشاركتنا ملاحظاتكِ البنّاءة. إنّ آراء واقتراحات رائدات الأعمال هي الوقود الحقيقي الذي يدفعنا دائماً للتطور والريادة.`,
    `نقدّر كثيراً الوقت الثمين الذي خصصته لمشاركتنا ملاحظاتك البنّاءة. إنّ آراء واقتراحات رواد الأعمال هي الوقود الحقيقي الذي يدفعنا دائماً للتطور والريادة.`
  );
  const bodyText2 = gText(
    isFemale,
    `يقوم فريق الدعم الفني والاستراتيجي حالياً بمراجعة ملاحظتكِ بعناية تامة، وسنبذل قصارى جهدنا لضمان تقديم أفضل تجربة ممكنة لكِ.`,
    `يقوم فريق الدعم الفني والاستراتيجي حالياً بمراجعة ملاحظتك بعناية تامة، وسنبذل قصارى جهدنا لضمان تقديم أفضل تجربة ممكنة لك.`
  );

  const contentHtml = `
    <span style="color: #22c55e; font-size: 13px; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 6px;">💡 مشاركة مستلمة</span>
    <h2 style="color: #15803d; font-size: 21px; font-weight: 800; margin: 0 0 10px 0;">${gText(isFemale, "تم استلام ملاحظتكِ بنجاح! 💡", "تم استلام ملاحظتك بنجاح! 💡")}</h2>
    <p style="margin: 0 0 20px 0; color: #166534; font-weight: 700; font-size: 14px;">${subHeadingText}</p>

    <p style="font-size: 15px; color: #1e293b; margin-bottom: 15px; line-height: 1.8;">
      ${bodyText1}
    </p>

    <div style="margin: 20px 0; padding: 10px 0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #64748b;">نص المشاركة المُرسلة:</p>
      <p style="margin: 0; font-size: 15px; color: #0f172a; font-style: italic; line-height: 1.8;">"${text}"</p>
    </div>

    <p style="font-size: 15px; color: #475569; line-height: 1.8;">
      ${bodyText2}
    </p>
  `;

  return sendEmailNotification(
    to,
    gText(isFemale, `تم استلام مشاركتكِ في Business Creator AI`, `تم استلام مشاركتك في Business Creator AI`),
    contentHtml,
    { text: "العودة إلى المنصة", url: appUrl },
  );
};
