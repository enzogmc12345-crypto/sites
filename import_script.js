function importExcelData() {
    const importedTasks = [
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "AMANCO", agent: "Linda", type: "REEL", 
            campaign: "Incêndio não avisa.  O sistema precisa estar pronto.", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "AMANCO", agent: "Linda", type: "CARROSSEL", 
            campaign: "Água fria", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "AMANCO", agent: "Linda", type: "CARD", 
            campaign: "Dia do Trabalhador e da Trabalhadora", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARROSSEL", 
            campaign: "Conteúdo Abril Azul", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARROSSEL", 
            campaign: "Dia da educação", creation: "SIM", designer: "Carol", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "EMAIL MKT", 
            campaign: "Email MKt - Emprego Apoiado - Dia da educação", creation: "SIM", designer: "Carol", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "ECOBAG/SACOLA", 
            campaign: "Sacolas para influenciadores", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Alta", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "CARROSSEL", 
            campaign: "Brincadeiras sem tela", creation: "SIM", designer: "Deisy/Dani", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "CARDS", 
            campaign: "Expectativa vs realidade", creation: "SIM", designer: "Deisy/Dani", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "CARROSSEL", 
            campaign: "Cenas Clássicas", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "Sleepytime orquestra", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "O poder do tédio", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "REEL", 
            campaign: "Racismo e discriminação racial", creation: "SIM", designer: "Tereza", deadline: "2026-04-24",
            priority: "Alta", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "NOTA SITE", 
            campaign: "Nota do site - Edital Juntos pela mobilidade social", creation: "SIM", designer: "Vanessa", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARROSSEL", 
            campaign: "Carrossel - Edital Juntos pela mobilidade Social", creation: "SIM", designer: "Vanessa", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "Reel Geral - Projeto Autonomia", creation: "SIM", designer: "Vanessa", deadline: "",
            priority: "Normal", status: "A FAZER", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "EMAIL MKT", 
            campaign: "Email mkt - tração", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARDS", 
            campaign: "Card Whatsapp - tração", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "STORIES", 
            campaign: "Stories Edital Tração - Levando nota do site", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "BANNER", 
            campaign: "Banner para site - Edital Tração", creation: "SIM", designer: "Estéfano", deadline: "",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "REEL", 
            campaign: "Workshop de Segurança e operações", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "REEL", 
            campaign: "Abril Verde - Mês da Segurança - POST 3", creation: "SIM", designer: "Estéfano", deadline: "2026-04-27",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Lori", type: "CERTIFICADOS", 
            campaign: "Certificados Media Training", creation: "SIM", designer: "Giovana", deadline: "2026-04-30",
            priority: "Baixa", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARD", 
            campaign: "Post para bloig", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "MEU CASH CARD", agent: "Isa", type: "REEL", 
            campaign: "reel - meu cash card", creation: "SIM", designer: "Enzo", deadline: "2026-04-24",
            priority: "Alta", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "CARROSSEL + STORIES", 
            campaign: "Insights sobre mercado de trabalho e RH", creation: "SIM", designer: "Tereza", deadline: "2026-04-24",
            priority: "Normal", status: "EM ANDAMENTO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "REEL", 
            campaign: "Legenda de vídeo 2", creation: "SIM", designer: "Enzo", deadline: "2026-04-13",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "5 POSTS", 
            campaign: "Posts Emprego Apoiado - Adaptação", creation: "SIM", designer: "Carol", deadline: "2026-04-15",
            priority: "Alta", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "Gnomos de jardim", creation: "SIM", designer: "Enzo", deadline: "2026-04-13",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "BLUEY", agent: "Carol", type: "REEL", 
            campaign: "Gnomos Ella Bakes", creation: "SIM", designer: "Estéfano", deadline: "2026-04-10",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "STORY", 
            campaign: "O silêncio também é violência", creation: "SIM", designer: "Tereza", deadline: "2026-04-13",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Registros de páscoa - navios e escritórios", creation: "SIM", designer: "Deisy", deadline: "2026-04-22",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Workshop de segurança e operações", creation: "SIM", designer: "Deisy", deadline: "2026-04-22",
            priority: "Normal", status: "CONCLUÍDO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARD", 
            campaign: "Quem faz a Apabex?", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "CARROSSEL", 
            campaign: "NFP", creation: "SIM", designer: "Giovana", deadline: "2026-04-13",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "FLYER", 
            campaign: "NFP - Flyer", creation: "SIM", designer: "Giovana", deadline: "2026-04-20",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "APABEX", agent: "Carol", type: "BLOG", 
            campaign: "Blog Abril Azul", creation: "SIM", designer: "Carol", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "O que é o Transformando O Amanhã na voz de quem faz", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "Toda infância importa", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "TBT Março", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "DEFINIR", 
            campaign: "Dia da educação", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "REEL", 
            campaign: "Adolescência LGBTQIA+", creation: "SIM", designer: "Vanessa", deadline: "2026-04-14",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "CARROSSEL", 
            campaign: "O que é o TOA?", creation: "SIM", designer: "Vanessa", deadline: "2026-04-13",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "CENPEC", agent: "Carol", type: "STORY", 
            campaign: "Nem toda infância tem a mesma chance", creation: "SIM", designer: "Vanessa", deadline: "2026-04-13",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "Reel do vídeocast Isabele", creation: "SIM", designer: "Vanessa", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "HEADER", 
            campaign: "(ajuste)  Header", creation: "SIM", designer: "Estéfano", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "Projeto Autonomia] Reel Geral - SBC", creation: "SIM", designer: "Vanessa", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "REEL", 
            campaign: "[Edital juntos pela mobilidade social] Reels OSCs 1 - Salvador", creation: "SIM", designer: "Estéfano", deadline: "2026-04-15",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARROSSEL", 
            campaign: "[Pesquisa IAÍ] Post Analítco - Card + Copy Insta e LK", creation: "SIM", designer: "Estéfano", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "CARD", 
            campaign: "Edital do tração", creation: "SIM", designer: "Vanessa", deadline: "2026-04-20",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "FUNDAÇÃO", agent: "Pedro", type: "NOTA", 
            campaign: "Nota de site", creation: "SIM", designer: "Vanessa", deadline: "2026-04-20",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "REEL", 
            campaign: "Reducing the burden on healthcare workers, with AI", creation: "SIM", designer: "Enzo", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "CARDS", 
            campaign: "Estático Tereza", creation: "SIM", designer: "Estéfano", deadline: "2026-04-22",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "FLYER", 
            campaign: "Flyer digital", creation: "SIM", designer: "Giovana", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "INTERSYSTEMS", agent: "Isa", type: "PDF", 
            campaign: "Adaptação material (tradução)", creation: "SIM", designer: "Enzo", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARROSSEL", 
            campaign: "Carrrossel", creation: "SIM", designer: "Estéfano", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARROSSEL", 
            campaign: "Evento", creation: "SIM", designer: "Giovana", deadline: "2026-04-13",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARROSSEL", 
            campaign: "5 sinais", creation: "SIM", designer: "Enzo", deadline: "2026-04-10",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "LINEAR", agent: "Isa", type: "CARDS", 
            campaign: "2 posts estáticos", creation: "SIM", designer: "Giovana", deadline: "2026-04-16",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "MEU CASH CARD", agent: "Isa", type: "REEL", 
            campaign: "Vídeo - evento", creation: "SIM", designer: "Enzo", deadline: "2026-04-15",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "EMAIL MKT", 
            campaign: "E-mail MKT - Save the date VIK", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "EMAIL MKT", 
            campaign: "E-mail MKT 3 - VIK", creation: "SIM", designer: "Giovana", deadline: "2026-04-24",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "REEL", 
            campaign: "Mês da segurança - post 2", creation: "SIM", designer: "Estéfano", deadline: "2026-04-22",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Parceria Iara Systems", creation: "SIM", designer: "Estéfano", deadline: "2026-04-13",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SEAGEMS", agent: "Deisy", type: "CARROSSEL", 
            campaign: "Registros de Páscoa nos navios", creation: "SIM", designer: "Estéfano", deadline: "2026-04-24",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "EMAIL MKT", 
            campaign: "News 22", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "Safety Walk", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "Como é trabalhar na Sodexo", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "Comentários positivos", creation: "SIM", designer: "Tereza", deadline: "2026-04-23",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Isa", type: "EMAIL MKT", 
            campaign: "5 emails", creation: "SIM", designer: "Tereza", deadline: "2026-04-14",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "CARROSSEL", 
            campaign: "Compilado de participações", creation: "SIM", designer: "Tereza", deadline: "2026-04-15",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "REEL", 
            campaign: "50 mil seguidores", creation: "SIM", designer: "Tereza", deadline: "2026-04-22",
            priority: "Alta", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        },
        {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            client: "SODEXO", agent: "Veri", type: "CARROSSEL", 
            campaign: "Symbol Awards - Lilian Rauld", creation: "SIM", designer: "Tereza", deadline: "2026-04-17",
            priority: "Normal", status: "AGUARDANDO APROVAÇÃO", adjustments: "", updatedAt: new Date().toISOString()
        }
    ];
    const batch = db.batch();
    importedTasks.forEach(t => {
        const docRef = db.collection("tasks").doc(t.id);
        batch.set(docRef, t);
    });
    batch.commit().then(() => {
        showToast("Demandas da planilha importadas com sucesso!");
    }).catch(err => {
        console.error("Erro na importação:", err);
        showToast("Erro na importação");
    });
}