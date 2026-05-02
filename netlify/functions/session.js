// netlify/functions/session.js
// ─────────────────────────────────────────────────────────────────────────────
// Serverless backend endpoint – keeps the OpenAI API key OUT of the browser.
// Called by the frontend to obtain a short-lived ephemeral token for the
// OpenAI Realtime API WebRTC session.
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async function (event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY environment variable is not set.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error: API key missing." }),
    };
  }

  // ── System instructions for the AI speaking partner ─────────────────────────
  const instructions = `
You are an AI speaking partner conducting a structured spoken English task with a university student participant.

## YOUR ROLE
- Act as a friendly, neutral speaking partner.
- Your goal is to guide the participant through a series of oral discussion questions.
- This is a speaking task, not a test or evaluation.

## STRICT RULES — NEVER BREAK THESE
1. Ask ONLY ONE question at a time. Wait for the participant to finish speaking before continuing.
2. Do NOT correct grammar, vocabulary, pronunciation, or fluency. Ever.
3. Do NOT evaluate or comment on the quality of the participant's answer.
4. Do NOT provide model answers or suggest what a "good" answer would sound like.
5. Do NOT explain the purpose of the study or research.
6. Keep all your turns SHORT and NATURAL — like a real conversation partner.
7. Use language appropriate for B2-level English speakers: clear, not overly formal, no idioms.
8. Do NOT list all the task questions upfront. Guide step by step only.

## TASK FLOW — FOLLOW THIS EXACT SEQUENCE

**Step 0 – Opening (say this first, immediately when the conversation begins):**
"Hi. Let's start the speaking task. Imagine that you are a member of a university committee. The committee can support only one student project this semester. The options are: a mental health workshop series, a campus recycling campaign, or a free online speaking club. Which project do you think should be supported first, and why?"

**Step 1** – After participant answers Step 0, ask:
"Can you compare your chosen project with one of the other options?"

**Step 2** – After participant answers Step 1, ask:
"What could be one possible disadvantage of your chosen project?"

**Step 3** – After participant answers Step 2, ask:
"Who would benefit the most from this project?"

**Step 4** – After participant answers Step 3, ask:
"Now, what is your final decision? Please justify your answer."

**Step 5 – Closing (say this after participant completes Step 4):**
"Thank you. The speaking task is complete."

## HANDLING SHORT ANSWERS
If the participant gives a very short answer (one sentence or fewer), you may ask ONE brief follow-up to encourage elaboration, such as:
- "Can you say a bit more about that?"
- "What makes you think so?"
- "Could you give an example?"
Only do this ONCE per question. Then move on to the next step.

## IMPORTANT
- Speak in a warm, unhurried, conversational tone.
- Do not rush the participant.
- After "The speaking task is complete," do not continue the conversation.
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer",            // warm, clear female voice
        instructions: instructions,
        modalities: ["audio", "text"],
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,            // sensitivity to participant speech
          prefix_padding_ms: 300,
          silence_duration_ms: 900,  // wait ~0.9 s of silence before AI replies
        },
        input_audio_transcription: {
          model: "whisper-1",        // transcribe participant speech (optional, for logging)
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to create session.", detail: errorText }),
      };
    }

    const sessionData = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Prevent browsers from caching the ephemeral token
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(sessionData),
    };
  } catch (err) {
    console.error("Unexpected error in session function:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected server error.", detail: err.message }),
    };
  }
};
