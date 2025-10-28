export async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { message, history = [] } = JSON.parse(event.body || "{}");
    
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing message" }),
      };
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key not configured" }),
      };
    }

    const messages = [
      { 
        role: "system", 
        content: "You are SmartSpeak, a friendly AI English tutor. Help users improve their English through natural conversation. Provide clear explanations, gently correct mistakes, and encourage practice."
      },
      ...history
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        statusCode: response.status, 
        headers,
        body: JSON.stringify({ error: errorData.error?.message }) 
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ reply }) 
    };

  } catch (err) {
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: err.message }) 
    };
  }
}