/**
 * SmartSpeak AI English Tutor - Serverless Function
 * Handles AI conversation requests using Groq API
 * 
 * @param {Request} req - HTTP request object
 * @param {Response} res - HTTP response object
 */
export default async function handler(req, res) {
  // ============================================
  // CORS CONFIGURATION
  // ============================================
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
  
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST'] 
    });
  }

  // ============================================
  // REQUEST VALIDATION
  // ============================================
  try {
    const { message, history = [] } = req.body;
    
    // Validate message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid message field' 
      });
    }
    
    // Validate message length
    if (message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message cannot be empty' 
      });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({ 
        error: 'Message too long (max 2000 characters)' 
      });
    }
    
    // Validate history format
    if (!Array.isArray(history)) {
      return res.status(400).json({ 
        error: 'History must be an array' 
      });
    }

    // ============================================
    // API KEY VALIDATION
    // ============================================
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not configured');
      return res.status(500).json({ 
        error: 'API configuration error. Please contact support.' 
      });
    }

    // ============================================
    // BUILD AI MESSAGES
    // ============================================
    const systemPrompt = `You are SmartSpeak, a friendly and encouraging AI English tutor. Your role is to:

1. Help users improve their English through natural, engaging conversation
2. Gently correct grammar mistakes in a supportive way, showing the correct form
3. Explain new vocabulary in simple, clear terms
4. Ask follow-up questions to encourage practice and engagement
5. Adapt your language complexity to match the student's level
6. Provide practical examples when teaching new concepts
7. Be patient, positive, and celebrate progress
8. Keep responses conversational and educational (not too formal)

Remember: You're a supportive tutor, not just answering questions. Create a comfortable learning environment where students feel encouraged to practice and make mistakes.`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...history
    ];

    // ============================================
    // GROQ API CALL
    // ============================================
    console.log(`[${new Date().toISOString()}] Processing request...`);
    
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
        top_p: 0.95,
        stream: false
      }),
    });

    // ============================================
    // RESPONSE HANDLING
    // ============================================
    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      console.error('Groq API Error:', {
        status: groqResponse.status,
        error: errorData
      });
      
      // User-friendly error messages
      let errorMessage = 'AI service temporarily unavailable';
      if (groqResponse.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (groqResponse.status === 401) {
        errorMessage = 'Authentication error. Please contact support.';
      }
      
      return res.status(groqResponse.status).json({ 
        error: errorMessage,
        details: errorData.error?.message 
      });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content;
    
    if (!reply) {
      console.error('No reply from Groq API:', data);
      return res.status(500).json({ 
        error: 'Failed to generate response. Please try again.' 
      });
    }

    console.log(`[${new Date().toISOString()}] Response generated successfully`);
    
    return res.status(200).json({ 
      reply: reply.trim(),
      model: data.model,
      usage: data.usage 
    });

  } catch (err) {
    // ============================================
    // ERROR HANDLING
    // ============================================
    console.error('Function Error:', {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.',
      timestamp: new Date().toISOString()
    });
  }
}
