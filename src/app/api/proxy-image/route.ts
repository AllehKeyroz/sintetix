import { NextResponse } from "next/server";
import mime from "mime-types";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get("url");

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch remote image" }, { status: response.status });
        }

        const buffer = await response.arrayBuffer();

        // 1. Pega Content-Type nativo do S3 (Geralmente diz 'binary/octet-stream' erroneamente)
        let contentType = response.headers.get("content-type");

        // 2. Se a origem forçou binary ou está ausente, vamos adivinhar pela URL (se tiver .png / .jpg)
        if (!contentType || contentType === "application/octet-stream" || contentType === "binary/octet-stream") {
            const pureUrl = url ? url.split("?")[0] : "";
            const derived = mime.lookup(pureUrl);
            if (derived) contentType = derived;
            else if (pureUrl.toLowerCase().includes(".mp4")) contentType = "video/mp4";
            else contentType = "image/png"; // Ultimo resort seguro e o esperado primariamente
        }

        // 3. Define a extensão do arquivo no `Content-Disposition` para o Download
        const extension = mime.extension(contentType as string) || "png";

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": contentType as string,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "Content-Disposition": `attachment; filename="sintetix_${Date.now()}.${extension}"`,
            },
        });
    } catch (error: any) {
        console.error("Erro interno no proxy de imagem:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 }
        );
    }
}
