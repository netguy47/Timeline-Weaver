
import type { Timeline } from '../types';

const generateHtmlForTimeline = (timeline: Timeline): string => {
  const sanitizedTitle = timeline.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const articlesHtml = timeline.articles.map((article, index) => {
    // Sanitize user-generated content to prevent basic HTML injection in the export
    const sanitizedHeadline = article.headline.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedByline = article.byline.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedBranchPrompt = article.branchPrompt.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedIntro = article.intro.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const sanitizedBody = article.body.map(p => p.replace(/</g, "&lt;").replace(/>/g, "&gt;"));

    return `
      <div class="article-container" id="${article.id}">
        <div class="article-content" data-article-id="${article.id}">
          <h2 class="article-headline">Chapter ${index + 1}: ${sanitizedHeadline}</h2>
          <p class="article-byline"><em>${sanitizedByline}</em></p>
          <blockquote class="article-prompt"><strong>Divergence point:</strong> "${sanitizedBranchPrompt}"</blockquote>
          <img src="${article.imageUrl}" alt="${article.imagePrompt}" class="article-image">
          <div class="prose">
            <p class="intro">${sanitizedIntro}</p>
            ${sanitizedBody.map(p => `<p>${p}</p>`).join('')}
          </div>
        </div>
        <div class="controls">
            <button class="play-button" data-play-for="${article.id}">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 24px; height: 24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
                <span class="button-text">Narrate Chapter</span>
            </button>
            <span class="status-text" data-status-for="${article.id}"></span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Timeline: ${sanitizedTitle}</title>
      <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
      <style>
        body { background-color: #111827; color: #f3f4f6; font-family: 'Georgia', serif; line-height: 1.6; }
        .main-container { max-width: 800px; margin: 0 auto; padding: 1rem 2rem 4rem; }
        .main-header { text-align: center; margin: 2rem 0; padding-bottom: 1rem; border-bottom: 1px solid #4b5563; }
        .main-header h1 { font-size: 3rem; color: #fcd34d; margin-bottom: 0.5rem; }
        .main-header p { font-size: 1.1rem; color: #d1d5db; font-style: italic; }
        .toc { background-color: #1f2937; padding: 1.5rem; border-radius: 8px; margin-bottom: 3rem; }
        .toc h2 { font-size: 1.5rem; color: #fcd34d; margin-top: 0; }
        .toc ol { list-style-position: inside; padding-left: 0; }
        .toc li { margin-bottom: 0.5rem; }
        .toc a { color: #fde68a; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }
        .article-container { background-color: #1f2937; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; border-left: 4px solid #f59e0b; }
        .article-headline { font-size: 2.25rem; color: #fde68a; margin-top: 0; }
        .article-byline { font-style: italic; color: #d1d5db; margin-bottom: 1.5rem; }
        .article-prompt { background-color: #374151; border-left: 3px solid #fcd34d; padding: 1rem; margin: 1.5rem 0; border-radius: 4px; color: #e5e7eb; }
        .article-image { width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; filter: grayscale(50%) sepia(20%); }
        .prose { font-family: 'Helvetica Neue', sans-serif; color: #d1d5db; font-size: 1.1rem; line-height: 1.7; }
        .prose .intro { font-weight: 600; font-size: 1.2rem; color: #e5e7eb; }
        .controls { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; }
        .play-button { background-color: #d97706; color: white; border: none; padding: 0.75rem 1rem; border-radius: 999px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; font-family: sans-serif; font-weight: bold; transition: background-color 0.2s; }
        .play-button:hover { background-color: #b45309; }
        .status-text { font-family: sans-serif; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="main-container">
        <header class="main-header">
          <h1>${sanitizedTitle}</h1>
          <p>An Alternate History by Timeline Weaver</p>
          <p><strong>Initial Prompt:</strong> "${timeline.initialPrompt.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"</p>
        </header>
        <nav class="toc">
            <h2>Table of Contents</h2>
            <ol>
              ${timeline.articles.map(article => `<li><a href="#${article.id}">${article.headline.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</a></li>`).join('')}
            </ol>
        </nav>
        ${articlesHtml}
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const synth = window.speechSynthesis;
          if (!synth) {
            console.warn("Speech Synthesis not supported by this browser.");
            document.querySelectorAll('.play-button').forEach(btn => btn.style.display = 'none');
            return;
          }

          let utteranceQueue = [];
          let currentlySpeakingArticle = null;
          
          const statuses = document.querySelectorAll('.status-text');

          const resetStatuses = () => {
              statuses.forEach(s => s.textContent = '');
              currentlySpeakingArticle = null;
          };

          const processQueue = () => {
            if (utteranceQueue.length === 0) {
              resetStatuses();
              return;
            }
            const text = utteranceQueue.shift();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = processQueue;
            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e);
                resetStatuses();
            };
            synth.speak(utterance);
          };
          
          synth.onvoiceschanged = () => { /* Some browsers require this to load voices */ };

          document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (e) => {
              const articleId = button.dataset.playFor;
              
              if (synth.speaking) {
                synth.cancel();
                // If clicking the same button, it acts as a stop button.
                if (currentlySpeakingArticle === articleId) {
                    resetStatuses();
                    return;
                }
              }
              
              resetStatuses();
              currentlySpeakingArticle = articleId;
              const statusEl = document.querySelector(\`.status-text[data-status-for="\${articleId}"]\`);
              if (statusEl) statusEl.textContent = 'Narrating...';

              utteranceQueue = [];
              const articleContent = document.querySelector(\`.article-content[data-article-id="\${articleId}"]\`);
              
              if (articleContent) {
                const headline = articleContent.querySelector('h2').textContent;
                const intro = articleContent.querySelector('.intro').textContent;
                const paragraphs = Array.from(articleContent.querySelectorAll('.prose p:not(.intro)')).map(p => p.textContent);
                
                utteranceQueue.push(headline);
                utteranceQueue.push(intro);
                utteranceQueue.push(...paragraphs);

                // Timeout to ensure cancel has finished
                setTimeout(processQueue, 100);
              }
            });
          });

          // Safety cleanup
          window.addEventListener('beforeunload', () => {
            if (synth.speaking) {
              synth.cancel();
            }
          });
        });
      <\/script>
    </body>
    </html>
  `;
};

const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportTimelineAsHtml = (timeline: Timeline) => {
  const htmlContent = generateHtmlForTimeline(timeline);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const fileName = `${timeline.title.toLowerCase().replace(/[\s\W]+/g, '-')}-timeline.html`;
  triggerDownload(blob, fileName);
};

export const exportTimelineAsJson = (timeline: Timeline) => {
  const jsonString = JSON.stringify(timeline, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const fileName = `${timeline.title.toLowerCase().replace(/[\s\W]+/g, '-')}-timeline.json`;
  triggerDownload(blob, fileName);
};