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
        responsavel TEXT NOT NULL,
        total REAL NOT NULL,
        tempo_total INTEGER NOT NULL,
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS itens_agendamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agendamento_id INTEGER NOT NULL,
        servico_id INTEGER NOT NULL,
        preco_cobrado REAL NOT NULL,
        FOREIGN KEY (agendamento_id) REFERENCES agendamentos (id),
        FOREIGN KEY (servico_id) REFERENCES servicos (id)
    )`);

    db.get('SELECT COUNT(*) AS total FROM servicos', (err, row) => {
        if (err || !row || row.total > 0) return;

        const padrao = [
            ['Análise da Qualidade do Leite', 120, 2],
            ['Coleta de Amostras', 80, 1],
            ['Visita Técnica', 250, 4],
            ['Consultoria em Nutrição Animal', 350, 5],
            ['Diagnóstico da Propriedade', 450, 6],
            ['Treinamento de Ordenha', 300, 3],
            ['Avaliação Sanitária do Rebanho', 180, 2],
            ['Planejamento Alimentar', 280, 3]
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

/* ---------- CLIENTES ---------- */
app.post('/salvar-cliente', (req, res) => {
    const { nome, cpf, telefone } = req.body;
    if (!nome || !cpf || !telefone) {
        return res.status(400).json({ success: false, error: 'Preencha todos os campos.' });
    }

    db.run(
        'INSERT INTO clientes (nome, cpf, telefone) VALUES (?, ?, ?)',
        [nome, cpf, telefone],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get('/listar-clientes', (req, res) => {
    const page = parseInt(req.query.page, 10);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const busca = (req.query.busca || '').trim();

    let where = '';
    const params = [];

    if (busca) {
        where = ' WHERE nome LIKE ? OR cpf LIKE ? OR telefone LIKE ?';
        const termo = '%' + busca + '%';
        params.push(termo, termo, termo);
    }

    if (!page || page < 1) {
        db.all('SELECT * FROM clientes' + where + ' ORDER BY nome ASC', params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
        return;
    }

    db.get('SELECT COUNT(*) AS total FROM clientes' + where, params, (errCount, rowCount) => {
        if (errCount) return res.status(500).json({ error: errCount.message });

        const total = rowCount.total || 0;
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        const paginaAtual = Math.min(page, totalPages);
        const offset = (paginaAtual - 1) * limit;

        db.all(
            'SELECT * FROM clientes' + where + ' ORDER BY nome ASC LIMIT ? OFFSET ?',
            [...params, limit, offset],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    clientes: rows,
                    total,
                    page: paginaAtual,
                    limit,
                    totalPages
                });
            }
        );
    });
});

/* ---------- SERVIÇOS ---------- */
app.post('/salvar-servico', (req, res) => {
    const { descricao, preco, tempo_estimado } = req.body;
    db.run(
        'INSERT INTO servicos (descricao, preco, tempo_estimado) VALUES (?, ?, ?)',
        [descricao, preco, tempo_estimado],
        function (err) {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get('/listar-servicos', (req, res) => {
    const page = parseInt(req.query.page, 10);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const busca = (req.query.busca || '').trim();

    let where = '';
    const params = [];

    if (busca) {
        where = ' WHERE descricao LIKE ?';
        params.push('%' + busca + '%');
    }

    if (!page || page < 1) {
        db.all('SELECT * FROM servicos' + where + ' ORDER BY descricao ASC', params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
        return;
    }

    db.get('SELECT COUNT(*) AS total FROM servicos' + where, params, (errCount, rowCount) => {
        if (errCount) return res.status(500).json({ error: errCount.message });

        const total = rowCount.total || 0;
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        const paginaAtual = Math.min(page, totalPages);
        const offset = (paginaAtual - 1) * limit;

        db.all(
            'SELECT * FROM servicos' + where + ' ORDER BY descricao ASC LIMIT ? OFFSET ?',
            [...params, limit, offset],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                    servicos: rows,
                    total,
                    page: paginaAtual,
                    limit,
                    totalPages
                });
            }
        );
    });
});

/* ---------- AGENDAMENTOS ---------- */
app.post('/salvar-agendamento', (req, res) => {
    const { cliente_id, data, responsavel, total, tempo_total, servicos } = req.body;

    if (!cliente_id || !data || !responsavel) {
        return res.status(400).json({ success: false, error: 'Cliente, data e responsável são obrigatórios.' });
    }
    if (!servicos || !Array.isArray(servicos) || servicos.length === 0) {
        return res.status(400).json({ success: false, error: 'Selecione ao menos um serviço.' });
    }

    const sqlMestre = `
        INSERT INTO agendamentos (cliente_id, data, responsavel, total, tempo_total)
        VALUES (?, ?, ?, ?, ?)`;

    db.run(sqlMestre, [cliente_id, data, responsavel, total || 0, tempo_total || 0], function (err) {
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
    });
});

app.get('/listar-agendamentos', (req, res) => {
    const sql = `
        SELECT a.id, a.data, a.responsavel, a.total, a.tempo_total,
               c.nome AS nome_cliente, c.telefone AS telefone_cliente
        FROM agendamentos a
        INNER JOIN clientes c ON a.cliente_id = c.id
        ORDER BY a.data DESC, a.id DESC`;

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

app.listen(3000, () => {
    console.log('====================================================');
    console.log('🚀 AGROLEITE rodando com sucesso na porta 3000!');
    console.log('📂 Banco de Dados: siscristovao.db');
    console.log('====================================================');
});
