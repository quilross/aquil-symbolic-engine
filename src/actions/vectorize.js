// Vector dimension constant - must match Cloudflare Vectorize requirements
const VECTOR_DIM = 1024;

// Ensure a vector embedding from text or vector with 1024-dimension validation
export async function ensureVector(env, input) {
  if (Array.isArray(input)) {
    if (input.length !== VECTOR_DIM) {
      throw new Error(`Embedding dimension mismatch: got ${input.length}, expected ${VECTOR_DIM}`);
    }
    return input;
  }
  
  // Generate embedding from text
  const resp = await env.AQUIL_AI.run("@cf/baai/bge-large-en-v1.5", { text: String(input ?? "") });
  const arr = resp?.data?.[0];
  
  if (!Array.isArray(arr) || arr.length !== VECTOR_DIM) {
    throw new Error(`Embedding failed or wrong dimension: got ${Array.isArray(arr) ? arr.length : typeof arr}`);
  }
  
  return arr;
}

// New centralized vector functions for ARK logging system

export async function upsertVectors(env, { id, text, vector, metadata = {} }) {
  if (!id) throw new Error("upsertVectors: 'id' is required");
  const values = await ensureVector(env, vector ?? text);
  const payload = [{ id: `logvec_${id}`, values, metadata }];
  return env.AQUIL_CONTEXT.upsert(payload);
}

export async function queryVectorIndex(env, { text, vector, topK = 5, returnMetadata = "all", returnValues = true }) {
  const values = await ensureVector(env, vector ?? text);
  return env.AQUIL_CONTEXT.query(values, { topK, returnMetadata, returnValues });
}

export async function testVectorFlow(env) {
  const testText = "Ark system full memory test";
  await upsertVectors(env, { id: "test1", text: testText, metadata: { type: "test" } });
  const results = await queryVectorIndex(env, { text: testText, topK: 1 });
  console.log("Vector test results:", results);
  return results;
}

// Query vector database by text (LEGACY - preserved for existing functionality)
export async function queryByText(
  env,
  { text, topK = 5, model = "@cf/baai/bge-large-en-v1.5" } = {},
) {
  const vector = await ensureVector(env, text);
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
  { text, topK = 5, model = "@cf/baai/bge-large-en-v1.5", threshold = 0.7 } = {},
) {
  try {
    const vector = await ensureVector(env, text);
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
      total_found: semanticMatches.length
    };
  } catch (error) {
    return {
      mode: 'semantic_recall',
      query: text,
      matches: [],
      error: error.message
    };
  }
}

// Mode 2: Transformative Inquiry - Reframe into growth questions (PRESERVED)
export async function transformativeInquiry(
  env,
  { text, topK = 3, model = "@cf/baai/bge-large-en-v1.5" } = {},
) {
  try {
    // Get semantic matches first
    const semanticResults = await semanticRecall(env, { text, topK, model });
    
    // Transform matches into inquiry-based insights
    const inquiries = [];
    for (const match of semanticResults.matches) {
      const logText = match.log_text;
      const metadata = match.metadata;
      
      // Generate transformative questions based on log content and context
      const inquiry = generateTransformativeQuestions(logText, metadata, text);
      inquiries.push({
        ...match,
        inquiry,
        transformative_questions: inquiry.questions,
        growth_opportunity: inquiry.growth_opportunity
      });
    }

    return {
      mode: 'transformative_inquiry',
      query: text,
      inquiries,
      total_found: inquiries.length,
      guidance: generateOverallGuidance(inquiries, text)
    };
  } catch (error) {
    return {
      mode: 'transformative_inquiry',
      query: text,
      inquiries: [],
      error: error.message
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
  { text, mode = 'semantic_recall', topK = 5, model = "@cf/baai/bge-large-en-v1.5", threshold = 0.7 } = {},
) {
  switch (mode) {
    case 'semantic_recall':
      return await semanticRecall(env, { text, topK, model, threshold });
    
    case 'transformative_inquiry':
      return await transformativeInquiry(env, { text, topK, model });
    
    case 'legacy':
      return await queryByText(env, { text, topK, model }); // Preserve original functionality
    
    default:
      return await semanticRecall(env, { text, topK, model, threshold });
  }
}
import { send, readJSON } from "../utils/http.js";

export async function upsert(req, env) {
  try {
    const body = await readJSON(req);
    
    // Support both flat format and OpenAI plugin vectors array format
    const { id, text, vector, metadata } =
      Array.isArray(body.vectors) ? {
        id: body.vectors[0]?.id,
        text: body.vectors[0]?.text,
        vector: body.vectors[0]?.values || body.vectors[0]?.vector,
        metadata: body.vectors[0]?.metadata || body.metadata || {}
      } : body;
    
    // Use new upsertVectors function
    const result = await upsertVectors(env, { id, text, vector, metadata });
    return send(200, { ok: true, id, inserted: result.inserted || 1 });
  } catch (e) {
    return send(500, { error: "vector_upsert_error", message: String(e) });
  }
}

export async function query(req, env) {
  try {
    const {
      text,
      vector,
      topK = 5,
      model = "@cf/baai/bge-large-en-v1.5",
      mode = "semantic_recall",
      threshold = 0.7,
      returnMetadata = "all",
      returnValues = true
    } = await readJSON(req);

    // Use new queryVectorIndex function for direct vector queries
    if (vector || (!text && vector)) {
      const result = await queryVectorIndex(env, { vector, topK, returnMetadata, returnValues });
      return send(200, { results: result });
    }

    // If text is provided, use RAG with semantic recall or transformative inquiry
    if (text) {
      const result = await queryVector(env, { text, mode, topK, model, threshold });
      return send(200, { 
        success: true,
        query: text,
        mode,
        ...result
      });
    }

    return send(400, { error: "text or vector required for query" });
    
  } catch (e) {
    return send(500, { error: "vector_query_error", message: String(e) });
  }
}
