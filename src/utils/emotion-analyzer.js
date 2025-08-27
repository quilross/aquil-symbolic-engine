export class EmotionAnalyzer {
  extractEmotions(text) {
    const lowerText = text.toLowerCase();
    const foundEmotions = [];

    const emotionMap = {
      anxious: ["anxious", "anxiety", "worried", "nervous", "stressed"],
      excited: ["excited", "thrilled", "energized", "pumped"],
      sad: ["sad", "down", "depressed", "blue", "melancholy"],
      angry: ["angry", "mad", "frustrated", "irritated", "furious"],
      calm: ["calm", "peaceful", "serene", "relaxed", "centered"],
      confused: ["confused", "unclear", "puzzled", "lost", "unsure"],
      hopeful: ["hopeful", "optimistic", "positive", "encouraged"],
      fearful: ["scared", "afraid", "fearful", "terrified", "frightened"],
    };

    Object.entries(emotionMap).forEach(([emotion, keywords]) => {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        foundEmotions.push(emotion);
      }
    });

    return foundEmotions;
  }

  extractBodySensations(text) {
    const lowerText = text.toLowerCase();
    const sensations = [];

    const sensationMap = {
      tension: ["tense", "tight", "stiff", "rigid", "contracted"],
      pressure: ["pressure", "heavy", "weight", "compressed"],
      warmth: ["warm", "hot", "burning", "heated"],
      coolness: ["cool", "cold", "chilly", "frozen"],
      lightness: ["light", "floating", "airy", "weightless"],
      energy: ["energy", "buzzing", "electric", "vibrating"],
      numbness: ["numb", "disconnected", "empty", "void"],
      pain: ["pain", "ache", "hurt", "sore", "uncomfortable"],
    };

    Object.entries(sensationMap).forEach(([sensation, keywords]) => {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        sensations.push(sensation);
      }
    });

    return sensations;
  }

  analyzeSomaticState(bodyState, emotions) {
    const bodyAnalysis = {
      energy_level: this.assessEnergyLevel(bodyState),
      nervous_system_state: this.assessNervousSystemState(bodyState, emotions),
      tension_areas: this.identifyTensionAreas(bodyState),
      emotional_embodiment: this.analyzeEmotionalEmbodiment(emotions),
    };

    return bodyAnalysis;
  }

  assessEnergyLevel(bodyState) {
    const lowerText = bodyState.toLowerCase();

    if (
      ["energized", "buzzing", "vibrant", "alive", "electric"].some((word) =>
        lowerText.includes(word),
      )
    )
      return "high";
    if (
      ["tired", "drained", "exhausted", "heavy", "depleted"].some((word) =>
        lowerText.includes(word),
      )
    )
      return "low";
    if (
      ["calm", "centered", "steady", "grounded", "balanced"].some((word) =>
        lowerText.includes(word),
      )
    )
      return "balanced";

    return "moderate";
  }

  assessNervousSystemState(bodyState, emotions) {
    const combinedText = `${bodyState} ${emotions}`.toLowerCase();

    if (
      ["activated", "anxious", "buzzing", "wired", "restless"].some((word) =>
        combinedText.includes(word),
      )
    ) {
      return "activated";
    } else if (
      ["numb", "disconnected", "frozen", "shut down", "empty"].some((word) =>
        combinedText.includes(word),
      )
    ) {
      return "hypoactivated";
    } else if (
      ["calm", "centered", "grounded", "present", "peaceful"].some((word) =>
        combinedText.includes(word),
      )
    ) {
      return "regulated";
    }

    return "mixed";
  }

  identifyTensionAreas(bodyState) {
    const lowerText = bodyState.toLowerCase();
    const areas = [];

    const areaMap = {
      head_neck: ["head", "neck", "jaw", "skull", "temple"],
      shoulders: ["shoulder", "upper back", "shoulder blade"],
      chest_heart: ["chest", "heart", "ribs", "sternum"],
      core: ["stomach", "belly", "abdomen", "core"],
      back: ["back", "spine", "lower back"],
      hips_pelvis: ["hips", "pelvis", "lower body"],
      legs_feet: ["legs", "thighs", "calves", "feet"],
    };

    Object.entries(areaMap).forEach(([area, keywords]) => {
      if (
        keywords.some(
          (keyword) =>
            lowerText.includes(keyword) &&
            (lowerText.includes("tense") ||
              lowerText.includes("tight") ||
              lowerText.includes("pain")),
        )
      ) {
        areas.push(area);
      }
    });

    return areas;
  }

  analyzeEmotionalEmbodiment(emotions) {
    return {
      primary_emotions: emotions.slice(0, 3),
      embodiment_quality:
        emotions.length > 2
          ? "rich_emotional_awareness"
          : "developing_awareness",
    };
  }
}
