exports.handler = async function(event) {
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

  output: {

    voice: "cedar"

  }

}
          }
        }
      }
    });

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: sessionConfig
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json"
      },
      body: data
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to create ephemeral token: " + error.message
      })
    };
  }
};
