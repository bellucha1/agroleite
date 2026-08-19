const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('.'));

const db = new sqlite3.Database('./siscristovao.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf TEXT NOT NULL,
        telefone TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        preco REAL NOT NULL,
        tempo_estimado INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        hora TEXT,
        responsavel TEXT NOT NULL,
        total REAL NOT NULL,
        tempo_total INTEGER NOT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    )`);

    db.run(`ALTER TABLE agendamentos ADD COLUMN hora TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS itens_agendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agendamento_id INTEGER NOT NULL,
        servico_id INTEGER NOT NULL,
        preco_cobrado REAL NOT NULL,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos (id),
        FOREIGN KEY (servico_id) REFERENCES servicos (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mensagens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        assunto TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        data TEXT NOT NULL,
        lida INTEGER DEFAULT 0
    )`);

    db.get('SELECT COUNT(*) AS total FROM servicos', (err, row) => {
        if (err || !row || row.total > 0) return;

        const padrao = [
            ['Análise da Qualidade do Leite', 120.00, 2],
            ['Coleta de Amostras', 80.00, 1],
            ['Visita Técnica', 250.00, 4],
            ['Consultoria em Nutrição Animal', 350.00, 5],
            ['Diagnóstico da Propriedade', 450.00, 6],
            ['Treinamento de Ordenha', 300.00, 3],
            ['Avaliação Sanitária do Rebanho', 180.00, 2],
            ['Planejamento Alimentar', 280.00, 3]
        ];

        const stmt = db.prepare(
            'INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)'
        );
        padrao.forEach(s => stmt.run(s));
        stmt.finalize();
        console.log('✅ Serviços padrão inseridos no banco.');
    });

    db.get('SELECT COUNT(*) AS total FROM clientes', (err, row) => {
        if (err || !row || row.total > 0) return;

        const exemplos = [
            ['Fazenda Esperança', '123.456.789-00', '(14) 99999-1001'],
            ['Sítio Primavera', '987.654.321-00', '(14) 98888-2002'],
            ['Cooperativa Vale do Leite', '12.345.678/0001-90', '(14) 97777-3003'],
            ['Fazenda Bela Vista', '111.222.333-44', '(14) 96666-4004']
        ];

        const stmt = db.prepare(
            'INSERT INTO clientes (nome, cpf, telefone) VALUES (?, ?, ?)'
        );
        exemplos.forEach(c => stmt.run(c));
        stmt.finalize();
        console.log('✅ Clientes de exemplo inseridos no banco.');
    });
});

app.post('/salvar-cliente', (req, res) => {
    const { nome, cpf, telefone } = req.body;
    if (!nome || !cpf || !telefone) {
        return res.status(400).json({ success: false, error: 'Preencha todos os campos.' });
    }

    db.run(
        'INSERT INTO clientes (nome, cpf, telefone) VALUES (?, ?, ?)',
        [nome.trim(), cpf.trim(), telefone.trim()],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get('/listar-clientes', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 10));
    const busca = (req.query.busca || '').trim();
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];
    if (busca) {
        where = 'WHERE nome LIKE ? OR cpf LIKE ? OR telefone LIKE ?';
        const like = `%${busca}%`;
        params = [like, like, like];
    }

    db.get(`SELECT COUNT(*) AS total FROM clientes ${where}`, params, (errCount, row) => {
        if (errCount) return res.status(500).json({ error: errCount.message });

        db.all(
            `SELECT * FROM clientes ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    data: rows,
                    total: row.total,
                    page,
                    limit,
                    totalPages: Math.ceil(row.total / limit) || 1
                });
            }
        );
    });
});

