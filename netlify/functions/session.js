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

    if (event.isBase64Encoded) {
      sdp = Buffer.from(sdp, "base64").toString("utf8");
    }

    sdp = sdp.trim();

    if (!sdp.startsWith("v=0")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/plain" },
        body:
          "Invalid SDP received by Netlify Function.\n\n" +
          "Expected SDP to start with v=0.\n\n" +
          "Received first 200 characters:\n" +
          sdp.slice(0, 200)
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

    const boundary = "----openai-realtime-boundary-" + Date.now();

    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="sdp"\r\n` +
      `Content-Type: application/sdp\r\n\r\n` +
      `${sdp}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="session"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${sessionConfig}\r\n` +
      `--${boundary}--\r\n`;

    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
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
