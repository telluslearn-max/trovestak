export interface NormalizationResult {
  normalizedName: string;
  reasoning: string;
  isShorthand: boolean;
}

const HF_API_URL = 'https://api-inference.huggingface.co/models/Qwen/Qwen2-0.5B-Instruct';

export async function normalizeProductName(productName: string): Promise<NormalizationResult> {
  const prompt = `<|begin_of_text|><|start_header_id|>user<|end_header_id|>

You are a product name normalizer. Determine if the product name is shorthand/abbreviated and convert to official retail name.

Product name: "${productName}"

Examples:
- "iPhone 14 Pro" → "Apple iPhone 14 Pro" (add brand)
- "S23 Ultra" → "Samsung Galaxy S23 Ultra" (expand model, add brand)
- "Redmi Note 12" → "Xiaomi Redmi Note 12" (add brand)
- "Samsung Galaxy S24" → "Samsung Galaxy S24" (already complete)

Respond ONLY with valid JSON, no other text:
{"isShorthand": true/false, "normalizedName": "official name", "reasoning": "1-2 sentences"}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    
    if (!responseText) {
      return {
        normalizedName: productName,
        reasoning: 'Empty response from HuggingFace',
        isShorthand: false,
      };
    }

    const jsonMatch = responseText.match(/\{\s*"isShorthand"\s*:\s*(true|false)[\s\S]*?\}/);
    if (!jsonMatch) {
      return {
        normalizedName: productName,
        reasoning: 'Failed to parse HF response, keeping original',
        isShorthand: false,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      normalizedName: parsed.normalizedName || productName,
      reasoning: parsed.reasoning || 'No reasoning provided',
      isShorthand: parsed.isShorthand || false,
    };
  } catch (error) {
    console.error('HuggingFace API error:', error);
    return {
      normalizedName: productName,
      reasoning: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isShorthand: false,
    };
  }
}
