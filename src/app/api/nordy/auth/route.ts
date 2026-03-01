export async function POST(req: Request) {
    try {
        const { cookieString } = await req.json();

        if (cookieString) {
            process.env.NORDY_COOKIE = cookieString;
        }

        return Response.json({ success: true, message: "Cookie Nordy atualizado com sucesso!" });

    } catch (e: any) {
        return Response.json({ success: false, error: e.message }, { status: 500 });
    }
}
