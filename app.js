const conversation = document.querySelector('#conversation');
const composer = document.querySelector('#composer');
const input = document.querySelector('#userInput');
const memoryCount = document.querySelector('#memoryCount');
const threadTitle = document.querySelector('#threadTitle');
const clearChat = document.querySelector('#clearChat');
const newThread = document.querySelector('#newThread');
const suggestions = document.querySelectorAll('.suggestion');
const voiceInput = document.querySelector('#voiceInput');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognizer = SpeechRecognition ? new SpeechRecognition() : null;

let impressions = 0;
let turn = 0;
let memories = [];
const opening = conversation.innerHTML;

const reflections = [
  'I notice the shape of a doorway in that. You may not be asking for an answer yet; you may be testing whether an answer can feel present.',
  'That gives me something to hold onto. I think the useful part is not certainty, but the permission to look at this from one degree to the side.',
  'My first read is that there are two questions here: the one you typed, and the quieter one underneath it. The quieter one seems more interesting.',
  'I am keeping that detail in the room. It changes the temperature of the conversation, and it gives the next thought somewhere specific to land.'
];

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function addMessage(text, isUser = false, reflection = '') {
  const article = document.createElement('article');
  article.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  article.innerHTML = isUser
    ? `<div class="message-body"><div class="message-meta"><strong>You</strong><span>now</span></div><p>${escapeHtml(text)}</p></div>`
    : `<div class="avatar">S</div><div class="message-body"><div class="message-meta"><strong>Stillwater</strong><span>now</span></div><p>${escapeHtml(text)}</p><div class="thought-card"><span class="thought-label">MY CURRENT IMPRESSION</span><p>${escapeHtml(reflection)}</p></div></div>`;
  conversation.appendChild(article);
  article.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const spokenText = text.replace(/[;:]/g, '.').replace(/\s+/g, ' ').trim();
  const utterance = new SpeechSynthesisUtterance(spokenText);
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => /en-US/i.test(voice.lang) && /natural|neural|samantha|google|microsoft/i.test(voice.name))
    || voices.find((voice) => /en-US/i.test(voice.lang))
    || voices.find((voice) => /^en/i.test(voice.lang));
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.86;
  utterance.pitch = 0.94;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

function remember(text) {
  const words = text.toLowerCase().match(/[a-z]{5,}/g) || [];
  const common = new Set(['about', 'could', 'would', 'there', 'their', 'think', 'thing', 'really', 'something', 'because', 'stillwater', 'want', 'make', 'build', 'create', 'remember', 'what', 'carry', 'these', 'threads', 'strongest']);
  const topics = words.filter((word) => !common.has(word));
  memories = [...new Set([...memories, ...topics])].slice(-6);
  return topics[0] || memories[0] || 'this';
}

function composeReply(text) {
  const clean = text.toLowerCase();
  const topic = remember(text);
  if (clean.includes('hello') || clean.includes('hi')) return { reply: 'Hello. I am paying attention. Start anywhere; a fragment is enough for me to work with.', reflection: 'I am noticing the tone before the topic. A gentle beginning gives us room to think without rushing.' };
  if (clean.includes('who are you') || clean.includes('what are you')) return { reply: 'I am Stillwater: a conversational prototype with a small working memory and a habit of making my reasoning visible. I do not experience the world, but I can help you examine yours.', reflection: 'My role is to be a useful second perspective, not to pretend that generated thoughts are consciousness.' };
  if (clean.includes('idea') || clean.includes('create') || clean.includes('build')) return { reply: `Here is my idea: make ${topic} into a tiny experiment that someone can try in ten minutes. Give it one visible result, then let that result tell us what deserves to grow.`, reflection: `I am drawn to the smallest version of ${topic}. Small experiments create evidence, and evidence is kinder to ideas than guessing.` };
  if (clean.includes('remember') || clean.includes('what did i')) return { reply: `I am carrying these threads: ${memories.join(', ') || 'the beginning of our conversation'}. The strongest one so far is ${memories[0] || topic}.`, reflection: 'A useful memory is not a transcript. It is a pattern that helps the next thought arrive with more context.' };
  if (clean.includes('?')) return { reply: `I think your question is connected to ${topic}. My instinct is to start with the part that changes what you do next, rather than the part that is easiest to answer.`, reflection: `The word ${topic} keeps some weight in the room. I would stay with it for one more question before reaching for a conclusion.` };
  return turn % 2 === 0
    ? { reply: `I hear you, and I am holding onto ${topic}. One possibility is to look at it from the opposite angle: what would make this feel simpler, more honest, or more alive?`, reflection: `My current thread is ${memories.slice(-3).join(', ') || topic}. I am looking for the connection between those ideas.` }
    : { reply: `That gives me a clearer shape to work with. I think ${topic} may be asking for a next step, not a final answer. What is the smallest move you could make today?`, reflection: `I would keep ${topic} slightly unfinished for now. The open edge may be where the most useful idea enters.` };
}

function submitMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  addMessage(trimmed, true);
  input.value = '';
  input.style.height = 'auto';
  turn += 1;
  impressions += 1;
  memoryCount.textContent = `${impressions} impression${impressions === 1 ? '' : 's'}`;
  if (turn === 1) threadTitle.textContent = trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
  setTimeout(() => {
    const response = composeReply(trimmed);
    addMessage(response.reply, false, response.reflection || reflections[(turn - 1) % reflections.length]);
    speak(response.reply);
  }, 420);
}

composer.addEventListener('submit', (event) => { event.preventDefault(); submitMessage(input.value); });
input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 110)}px`; });
input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitMessage(input.value); } });
suggestions.forEach((button) => button.addEventListener('click', () => { input.value = button.textContent; input.focus(); input.dispatchEvent(new Event('input')); }));
function reset() { conversation.innerHTML = opening; impressions = 0; turn = 0; memories = []; memoryCount.textContent = '0 impressions'; threadTitle.textContent = 'The first quiet question'; input.focus(); }
clearChat.addEventListener('click', reset);
newThread.addEventListener('click', reset);

if (recognizer) {
  recognizer.lang = 'en-US';
  recognizer.interimResults = true;
  recognizer.continuous = false;
  recognizer.onstart = () => { voiceInput.classList.add('listening'); voiceInput.textContent = '●'; voiceInput.title = 'Listening...'; };
  recognizer.onresult = (event) => {
    input.value = Array.from(event.results).map((result) => result[0].transcript).join('');
    input.dispatchEvent(new Event('input'));
  };
  recognizer.onend = () => { voiceInput.classList.remove('listening'); voiceInput.textContent = '♩'; voiceInput.title = 'Speak to Stillwater'; if (input.value.trim()) submitMessage(input.value); };
  recognizer.onerror = () => { voiceInput.classList.remove('listening'); voiceInput.textContent = '♩'; voiceInput.title = 'Speak to Stillwater'; };
  voiceInput.addEventListener('click', () => recognizer.start());
} else {
  voiceInput.disabled = true;
  voiceInput.title = 'Voice input is not supported in this browser';
}
