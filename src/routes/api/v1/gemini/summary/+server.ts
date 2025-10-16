import type { RequestHandler } from './$types';
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '$env/static/private';

interface TransformedItem {
    id: number;
    iri: string;
    nazev: string;
    url: string;
    vyveseni: string | null;
    relevantniDo: string | null;
    okruh: string;
    category: string;
    dokumenty: Array<{
        nazev: string;
        url: string;
        typ: string;
    }>;
    guessedLatitude: number;
    guessedLongitude: number;
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
    try {
        const item: TransformedItem = await request.json();

        if (!item) {
            return new Response(
                JSON.stringify({ error: 'Missing item in request body' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const documentInfo = item.dokumenty?.map(doc => `- ${doc.nazev}`).join('\n') || 'Žádné dokumenty.';

        // Upload PDF documents to Gemini
        const uploadedFiles: Array<{ uri: string; mimeType: string }> = [];
        
        if (item.dokumenty && item.dokumenty.length > 0) {
            for (const doc of item.dokumenty) {
                // Check if document is a PDF
                if (doc.url.toLowerCase().endsWith('.pdf')) {
                    try {
                        // Download PDF
                        const pdfBuffer = await fetch(doc.url)
                            .then((response) => response.arrayBuffer());

                        const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

                        // Upload to Gemini
                        const file = await ai.files.upload({
                            file: fileBlob,
                            config: { displayName: doc.nazev }
                        });

                        // Wait for processing
                        if (!file.name) {
                            console.error(`File upload failed for ${doc.nazev}: no file name returned`);
                            continue;
                        }

                        let getFile = await ai.files.get({ name: file.name });
                        while (getFile.state === 'PROCESSING') {
                            await new Promise((resolve) => setTimeout(resolve, 5000));
                            getFile = await ai.files.get({ name: file.name });
                        }

                        if (getFile.state === 'ACTIVE' && file.uri && file.mimeType) {
                            uploadedFiles.push({ uri: file.uri, mimeType: file.mimeType });
                        }
                    } catch (uploadError) {
                        console.error(`Failed to upload PDF ${doc.nazev}:`, uploadError);
                        // Continue with other documents even if one fails
                    }
                }
            }
        }

        const prompt = `Jsi AI asistent, který shrnuje obsah úředních desek. Vytvoř stručné a srozumitelné shrnutí pro následující položku v češtině. Zaměř se na název a připojené dokumenty. ${uploadedFiles.length > 0 ? 'Analyzuj obsah přiložených PDF dokumentů.' : ''} Odpověď vrať jako prostý text.
Ať je to krátké, 1-2 odstavce. NEPOUŽÍVEJ MARKDOWN, POUŽÍVEJ BASIC HTML STYLY. Ztučňuj klíčová slova (pomocí <b></b>), používej odrážky. Zkus aby to bylo co nejkratší - aby se informace neopakovaly a byly napsány co nejstručněji a nejvíce srozumitelně, a hezky rozdělené do odstavců.
Položka:
Název: ${item.nazev}
Okruh: ${item.okruh}
Dokumenty:
${documentInfo}

Shrnutí:`;

        const contents: Array<any> = [];
        
        for (const file of uploadedFiles) {
            contents.push(createPartFromUri(file.uri, file.mimeType));
        }
        
        contents.push(prompt);

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: contents, 
            config: {
                systemInstruction: "Nesmíš používat markdown. Musíš shrnout pouze to nejpodstatnější. Použij základní HTML styly pro formátování. A odděluj věci do hezkých odstavců.",
            }
        });

        const summary = (geminiResponse.text ?? "").toString().trim();

        if (!summary) {
            return new Response(
                JSON.stringify({ error: 'Failed to generate summary' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                status: 'ok',
                summary: summary,
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};