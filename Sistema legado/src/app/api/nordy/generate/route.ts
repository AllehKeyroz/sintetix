import { NextResponse } from "next/server";
import { getNordyCookiesServer } from "@/lib/nordy_server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { workflow, prompt } = body;

        const activeWorkflowId = workflow || "69a1b01e36a0883b05b9294d";

        if (!activeWorkflowId || !prompt) {
            return NextResponse.json(
                { error: "workflow e prompt são obrigatórios" },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("targetId") || "admin";

        // 1. Tentar pegar do Firestore (Mais atualizado)
        let cookie = await getNordyCookiesServer(targetId);

        // 2. Se não houver no Firestore, tentar do .env
        if (!cookie) {
            cookie = process.env.NORDY_COOKIE as string;
            if (targetId && targetId !== "admin") {
                cookie = process.env[`NORDY_COOKIE_${targetId}`] as string || process.env.NORDY_COOKIE as string;
            }
        }

        if (!cookie) {
            return NextResponse.json(
                { error: "NORDY_COOKIE não encontrado. Conecte sua extensão no painel Studio." },
                { status: 401 }
            );
        }

        const nordyApiUrl = "https://api.nordy.ai/general/job";
        const clientId = `sintetix-app-${Date.now()}`;

        const response = await fetch(nordyApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Cookie: cookie,
                Origin: "https://nordy.ai",
                Referer: "https://nordy.ai/",
                "x-origin-url": "https://nordy.ai/comfyui",
            },
            body: JSON.stringify({
                clientId: clientId,
                workflow: activeWorkflowId,
                prompt: JSON.stringify({
                    output: prompt,
                }),
            }),
        });

        const textResponse = await response.text();

        if (!response.ok) {
            console.error("Erro na API do Nordy:", textResponse);
            return NextResponse.json(
                { error: "Erro na API do Nordy", details: textResponse },
                { status: response.status }
            );
        }

        try {
            const data = JSON.parse(textResponse);
            return NextResponse.json(data);
        } catch (e) {
            return NextResponse.json(
                { error: "A resposta do Nordy não é um JSON válido", details: textResponse },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Erro no proxy Nordy Generate:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor", details: error.message },
            { status: 500 }
        );
    }
}
