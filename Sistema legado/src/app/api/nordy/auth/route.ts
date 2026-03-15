import { NextResponse } from "next/server";

// Habilitando CORS para a Extensão do Chrome poder chamar direto a API
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cookieString, targetId = "admin" } = body;

        console.log(`[AUTH] Atualizando Token Nordy para o alvo: ${targetId}`);

        if (cookieString) {
            if (targetId === "admin") {
                // Global/Admin
                process.env.NORDY_COOKIE = cookieString;
            } else {
                // Específico por agência
                const key = `NORDY_COOKIE_${targetId.trim()}`;
                process.env[key] = cookieString;

                // Backup para testes se a API global estiver vazia ainda
                if (!process.env.NORDY_COOKIE) {
                    process.env.NORDY_COOKIE = cookieString;
                }
            }
        }

        return NextResponse.json({ success: true, message: `Cookie Nordy atualizado com sucesso! (ID: ${targetId})` }, { headers: corsHeaders });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders });
    }
}
