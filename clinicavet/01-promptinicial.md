# Prompt inicial — Clínica veterinária VetCare

Crie neste repositório um site funcional de uma clínica veterinária chamada VetCare, usando como fontes de verdade:

- `docs/design_system.md` — identidade visual, tipografia, espaçamento, componentes e temas.
- `supabase/schema.sql` — tabelas, colunas, regras de acesso, categorias iniciais e políticas RLS.

Antes de implementar, leia esses dois arquivos e inspecione a estrutura existente do projeto. Preserve os arquivos e decisões já existentes que forem compatíveis. Faça a implementação nos diretórios atuais (`index.html`, `css/`, `js/` e outros arquivos necessários), sem introduzir frameworks de aplicação ou ferramentas de build.

## Tecnologias e limites

- HTML semântico, CSS e JavaScript Vanilla.
- Tailwind CSS para a estilização, usando uma forma compatível com este projeto estático e documentando qualquer configuração necessária.
- Supabase JavaScript Client para autenticação e acesso ao banco.
- SweetAlert2 para confirmações, avisos e mensagens de sucesso ou erro.
- Lucide Icons para ícones; use a integração oficial apropriada para uma página estática e não use emojis como ícones.
- Não use React, Vue, Angular, TypeScript, jQuery ou bibliotecas de gráficos pesadas.
- Mantenha o código organizado em módulos/arquivos pequenos, com responsabilidades claras.

## Funcionalidades

### Acesso e sessão

- Criar uma tela de login com email e senha, além de opção para criar conta e recuperar senha.
- Usar Supabase Auth. Manter a sessão com o cliente oficial e permitir sair da conta.
- Exibir erros de autenticação em português, de forma clara e acessível.
- Enquanto não houver sessão, mostrar apenas a área de acesso; após autenticar, abrir o dashboard.
- Não inventar autenticação local nem armazenar senhas manualmente.

### Tutores

- Consultar, cadastrar, editar e excluir tutores da tabela`public.tutores`.
- Campos: nome completo, CPF, telefone, e-mail, endereço e data de cadastro.
- Permitor pesquisar tutores por nome, CPF ou telefone.
- Listar os tutores cadastrados, ordenando pelos mais recentes.
- Exibir os animais vinculados a cada tutor.
- Validar os campos obrigatórios e os formatos de CPF, e-mail e telefone.
- Confirmar exclusões com SweetAlert2.
- Ao excluir um tutor, respeitar os relacionamentos existentes no schema, evitando exclusões indevidas de animais e consultas relacionadas.
- Atualizar os dados visíveis após criar, editar ou excluir um tutor.

### Animais 

- Consultar, cadastrar. ediatar e excluir animais da tabela`public.animais`.
- Campos: nome do animal, espécie, raça, sexo, data de nascimento, peso, cor, observações e tutor responsável.
- Permitir pesquisar animais por nome e filtrar por espécie.
- Disponibilizar as opções de espécie: cachorro, gato, ave, réptil e outros.
- Permitir selecionar somente tutores previamente cadastrados e autorizados.
- Exibir o nome do tutor responsável pelo animal.
- Permitir visualizar as informações completas do animal.
- Exibir o histórico de consultas vinculado a cada animal.
- Validar os dados antes de enviar ao banco.
- Confirmar exclusões com SweetAlert2.
- Atualizar a listagem após criar, editar ou excluir um animal.

### Consultas

- Consultar, cadastrar, editar e excluir consultas da tabela `public.consultas`.
- Campos: animal, tutor responsável, veterinário, data, horário, tipo de atendimento, sintomas, diagnóstico, tratamento, observações e status.
- O tutor deverá ser identificado automaticamente a partir do animal selecionado.
- Permitir selecionar animais previamente cadastrados.
- Disponibilizar os tipos de atendimento: consulta de rotina, vacinação, emergência, retorno, exames e cirurgia.
- Disponibilizar os status: agendada, em andamento, concluída e cancelada.
- Filtrar consultas por período, animal, veterinário e status.
- Ordenar os atendimentos pela data e horário.
- Permitir atualizar o status de uma consulta.
- Permitir registrar diagnóstico e tratamento após o atendimento.
- Exibir o histórico de consultas de cada animal.
- Validar os dados antes de enviar ao banco.
- Confirmar exclusões com SweetAlert2.
- Atualizar os dados visíveis após criar, editar ou excluir uma consulta.
- Tratar conflitos de agendamento, quando houver regras correspondentes no schema.

### Dashboard

