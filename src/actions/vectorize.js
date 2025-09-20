// Ensure a vector: embed text or pass through provided vector
// ...existing code...
// Ensure we have a proper vector for queries
export async function ensureVector(
  env,
  { text, vector, model = "@cf/baai/bge-large-en-v1.5", expectedDim = 1024 } = {},
) {
  let values;
  
  if (vector) {
    if (Array.isArray(vector)) values = vector;
    else if (ArrayBuffer.isView(vector)) values = Array.from(vector);
    else throw new Error("Provided vector is not an array or typed array");
  } else if (text) {
    // TEMPORARY TEST: Return a hardcoded 1024-dimension vector to test if the issue is in Vectorize
    values = new Array(1024).fill(0.1);
    
    /* 
    try {
      // Call AI model - confirmed working format from test endpoint
      const aiResponse = await env.AQUIL_AI.run(model, { text });
      
      // Extract vector from known working response format: { data: [[...numbers...]], shape: [1, 1024], pooling: "mean" }
      if (aiResponse && 
          typeof aiResponse === 'object' && 
          Array.isArray(aiResponse.data) && 
          aiResponse.data.length > 0 &&
          Array.isArray(aiResponse.data[0]) && 
          aiResponse.data[0].length > 0 &&
          typeof aiResponse.data[0][0] === 'number') {
        values = aiResponse.data[0];
      } else {
        throw new Error(`Unexpected AI response format. Expected {data: [[numbers...]]}, got: ${JSON.stringify(aiResponse, null, 2)}`);
      }
      
    } catch (aiError) {
      throw new Error(`AI embedding generation failed: ${aiError.message}`);
    }
    */
  } else {
    throw new Error("No text or vector provided for embedding");
  }
  
  // Convert typed array to regular array if needed
  if (values && ArrayBuffer.isView(values)) {
    values = Array.from(values);
  }
  
  // Validate result
  if (!Array.isArray(values) || values.length === 0 || typeof values[0] !== 'number') {
    throw new Error('Invalid embedding format: not a valid number array');
  }
  
  // Validate dimensions
  if (values.length !== expectedDim) {
    throw new Error(`Embedding dimension mismatch: got ${values.length}, expected ${expectedDim}`);
  }
  
  return values;
}

// Query vector database by text (LEGACY - preserved for existing functionality)
export async function queryByText(
  env,
  { text, topK = 5, model = "@cf/baai/bge-large-en-v1.5", expectedDim = 1024 } = {},
) {
  const vector = await ensureVector(env, { text, model, expectedDim });
  const results = await env.AQUIL_CONTEXT.query({
    topK,
    vector,
    includeMetadata: true,
  });
  return (results.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
  }));
}

// DUAL-MODE Vector Operations: Semantic Recall + Transformative Inquiry

// Mode 1: Semantic Recall - Direct nearest-neighbor log retrieval
export async function semanticRecall(
  env,
  { text, topK = 5, model = "@cf/baai/bge-large-en-v1.5", threshold = 0.7, expectedDim = 1024 } = {},
) {
  try {
    // Generate vector using fixed ensureVector function
    let vector = await ensureVector(env, { text, model, expectedDim });

    // Query Vectorize with the generated vector
    const results = await env.AQUIL_CONTEXT.query({
      topK,
      vector,
      includeMetadata: true,
    });

    // Filter by similarity threshold and return full log content
    const semanticMatches = [];
    for (const match of results.matches || []) {
      if (match.score >= threshold) {
        // Try to get full log content from KV
        try {
          const logKey = match.id.replace('logvec_', 'log_');
          const logContent = await env.AQUIL_MEMORIES.get(logKey);
          if (logContent) {
            const parsedLog = JSON.parse(logContent);
            semanticMatches.push({
              id: match.id,
              score: match.score,
              metadata: match.metadata,
              content: parsedLog,
              log_text: parsedLog.payload?.content || parsedLog.payload?.message || 'No content'
            });
          }
        } catch (e) {
          // Fallback to metadata only
          semanticMatches.push({
            id: match.id,
            score: match.score,
            metadata: match.metadata,
            content: null,
            log_text: 'Content unavailable'
          });
        }
      }
    }

    return {
      mode: 'semantic_recall',
      query: text,
      matches: semanticMatches,
      total_found: semanticMatches.length,
      vector_length: vector.length,
      expected_dim: expectedDim,
      debug: { 
        vector_sample: vector.slice(0, 5),
        total_matches: results.matches?.length || 0,
        filtered_matches: semanticMatches.length
      }
    };
  } catch (error) {
    return {
      mode: 'semantic_recall',
      query: text,
      matches: [],
      error: error.message,
      debug: {
        attempted: true,
        error_type: error.constructor.name
      }
    };
  }
}

