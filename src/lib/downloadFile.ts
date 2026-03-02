export const downloadFileToClient = async (url: string, prefix: string = "sintetix_") => {
    try {
        // Redireciona o href diretamente para o proxy que injeta header Content-Disposition garantindo o pop-up ou save do navegador!
        // O navegador não sofre bloqueios de CORS por ser mesmo host (nosso API) e salva no formato do Content-Type (image/png) forçado nela.
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;

        const a = document.createElement("a");
        a.style.display = "none";
        a.href = proxyUrl;
        const ext = url.toLowerCase().includes(".mp4") ? "mp4" : "png";
        a.setAttribute("download", `${prefix}${Date.now()}.${ext}`);

        document.body.appendChild(a);
        a.click();

        setTimeout(() => document.body.removeChild(a), 500);

    } catch (error) {
        console.error("Erro no fluxo do download:", error);
        alert("Ocorreu um erro no download. Tente abrir em nova aba usando botão direito > Copiar endereço na imagem.");
    }
};
