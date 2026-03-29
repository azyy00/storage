const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type SummaryRequestBody = {
  name?: string;
  year?: string;
  category?: string;
  description?: string;
  extractedText?: string | null;
  model?: string;
};

function buildPrompt(input: SummaryRequestBody) {
  return `
File name: ${input.name ?? "Unknown file"}
Year: ${input.year ?? "Unknown"}
Category: ${input.category ?? "Unknown"}
Description: ${input.description?.trim() || "None"}

Extracted file text:
${input.extractedText?.trim() || "No extracted text provided."}
  `.trim();
}

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = payload?.output;
  if (!Array.isArray(output)) {
    return "";
  }

  const texts: string[] = [];

  for (const item of output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const content of item.content) {
      if (typeof content?.text === "string" && content.text.trim()) {
        texts.push(content.text.trim());
      }
    }
  }

  return texts.join("\n").trim();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const input = (await request.json()) as SummaryRequestBody;
    const extractedText = input.extractedText?.trim() ?? "";
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({
          summary: "",
          error: "OPENAI_API_KEY is missing in Supabase function secrets.",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    if (!extractedText) {
      return new Response(
        JSON.stringify({
          summary: "",
          error: "No extracted file text was provided for summarization.",
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model || "gpt-5-mini",
        max_output_tokens: 180,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You summarize uploaded files for an internal storage dashboard. Write a concise summary in 2 or 3 sentences, under 90 words, based on the extracted file text. Focus on the document's actual content, purpose, and notable topics. Do not mention uploading, storage, or internal review unless the file text itself says so.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildPrompt(input),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI summary request failed:", errorText);

      return new Response(
        JSON.stringify({
          summary: "",
          error: errorText,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    const payload = await response.json();
    const summary = extractOutputText(payload);

    return new Response(JSON.stringify({ summary, error: null }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Unexpected summary function error:", error);

    return new Response(
      JSON.stringify({
        summary: "",
        error: error instanceof Error ? error.message : "Unknown error.",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
