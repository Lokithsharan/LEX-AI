// This is a server-side API route. It should be placed in a `pages/api` directory.
// This function acts as a secure proxy to the IBM Granite API.

// A simple type definition for the expected request body.
interface GraniteRequestBody {
    primaryContext: string;
    question: string;
    retrievedContext?: string;
}

// In a real environment, these would be Next.js or similar framework types.
// For this context, we'll use simple Request/Response objects.
declare class Request {
  json(): Promise<any>;
  method: string;
}
declare class Response {
  constructor(body: string | null, init?: { status: number; headers: Record<string, string> });
  static json(data: any, init?: { status: number }): Response;
}


export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { primaryContext, question, retrievedContext }: GraniteRequestBody = await req.json();
    const apiKey = process.env.API_KEY;
    const projectId = process.env.IBM_PROJECT_ID;


    if (!apiKey || !projectId) {
         return new Response(JSON.stringify({ error: 'API key or IBM_PROJECT_ID not configured on the server.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Step 1: Get a bearer token from IBM Cloud IAM
        const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
        });

        if (!tokenResponse.ok) {
            console.error('IBM Token API Error:', await tokenResponse.text());
            throw new Error('Could not authenticate with IBM Cloud.');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Step 2: Construct the prompt in the format the Granite chat model expects
        const systemInstruction = "You are a helpful legal AI assistant. Your role is to answer questions based on the provided context. First, use the 'Primary Document Context'. If it's insufficient, use the 'Additional Retrieved Context' from other documents to provide a more comprehensive answer. If the answer cannot be found in any of the provided text, state that clearly. Be concise and direct.";
        
        let userPrompt = `PRIMARY DOCUMENT CONTEXT:\n---\n${primaryContext}\n---\n\n`;

        if (retrievedContext && retrievedContext.trim() !== '') {
            userPrompt += `ADDITIONAL RETRIEVED CONTEXT FROM OTHER CASES:\n---\n${retrievedContext}\n---\n\n`;
        }
        
        userPrompt += `Based on all the context provided, please answer the following question.\nQUESTION: ${question}`;
        
        // This structured format is crucial for the chat model
        const finalPrompt = `System:\n${systemInstruction}\n\nUser:\n${userPrompt}\n\nAssistant:`;


        const modelEndpoint = 'https://us-south.ml.cloud.ibm.com/ml/v1/generation?version=2023-05-29';
        const modelResponse = await fetch(modelEndpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                input: finalPrompt,
                parameters: {
                    decoding_method: "greedy",
                    max_new_tokens: 400,
                    min_new_tokens: 30,
                    repetition_penalty: 1.05,
                },
                model_id: "ibm/granite-13b-chat-v2",
                project_id: projectId,
            }),
        });

        if (!modelResponse.ok) {
            console.error('IBM Granite API Error:', await modelResponse.text());
            throw new Error('The AI model failed to generate a response.');
        }

        const modelData = await modelResponse.json();
        const generatedText = modelData.results?.[0]?.generated_text || 'The model returned an empty response.';

        return new Response(JSON.stringify({ response: generatedText.trim() }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in /api/granite handler:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}