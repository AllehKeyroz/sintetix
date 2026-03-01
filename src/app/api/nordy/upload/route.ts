import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") || formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "Arquivo não encontrado ou inválido" }, { status: 400 });
        }

        const cookie = process.env.NORDY_COOKIE;
        if (!cookie) {
            return NextResponse.json({ error: "NORDY_COOKIE não configurado" }, { status: 500 });
        }

        const nordyUploadUrl = "https://api.nordy.ai/general/input-asset/file/image";

        // Preparar novo FormData para o Nordy baseado na captura do usuario
        const nordyForm = new FormData();
        nordyForm.append("image", file);
        nordyForm.append("body", JSON.stringify({ name: file.name }));

        const response = await fetch(nordyUploadUrl, {
            method: "POST",
            headers: {
                Cookie: cookie,
                Origin: "https://nordy.ai",
                Referer: "https://nordy.ai/",
                "x-origin-url": "https://nordy.ai/comfyui",
            },
            body: nordyForm,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro no upload para o Nordy:", data);
            return NextResponse.json(data, { status: response.status });
        }

        // Retornamos o objeto completo do asset para o front extrair o rawUrl
        return NextResponse.json(data.asset);
    } catch (error: any) {
        console.error("Erro no proxy Nordy Upload:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
