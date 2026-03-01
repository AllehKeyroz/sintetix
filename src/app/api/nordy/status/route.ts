import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get("jobId");

        if (!jobId) {
            return NextResponse.json(
                { error: "jobId é obrigatório" },
                { status: 400 }
            );
        }

        const cookie = process.env.NORDY_COOKIE;

        if (!cookie) {
            return NextResponse.json(
                { error: "NORDY_COOKIE não configurado no .env.local" },
                { status: 500 }
            );
        }

        const response = await fetch(`https://api.nordy.ai/general/job/${jobId}`, {
            method: "GET",
            headers: {
                Cookie: cookie,
                Origin: "https://nordy.ai",
                Referer: "https://nordy.ai/",
            },
        });

        const textResponse = await response.text();

        if (!response.ok) {
            console.error("Erro no proxy Nordy Status:", textResponse);
            return NextResponse.json(
                { error: "Erro na API do Nordy", details: textResponse },
                { status: response.status }
            );
        }

        try {
            const data = JSON.parse(textResponse);
            const status = (data.status || "").toLowerCase();

            if (status === "done" || status === "completed" || status === "success") {
                console.log(`=== NORDY DONE [${jobId}] - Payload Size: ${textResponse.length} chars ===`);
                // Log only a snippet of the result to avoid terminal lag/Next.js warnings
                console.log("Snippet:", textResponse.substring(0, 500) + "...");
            }
            return NextResponse.json(data);
        } catch (e: any) {
            console.error("Erro ao fazer parse do JSON do Nordy:", e.message);
            return NextResponse.json(
                { error: "A resposta do Nordy não é um JSON válido", details: textResponse.substring(0, 1000) },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Erro interno no proxy Nordy Status:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor", details: error.message },
            { status: 500 }
        );
    }
}
