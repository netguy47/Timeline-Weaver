// server.js
// To run this server:
// 1. In your project's terminal, install dependencies: npm install express @google/genai openai cors dotenv
// 2. Create a file named .env in the same directory as this server.js file.
// 3. Add your API keys to the .env file like this:
//    OPENAI_API_KEY="your_actual_openai_api_key_here"
//    GOOGLE_API_KEY="your_actual_google_api_key_here"
// 4. Run the server from your terminal: node server.js

require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const { GoogleGenAI, Type } = require('@google/genai');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// --- Key and Client Initialization ---

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!OPENAI_API_KEY || !GOOGLE_API_KEY) {
  console.error("\nFATAL ERROR: API keys are not defined.");
  console.error("Please ensure OPENAI_API_KEY and GOOGLE_API_KEY are in your .env file.\n");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const googleAi = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// --- Schemas for Google GenAI ---

const articleSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: "A compelling, news-style headline for the article. Maximum 15 words." },
    byline: { type: Type.STRING, description: "A fictional reporter's name and dateline. Example: 'By Thomas Cadwell, reporting from Alexandria, 48 BCE'." },
    intro: { type: Type.STRING, description: "A single, engaging introductory paragraph that sets the scene." },
    body: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 paragraphs of detailed narrative analysis. Use an eyewitness tone and include fictional expert commentary." },
    imagePrompt: { type: Type.STRING, description: "A detailed prompt for a vintage, grainy, photorealistic image that captures the essence of the article's main event." },
    nextChapterOptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Three distinct and intriguing 'what if' prompts that could logically follow this historical event." },
  },
  required: ["headline", "byline", "intro", "body", "imagePrompt", "nextChapterOptions"],
};

const artifactSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A title for the document, like 'A Letter from Tribune Marcus'." },
        type: { type: Type.STRING, description: "The type of document, e.g., 'Personal Letter', 'Diary Entry', 'Official Memo'." },
        content: { type: Type.STRING, description: "The full text of the artifact, written from the perspective of someone within the timeline (1-2 paragraphs)." }
    },
    required: ["title", "type", "content"],
};

// --- API Endpoints ---

// Root endpoint for a user-friendly status page in the browser
app.get('/', (req, res) => {
    res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Timeline Weaver Backend</title>
        <style>
            body { 
                background-color: #111827; 
                color: #e5e7eb; 
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                background-color: #1f2937;
                padding: 2rem 3rem;
                border-radius: 0.5rem;
                border: 1px solid #374151;
                max-width: 600px;
                text-align: center;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
            }
            h1 {
                color: #fcd34d;
                font-size: 1.875rem;
                margin-top: 0;
            }
            p {
                line-height: 1.6;
            }
            code {
                background-color: #374151;
                padding: 0.2rem 0.4rem;
                border-radius: 0.25rem;
                font-family: 'Courier New', Courier, monospace;
            }
            ul {
                list-style: none;
                padding: 0;
                text-align: left;
                margin-top: 1.5rem;
            }
            li {
                background-color: #374151;
                padding: 0.75rem 1rem;
                margin-bottom: 0.5rem;
                border-radius: 0.25rem;
                font-family: 'Courier New', Courier, monospace;
            }
            .method {
                color: #a7f3d0;
                font-weight: bold;
                margin-right: 1rem;
                display: inline-block;
                width: 40px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Timeline Weaver Backend</h1>
            <p>The server is running successfully. This backend provides AI generation and text-to-speech services for the Timeline Weaver application.</p>
            <p>The following API endpoints are available:</p>
            <ul>
                <li><span class="method">GET</span> <code>/api/status</code></li>
                <li><span class="method">POST</span> <code>/api/generate-article</code></li>
                <li><span class="method">POST</span> <code>/api/generate-image</code></li>
                <li><span class="method">POST</span> <code>/api/generate-artifact</code></li>
                <li><span class="method">POST</span> <code>/api/generate-echo</code></li>
                <li><span class="method">POST</span> <code>/api/tts</code></li>
            </ul>
        </div>
    </body>
    </html>
    `);
});

app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online' });
});

app.post('/api/generate-article', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Request body must contain a "prompt" field.' });
  }

  try {
    const textResponse = await googleAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate an alternate history news report based on this premise: "${prompt}"`,
      config: {
        systemInstruction: "You are a world-class historian and journalist for 'Timeline Weaver'. Your tone is academic, detailed, and immersive. You must return the data in the requested JSON format.",
        responseMimeType: "application/json",
        responseSchema: articleSchema,
      },
    });

    // Robustly parse the JSON response, removing markdown fences if they exist.
    let jsonText = textResponse.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.lastIndexOf('```')).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.lastIndexOf('```')).trim();
    }
    const articleJson = JSON.parse(jsonText);


    // Robust defensive check: Ensure article.body is always a valid array.
    if (!Array.isArray(articleJson.body)) {
        console.warn(`[Robustness] AI returned article.body as type ${typeof articleJson.body}. Forcing to array.`);
        if (typeof articleJson.body === 'string') {
            articleJson.body = articleJson.body.split('\n').filter(p => p && p.trim() !== '');
        } else {
            articleJson.body = [];
        }
    } else {
        articleJson.body = articleJson.body.filter(p => p && typeof p === 'string' && p.trim() !== '');
    }

    // Robust defensive check: Ensure nextChapterOptions is always a valid array.
    if (!Array.isArray(articleJson.nextChapterOptions)) {
        console.warn(`[Robustness] AI returned nextChapterOptions as type ${typeof articleJson.nextChapterOptions}. Forcing to empty array.`);
        articleJson.nextChapterOptions = [];
    }
    
    res.status(200).json(articleJson);

  } catch (error) {
    console.error('Google GenAI Error (Article):', error);
    res.status(500).json({ message: 'Error generating article content.', details: error.message });
  }
});

