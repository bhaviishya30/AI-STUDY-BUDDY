const modes = {
  doubt: {
    nav: "Ask AI",
    title: "Learn smarter,",
    subtitle: "Your personal AI study partner is ready. What are we learning today?",
    workspaceTitle: "Ask your study buddy",
    description: "No question is too small. Let's figure it out together.",
    label: "YOUR QUESTION",
    placeholder: "For example: Explain binary search with a simple example...",
    button: "Get an explanation",
    icon: "✧"
  },
  summary: {
    nav: "Notes Summarizer",
    title: "Make revision",
    subtitle: "Turn long notes into clear points you can revise with confidence.",
    workspaceTitle: "Summarize your notes",
    description: "Paste your class notes and get a concise revision guide.",
    label: "PASTE YOUR NOTES",
    placeholder: "Paste your notes here. You can include definitions, paragraphs, or lecture notes...",
    button: "Summarize notes",
    icon: "▤"
  },
  quiz: {
    nav: "Quiz Generator",
    title: "Ready to test",
    subtitle: "Practice a topic and find out what you already know.",
    workspaceTitle: "Create a practice quiz",
    description: "Enter a topic or notes and generate 5 multiple-choice questions.",
    label: "TOPIC OR NOTES",
    placeholder: "For example: Java strings, photosynthesis, or the French Revolution...",
    button: "Generate quiz",
    icon: "☷"
  }
};

let currentMode = "doubt";
const form = document.getElementById("studyForm");
const input = document.getElementById("studyInput");
const charCount = document.getElementById("charCount");
const submitButton = document.getElementById("submitButton");
const submitLabel = document.getElementById("submitLabel");
const resultPanel = document.getElementById("resultPanel");
const resultText = document.getElementById("resultText");
const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function chooseMode(mode) {
  if (!modes[mode]) return;
  currentMode = mode;
  const config = modes[mode];

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  document.querySelectorAll(".tool-card").forEach(button => {
    button.classList.toggle("selected", button.dataset.mode === mode);
  });

  document.getElementById("breadcrumbMode").textContent = config.nav;
  document.getElementById("pageTitle").innerHTML =
    `${config.title}<br><span>${mode === "doubt" ? "not harder." : mode === "summary" ? "easier." : "your knowledge?"}</span>`;
  document.getElementById("pageSubtitle").textContent = config.subtitle;
  document.getElementById("workspaceTitle").textContent = config.workspaceTitle;
  document.getElementById("workspaceDescription").textContent = config.description;
  document.getElementById("inputLabel").textContent = config.label;
  input.placeholder = config.placeholder;
  document.getElementById("workspaceIcon").textContent = config.icon;
  submitLabel.textContent = config.button;
  resultPanel.hidden = true;
  document.getElementById("sidebar").classList.remove("open");
}

document.querySelectorAll("[data-mode]").forEach(button => {
  button.addEventListener("click", () => chooseMode(button.dataset.mode));
});

input.addEventListener("input", () => {
  charCount.textContent = `${input.value.length.toLocaleString()} / 12,000`;
});

document.getElementById("clearButton").addEventListener("click", () => {
  input.value = "";
  charCount.textContent = "0 / 12,000";
  resultPanel.hidden = true;
  input.focus();
});

document.getElementById("menuButton").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    showToast("Enter a question, topic, or notes first.");
    input.focus();
    return;
  }

  submitButton.disabled = true;
  submitLabel.textContent = "Working on it...";
  resultPanel.hidden = true;
  resultText.classList.remove("error-text");

  try {
    const response = await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: currentMode, text })
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Something went wrong.");
    resultText.textContent = data.answer;
    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    resultText.textContent = error.message || "Could not connect. Please try again.";
    resultText.classList.add("error-text");
    resultPanel.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = modes[currentMode].button;
  }
});

document.getElementById("copyButton").addEventListener("click", async () => {
  const text = resultText.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Answer copied to clipboard.");
  } catch {
    showToast("Select the answer text and copy it manually.");
  }
});