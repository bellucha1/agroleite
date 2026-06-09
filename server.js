// ===============================
// AGROLEITE - Sistema de Acesso
// ===============================

// Cliente entra direto
function cliente() {
    window.location.href = "index.html";
}

// Mostra área do funcionário
function mostrarFuncionario() {
    document.getElementById("inicio").style.display = "none";
    document.getElementById("areaFuncionario").style.display = "block";

    // Limpa mensagens anteriores
    document.getElementById("erro").innerText = "";
}

// Volta para tela inicial
function voltar() {
    document.getElementById("inicio").style.display = "block";
    document.getElementById("areaFuncionario").style.display = "none";

    // Limpa os campos
    document.getElementById("chave").value = "";
    document.getElementById("senha").value = "";
    document.getElementById("codigo").value = "";
    document.getElementById("frase").value = "";
    document.getElementById("erro").innerText = "";
}

// Validação do funcionário
function validarFuncionario() {

    const chave = document
        .getElementById("chave")
        .value
        .trim();

    const senha = document
        .getElementById("senha")
        .value
        .trim();

    const codigo = document
        .getElementById("codigo")
        .value
        .trim();

    const frase = document
        .getElementById("frase")
        .value
        .trim()
        .toUpperCase();

    // ===============================
    // Credenciais
    // ===============================

    const chaveCorreta = "AGROLEITE2025";
    const senhaCorreta = "FUNC123";
    const codigoCorreto = "0000";
    const fraseCorreta = "VACA JERSEY TEM O LEITE MAIS GORDO";

    // ===============================
    // Verificação
    // ===============================

    if (chave !== chaveCorreta) {
        document.getElementById("erro").innerText =
            "Chave de acesso incorreta.";
        return;
    }

    if (senha !== senhaCorreta) {
        document.getElementById("erro").innerText =
            "Senha incorreta.";
        return;
    }

    if (codigo !== codigoCorreto) {
        document.getElementById("erro").innerText =
            "Código incorreto.";
        return;
    }

    if (frase !== fraseCorreta) {
        document.getElementById("erro").innerText =
            "Frase de segurança incorreta.";
        return;
    }

    // ===============================
    // Acesso liberado
    // ===============================

    alert("Acesso autorizado!");

    window.location.href = "index.html";
}

// Permite pressionar ENTER
document.addEventListener("keydown", function(event) {

    if (
        event.key === "Enter" &&
        document.getElementById("areaFuncionario").style.display === "block"
    ) {
        validarFuncionario();
    }

});
