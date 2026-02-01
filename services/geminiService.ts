
import { GoogleGenAI, Type } from "@google/genai";
import type { Article, Artifact } from '../types';

// Create a new GoogleGenAI instance right before use to ensure it uses the most up-to-date API key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const articleSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: "A grand, multi-part headline (max 20 words)." },
    byline: { type: Type.STRING, description: "Detailed fictional reporter, dateline, and secondary credits." },
    intro: { type: Type.STRING, description: "A lengthy, gripping introductory essay (approx 150 words)." },
    body: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Dense, academic, and extremely detailed paragraphs of Archive POV analysis. Each paragraph must be a substantive exploration of specific causality." 
    },
    groundPOV: {
      type: Type.OBJECT,
      properties: {
        format: { type: Type.STRING, description: "Immersive format, e.g. 'The Lost Journals of...', 'Confessions of...'" },
        content: { type: Type.STRING, description: "A multi-paragraph, emotionally charged first-person narrative (substantive portion of word count)." }
      },
      required: ["format", "content"]
    },
    imagePrompt: { type: Type.STRING, description: "Hyper-detailed cinematic photorealistic prompt." },
    soundscapePrompt: { type: Type.STRING, description: "Atmospheric foley and music directions for the narration." },
    pivotPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Title of a secondary divergence." },
          description: { type: Type.STRING, description: "Strategic 'what-if' premise." }
        },
        required: ["title", "description"]
      },
      description: "Strategic fork points in history."
    },
    systemicConsequences: {
      type: Type.OBJECT,
      properties: {
        technological: { type: Type.NUMBER },
        cultural: { type: Type.NUMBER },
        political: { type: Type.NUMBER },
        summary: { type: Type.STRING, description: "Detailed analysis of societal impact." }
      },
      required: ["technological", "cultural", "political", "summary"]
    },
    plausibility: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        frictionNote: { type: Type.STRING }
      },
      required: ["score", "frictionNote"]
    }
  },
  required: ["headline", "byline", "intro", "body", "groundPOV", "imagePrompt", "soundscapePrompt", "pivotPoints", "systemicConsequences", "plausibility"],
};

export const generateArticleContent = async (
  prompt: string, 
  minWordCount: number = 1200, 
  parentArticle?: Article
): Promise<Omit<Article, 'id' | 'parentId' | 'imageUrl' | 'branchPrompt' | 'historicalEcho'>> => {
  const ai = getAI();
  const context = parentArticle ? `Based on previous event: ${parentArticle.headline}. Divergence: ${parentArticle.branchPrompt} -> Next Phase: ${prompt}` : `Foundational Divergence: ${prompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `UNCOMPROMISING CAUSAL SIMULATION REQUIRED. 
    Branching Premise: "${context}". 
    Simulation Goal: Generate a MINIMUM of ${minWordCount} words of deep historical analysis. 
    
    CRITICAL INSTRUCTIONS:
    1. The 'body' array MUST contain at least 10-15 dense paragraphs. Each paragraph should be a complete scholarly exploration of a specific societal or geopolitical ripple.
    2. The 'groundPOV.content' MUST be at least 500 words of first-person narrative, providing an emotional anchor to the macro-events.
    3. Ensure high probability of causal logic: every historical shift must be supported by systemic consequences.
    4. Verbosity is a virtue: use rich, period-accurate, or academic language.`,
    config: {
      systemInstruction: `You are the ultimate Chronos Causal Simulator. 
      You specialize in high-fidelity alternate history reports that exceed ${minWordCount} words. 
      Your output is used by high-level chrononauts to understand complex systemic shifts. 
      DO NOT summarize. ELABORATE. Provide technical, cultural, and political depth for every causal node.`,
      responseMimeType: "application/json",
      responseSchema: articleSchema,
    },
  });

  const raw = JSON.parse(response.text || '{}');
  return {
    ...raw,
    pivotPoints: raw.pivotPoints.map((p: any) => ({ ...p, id: crypto.randomUUID() }))
  };
};

export const generateImage = async (prompt: string): Promise<{ imageUrl: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `${prompt}, historical masterpiece, 8k resolution, film grain, hyper-realistic, atmospheric lighting, National Geographic style` }],
    },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return { imageUrl: `data:image/png;base64,${part.inlineData.data}` };
    }
  }
  throw new Error("Visual simulation failed.");
};

export const generateArtifact = async (article: Article): Promise<Artifact> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a physical artifact for: ${article.headline}`,
    config: {
      systemInstruction: "You are a master archivist. Create a long-form document artifact (300+ words) that feels authentic to the period, using period-accurate vernacular.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING },
          content: { type: Type.STRING, description: "Authentic text (300+ words)." }
        },
        required: ["title", "type", "content"]
      }
    }
  });
  return JSON.parse(response.text || '{}') as Artifact;
};

export const generateHistoricalEcho = async (prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Explain the real-world historical context of: "${prompt}" with academic depth.`,
    config: { systemInstruction: "Concise yet comprehensive factual historian." }
  });
  return response.text || '';
};
