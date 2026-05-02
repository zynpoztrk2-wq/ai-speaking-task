exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: "OPENAI_API_KEY is missing in Netlify environment variables."
    };
  }

  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: "gpt-realtime",
    audio: {
      output: {
        voice: "marin"
      }
    }
  });

  try {
    const formData = new FormData();
    formData.set("sdp", event.body);
    formData.set("session", sessionConfig);

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "text/plain"
        },
        body: responseText
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/sdp"
      },
      body: responseText
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain"
      },
      body: "Failed to create realtime session: " + error.message
    };
  }
};
