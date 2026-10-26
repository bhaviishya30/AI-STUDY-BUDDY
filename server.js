require("dotenv").config();

console.log("ENV file loaded:", Boolean(process.env.OPENAI_API_KEY));

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const prompts = {
  doubt: "You are a friendly study tutor. Explain the answer in simple, clear language for a student. Use short headings and a small example when useful. If the question is ambiguous, ask one brief clarification.",
  summary: "You are a study-notes assistant. Summarize the provided notes into clear revision notes. Include a short overview, key points, and important terms. Do not invent facts not present in the notes.",
  quiz: "You are a quiz creator. Create 5 multiple-choice questions from the topic or notes the student gives. Each question must have four options (A-D), one correct answer, and a one-sentence explanation. Make the format easy to read."
};

app.post("/api/study", async (req, res) => {
  const { mode, text } = req.body || {};

  if (!prompts[mode]) {
    return res.status(400).json({ error: "Please choose a valid study tool." });
  }
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Please enter a question, topic, or notes first." });
  }
  if (text.length > 12000) {
    return res.status(400).json({ error: "Please keep your input under 12,000 characters." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI is not connected yet. Add your API key to a .env file, then restart the server. You can still explore the demo UI."
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: prompts[mode],
        input: text.trim()
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || "The AI request failed. Please try again.";
      return res.status(response.status).json({ error: message });
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(part => part.type === "output_text")
      .map(part => part.text)
      .join("\n")
      .trim();

    if (!answer) {
      return res.status(502).json({ error: "The AI returned an empty answer. Please try again." });
    }

    res.json({ answer });
  } catch (error) {
    console.error("Study request failed:", error.message);
    res.status(500).json({ error: "Could not reach the AI service. Check your connection and try again." });
  }
});

app.listen(PORT, () => {
  console.log(`AI Study Buddy is running at http://localhost:${PORT}`);
});