import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { messages, model, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Google Gemini API Key ausente. Configure no painel de Admin." }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Formatar o histórico de mensagens
        // O array messages passado na v1 vinha como [{role: "system"|"user"|"assistant", content: string}]
        let systemInstruction = "";
        const history: { role: string, parts: { text: string }[] }[] = [];
        let latestMsg = "";

        for (const msg of messages) {
            if (msg.role === "system") {
                systemInstruction += msg.content + "\n";
            } else if (msg.role === "user") {
                history.push({ role: "user", parts: [{ text: msg.content }] });
                latestMsg = msg.content;
            } else {
                history.push({ role: "model", parts: [{ text: msg.content }] });
            }
        }

        // Removendo a última mensagem do usuário do histórico, já que ela é o "input" que enviamos agora no final.
        if (history.length > 0 && history[history.length - 1].role === "user") {
            history.pop();
        }

        const genModel = genAI.getGenerativeModel({
            model: model || "gemini-2.5-flash",
            // Fallback: systemInstruction exists on Gemini 1.5+
            systemInstruction: systemInstruction.trim() || undefined
        });

        const chat = genModel.startChat({
            history: history,
        });

        const result = await chat.sendMessage(latestMsg);
        const response = await result.response;
        const fullText = response.text();

        return NextResponse.json({ choices: [{ message: { content: fullText } }] });
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || "Erro na comunicação com a IA Google Gemini" }, { status: 500 });
    }
}
