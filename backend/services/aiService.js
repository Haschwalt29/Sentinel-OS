require("dotenv").config({ path: __dirname + "/../.env.dev" });
const { CohereClient } = require('cohere-ai');
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

async function askAI(prompt) {
  try {
    const { default: cohere } = await import("cohere-ai"); // 👈 dynamically import ESM
    cohere.apiKey = process.env.COHERE_API_KEY;

    const response = await cohere.generate({
      model: "command",
      prompt,
      max_tokens: 100,
      temperature: 0.8,
    });

    return response.body.generations[0].text.trim();
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
 * Extracts location entities from text using Cohere's NER model.
 * @param {string} text - The text to analyze.
 * @returns {Promise<string[]>} - An array of unique location names.
 */
async function extractLocations(text) {
  try {
    console.log('NER: Extracting locations...');
    const response = await cohere.extract({
      text,
      model: 'extract-english-v1',
    });

    const locations = response.extractions
      .filter(ext => ext.type === 'LOC')
      .map(ext => ext.text);

    const uniqueLocations = [...new Set(locations)]; // Remove duplicates
    
    if(uniqueLocations.length > 0) {
        console.log(`NER: Found locations: ${uniqueLocations.join(', ')}`);
    } else {
        console.log('NER: No locations found.');
    }
    
    return uniqueLocations;
  } catch (err) {
    console.error('Cohere extractLocations error:', err);
    return []; // Return empty array on error
  }
}

module.exports = { askAI, classifyText, extractLocations };
