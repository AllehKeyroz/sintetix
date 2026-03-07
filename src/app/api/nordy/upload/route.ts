import { NextResponse } from "next/server";
import { getNordyCookiesServer } from "@/lib/nordy_server";

export async function POST(req: Request) {
    const origin = req.headers.get("origin") || "*";
    const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    try {
        const formData = await req.formData();
        const file = formData.get("image") || formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo não encontrado ou inválido" }, { status: 400, headers: corsHeaders });
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
            return NextResponse.json({ error: "NORDY_COOKIE não encontrado no Firestore ou ambiente" }, { status: 401, headers: corsHeaders });
        }

        const nordyUploadUrl = "https://api.nordy.ai/general/input-asset/file/image";

        const nordyForm = new FormData();
        const fileContent = await file.arrayBuffer();
        const blob = new Blob([fileContent], { type: file.type });

        nordyForm.append("image", blob, file.name);
        nordyForm.append("body", JSON.stringify({ name: file.name }));

        const response = await fetch(nordyUploadUrl, {
            method: "POST",
            headers: {
                Cookie: cookie,
                Origin: "https://nordy.ai",
                Referer: "https://nordy.ai/",
                "x-origin-url": "https://nordy.ai/comfyui",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            },
            body: nordyForm,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro no upload para o Nordy:", data);
            return NextResponse.json(data, { status: response.status, headers: corsHeaders });
        }

        return NextResponse.json(data.asset, { headers: corsHeaders });
    } catch (error: any) {
        console.error("Erro no proxy Nordy Upload:", error);
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS(request: Request) {
    const origin = request.headers.get("origin") || "*";
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
