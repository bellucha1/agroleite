/* ==========================================================================
   LOGIN AGROLEITE
   ========================================================================== */

// Página inicial = Login
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>AGROLEITE - Login</title>

<style>
body{
    margin:0;
    font-family:Arial,sans-serif;
    background:linear-gradient(135deg,#2E7D32,#81C784);
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
}

.container{
    background:white;
    padding:30px;
    border-radius:15px;
    width:400px;
    box-shadow:0 0 20px rgba(0,0,0,.2);
    text-align:center;
}

h1{
    color:#2E7D32;
}

button{
    width:100%;
    padding:12px;
    margin-top:10px;
    border:none;
    border-radius:8px;
    cursor:pointer;
    font-size:16px;
}

.cliente{
    background:#4CAF50;
    color:white;
}

.funcionario{
    background:#1565C0;
    color:white;
}

input{
    width:100%;
    padding:10px;
    margin-top:10px;
    border:1px solid #ccc;
    border-radius:6px;
}

#funcionario{
    display:none;
}

.erro{
    color:red;
    margin-top:10px;
}
</style>
</head>

<body>

<div class="container">

<h1>AGROLEITE</h1>

<div id="inicio">

<button class="cliente" onclick="souCliente()">
SOU CLIENTE
</button>

<button class="funcionario" onclick="mostrarFuncionario()">
SOU FUNCIONÁRIO
</button>

</div>

<div id="funcionario">

<input id="chave" placeholder="Chave de acesso">

<input id="senha" type="password" placeholder="Senha">

<input id="codigo" placeholder="Código">

<input id="frase" placeholder="Frase de segurança">

<button class="funcionario" onclick="loginFuncionario()">
PROSSEGUIR
</button>

<button onclick="voltar()">
VOLTAR
</button>

<div class="erro" id="erro"></div>

</div>

</div>

<script>

function mostrarFuncionario(){
    document.getElementById("inicio").style.display="none";
    document.getElementById("funcionario").style.display="block";
}

function voltar(){
    document.getElementById("inicio").style.display="block";
    document.getElementById("funcionario").style.display="none";
}

async function souCliente(){

    const resposta = await fetch('/login',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            tipo:'cliente'
        })
    });

    const dados = await resposta.json();

    if(dados.success){
        window.location.href = dados.redirect;
    }

}

async function loginFuncionario(){

    const resposta = await fetch('/login',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            tipo:'funcionario',
            chave:document.getElementById('chave').value,
            senha:document.getElementById('senha').value,
            codigo:document.getElementById('codigo').value,
            frase:document.getElementById('frase').value
        })
    });

    const dados = await resposta.json();

    if(dados.success){

        window.location.href = dados.redirect;

    }else{

        document.getElementById('erro').innerText =
        dados.message;

    }

}

</script>

</body>
</html>
`);
});

// Autenticação
app.post('/login', (req,res)=>{

    const {
        tipo,
        chave,
        senha,
        codigo,
        frase
    } = req.body;

    // Cliente entra direto
    if(tipo === 'cliente'){

        return res.json({
            success:true,
            redirect:'/index.html'
        });

    }

    // Funcionário
    if(tipo === 'funcionario'){

        if(
            chave === 'AGROLEITE2025' &&
            senha === 'FUNC123' &&
            codigo === '0000' &&
            frase &&
            frase.trim().toUpperCase() ===
            'VACA JERSEY TEM O LEITE MAIS GORDO'
        ){

            return res.json({
                success:true,
                redirect:'/index.html'
            });

        }

        return res.status(401).json({
            success:false,
            message:'Dados incorretos.'
        });

    }

    res.status(400).json({
        success:false
    });

});
