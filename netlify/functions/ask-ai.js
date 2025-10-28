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

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Gemini API key not configured" }),
      };
    }

    // Build conversation history for Gemini
    let conversationText = "You are SmartSpeak, a friendly and encouraging AI English tutor. Help users improve their English through natural conversation. Provide clear explanations, gently correct mistakes, and encourage practice. Keep responses conversational and educational.\n\n";
    
    // Add previous messages
    history.forEach(msg => {
      if (msg.role === "user") {
        conversationText += `Student: ${msg.content}\n`;
      } else if (msg.role === "assistant") {
        conversationText += `Tutor: ${msg.content}\n`;
      }
    });
    
    // Add current message
    conversationText += `Student: ${message}\nTutor:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: conversationText
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      return { 
        statusCode: response.status, 
        headers,
        body: JSON.stringify({ error: errorData.error?.message || "API error" }) 
      };
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't respond.";

    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ reply: reply.trim() }) 
    };

  } catch (err) {
    console.error("Error:", err);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ error: err.message }) 
    };
  }
}
