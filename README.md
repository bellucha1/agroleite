# AGROLEITE

Sistema de gestão para clientes, serviços e agendamentos.

## Como rodar (local ou Codespace)

```bash
npm install
npm start
```

Abra no navegador:

- Login: `http://localhost:3000`
- Depois do login: páginas em `/agroleite/`

No **GitHub Codespaces**, após o `npm start`, use a porta **3000** (Forwarded Ports) e abra o link gerado.

## Estrutura

| Pasta/Arquivo | Conteúdo |
|---------------|----------|
| `index.html` | Tela de login |
| `agroleite/` | Páginas do sistema (home, clientes, serviços, agendamentos, consultas) |
| `css/` | Estilos |
| `js/server.js` | Backend Express + SQLite |
| `siscristovao.db` | Banco de dados (criado/atualizado automaticamente) |
| `imagensagroleite/` | Imagens |

## Funcionalidades

- Cadastro e listagem de **clientes** (com paginação e busca)
- Cadastro e listagem de **serviços** (valor e tempo estimado)
- **Agendamentos** com data, horário e serviços selecionados
- **Consulta** de agendamentos com detalhes e exclusão

## Banco de dados

O arquivo `siscristovao.db` é gerado na primeira execução se não existir.  
Na primeira vez, o sistema pode inserir serviços e clientes de exemplo.

Para começar do zero:

```bash
rm -f siscristovao.db
npm start
```
