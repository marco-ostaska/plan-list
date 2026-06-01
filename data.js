// Simulated vault: 2 levels deep — folders + .md files
// Each file has markdown content with tasks, notes, and a comments timeline.

window.VAULT = {
  name: "meu-vault",
  folders: [
    {
      id: "trabalho",
      name: "Trabalho",
      files: [
        {
          id: "semana",
          name: "Semana atual.md",
          updated: "hoje, 14:32",
          content: `# Semana de 25–31 de maio

Foco: fechar o relatório do Q2 e destravar o onboarding novo.

## Segunda
- [x] Stand-up #daily
- [x] Revisar PR do Lucas
- [ ] Mandar nota fiscal pro RH @hoje
- [ ] Ligar pro contador

## Terça
- [ ] Reunião com a Marina — alinhar escopo do Q3 @terça 10h
- [ ] Escrever rascunho do relatório #relatório
- [ ] Almoço com a equipe (não esquecer)

## Quarta
- [ ] Finalizar slides do all-hands #apresentação
- [ ] Review do design com a Júlia

## Notas soltas
A Marina comentou que o time de dados quer um espaço fixo na pauta semanal.
Vale propor um formato de 15min toda quinta — sem agenda fixa, só atualizações.`,
          comments: [
            { id: "c1", author: "você", when: "ontem 17:04", text: "lembrar de incluir o time de dados na pauta da quinta" },
            { id: "c2", author: "você", when: "hoje 09:11", text: "Marina topou. agendar pra essa semana ainda?" },
            { id: "c3", author: "você", when: "hoje 14:32", text: "agendado ✓ — agora é só preparar a primeira" },
          ],
        },
        {
          id: "projeto-x",
          name: "Projeto X.md",
          updated: "ontem",
          content: `# Projeto X — replanejamento

Depois do feedback do cliente, dá pra cortar metade do escopo inicial.

## O que fica
- [x] Fluxo de cadastro novo
- [x] Tela de billing
- [ ] Notificações por email #email
- [ ] Painel admin (versão mínima)

## O que sai
- [x] Integração com Slack (adiar pra v2)
- [x] Sistema de relatórios custom

## Riscos
- [ ] Validar com o jurídico antes de mexer no fluxo de cadastro
- [ ] Confirmar se o time de infra tem banda pra ajudar @sexta

## Decisões
Decidimos manter o nome "Projeto X" internamente. Externamente vai virar "Foco".`,
          comments: [
            { id: "c1", author: "você", when: "2 dias atrás", text: "o cliente parecia satisfeito. anotar pra retomar v2 daqui 2 meses" },
            { id: "c2", author: "você", when: "ontem 11:20", text: "jurídico respondeu — sem bloqueios" },
          ],
        },
        {
          id: "1-1-marina",
          name: "1-1 Marina.md",
          updated: "3 dias atrás",
          content: `# 1:1 com Marina

## Pra falar
- [ ] Pedir feedback sobre a apresentação de quinta
- [ ] Discutir prioridades do Q3
- [x] Pegar contexto sobre o time de dados
- [ ] Falar sobre férias em julho

## Notas da última
Ela mencionou que está sobrecarregada com reuniões. Talvez seja bom propor um "no meeting wednesday" pro time inteiro.

## Itens recorrentes
- [ ] Revisar OKRs mensalmente
- [ ] Atualizar planilha de capacidade do time`,
          comments: [
            { id: "c1", author: "você", when: "semana passada", text: "ela parecia preocupada com o Léo. ficar de olho." },
          ],
        },
      ],
    },
    {
      id: "pessoal",
      name: "Pessoal",
      files: [
        {
          id: "casa",
          name: "Casa.md",
          updated: "hoje, 08:15",
          content: `# Casa

## Manutenção
- [ ] Trocar a torneira da cozinha #urgente
- [ ] Chamar o eletricista pra ver a tomada do quarto
- [x] Comprar lâmpada nova pra sala
- [ ] Limpar o filtro do ar-condicionado @sábado

## Compras
- [x] Café
- [x] Detergente
- [ ] Sabão em pó
- [ ] Papel higiênico
- [ ] Frutas pra semana

## Ideias / projetos
- [ ] Montar uma estante na parede do escritório
- [ ] Pintar a parede do corredor (cor neutra, não branca)

## Notas
Aquela loja de utilidades na rua Augusta tem ferramentas baratas.`,
          comments: [
            { id: "c1", author: "você", when: "hoje 08:15", text: "lembrar que a chave de fenda tá na gaveta da cozinha agora" },
          ],
        },
        {
          id: "saude",
          name: "Saúde.md",
          updated: "semana passada",
          content: `# Saúde

## Consultas
- [x] Dentista (limpeza) — feito 12/05
- [ ] Marcar oftalmologista @maio
- [ ] Exames de rotina anuais

## Rotina
- [x] Caminhar segunda
- [x] Caminhar quarta
- [ ] Caminhar sexta
- [ ] Beber 2L de água todo dia (lembrar à tarde)

## Sono
Tenho dormido melhor desde que parei de ver tela depois das 22h.
Continuar com isso.`,
          comments: [],
        },
        {
          id: "estudos",
          name: "Estudos.md",
          updated: "4 dias atrás",
          content: `# Estudos

## Em andamento
- [ ] Terminar curso de SQL avançado (3 módulos restando)
- [ ] Livro: "Thinking in Systems" — cap. 4
- [x] Workshop de escrita técnica

## Pra começar
- [ ] Curso de fotografia básica
- [ ] Voltar pro francês (Duolingo, 15min/dia)

## Notas
O curso de SQL tá denso. Talvez fazer 1 módulo por semana sem pressa.`,
          comments: [
            { id: "c1", author: "você", when: "semana passada", text: "não me cobrar tanto, lazer também é estudo" },
          ],
        },
      ],
    },
    {
      id: "ideias",
      name: "Ideias",
      files: [
        {
          id: "side-projects",
          name: "Side projects.md",
          updated: "2 semanas atrás",
          content: `# Side projects

Coisas que quero fazer um dia. Sem pressa.

## Lista
- [ ] App de receitas que aceita ingredientes que tenho em casa
- [ ] Newsletter mensal sobre design + sistemas
- [ ] Ferramenta de leitura compartilhada (anotar livros junto)
- [x] Site pessoal novo
- [ ] Plugin de timer pomodoro com sons de chuva

## Princípios
- Pequeno é melhor que grande
- Terminar > começar
- Compartilhar cedo`,
          comments: [],
        },
        {
          id: "livros",
          name: "Livros.md",
          updated: "1 mês atrás",
          content: `# Livros

## Lendo
- [ ] Thinking in Systems — Donella Meadows
- [ ] A short history of nearly everything

## Próximos
- [ ] The Design of Everyday Things (reler)
- [ ] Mãos de Cavalo — Daniel Galera
- [ ] Educação Sentimental — Flaubert

## Lidos esse ano
- [x] Klara and the Sun
- [x] Tomorrow, and Tomorrow, and Tomorrow
- [x] Pequena Coreografia do Adeus`,
          comments: [],
        },
      ],
    },
  ],
  rootFiles: [
    {
      id: "hoje",
      name: "Hoje.md",
      updated: "agora",
      content: `# Hoje — 27 de maio

Dia tranquilo. Foco em fechar coisas pequenas.

## Manhã
- [x] Café + ler emails
- [x] Stand-up
- [ ] Revisar planejamento da semana
- [ ] Responder Marina sobre quinta

## Tarde
- [ ] Bloco de 2h sem reunião pro relatório
- [ ] Caminhada de 20min depois do almoço
- [ ] Ligar pro contador

## Notas
Acordei bem. Aproveitar a energia da manhã pro relatório.`,
      comments: [
        { id: "c1", author: "você", when: "agora", text: "começar pelo relatório, mesmo." },
      ],
    },
    {
      id: "inbox",
      name: "Inbox.md",
      updated: "hoje, 11:02",
      content: `# Inbox

Captura rápida. Triagem depois.

- [ ] Comprar presente de aniversário da Bia
- [ ] Pesquisar sobre aquele documentário que o Léo recomendou
- [ ] Ver se aquela cafeteira nova vale a pena
- [ ] Responder mensagem do João
- [ ] Renovar assinatura da revista`,
      comments: [],
    },
  ],
};
