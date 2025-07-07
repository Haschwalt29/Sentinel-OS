require("dotenv").config({ path: __dirname + "/../.env.dev" });
const { CohereClient } = require('cohere-ai');

// Initialize Cohere client properly
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

async function askAI(prompt) {
  try {
    const response = await cohere.generate({
      model: "command",
      prompt,
      max_tokens: 100,
      temperature: 0.8,
    });

    return response.generations[0].text.trim();
  } catch (err) {
    console.error("🛑 Cohere error:", err.message);
    return "Sorry, I couldn't process that.";
  }
}

async function classifyText(title, content) {
  try {
    const input = `Title: ${title}\nContent: ${content}\n\nClassify the above news article as one of the following threat levels: \"High Threat\", \"Medium Threat\", or \"No Threat\". Respond ONLY with a JSON object in this format:\n{\"prediction\": \"High Threat|Medium Threat|No Threat\", \"confidence\": 0-1}\n\nClassification:`;
    const response = await cohere.generate({
      model: "command",
      prompt: input,
      max_tokens: 50,
      temperature: 0.2,
    });
    const text = response.generations[0].text.trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    } else {
      throw new Error("No valid JSON found in Cohere response");
    }
  } catch (err) {
    console.error('Cohere classifyText error:', err);
    throw err;
  }
}

/**
 * Extracts location entities from text using Cohere's generate model.
 * @param {string} text - The text to analyze.
 * @returns {Promise<string[]>} - An array of unique location names.
 */
async function extractLocations(text) {
  try {
    console.log('NER: Extracting locations...');
    
    // Use generate model for NER extraction
    const prompt = `Extract all location names (cities, countries, regions, landmarks) from the following text. Return ONLY a JSON array of location names, no other text:

Text: ${text}

Locations:`;

    const response = await cohere.generate({
      model: "command",
      prompt: prompt,
      max_tokens: 200,
      temperature: 0.1,
    });

    const result = response.generations[0].text.trim();
    
    // Try to parse as JSON array
    try {
      const locations = JSON.parse(result);
      if (Array.isArray(locations)) {
        const uniqueLocations = [...new Set(locations)]; // Remove duplicates
        
        if(uniqueLocations.length > 0) {
            console.log(`NER: Found locations: ${uniqueLocations.join(', ')}`);
        } else {
            console.log('NER: No locations found.');
        }
        
        return uniqueLocations;
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract locations from text
      console.log('NER: JSON parsing failed, extracting from text...');
      const locationPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
      const matches = result.match(locationPattern) || [];
      const uniqueLocations = [...new Set(matches)];
      
      if(uniqueLocations.length > 0) {
          console.log(`NER: Found locations: ${uniqueLocations.join(', ')}`);
      } else {
          console.log('NER: No locations found.');
      }
      
      return uniqueLocations;
    }
    
    return [];
  } catch (err) {
    console.error('Cohere extractLocations error:', err);
    return []; // Return empty array on error
  }
}

module.exports = { askAI, classifyText, extractLocations };
