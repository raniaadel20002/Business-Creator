import { GoogleGenAI, Type } from "@google/genai";
import { createGeminiClient, getModelFallbackList } from "./geminiClient.js";

export class LogoService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = createGeminiClient();
  }

  private sanitizeStructuredConfig(config: any): any {
    if (!config) return config;
    const clean = { ...config };
    if ((clean.tools || clean.toolConfig) && (clean.responseMimeType === "application/json" || clean.responseSchema)) {
      delete clean.tools;
      delete clean.toolConfig;
    }
    return clean;
  }

  private async executeModelAttempt(
    params: { model: string; contents: any; config?: any },
    modelName: string,
    activeConfig: any
  ): Promise<any> {
    try {
      console.log(`[Gemini SDK Logo] Attempting generation with model: ${modelName}`);
      return await this.ai.models.generateContent({
        ...params,
        model: modelName,
        config: activeConfig
      });
    } catch (error: any) {
      const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
      
      if (errStr.includes("too many states") || errStr.includes("constraint") || errStr.includes("INVALID_ARGUMENT") || errStr.includes("400")) {
        console.warn(`[Gemini SDK Logo] Model ${modelName} failed due to schema complexity. Retrying without responseSchema...`);
        const configWithoutSchema = { ...activeConfig };
        delete configWithoutSchema.responseSchema;
        return await this.ai.models.generateContent({
          ...params,
          model: modelName,
          config: configWithoutSchema
        });
      }
      
      if (errStr.includes("application/json") && (errStr.includes("unsupported") || errStr.includes("Tool use"))) {
        console.warn(`[Gemini SDK Logo] Model ${modelName} failed due to tool/JSON incompatibility. Retrying without tools...`);
        const configWithoutTools = { ...activeConfig };
        delete configWithoutTools.tools;
        delete configWithoutTools.toolConfig;
        return await this.ai.models.generateContent({
          ...params,
          model: modelName,
          config: configWithoutTools
        });
      }

      throw error;
    }
  }

  async generateContentWithFallback(params: {
    model: string;
    contents: any;
    config?: any;
  }): Promise<any> {
    const modelsToTry = getModelFallbackList(params.model);

    let lastError: any = null;
    const sanitizedConfig = this.sanitizeStructuredConfig(params.config);

    // 1. Try across all models with sanitized config
    for (const modelName of modelsToTry) {
      try {
        const response = await this.executeModelAttempt(params, modelName, sanitizedConfig);
        console.log(`[Gemini SDK Logo] Successfully processed using model: ${modelName}`);
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn("[Gemini SDK Logo] Attempt with model %s failed:", modelName, error?.message || error);
      }
    }

    // 2. Fallback attempt stripping all tools
    if (params.config && (params.config.tools || params.config.toolConfig)) {
      console.log("[Gemini SDK Logo] Falling back to attempts WITHOUT search grounding / tools...");
      const configWithoutTools = { ...params.config };
      delete configWithoutTools.tools;
      delete configWithoutTools.toolConfig;

      for (const modelName of modelsToTry) {
        try {
          const response = await this.executeModelAttempt(params, modelName, configWithoutTools);
          console.log(`[Gemini SDK Logo] Successfully processed without tools using model: ${modelName}`);
          return response;
        } catch (error: any) {
          lastError = error;
          console.warn("[Gemini SDK Logo] Attempt without tools with model %s failed:", modelName, error?.message || error);
        }
      }
    }

    throw lastError || new Error("All fallback models and configurations failed.");
  }

  async generateLogoSystem(prompt: string, projectName: string, idea: string, styleDesc: string): Promise<any> {
    const systemPrompt = `You are a world-class Logo Design Engine and Brand Symbol Specialist.

Your task is to generate a PERFECT, production-ready logo design system for a business based on its idea and name.

This is NOT a creative experiment — this is a precision design task.
The output MUST meet global branding agency standards.

---
STRICT DESIGN CONSTRAINTS (PRODUCTION-CRITICAL):

1. **Format**: All logos MUST be provided as pure, standalone, fully valid <svg> strings.
   - Every SVG MUST start with <svg and end with </svg>.
   - Every SVG MUST include valid \`xmlns="http://www.w3.org/2000/svg"\` and \`viewBox="0 0 512 512"\`.
   - NO markdown, NO backticks, NO HTML wrapper inside the SVG string values.
   - SVG must be 100% valid XML and renderable directly by the browser.

2. **Required Variations (All 4 are MANDATORY)**:
   - \`primarySvg\`: Full-color primary logo on a transparent or clean dark/light background. Includes the main icon and the brand name typography.
   - \`blackSvg\`: Pure monochrome black (#000000) on transparent background (for light paper, stamps, receipts).
   - \`whiteSvg\`: Pure monochrome white (#FFFFFF) on transparent background (for dark backgrounds, video overlays).
   - \`faviconSvg\`: High-contrast, ultra-minimal icon only (no text) that remains crisp and recognizable at 16x16 pixels.

3. **Style & Visual Quality**:
   - Modern, premium, minimalist vector style.
   - Smooth paths, balanced geometry, professional spacing and padding.
   - Colors should be harmonious (2-3 brand colors maximum).
   - Arabic / English typography should be clean, geometric, and modern.

4. **Required Fields**:
   - \`logoConceptExplanation\`: Deep, professional rationale explaining the concept, color psychology, and symbol meaning in Arabic (Egyptian tone).
   - \`primarySvg\`: Valid SVG string for the primary logo.
   - \`blackSvg\`: Valid SVG string for the black monochrome version.
   - \`whiteSvg\`: Valid SVG string for the white monochrome version.
   - \`faviconSvg\`: Valid SVG string for the favicon mark.
   - \`primaryPromptForImageAI\`: An ultra-detailed, photorealistic prompt in English to feed into Gemini Imagen to generate a 3D corporate mockup of the brand.
   - \`usageNote\`: Clear, actionable brand guidelines in Arabic on how to use the logo across different media.`;

    const userPrompt = `Project Name: "${projectName}"
Project Idea / Concept: "${idea}"
Design Style & Brand Vibe: "${styleDesc || 'Modern, Minimalist, Corporate, Elegant'}"

Generate the complete, agency-grade Logo Design System now according to the system prompt and schema.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        logoConceptExplanation: { type: Type.STRING },
        primarySvg: { type: Type.STRING },
        blackSvg: { type: Type.STRING },
        whiteSvg: { type: Type.STRING },
        faviconSvg: { type: Type.STRING },
        primaryPromptForImageAI: { type: Type.STRING },
        usageNote: { type: Type.STRING }
      },
      required: [
        "logoConceptExplanation",
        "primarySvg",
        "blackSvg",
        "whiteSvg",
        "faviconSvg",
        "primaryPromptForImageAI",
        "usageNote"
      ]
    };

    let result: any = null;

    try {
      console.log(`[Logo Service] Requesting complete Logo System from Gemini for project: ${projectName}...`);
      const response = await this.generateContentWithFallback({
        model: "gemini-3.6-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: schema as any
        }
      });

      let text = (response.text || "{}").trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }

      try {
        result = JSON.parse(text);
      } catch (error) {
        console.error("Failed to parse logo system response, attempting fallback extraction:", error);
        try {
          const extractField = (fieldName: string, srcText: string): string => {
            const target = `"${fieldName}"`;
            const idx = srcText.indexOf(target);
            if (idx === -1) return "";
            const colonIdx = srcText.indexOf(":", idx + target.length);
            if (colonIdx === -1) return "";
            const firstQuote = srcText.indexOf('"', colonIdx + 1);
            if (firstQuote === -1) return "";
            let endQuote = -1;
            for (let i = firstQuote + 1; i < srcText.length; i++) {
              if (srcText[i] === '"' && srcText[i - 1] !== '\\') {
                endQuote = i;
                break;
              }
            }
            if (endQuote !== -1) {
              return srcText.slice(firstQuote + 1, endQuote).replace(/\\"/g, '"').replace(/\\n/g, '\n');
            }
            return "";
          };

          result = {
            logoConceptExplanation: extractField("logoConceptExplanation", text) || "مفهوم الشعار المقترح",
            primarySvg: extractField("primarySvg", text),
            blackSvg: extractField("blackSvg", text),
            whiteSvg: extractField("whiteSvg", text),
            faviconSvg: extractField("faviconSvg", text),
            primaryPromptForImageAI: extractField("primaryPromptForImageAI", text) || `${projectName} logo design`,
            usageNote: extractField("usageNote", text) || "دليل استخدام الشعار"
          };

          if (!(result.primarySvg && result.primarySvg.includes("<svg"))) {
            throw new Error("Missing SVG in fallback extraction");
          }
          console.log("Successfully extracted logo system via fallback parser.");
        } catch (fallbackError) {
          console.error("Fallback extraction also failed, using programmatic generator:", fallbackError);
          result = this.generateFallbackLogoSystem(projectName, idea, styleDesc);
        }
      }
    } catch (apiError) {
      console.warn("[Logo Service] API generation failed completely, returning premium programmatic fallback:", apiError);
      result = this.generateFallbackLogoSystem(projectName, idea, styleDesc);
    }

    if (result) {
      try {
        result.primaryPngBase64 = await this.generatePngLogoWithGemini(result.primaryPromptForImageAI, projectName, idea);
      } catch (imgErr) {
        console.error("Failed to generate PNG logo with Gemini, continuing with SVGs only:", imgErr);
        result.primaryPngBase64 = "";
      }
    }

    return result;
  }

  private async generatePngLogoWithGemini(promptForImageAI: string, projectName: string, idea: string): Promise<string> {
    const optimizedPrompt = `A premium professional minimalist vector logo design for the brand "${projectName}" based on the concept "${idea}". Detail instructions: ${promptForImageAI || 'Modern logo mark, minimalist, clean'}. White clean solid color background, balanced geometry, modern corporate branding typography aesthetic, 8k resolution, flat vectors, elegant colors. Strictly NO photo-realistic mockups, NO realistic shadows, NO cluttered details, NO text, NO misspelled words. Single centered elegant icon.`;

    const modelsToTry = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini SDK Logo] Attempting PNG logo image generation with model: ${modelName}`);
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                text: optimizedPrompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              console.log(`[Gemini SDK Logo] Successfully generated logo image using model: ${modelName}`);
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn("[Gemini SDK Logo] Image generation failed with model %s. Error:", modelName, err?.message || err);
      }
    }

    console.error("[Gemini SDK Logo] All Gemini Image generation models failed. Returning empty string.", lastError);
    return "";
  }

  private generateFallbackLogoSystem(projectName: string, idea: string, styleDesc: string): any {
    const char = projectName ? projectName.trim().charAt(0).toUpperCase() : "M";
    
    // Choose color scheme based on the idea
    let primaryColor = "#F59E0B"; // Gold
    let secondaryColor = "#D97706";
    let bgStart = "#0F172A";
    let bgEnd = "#1E293B";
    let categoryName = "عام وفخم";
    
    const ideaLower = (idea + " " + styleDesc).toLowerCase();
    if (ideaLower.includes("طعام") || ideaLower.includes("أكل") || ideaLower.includes("مطعم") || ideaLower.includes("غذاء") || ideaLower.includes("مطبخ") || ideaLower.includes("حلويات") || ideaLower.includes("food") || ideaLower.includes("restaurant")) {
      primaryColor = "#EA580C"; // Orange
      secondaryColor = "#F97316";
      bgStart = "#180802";
      bgEnd = "#2D1509";
      categoryName = "مأكولات ومطاعم";
    } else if (ideaLower.includes("تقن") || ideaLower.includes("تكنولوجيا") || ideaLower.includes("برمج") || ideaLower.includes("رقمي") || ideaLower.includes("ويب") || ideaLower.includes("تطبيق") || ideaLower.includes("tech") || ideaLower.includes("app") || ideaLower.includes("software") || ideaLower.includes("digital")) {
      primaryColor = "#06B6D4"; // Cyan
      secondaryColor = "#3B82F6"; // Blue
      bgStart = "#030712";
      bgEnd = "#0F172A";
      categoryName = "تقني وبرمجي";
    } else if (ideaLower.includes("تجميل") || ideaLower.includes("ملابس") || ideaLower.includes("أزياء") || ideaLower.includes("موضة") || ideaLower.includes("صالون") || ideaLower.includes("عطور") || ideaLower.includes("beauty") || ideaLower.includes("fashion") || ideaLower.includes("perfume")) {
      primaryColor = "#EC4899"; // Pink
      secondaryColor = "#8B5CF6"; // Purple
      bgStart = "#1E1B4B";
      bgEnd = "#311042";
      categoryName = "موضة وجمال";
    } else if (ideaLower.includes("تعليم") || ideaLower.includes("مدرسة") || ideaLower.includes("كتاب") || ideaLower.includes("كورسات") || ideaLower.includes("study") || ideaLower.includes("education")) {
      primaryColor = "#10B981"; // Emerald
      secondaryColor = "#059669";
      bgStart = "#064E3B";
      bgEnd = "#022C22";
      categoryName = "تعليمي وتثقيفي";
    }

    const primarySvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%' height='100%'>
  <defs>
    <linearGradient id='bgGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${bgStart}'/>
      <stop offset='100%' stop-color='${bgEnd}'/>
    </linearGradient>
    <linearGradient id='brandGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${primaryColor}'/>
      <stop offset='100%' stop-color='${secondaryColor}'/>
    </linearGradient>
  </defs>
  <rect width='400' height='400' rx='24' fill='url(#bgGrad)'/>
  <circle cx='200' cy='175' r='80' fill='none' stroke='url(#brandGrad)' stroke-width='4' stroke-dasharray='12, 6'/>
  <circle cx='200' cy='175' r='70' fill='${bgEnd}' stroke='#334155' stroke-width='2'/>
  <text x='200' y='205' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='84' font-weight='900' fill='url(#brandGrad)' text-anchor='middle'>${char}</text>
  <text x='200' y='315' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='26' font-weight='bold' fill='#FFFFFF' text-anchor='middle'>${projectName}</text>
  <text x='200' y='345' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='11' font-weight='normal' fill='#94A3B8' letter-spacing='3' text-anchor='middle'>EST. 2026 • ${categoryName}</text>
</svg>`;

    const blackSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%' height='100%'>
  <rect width='400' height='400' rx='24' fill='#000000'/>
  <circle cx='200' cy='175' r='80' fill='none' stroke='#FFFFFF' stroke-width='4' stroke-dasharray='12, 6'/>
  <circle cx='200' cy='175' r='70' fill='#000000' stroke='#333333' stroke-width='2'/>
  <text x='200' y='205' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='84' font-weight='900' fill='#FFFFFF' text-anchor='middle'>${char}</text>
  <text x='200' y='315' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='26' font-weight='bold' fill='#FFFFFF' text-anchor='middle'>${projectName}</text>
  <text x='200' y='345' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='11' font-weight='normal' fill='#888888' letter-spacing='3' text-anchor='middle'>EST. 2026 • ${categoryName}</text>
</svg>`;

    const whiteSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%' height='100%'>
  <rect width='400' height='400' rx='24' fill='#FFFFFF' stroke='#E2E8F0' stroke-width='2'/>
  <circle cx='200' cy='175' r='80' fill='none' stroke='#000000' stroke-width='4' stroke-dasharray='12, 6'/>
  <circle cx='200' cy='175' r='70' fill='#FFFFFF' stroke='#E2E8F0' stroke-width='2'/>
  <text x='200' y='205' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='84' font-weight='900' fill='#000000' text-anchor='middle'>${char}</text>
  <text x='200' y='315' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='26' font-weight='bold' fill='#000000' text-anchor='middle'>${projectName}</text>
  <text x='200' y='345' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='11' font-weight='normal' fill='#64748B' letter-spacing='3' text-anchor='middle'>EST. 2026 • ${categoryName}</text>
</svg>`;

    const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100%' height='100%'>
  <circle cx='50' cy='50' r='45' fill='${bgStart}' stroke='${primaryColor}' stroke-width='3'/>
  <text x='50' y='68' font-family='Segoe UI, Roboto, Helvetica, sans-serif' font-size='50' font-weight='900' fill='${primaryColor}' text-anchor='middle'>${char}</text>
</svg>`;

    return {
      logoConceptExplanation: `تم تصميم هذا الشعار الاحترافي ذو النمط المعاصر لعلامتك التجارية "${projectName}" لتجسيد قيم الهوية البصرية من فئة "${categoryName}". يعتمد التصميم على الحرف المبدئي المتزن هندسياً مع خلفية فخمة تعكس الطابع المستدام والاحترافي للأعمال لعام 2026.`,
      primarySvg,
      blackSvg,
      whiteSvg,
      faviconSvg,
      primaryPromptForImageAI: `A premium professional minimalist vector logo design for the brand "${projectName}". White solid background, high-resolution clean 2d vector icon.`,
      usageNote: "يمكن استخدام النسخة الأساسية الملونة على جميع خلفيات السوشيال ميديا الداكنة، والنسخة البيضاء على المطبوعات، بينما favicon مخصص لعلامة تبويب المتجر والموقع الإلكتروني.",
      primaryPngBase64: ""
    };
  }
}
