#!/usr/bin/env node
/**
 * Enhance consequential operation descriptions to clarify impact
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const mainSchemaPath = path.join(rootDir, 'gpt-actions-schema.json');

const schema = JSON.parse(fs.readFileSync(mainSchemaPath, 'utf8'));

// Operations that need impact clarity with suggested enhancements
const impactEnhancements = {
  "trustCheckIn": {
    current: "Called when user expresses self-doubt, anxiety, fear of judgment, mentions feeling unsafe, or needs confidence support. Triggers on: 'I don't trust myself', 'feeling anxious', 'not confident about', 'scared to try', 'doubt', 'uncertainty'.",
    enhanced: "Called when user expresses self-doubt, anxiety, fear of judgment, mentions feeling unsafe, or needs confidence support. CREATES trust-building insights and confidence strategies. Triggers on: 'I don't trust myself', 'feeling anxious', 'not confident about', 'scared to try', 'doubt', 'uncertainty'."
  },
  "somaticHealingSession": {
    current: "Called when user mentions body awareness, tension, physical discomfort, or wants to explore somatic healing. Triggers on: 'feel tension', 'body awareness', 'somatic healing', 'body sensations', 'physical discomfort'.",
    enhanced: "Called when user mentions body awareness, tension, physical discomfort, or wants to explore somatic healing. CREATES personalized somatic healing sessions and body awareness practices. Triggers on: 'feel tension', 'body awareness', 'somatic healing', 'body sensations', 'physical discomfort'."
  },
  "extractMediaWisdom": {
    current: "Called when user mentions books, movies, podcasts, articles, or any media they've consumed. Triggers on: 'I read', 'watched a movie', 'listened to podcast', 'interesting article', 'media', 'book recommendation'.",
    enhanced: "Called when user mentions books, movies, podcasts, articles, or any media they've consumed. EXTRACTS and LOGS wisdom insights from media for future reference. Triggers on: 'I read', 'watched a movie', 'listened to podcast', 'interesting article', 'media', 'book recommendation'."
  },
  "recognizePatterns": {
    current: "Called when user mentions recurring themes, patterns, or connections in their life. Triggers on: 'I notice a pattern', 'this always happens', 'recurring theme', 'similar situation', 'pattern recognition'.",
    enhanced: "Called when user mentions recurring themes, patterns, or connections in their life. IDENTIFIES and RECORDS behavioral patterns for growth insights. Triggers on: 'I notice a pattern', 'this always happens', 'recurring theme', 'similar situation', 'pattern recognition'."
  },
  "standingTallPractice": {
    current: "Called when user needs confidence building, posture work, or leadership presence. Triggers on: 'standing tall', 'confidence boost', 'leadership presence', 'posture', 'feel powerful'.",
    enhanced: "Called when user needs confidence building, posture work, or leadership presence. BUILDS confidence practices and leadership presence strategies. Triggers on: 'standing tall', 'confidence boost', 'leadership presence', 'posture', 'feel powerful'."
  },
  "synthesizeWisdom": {
    current: "Called when user wants to integrate learnings, synthesize insights, or connect different wisdom sources. Triggers on: 'synthesize insights', 'connect learnings', 'wisdom integration', 'bring it together', 'overall learning'.",
    enhanced: "Called when user wants to integrate learnings, synthesize insights, or connect different wisdom sources. CREATES comprehensive wisdom synthesis and learning integration. Triggers on: 'synthesize insights', 'connect learnings', 'wisdom integration', 'bring it together', 'overall learning'."
  },
  "submitFeedback": {
    current: "Called when user wants to provide feedback about the system, experience, or suggestions. Triggers on: 'feedback', 'suggestion', 'improvement', 'system feedback', 'user experience'.",
    enhanced: "Called when user wants to provide feedback about the system, experience, or suggestions. RECORDS and PROCESSES user feedback for system improvements. Triggers on: 'feedback', 'suggestion', 'improvement', 'system feedback', 'user experience'."
  },
  "generateDiscoveryInquiry": {
    current: "Called when user needs thought-provoking questions, deeper exploration, or Socratic inquiry. Triggers on: 'ask me questions', 'help me explore', 'deeper thinking', 'reflection questions', 'discovery'.",
    enhanced: "Called when user needs thought-provoking questions, deeper exploration, or Socratic inquiry. GENERATES personalized discovery questions for deeper self-exploration. Triggers on: 'ask me questions', 'help me explore', 'deeper thinking', 'reflection questions', 'discovery'."
  },
  "interpretDream": {
    current: "Called when user mentions dreams, dream interpretation, or symbolic content. Triggers on: 'I had a dream', 'dream interpretation', 'symbolic meaning', 'dream analysis', 'unconscious'.",
    enhanced: "Called when user mentions dreams, dream interpretation, or symbolic content. CREATES personalized dream interpretations and symbolic meaning analysis. Triggers on: 'I had a dream', 'dream interpretation', 'symbolic meaning', 'dream analysis', 'unconscious'."
  },
  "optimizeEnergy": {
    current: "Called when user mentions energy levels, fatigue, vitality, or energy management. Triggers on: 'low energy', 'optimize energy', 'feeling tired', 'vitality', 'energy management'.",
    enhanced: "Called when user mentions energy levels, fatigue, vitality, or energy management. CREATES personalized energy optimization strategies and vitality plans. Triggers on: 'low energy', 'optimize energy', 'feeling tired', 'vitality', 'energy management'."
  },
  "clarifyValues": {
    current: "Called when user discusses personal values, ethical decisions, or value conflicts. Triggers on: 'my values', 'what matters to me', 'value conflict', 'ethics', 'principles'.",
    enhanced: "Called when user discusses personal values, ethical decisions, or value conflicts. CLARIFIES and DOCUMENTS personal values framework for decision-making. Triggers on: 'my values', 'what matters to me', 'value conflict', 'ethics', 'principles'."
  },
  "unleashCreativity": {
    current: "Called when user wants to explore creativity, overcome creative blocks, or engage in creative projects. Triggers on: 'creative block', 'unleash creativity', 'creative project', 'artistic expression', 'innovation'.",
    enhanced: "Called when user wants to explore creativity, overcome creative blocks, or engage in creative projects. UNLOCKS creative potential and DEVELOPS personalized creativity practices. Triggers on: 'creative block', 'unleash creativity', 'creative project', 'artistic expression', 'innovation'."
  },
  "navigateTransitions": {
    current: "Called when user faces life transitions, career changes, or major life shifts. Triggers on: 'life transition', 'career change', 'major shift', 'life change', 'transition period'.",
    enhanced: "Called when user faces life transitions, career changes, or major life shifts. CREATES transition navigation strategies and change management plans. Triggers on: 'life transition', 'career change', 'major shift', 'life change', 'transition period'."
  },
  "healAncestry": {
    current: "Called when user mentions family patterns, ancestral healing, generational themes, or family dynamics. Triggers on: 'family patterns', 'ancestral healing', 'generational', 'family dynamics', 'inherited traits'.",
    enhanced: "Called when user mentions family patterns, ancestral healing, generational themes, or family dynamics. FACILITATES ancestral healing work and TRANSFORMS generational patterns. Triggers on: 'family patterns', 'ancestral healing', 'generational', 'family dynamics', 'inherited traits'."
  },
  "ragMemoryConsolidation": {
    current: "Called when deep memory retrieval and consolidation is needed. Processes previous conversations and insights to build comprehensive understanding and continuity.",
    enhanced: "Called when deep memory retrieval and consolidation is needed. CONSOLIDATES and INTEGRATES conversation memories for enhanced continuity and insights. Processes previous conversations and insights to build comprehensive understanding."
  },
  "trackMoodAndEmotions": {
    current: "Called when user mentions feelings, emotions, mood changes, or emotional states. Triggers on: 'feeling sad', 'happy today', 'mood is', 'emotionally', 'my feelings'.",
    enhanced: "Called when user mentions feelings, emotions, mood changes, or emotional states. TRACKS and ANALYZES emotional patterns for mood insights and regulation. Triggers on: 'feeling sad', 'happy today', 'mood is', 'emotionally', 'my feelings'."
  },
  "designHabits": {
    current: "Called when user wants to build new habits or break old ones. Triggers on: 'want to start', 'habit', 'routine', 'stop doing', 'build consistency'.",
    enhanced: "Called when user wants to build new habits or break old ones. DESIGNS personalized habit systems and CREATES behavior change strategies. Triggers on: 'want to start', 'habit', 'routine', 'stop doing', 'build consistency'."
  },
  "exportConversationData": {
    current: "Called when conversation history export is needed in various formats for backup or analysis. Supports JSON, CSV, and PDF formats for comprehensive data management.",
    enhanced: "Called when conversation history export is needed in various formats for backup or analysis. EXPORTS and PACKAGES conversation data in multiple formats for external use. Supports JSON, CSV, and PDF formats for comprehensive data management."
  }
};

let changesCount = 0;

// Process each path and method
for (const [pathKey, pathData] of Object.entries(schema.paths || {})) {
  for (const [method, methodData] of Object.entries(pathData)) {
    if (methodData.operationId && impactEnhancements[methodData.operationId]) {
      const enhancement = impactEnhancements[methodData.operationId];
      
      if (methodData.description === enhancement.current) {
        console.log(`Enhancing description for ${methodData.operationId}`);
        methodData.description = enhancement.enhanced;
        changesCount++;
      }
    }
  }
}

if (changesCount > 0) {
  // Write updated schema back to file
  fs.writeFileSync(mainSchemaPath, JSON.stringify(schema, null, 2) + '\n');
  console.log(`✅ Enhanced descriptions for ${changesCount} consequential operations`);
} else {
  console.log('✅ All consequential operations already have clear impact descriptions');
}