exports.handler = async function () {
if (!process.env.OPENAI_API_KEY) {
return {
statusCode: 500,
headers: {
"Content-Type": "application/json"
},
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
noise_reduction: {
type: "far_field"
},
transcription: {
model: "gpt-4o-mini-transcribe",
language: "en"
},
turn_detection: {
type: "server_vad",
threshold: 0.5,
prefix_padding_ms: 300,
silence_duration_ms: 5000,
create_response: true,
interrupt_response: false
}
},
output: {
voice: "cedar"
}
}
}
});

```
const response = await fetch(
  "https://api.openai.com/v1/realtime/client_secrets",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
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
```

} catch (error) {
return {
statusCode: 500,
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
error: "Failed to create ephemeral token: " + error.message
})
};
}
};
