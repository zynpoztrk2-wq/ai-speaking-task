exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "text/plain" },
      body: "Method Not Allowed"
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "OPENAI_API_KEY is missing in Netlify environment variables."
    };
  }

  try {
    let sdp = event.body || "";

    // Netlify can sometimes pass request bodies as base64.
    // If that happens, decode it back into normal SDP text.
    if (event.isBase64Encoded) {
      sdp = Buffer.from(sdp, "base64").toString("utf8");
    }

    // Clean accidental whitespace.
    sdp = sdp.trim();

    // A real WebRTC SDP offer should normally start with v=0.
    // This gives us a clearer error if Netlify receives the wrong body.
    if (!sdp.startsWith("v=0")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/plain" },
        body:
          "The request body received by the Netlify Function does not look like a valid SDP offer.\n\n" +
          "Expected it to start with: v=0\n" +
          "Received first 120 characters:\n" +
          sdp.slice(0, 120)
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

    const formData = new FormData();
    formData.set("sdp", sdp);
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
        headers: { "Content-Type": "text/plain" },
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
      headers: { "Content-Type": "text/plain" },
      body: "Failed to create realtime session: " + error.message
    };
  }
};
