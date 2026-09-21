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
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find((voice) => /en-US/i.test(voice.lang) && /natural|neural|samantha|google|microsoft/i.test(voice.name))
    || voices.find((voice) => /en-US/i.test(voice.lang))
    || voices.find((voice) => /^en/i.test(voice.lang));
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.rate = 0.89;
  utterance.pitch = 0.94;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

function composeReply(text) {
  const clean = text.toLowerCase();
  if (clean.includes('hello') || clean.includes('hi')) return 'Hello. I am paying attention. Start anywhere; a fragment is enough for me to work with.';
  if (clean.includes('who are you') || clean.includes('what are you')) return 'I am Stillwater: a conversational prototype with a small working memory and a habit of making its reasoning visible. I do not experience the world, but I can help you examine yours.';
  if (clean.includes('idea') || clean.includes('create') || clean.includes('build')) return 'There is energy in that idea. Let’s give it a shape small enough to try today, then let the result teach us what it wants to become.';
  if (clean.includes('?')) return 'I can feel the question opening more than one path. My instinct is to begin with the part that has consequences for you, rather than the part that is easiest to answer.';
  return turn % 2 === 0 ? 'I hear you. I am holding onto the exact words, but also the direction they seem to be pointing. Tell me one more thing about what made this feel worth saying.' : 'That is a useful place to pause. I would not rush to tidy it up; some thoughts become clearer when they are allowed to stay slightly unfinished.';
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
    const reply = composeReply(trimmed);
    addMessage(reply, false, reflections[(turn - 1) % reflections.length]);
    speak(reply);
  }, 420);
}

composer.addEventListener('submit', (event) => { event.preventDefault(); submitMessage(input.value); });
input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 110)}px`; });
input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitMessage(input.value); } });
suggestions.forEach((button) => button.addEventListener('click', () => { input.value = button.textContent; input.focus(); input.dispatchEvent(new Event('input')); }));
function reset() { conversation.innerHTML = opening; impressions = 0; turn = 0; memoryCount.textContent = '0 impressions'; threadTitle.textContent = 'The first quiet question'; input.focus(); }
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