// Mode 2: Transformative Inquiry - Generate insights and questions from semantic matches
export async function transformativeInquiry(
  env,
  { text, topK = 5, model = "@cf/baai/bge-large-en-v1.5", expectedDim = 1024 } = {},
) {
  try {
    const semanticResults = await semanticRecall(env, { text, topK, model, expectedDim });

    const inquiries = [];
    for (const match of semanticResults.matches || []) {
      const logText = match.log_text || '';
      const metadata = match.metadata || {};
      const inquiry = generateTransformativeQuestions(logText, metadata, text);
      inquiries.push({
        ...match,
        inquiry,
        transformative_questions: inquiry.questions,
        growth_opportunity: inquiry.growth_opportunity,
      });
    }

    return {
      mode: 'transformative_inquiry',
      query: text,
      inquiries,
      total_found: inquiries.length,
      guidance: generateOverallGuidance(inquiries, text),
    };
  } catch (error) {
    return {
      mode: 'transformative_inquiry',
      query: text,
      inquiries: [],
      error: error.message,
    };
  }
}

// Helper: Generate transformative questions from log content
function generateTransformativeQuestions(logText, metadata, currentQuery) {
  const questions = [];
  const themes = [];
  
  // Analyze log content for patterns
  if (logText.includes('trust') || metadata?.tags?.includes('trust')) {
    questions.push("What would it look like to trust yourself completely in this situation?");
    themes.push('trust');
  }
  
  if (logText.includes('fear') || logText.includes('anxious') || logText.includes('worried')) {
    questions.push("What is this fear trying to protect you from?");
    questions.push("How might this challenge be an invitation to grow?");
    themes.push('fear_transformation');
  }
  
  if (logText.includes('creative') || logText.includes('block') || logText.includes('stuck')) {
    questions.push("What wants to be expressed through you right now?");
    questions.push("How can you honor your creative process without forcing?");
    themes.push('creativity');
  }
  
  if (logText.includes('body') || logText.includes('tense') || logText.includes('pain')) {
    questions.push("What is your body trying to tell you?");
    questions.push("How can you listen more deeply to your somatic wisdom?");
    themes.push('somatic');
  }
  
  // Default transformative questions if no specific patterns found
  if (questions.length === 0) {
    questions.push("What is this experience teaching you about yourself?");
    questions.push("How can you approach this with more self-compassion?");
    themes.push('general_growth');
  }
  
  return {
    questions,
    themes,
    growth_opportunity: `This pattern offers an opportunity to deepen your ${themes.join(' and ')} practice.`
  };
}

// Helper: Generate overall guidance from multiple inquiries
function generateOverallGuidance(inquiries, currentQuery) {
  if (inquiries.length === 0) {
    return "Consider this moment as an opportunity for self-discovery and growth.";
  }
  
  const allThemes = inquiries.flatMap(inq => inq.inquiry.themes);
  const uniqueThemes = [...new Set(allThemes)];
  
  if (uniqueThemes.includes('trust')) {
    return "Your logs suggest a pattern around trust. Consider how you can deepen your relationship with self-trust.";
  }
  
  if (uniqueThemes.includes('creativity')) {
    return "There's a creative thread running through your experiences. How can you honor your creative expression?";
  }
  
  if (uniqueThemes.includes('somatic')) {
    return "Your body holds wisdom about this situation. Take time to listen to what it's communicating.";
  }
  
  return "Your experiences are weaving together a unique pattern of growth and self-discovery.";
}

