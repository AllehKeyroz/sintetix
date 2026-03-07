import { NextResponse } from "next/server";
import { getNordyCookiesServer } from "@/lib/nordy_server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("targetId") || "admin";

        // 1. Tentar pegar do Firestore (Mais atualizado)
        let cookie = await getNordyCookiesServer(targetId);

        // 2. Se não houver no Firestore, tentar do .env (Apenas se for admin/global)
        if (!cookie) {
            cookie = process.env.NORDY_COOKIE as string;
            if (targetId && targetId !== "admin") {
                cookie = process.env[`NORDY_COOKIE_${targetId}`] as string || process.env.NORDY_COOKIE as string;
            }
        }

        if (!cookie) {
            return NextResponse.json(
                { error: "NORDY_COOKIE não configurado localmente ou no Firestore" },
                { status: 401 } // Usar 401 para indicar que falta autenticação
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
                { error: "Acesso Negado ou Cookies Expirados no Nordy", details: textResponse },
                { status: response.status }
            );
        }

        try {
            const data = JSON.parse(textResponse);

            // 3. Atualizar o Firestore com a nova cota
            const docRef = doc(db, "settings", `nordy_${targetId}`);
            await updateDoc(docRef, {
                quota_total: data.credits || 0,
                quota_used: data.used || 0,
                updated_at: Timestamp.now()
            }).catch(e => console.error("Erro ao atualizar cota no Firestore:", e));

            return NextResponse.json({
                ...data,
                current_cookie: cookie // Retorna o cookie para o frontend fazer o backup no admin
            });
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