- Criar uma visão inicial com total de tutores cadastrados, total de animais, consultas agendadas, consultas concluídas e consultas do dia.
- Permitir selecionar mês ou período para visualizar os indicadores.
- Calcular os indicadores utilizando os dados reais retornados pelo Supabase.
- Mostrar próximas consultas com nome do animal, tutor, veterinário, data e horário.
- Mostrar os últimos animais cadastrados.
- Criar um resumo dos atendimentos por tipo e status.
- Exibir o período selecionado e utilizar dados reais, sem números fictícios.
- Implementar estados vazios, carregamento e tratamento de erros.

## Design e experiência

- Siga `docs/design_system.md`: paleta roxa e verde-turquesa, cores semânticas, Poppins para títulos, Inter para textos, grid de 8 px, raios, cartões e contraste definidos.
- Implementar modo claro e escuro aplicando/removendo `dark` no elemento `<html>`, guardar a preferência do usuário e aplicar o mesmo tema ao SweetAlert2.
- Criar layout responsivo para celular e desktop, com navegação clara entre Dashboard, Lançamentos e Categorias.
- Usar rótulos visíveis, foco de teclado, estados de foco/erro, mensagens compreensíveis e estrutura semântica. Não depender só de cor para transmitir estado.
- Usar Lucide Icons com rótulo acessível ou `aria-hidden="true"` quando decorativos.
- Evitar conteúdo de demonstração disfarçado de dado real. Se usar dados de exemplo durante o desenvolvimento, isolá-los e deixar claro como removê-los.

## Integração e segurança Supabase

- Use apenas a URL do projeto Supabase e a chave pública `anon`/publishable no frontend. Nunca exponha `service_role`, segredo ou credencial privilegiada.
- Não enfraqueça nem contorne as políticas RLS do schema. Faça consultas e mutações autenticadas; trate falhas de rede, sessão expirada e permissões negadas.
- Para inserir categorias próprias, preencha `usuario_id` com o usuário autenticado e `carga_inicial` como `false`. Para lançamentos, associe o `usuario_id` autenticado e respeite `categoria_id` compatível com o tipo.
- Leia `supabase/schema.sql` antes de escrever consultas e use os nomes reais das colunas: `usuario_id`, `categoria_id`, `tipo`, `descricao`, `valor`, `data_lancamento`, `criado_em`, `nome` e `carga_inicial`.
- Centralize a inicialização/configuração do Supabase. Use `SUPABASE_URL` e `SUPABASE_ANON_KEY` em um `.env` local, forneça um `.env.example` sem valores reais e garanta que `.env` esteja no `.gitignore`.
- Como o navegador não lê arquivos `.env`, não tente carregá-lo com `fetch` nem inclua esses valores diretamente no JavaScript versionado. Sem adicionar framework ou ferramenta de build, disponibilize a configuração pública em tempo de execução por um mecanismo simples (por exemplo, um pequeno servidor local que lê o `.env` e entrega um `config.js` gerado). Documente também como fornecer as mesmas variáveis no ambiente de hospedagem.
- A URL e a chave `anon`/publishable são públicas por definição e ficarão visíveis no navegador; o `.env` organiza a configuração, mas não torna essas variáveis secretas. Nunca exponha a chave `service_role` ou qualquer segredo no cliente.
- Para operações de atualização e exclusão, restrinja também pela chave do registro; deixe a autorização final para a RLS.

## Entrega

Implemente a aplicação completa, não apenas um mockup.

 Inclua instruções para copiar `.env.example` para `.env`, configurar `SUPABASE_URL` e `SUPABASE_ANON_KEY`, aplicar o schema no projeto Supabase e iniciar o servidor local necessário para servir a página e sua configuração pública. 
 
 Teste o cadastro, login, logout e recuperação de senha.

 Teste o CRUD completo de tutores.

 Teste o CRUD completo de animais.

 Teste o CRUD completo de consultas.

 Verifique os relacionamentos entre tutores, animais e consultas.

 Teste os filtros e pesquisas.

 Verifique as políticas RLS.

 Teste o modo claro e escuro.

 Verifique a responsividade em celulares e computadores.

Confirme que a aplicação está preparada para publicação no GitHub Pages.

Ao concluir, resuma os arquivos criados/alterados, as funcionalidades entregues e qualquer configuração manual ainda necessária. 

Não altere o schema ou crie tabelas/políticas adicionais sem uma necessidade concreta identificada na implementação.

Objetivo final: entregar um sistema de gestão veterinária profissional, funcional e seguro, com integração real ao Supabase, utilizando HTML, CSS, JavaScript Vanilla e as tecnologias permitidas pela disciplina.