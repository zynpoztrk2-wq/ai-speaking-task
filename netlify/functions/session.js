exports.handler = async function () {
  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "OPENAI_API_KEY is missing in Netlify environment variables."
      })
    };
  }

  try {
    const sessionConfig = JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-realtime",
        audio: {
          input: {
            noise_reduction: { type: "near_field" },
            turn_detection: {
              type: "server_vad",        // sabit eşik (semantic_vad değil)
              threshold: 0.6,            // nefes/gürültü elensin
              prefix_padding_ms: 300,    // ilk hece kaçmasın
              silence_duration_ms: 5000, // 5 sn sessizlik = tur bitti
              create_response: true,     // öğrenci susunca AI devam etsin
              interrupt_response: false  // AI scripti yarıda kesilmesin
            }
          },
          output: {
            voice: "cedar"
          }
        }
      }
    });

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
          "Content-Type": "application/json"
        },
        body: sessionConfig
      }
    );

    const data = await response.text();
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: data
    };
  } catch (error) {
    console.error("Session function error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to create ephemeral token: " + String(error)
      })
    };
  }
};
