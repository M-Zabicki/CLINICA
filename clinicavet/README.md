# VetCare

Sistema de gestão veterinária em HTML, CSS e JavaScript, com Supabase Auth e banco protegido por RLS. A interface usa Tailwind via CDN, SweetAlert2 e Lucide. Nenhuma credencial privilegiada é usada no navegador.

## Executar localmente

1. Copie `.env.example` para `.env` e defina `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os dados públicos do projeto.
2. No SQL Editor do Supabase, execute `supabase/schema.sql`.
3. Execute `python server.py` e abra `http://localhost:8000`.
4. Crie sua conta pela tela de acesso. Ajuste no Supabase as URLs de redirecionamento de autenticação e recuperação para a URL local.

O servidor lê o `.env` e entrega `config.js` em tempo de execução. A URL e a chave anon são públicas; nunca use `service_role` no cliente.

## GitHub Pages

Pages é hospedagem estática e não executa `server.py`. Antes de publicar, preencha `config.js` com a URL e a chave pública anon/publishable (ou gere o arquivo no workflow de publicação). Os caminhos são relativos para funcionar em subcaminhos. Configure no Supabase os redirect URLs do domínio Pages. O arquivo `.env` fica ignorado pelo Git.

## Dados e segurança

O schema cria tutores, animais e consultas com RLS por `usuario_id`, validações e chaves estrangeiras que protegem o histórico. Exclusões de tutores/animais com registros dependentes são recusadas pelo banco. Não contém dados de demonstração.
