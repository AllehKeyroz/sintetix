import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookie = process.env.NORDY_COOKIE;

        if (!cookie) {
            return NextResponse.json(
                { error: "NORDY_COOKIE não configurado no .env.local" },
                { status: 500 }
            );
        }

        const response = await fetch("https://api.nordy.ai/general/credit/active", {
            method: "GET",
            headers: {
                Cookie: cookie,
                Origin: "https://nordy.ai",
                Referer: "https://nordy.ai/",
            },
        });

        const textResponse = await response.text();

        if (!response.ok) {
            console.error("Erro no proxy Nordy Quota:", textResponse);
            return NextResponse.json(
                { error: "Erro ao buscar cotas", details: textResponse },
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
        console.error("Erro interno no proxy Nordy Quota:", error);
        return NextResponse.json(
            { error: "Erro interno no servidor", details: error.message },
            { status: 500 }
        );
    }
}
