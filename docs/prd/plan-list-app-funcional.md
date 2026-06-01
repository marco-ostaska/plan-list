# plan-list — App Funcional de Tarefas e Ideias Pessoais

## 1. Objective

Transformar o protótipo atual (HTML + React + Express lendo arquivos .md) num app pessoal utilizável no dia a dia para organizar tarefas e ideias, eliminando fricções que impedem o uso contínuo: reabrir pasta toda vez, criar tarefas só via edição manual de markdown, falta de visão agregada.

## 2. Current Problem

Hoje o app funciona como prova de conceito:
- Toda vez que abre o app é necessário digitar o caminho da pasta
  (mesmo que localStorage já tente lembrar, não há fallback claro quando
  a pasta não está acessível)
- Para criar uma nova tarefa precisa navegar até o arquivo certo,
  achar a linha certa e digitar `- [ ] texto` manualmente
- Não existe visão de "todas as tarefas abertas" — precisa abrir arquivo
  por arquivo
- Não há forma de adicionar um arquivo novo pelo teclado rapidamente

## 3. Scope

- Vault padrão configurável: salvar o caminho do vault e reconectar
  automaticamente ao abrir; exibir erro claro se a pasta sumiu
- Quick-add: atalho/botão para criar uma nova tarefa em arquivo
  predefinido ou no arquivo ativo, sem abrir o editor de texto
- Visão "inbox": lista de todas as tarefas abertas (`- [ ]`) de todos
  os arquivos do vault, com link para o arquivo de origem
- Criar novo arquivo via atalho (Cmd/Ctrl+N) direto na sidebar
- UX de marcar tarefa como feita na visão inbox (atualiza o .md em disco)
- Listar todos os arquivos `.md` do vault na sidebar, incluindo arquivos
  na raiz e em subpastas (máximo 2 níveis); exibir nome sem extensão e
  indicador de progresso de tarefas por arquivo

## 4. Out of Scope

- Notificações do sistema operacional
- Lembretes temporizados
- Sincronização com serviços externos (Google Tasks, Notion, etc.)
- Suporte a múltiplos vaults simultâneos
- Busca full-text (pode ser avaliada em histórias futuras)

## 5. Requirements

1. Ao iniciar, o app carrega automaticamente o último vault aberto sem
   interação do usuário; se falhar, exibe a tela de picker com mensagem
   de erro explicativa.
2. O usuário pode trocar o vault ativo a qualquer momento via um botão
   acessível na sidebar.
3. Um campo de quick-add (acessível via atalho `t`) adiciona uma tarefa
   como `- [ ] texto` no final do arquivo ativo ou num arquivo de inbox
   configurável.
4. A visão "inbox" lista todas as tarefas abertas do vault com o nome
   do arquivo de origem; clicar na tarefa abre o arquivo correspondente.
5. Marcar uma tarefa como feita na visão inbox altera o `- [ ]` para
   `- [x]` no arquivo .md em disco.
6. O atalho `Cmd/Ctrl+N` cria um novo arquivo .md na pasta raiz ou
   pasta selecionada e abre para edição imediatamente.
7. O estado do vault (caminho) persiste em localStorage e sobrevive a
   recarregamentos do browser.
8. A sidebar exibe todos os arquivos `.md` do vault agrupados por pasta;
   arquivos na raiz aparecem em seção separada; cada entrada mostra o
   nome e um indicador visual de progresso de tarefas do arquivo.

## 6. Success Criteria

- Abrir o app e estar editando uma nota em menos de 2 segundos,
  sem digitar nenhum caminho.
- Adicionar uma tarefa nova em menos de 3 segundos a partir de qualquer
  tela do app.
- Ver todas as tarefas abertas do vault numa única tela sem abrir
  arquivo algum.
- Marcar uma tarefa como feita na visão inbox e verificar que o arquivo
  .md foi atualizado em disco.
- A sidebar lista todos os arquivos .md do vault ao abrir o app.

## 7. Risks

- O app usa Babel standalone no browser (sem bundler); JSX compilado
  em runtime pode ficar lento com arquivos .jsx maiores — avaliar se
  a visão inbox com muitos itens precisa de paginação.
- Editar arquivos .md programaticamente (para marcar checkbox na inbox)
  requer cuidado com a posição da linha; regex pode falhar em edge cases
  de markdown aninhado.
- Vault path em localStorage não persiste entre profiles de browser
  ou modo incógnito — aceitável para uso pessoal.