app.post('/salvar-servico', (req, res) => {
    const { descricao, preco, tempo_estimado } = req.body;
    if (!descricao || preco === undefined || preco === null || !tempo_estimado) {
        return res.status(400).json({ success: false, error: 'Preencha descrição, preço e tempo estimado.' });
    }

    const precoNum = parseFloat(preco);
    const tempoNum = parseInt(tempo_estimado);

    if (isNaN(precoNum) || precoNum < 0) {
        return res.status(400).json({ success: false, error: 'Preço inválido.' });
    }
    if (isNaN(tempoNum) || tempoNum < 1 || tempoNum > 12) {
        return res.status(400).json({ success: false, error: 'Tempo estimado deve ser entre 1 e 12 horas.' });
    }

    db.run(
        'INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)',
        [descricao.trim(), precoNum, tempoNum],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get('/listar-servicos', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 10));
    const busca = (req.query.busca || '').trim();
    const offset = (page - 1) * limit;

    let where = '';
    let params = [];
    if (busca) {
        where = 'WHERE descricao LIKE ?';
        params = [`%${busca}%`];
    }

    db.get(`SELECT COUNT(*) AS total FROM servicos ${where}`, params, (errCount, row) => {
        if (errCount) return res.status(500).json({ error: errCount.message });

        db.all(
            `SELECT * FROM servicos ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    data: rows,
                    total: row.total,
                    page,
                    limit,
                    totalPages: Math.ceil(row.total / limit) || 1
                });
            }
        );
    });
});

app.get('/todos-servicos', (req, res) => {
    db.all('SELECT * FROM servicos ORDER BY descricao', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/salvar-agendamento', (req, res) => {
    const { cliente_id, data, hora, responsavel, total, tempo_total, servicos } = req.body;
    if (!cliente_id || !data || !responsavel || !servicos || !Array.isArray(servicos) || servicos.length === 0) {
        return res.status(400).json({ success: false, error: 'Dados incompletos do agendamento.' });
    }
    if (!hora) {
        return res.status(400).json({ success: false, error: 'Informe o horário do agendamento.' });
    }

    db.run(
        `INSERT INTO agendamentos (cliente_id, data, hora, responsavel, total, tempo_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cliente_id, data, hora, responsavel.trim(), total || 0, tempo_total || 0],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });

            const agendamentoId = this.lastID;
            const stmt = db.prepare(
                'INSERT INTO itens_agendamento (agendamento_id, servico_id, preco_cobrado) VALUES (?, ?, ?)'
            );

            servicos.forEach(item => {
                stmt.run(agendamentoId, item.id, item.preco);
            });

            stmt.finalize(errFinalize => {
                if (errFinalize) {
                    return res.status(500).json({ success: false, error: errFinalize.message });
                }
                res.json({ success: true, id: agendamentoId });
            });
        }
    );
});

app.get('/listar-agendamentos', (req, res) => {
    const sql = `
        SELECT a.id, a.data, a.hora, a.responsavel, a.total, a.tempo_total,
               c.nome AS nome_cliente, c.telefone AS telefone_cliente
        FROM agendamentos a
        INNER JOIN clientes c ON a.cliente_id = c.id
        ORDER BY a.data DESC, a.hora ASC, a.id DESC`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/detalhes-agendamento/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT i.preco_cobrado, s.descricao, s.tempo_estimado
        FROM itens_agendamento i
        INNER JOIN servicos s ON i.servico_id = s.id
        WHERE i.agendamento_id = ?`;

    db.all(sql, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.delete('/excluir-agendamento/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM itens_agendamento WHERE agendamento_id = ?', [id], err1 => {
        if (err1) return res.status(500).json({ success: false, error: err1.message });

        db.run('DELETE FROM agendamentos WHERE id = ?', [id], function (err2) {
            if (err2) return res.status(500).json({ success: false, error: err2.message });
            res.json({ success: true, removidos: this.changes });
        });
    });
});

// ==================== MENSAGENS ====================
app.post('/salvar-mensagem', (req, res) => {
    const { nome, email, telefone, assunto, mensagem } = req.body;
    if (!nome || !email || !assunto || !mensagem) {
        return res.status(400).json({ success: false, error: 'Preencha nome, e-mail, assunto e mensagem.' });
    }

    const data = new Date().toISOString();
    db.run(
        `INSERT INTO mensagens (nome, email, telefone, assunto, mensagem, data, lida)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [nome.trim(), email.trim(), (telefone || '').trim(), assunto.trim(), mensagem.trim(), data],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get('/listar-mensagens', (req, res) => {
    db.all(
        `SELECT id, nome, email, telefone, assunto, mensagem, data, lida
         FROM mensagens
         ORDER BY data DESC, id DESC`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const lista = rows.map(r => ({ ...r, lida: !!r.lida }));
            res.json(lista);
        }
    );
});

app.get('/contar-mensagens-nao-lidas', (req, res) => {
    db.get('SELECT COUNT(*) AS total FROM mensagens WHERE lida = 0', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: row ? row.total : 0 });
    });
});

app.put('/marcar-mensagem/:id', (req, res) => {
    const { id } = req.params;
    const lida = req.body.lida ? 1 : 0;
    db.run('UPDATE mensagens SET lida = ? WHERE id = ?', [lida, id], function (err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.put('/marcar-todas-lidas', (req, res) => {
    db.run('UPDATE mensagens SET lida = 1 WHERE lida = 0', [], function (err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, changes: this.changes });
    });
});

app.delete('/excluir-mensagem/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM mensagens WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, removidos: this.changes });
    });
});

app.listen(3000, () => {
    console.log('====================================================');
    console.log('🚀 AGROLEITE rodando com sucesso na porta 3000!');
    console.log('📂 Banco de Dados: siscristovao.db');
    console.log('====================================================');
});