// Unified Vector Query - Supports both modes
export async function queryVector(
  env,
  { text, mode = 'semantic_recall', topK = 5, model = "@cf/baai/bge-large-en-v1.5", threshold = 0.7, expectedDim = 1024 } = {},
) {
  switch (mode) {
    case 'semantic_recall':
      return await semanticRecall(env, { text, topK, model, threshold, expectedDim });
    
    case 'transformative_inquiry':
      return await transformativeInquiry(env, { text, topK, model, expectedDim });
    
    case 'legacy':
      return await queryByText(env, { text, topK, model, expectedDim }); // Preserve original functionality
    
    default:
      return await semanticRecall(env, { text, topK, model, threshold, expectedDim });
  }
}
import { send, readJSON } from "../utils/http.js";

export async function upsert(req, env) {
  const body = await readJSON(req);
  const {
    id,
    text,
    vector,
    metadata,
    model = "@cf/baai/bge-large-en-v1.5",
    expectedDim = 1024,
  } = body;
  let v = vector;
  try {
    if (!v && text) {
      v = await ensureVector(env, { text, model, expectedDim });
    }
    if (!id || !Array.isArray(v))
      return send(400, { error: "id and embedding vector required" });
    if (v.length !== expectedDim) {
      return send(400, { error: `Embedding dimension mismatch: got ${v.length}, expected ${expectedDim}` });
    }
    await env.AQUIL_CONTEXT.upsert([{ id, values: v, metadata }]);
    return send(200, { ok: true, id, dimension: v.length });
  } catch (e) {
    return send(500, { error: "vector_upsert_error", message: String(e) });
  }
}

export async function query(req, env) {
  try {
    const body = await readJSON(req);
    const {
      text,
      vector,
      topK = 5,
      model = "@cf/baai/bge-large-en-v1.5",
      mode = "semantic_recall",
      threshold = 0.7,
      expectedDim = 1024
    } = body;

    // If text is provided, use RAG with semantic recall or transformative inquiry
    if (text) {
      let v;
      try {
        v = await ensureVector(env, { text, model, expectedDim });
      } catch (e) {
        return send(400, { error: "embedding_error", message: String(e) });
      }
      if (v.length !== expectedDim) {
        return send(400, { error: `Embedding dimension mismatch: got ${v.length}, expected ${expectedDim}` });
      }
      const results = await env.AQUIL_CONTEXT.query({ vector: v, topK, includeMetadata: true });
      return send(200, { success: true, query: text, mode, dimension: v.length, results });
    }

    // Fallback to basic vector query for vector-only queries
    let v2 = vector;
    if (!v2) {
      return send(400, { error: "text or vector required for query" });
    }
    if (!Array.isArray(v2)) {
      return send(400, { error: "vector must be an array" });
    }
    if (v2.length !== expectedDim) {
      return send(400, { error: `Embedding dimension mismatch: got ${v2.length}, expected ${expectedDim}` });
    }
    const results = await env.AQUIL_CONTEXT.query({ vector: v2, topK, includeMetadata: true });
    return send(200, { success: true, mode: 'vector_only', dimension: v2.length, results });
  } catch (e) {
    return send(500, { error: "vector_query_error", message: String(e) });
  }
}

// Test AI binding directly
export async function testAI(env, { text = "test" } = {}) {
  try {
    console.log(`[testAI] Testing AI binding with text: "${text}"`);
    const out = await env.AQUIL_AI.run("@cf/baai/bge-large-en-v1.5", { text });
    console.log(`[testAI] AI response:`, JSON.stringify(out, null, 2));
    return {
      success: true,
      text,
      response: out,
      responseType: typeof out,
      responseKeys: out && typeof out === 'object' ? Object.keys(out) : null
    };
  } catch (error) {
    console.error(`[testAI] AI binding test failed:`, error);
    return {
      success: false,
      error: error.message,
      errorType: typeof error
    };
  }
}