app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Request body must contain a "prompt" field.' });
    }

    try {
        const imageResponse = await googleAi.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `${prompt}, vintage photo, grainy, historical photograph, cinematic`,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        const base64ImageBytes = imageResponse.generatedImages[0]?.image.imageBytes;
        if (!base64ImageBytes) throw new Error("Image generation returned no data.");
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        res.status(200).json({ imageUrl });
    } catch (imageError) {
        console.warn("Server-side image generation failed:", imageError.message);
        res.status(500).json({ message: 'Error generating image.', details: imageError.message });
    }
});

app.post('/api/generate-artifact', async (req, res) => {
    const { article } = req.body;
    if (!article) {
        return res.status(400).json({ message: 'Request body must contain an "article" object.' });
    }
    const articleContext = `Headline: ${article.headline}\nIntro: ${article.intro}`;
    try {
        const response = await googleAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following news report, generate a short, related primary source document (like a letter, diary entry, or official memo).\n\nCONTEXT:\n${articleContext}`,
            config: {
                systemInstruction: "You are a historical archivist. Your response must be in the requested JSON format.",
                responseMimeType: "application/json",
                responseSchema: artifactSchema,
            },
        });
        res.status(200).json(JSON.parse(response.text));
    } catch (error) {
        console.error('Google GenAI Error (Artifact):', error);
        res.status(500).json({ message: 'Error generating artifact.', details: error.message });
    }
});

app.post('/api/generate-echo', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ message: 'Request body must contain a "prompt" field.' });
    }
    try {
        const response = await googleAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The following is a 'what if' historical prompt: "${prompt}". In 2-3 concise sentences, explain what actually happened in our real-world history regarding this event.`,
            config: { systemInstruction: "You are a concise and factual historian." }
        });
        res.status(200).json({ text: response.text });
    } catch(error) {
        console.error('Google GenAI Error (Echo):', error);
        res.status(500).json({ message: 'Error generating historical echo.', details: error.message });
    }
});

app.post('/api/tts', async (req, res) => {
  const { text, voice = "nova" } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Missing text' });
  }

  try {
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
    });

    // The correct way for OpenAI SDK v4+
    const arrayBuffer = await mp3Response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", buffer.length);
    res.send(buffer);

  } catch (error) {
    console.error("❌ OpenAI TTS Error:", error.message);
    res.status(500).json({ 
      message: "Error generating TTS audio.",
      details: error.message 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Timeline Weaver server is running on http://localhost:${PORT}`));