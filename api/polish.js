export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { draft } = req.body;

  if (!draft || typeof draft !== "string" || draft.trim() === "") {
    return res.status(400).json({ error: "Please provide a draft to polish." });
  }

  if (draft.length > 6000) {
    return res.status(400).json({ error: "That draft is too long. Please keep it under 6000 characters." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are an expert career writing assistant. Rewrite the following cover letter or outreach message to sound more professional, confident, and clear, while keeping the original meaning and key details intact.

Respond ONLY with valid JSON in this exact shape, no markdown formatting, no code fences, nothing else:
{
  "polished": "the rewritten text here",
  "changes": ["short change 1", "short change 2", "short change 3"]
}

The "changes" array should list 3-5 short, specific improvements you made.

Original text:
"""${draft}"""`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again in a moment." });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(502).json({ error: "Received an unexpected response from the AI. Please try again." });
    }

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", cleaned);
      return res.status(502).json({ error: "Couldn't process the AI's response. Please try again." });
    }

    if (!parsed.polished) {
      return res.status(502).json({ error: "The AI didn't return a polished version. Please try again." });
    }

    return res.status(200).json({
      polished: parsed.polished,
      changes: Array.isArray(parsed.changes) ? parsed.changes : []
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong on our end. Please try again." });
  }
}