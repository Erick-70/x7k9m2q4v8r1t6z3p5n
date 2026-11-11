const botoesAbas = document.querySelectorAll(".aba");
const conteudos = document.querySelectorAll(".conteudo-aba");

botoesAbas.forEach(botao => {
    botao.addEventListener("click", () => {
        const abaSelecionada = botao.dataset.aba;

        // Remove a classe ativa de todas as abas
        botoesAbas.forEach(item => item.classList.remove("ativa"));
        conteudos.forEach(item => item.classList.remove("ativo"));

        // Ativa a aba selecionada
        botao.classList.add("ativa");
        document.getElementById(abaSelecionada).classList.add("ativo");

        // Executa a função correspondente
        switch (abaSelecionada) {

            case "principal":
                inicializarDashboard();
                break;

            case "fluxo-caixa":
                renderizarFluxoCaixa();
                break;

            case "analises":
                renderizarAnalises();
                break;

            case "dre-balanco":
                renderizarDREBalanço();
                break;

            case "boletins":
                renderizarBoletins();
                break;

            case "rankings":
                renderizarRanking();
                break;
        }
    });
});

////// ADICIONAR MOVIMENTACAO


/* ==========================================
   CONFIGURAÇÕES
========================================== */

const CHAVE_MOVIMENTACOES = "movimentacoes_financeiras";

const TIPOS_MOVIMENTACAO = [
    "DESPESAS",
    "RECEITAS",
    "CARTÕES",
    "RECEITAS NÃO-OPER.",
    "INVESTIMENTOS",
    "SAÍDAS NÃO-OPER."
];

let movimentacoes = [];


/* ==========================================
   ARMAZENAMENTO
========================================== */

function carregarMovimentacoes() {
    try {
        movimentacoes = JSON.parse(
            localStorage.getItem(CHAVE_MOVIMENTACOES)
        ) || [];
    } catch {
        movimentacoes = [];
    }

    renderizarMovimentacoes();
    dadosFinanceiros = gerarDicionarioFinanceiro();
}

function salvarMovimentacoes() {
    localStorage.setItem(
        CHAVE_MOVIMENTACOES,
        JSON.stringify(movimentacoes)
    );

    document.getElementById("statusMovimentacoes").textContent = "Dados salvos automaticamente.";
    dadosFinanceiros = gerarDicionarioFinanceiro();
}


/* ==========================================
   FORMATAÇÃO
========================================== */

function formatarValor(valor) {
    const numero = Number(valor) || 0;

    return (numero < 0 ? "-R$ " : "R$ ") +
        Math.abs(numero).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

function converterValor(valor) {

    if (typeof valor === "number") {
        return valor;
    }

    if (!valor) return 0;

    let texto = String(valor)
        .replace(/R\$/gi, "")
        .replace(/\s/g, "")
        .trim();

    let negativo = texto.startsWith("-");

    texto = texto.replace(/-/g, "");

    if (texto.includes(",") && texto.includes(".")) {

        // Formato brasileiro: 1.250,15
        texto = texto.replace(/\./g, "").replace(",", ".");

    } else if (texto.includes(",")) {

        // Formato brasileiro: 30,50
        texto = texto.replace(",", ".");

    } else if (texto.includes(".")) {

        // Formato decimal: 30.50
        // Se houver três dígitos após o ponto, considera separador de milhar.
        const partes = texto.split(".");

        if (partes.length > 1 && partes[partes.length - 1].length === 3) {
            texto = texto.replace(/\./g, "");
        }
    }

    const numero = Number(texto);

    if (!Number.isFinite(numero)) return 0;

    return negativo ? -numero : numero;
}

function formatarDataExcel(data) {
    if (!data) return "";

    const partes = String(data).split("-");

    if (partes.length !== 3) return "";

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function dataAtual() {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function escaparHTML(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


/* ==========================================
   RENDERIZAÇÃO DA TABELA
========================================== */


function renderizarMovimentacoes() {
    const tbody = document.getElementById("corpoMovimentacoes");
    const filtro = document.getElementById("filtroMovimentacoes");

    tbody.innerHTML = "";

    // Separa os termos por vírgula
    const termos = filtro
        ? filtro.value
            .split(",")
            .map(t => normalizarTextoMovimentacao(t.trim()))
            .filter(Boolean)
        : [];

    // Cria uma linha de pesquisa com todos os dados
    const movimentacoesFiltradas = movimentacoes
        .map((mov, index) => {

            // Formata a data para DD/MM/AAAA
            let dataFormatada = mov.data || "";

            if (/^\d{4}-\d{2}-\d{2}$/.test(dataFormatada)) {
                dataFormatada = dataFormatada.split("-").reverse().join("/");
            }

            const linhaPesquisa = normalizarTextoMovimentacao([
                mov.descricao,
                formatarValor(mov.valor),
                dataFormatada,
                mov.tipo
            ].join(" - "));

            return {
                mov,
                index,
                linhaPesquisa
            };
        })
        .filter(({ mov, linhaPesquisa }) => {

            return termos.length === 0 ||
                termos.every(termo => {

                    // Verifica se o termo corresponde exatamente a um tipo
                    const tipoEncontrado = TIPOS_MOVIMENTACAO.find(
                        tipo => normalizarTextoMovimentacao(tipo) === termo
                    );

                    if (tipoEncontrado) {
                        return normalizarTextoMovimentacao(mov.tipo) === termo;
                    }

                    // Pesquisa nas demais informações da movimentação
                    return linhaPesquisa.includes(termo);
                });
        });

    // Renderiza as movimentações encontradas
    movimentacoesFiltradas.forEach(({ mov, index }) => {

        const tr = document.createElement("tr");

        const valor = Number(mov.valor) || 0;

        const classeValor = valor < 0
            ? "valor-negativo"
            : "valor-positivo";

        tr.innerHTML = `
            <td>
                <input
                    type="text"
                    value="${escaparHTML(mov.descricao)}"
                    placeholder="Descrição da movimentação"
                    data-index="${index}"
                    data-campo="descricao"
                >
            </td>

            <td>
                <input
                    type="text"
                    value="${formatarValor(mov.valor)}"
                    class="${classeValor}"
                    data-index="${index}"
                    data-campo="valor"
                    inputmode="decimal"
                >
            </td>

            <td>
                <input
                    type="date"
                    value="${escaparHTML(mov.data)}"
                    data-index="${index}"
                    data-campo="data"
                >
            </td>

            <td>
                <select
                    data-index="${index}"
                    data-campo="tipo"
                >
                    ${TIPOS_MOVIMENTACAO.map(tipo => `
                        <option
                            value="${escaparHTML(tipo)}"
                            ${mov.tipo === tipo ? "selected" : ""}
                        >
                            ${tipo}
                        </option>
                    `).join("")}
                </select>
            </td>

            <td>
                <button
                    class="btn-excluir-mov"
                    title="Excluir movimentação"
                    onclick="excluirMovimentacao(${index})"
                >
                    ×
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Atualiza o total de movimentações cadastradas
    document.getElementById("totalMovimentacoes").textContent =
        movimentacoes.length;

    // Atualiza o contador do filtro
    const contador = document.getElementById(
        "contadorFiltroMovimentacoes"
    );

    if (contador) {
        contador.textContent = termos.length > 0
            ? `${movimentacoesFiltradas.length} de ${movimentacoes.length} movimentações encontradas`
            : `${movimentacoes.length} movimentações`;
    }

    // Atualiza o painel de resultados, caso exista
    const resultado = document.getElementById(
        "resultadoFiltroMovimentacoes"
    );

    const soma = document.getElementById(
        "somaFiltroMovimentacoes"
    );

    if (resultado) {
        resultado.hidden = termos.length === 0;
    }

    if (soma) {
        const totalFiltrado = movimentacoesFiltradas.reduce(
            (total, item) => total + (Number(item.mov.valor) || 0),
            0
        );

        soma.textContent = `Total: ${formatarValor(totalFiltrado)}`;
    }

    // Mensagem quando não houver resultados
    if (movimentacoesFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:25px; color:var(--texto-secundario);">
                    Nenhuma movimentação encontrada.
                </td>
            </tr>
        `;
    }
}


function normalizarTextoMovimentacao(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function limparFiltroMovimentacoes() {
    document.getElementById("filtroMovimentacoes").value = "";
    renderizarMovimentacoes();
}


/* ==========================================
   EDIÇÃO DOS REGISTROS
========================================== */

document.getElementById("corpoMovimentacoes")
    .addEventListener("change", evento => {

        const campo = evento.target;

        if (!campo.dataset.campo) return;

        const index = Number(campo.dataset.index);
        const propriedade = campo.dataset.campo;

        if (!movimentacoes[index]) return;

        if (propriedade === "valor") {

            movimentacoes[index].valor = ajustarSinalMovimentacao(
                converterValor(campo.value),
                movimentacoes[index].tipo
            );

        } else {

            movimentacoes[index][propriedade] = campo.value;

            if (propriedade === "tipo") {
                movimentacoes[index].valor = ajustarSinalMovimentacao(
                    movimentacoes[index].valor,
                    campo.value
                );
            }
        }

        salvarMovimentacoes();
        renderizarMovimentacoes();
    });

document.getElementById("corpoMovimentacoes")
    .addEventListener("change", evento => {

        const campo = evento.target;

        if (!campo.dataset.campo) return;

        const index = Number(campo.dataset.index);
        const propriedade = campo.dataset.campo;

        if (!movimentacoes[index]) return;

        movimentacoes[index][propriedade] =
            propriedade === "valor"
                ? converterValor(campo.value)
                : campo.value;

        salvarMovimentacoes();
    });


/* ==========================================
   ADICIONAR MOVIMENTAÇÃO
========================================== */

function adicionarMovimentacao() {

    movimentacoes.push({
        descricao: "",
        valor: 0,
        data: dataAtual(),
        tipo: "DESPESAS"
    });

    salvarMovimentacoes();
    renderizarMovimentacoes();

    const campos = document.querySelectorAll(
        '#corpoMovimentacoes input[data-campo="descricao"]'
    );

    campos[campos.length - 1]?.focus();
}


/* ==========================================
   EXCLUIR MOVIMENTAÇÃO
========================================== */

function excluirMovimentacao(index) {

    if (!movimentacoes[index]) return;

    movimentacoes.splice(index, 1);

    salvarMovimentacoes();
    renderizarMovimentacoes();
}


/* ==========================================
   EXPORTAR PARA EXCEL
========================================== */

function exportarMovimentacoes() {

    if (!movimentacoes.length) {
        alert("Não existem movimentações para exportar.");
        return;
    }

    const cabecalho = [
        "Descrição",
        "Valor",
        "Data",
        "Tipo"
    ];

    const linhas = movimentacoes.map(mov => {

        let data = "";

        if (mov.data) {
            const [ano, mes, dia] = mov.data.split("-");

            data = new Date(
                Number(ano),
                Number(mes) - 1,
                Number(dia)
            );
        }

        return [
            mov.descricao,
            Number(mov.valor) || 0,
            data,
            mov.tipo
        ];
    });

    const planilha = XLSX.utils.aoa_to_sheet([
        cabecalho,
        ...linhas
    ]);

    planilha["!cols"] = [
        { wch: 45 },
        { wch: 16 },
        { wch: 16 },
        { wch: 25 }
    ];

    for (let i = 2; i <= linhas.length + 1; i++) {

        const celulaValor = planilha[`B${i}`];
        const celulaData = planilha[`C${i}`];

        if (celulaValor) {
            celulaValor.z = 'R$ #,##0.00;[Red]-R$ #,##0.00';
        }

        if (celulaData) {
            celulaData.z = "dd/mm/yyyy";
        }
    }

    const arquivo = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        arquivo,
        planilha,
        "Movimentações"
    );

    XLSX.writeFile(
        arquivo,
        "movimentacoes_financeiras.xlsx"
    );
}


/* ==========================================
   CONVERTER DATA DA PLANILHA
========================================== */

function converterDataExcel(valor) {

    if (!valor) return "";

    // Data reconhecida pelo Excel
    if (valor instanceof Date && !isNaN(valor)) {
        const ano = valor.getFullYear();
        const mes = String(valor.getMonth() + 1).padStart(2, "0");
        const dia = String(valor.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    // Número serial do Excel
    if (typeof valor === "number") {
        const data = XLSX.SSF.parse_date_code(valor);

        if (!data) return "";

        return [
            data.y,
            String(data.m).padStart(2, "0"),
            String(data.d).padStart(2, "0")
        ].join("-");
    }

    // Data no formato DD/MM/AAAA
    const texto = String(valor).trim();

    const brasileira = texto.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

    if (brasileira) {
        return `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`;
    }

    // Data no formato AAAA-MM-DD
    const iso = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (iso) return texto;

    return "";
}


/* ==========================================
   IMPORTAR EXCEL
========================================== */

async function importarMovimentacoes(evento) {

    const arquivo = evento.target.files[0];

    if (!arquivo) return;

    try {

        const dados = await arquivo.arrayBuffer();

        const workbook = XLSX.read(dados, {
            type: "array",
            cellDates: true
        });

        const primeiraAba = workbook.Sheets[
            workbook.SheetNames[0]
        ];

        const linhas = XLSX.utils.sheet_to_json(
            primeiraAba,
            {
                header: 1,
                defval: "",
                raw: true
            }
        );

        if (linhas.length < 2) {
            alert("A planilha não possui registros.");
            return;
        }

        const cabecalho = linhas[0].map(item =>
            String(item).trim().toLowerCase()
        );

        const colunas = {
            descricao: cabecalho.indexOf("descrição") !== -1
                ? cabecalho.indexOf("descrição")
                : cabecalho.indexOf("descricao"),

            valor: cabecalho.indexOf("valor"),

            data: cabecalho.indexOf("data"),

            tipo: cabecalho.indexOf("tipo")
        };

        if (Object.values(colunas).some(indice => indice === -1)) {
            alert(
                "A planilha precisa conter as quatro colunas: Descrição, Valor, Data e Tipo."
            );
            return;
        }

        const novosRegistros = [];

        linhas.slice(1).forEach(linha => {

            const descricao = String(
                linha[colunas.descricao] ?? ""
            ).trim();

            const valor = converterValor(
                linha[colunas.valor]
            );

            const data = converterDataExcel(
                linha[colunas.data]
            );

            const tipo = String(
                linha[colunas.tipo] ?? ""
            ).trim().toUpperCase();

            if (
                !descricao ||
                !data ||
                !TIPOS_MOVIMENTACAO.includes(tipo)
            ) {
                return;
            }

            novosRegistros.push({
                descricao,
                valor,
                data,
                tipo
            });
        });

        if (!novosRegistros.length) {
            alert("Nenhuma movimentação válida foi encontrada.");
            return;
        }

        movimentacoes = novosRegistros;

        salvarMovimentacoes();
        renderizarMovimentacoes();

        alert(
            `${novosRegistros.length} movimentação(ões) importada(s) com sucesso!`
        );

    } catch (erro) {

        console.error("Erro ao importar Excel:", erro);

        alert("Não foi possível importar a planilha.");

    } finally {

        evento.target.value = "";

    }
}

function ajustarSinalMovimentacao(valor, tipo) {

    const tiposPositivos = [
        "RECEITAS",
        "RECEITAS NÃO-OPER."
    ];

    const numero = Math.abs(Number(valor) || 0);

    return tiposPositivos.includes(tipo)
        ? numero
        : -numero;
}


/* ==========================================
   Dados
========================================== */
var dadosFinanceiros = gerarDicionarioFinanceiro();

function gerarDicionarioFinanceiro() {

    const resultado = {};

    movimentacoes.forEach(mov => {

        if (!mov.data) return;

        const [ano, mes, dia] = mov.data.split("-");

        const nomesMeses = [
            "Janeiro", "Fevereiro", "Março",
            "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro",
            "Outubro", "Novembro", "Dezembro"
        ];

        const nomeMes = nomesMeses[Number(mes) - 1];

        const chave = `${nomeMes}-${ano}`;

        // Cria o mês caso ainda não exista
        if (!resultado[chave]) {

            resultado[chave] = {
                "Totais": {
                    "DESPESAS": 0,
                    "RECEITAS": 0,
                    "CARTÕES": 0,
                    "RECEITAS NÃO-OPER.": 0,
                    "INVESTIMENTOS": 0,
                    "SAÍDAS NÃO-OPER.": 0
                },

                "movimentações": {}
            };
        }

        const grupo = resultado[chave];

        const valor = Number(mov.valor) || 0;

        // Soma o valor ao tipo correspondente
        grupo.Totais[mov.tipo] += valor;

        // Adiciona a movimentação
        const numero = Object.keys(
            grupo["movimentações"]
        ).length + 1;

        grupo["movimentações"][numero] = {
            "Descrição": mov.descricao,
            "Valor": valor,
            "Data": `${dia}/${mes}/${ano}`,
            "Tipo": mov.tipo
        };

    });

    return resultado;
}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

carregarMovimentacoes();



/* ==========================================
   FLUXO DE CAIXA
========================================== */

const fluxoMeses = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro",
    "Outubro", "Novembro", "Dezembro"
];

const fluxoTipos = [
    "DESPESAS",
    "RECEITAS",
    "CARTÕES",
    "RECEITAS NÃO-OPER.",
    "INVESTIMENTOS",
    "SAÍDAS NÃO-OPER."
];

let fluxoMostrarDetalhes = true;


/* ==========================================
   ACESSO AOS DADOS
========================================== */

function obterDadosFluxo() {

    if (typeof movimentacoes === "undefined") {
        return [];
    }

    return movimentacoes;
}


/* ==========================================
   FORMATAÇÃO
========================================== */

function formatarValorFluxo(valor) {

    const numero = Number(valor) || 0;

    if (numero === 0) return "R$ –";

    const formatado = Math.abs(numero).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return numero < 0
        ? `-R$ ${formatado}`
        : `R$ ${formatado}`;
}


function formatarPercentualFluxo(valor) {

    return (Number(valor) || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + "%";
}


function escaparFluxo(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


function somarFluxo(valores) {

    const total = valores.reduce(
        (soma, valor) => soma + (Number(valor) || 0),
        0
    );

    return Math.round((total + Number.EPSILON) * 100) / 100;
}


/* ==========================================
   CONVERTER DATA
========================================== */

function obterMesAnoFluxo(data) {

    if (!data) return null;

    const partes = String(data).split("-");

    if (partes.length !== 3) return null;

    return {
        ano: Number(partes[0]),
        mes: Number(partes[1]),
        dia: Number(partes[2])
    };
}


/* ==========================================
   ORGANIZAR MOVIMENTAÇÕES POR MÊS
========================================== */

function organizarDadosFluxo(anoSelecionado) {

    const dados = obterDadosFluxo();

    const resultado = {};

    fluxoMeses.forEach((mes, indice) => {

        resultado[indice + 1] = {
            categorias: {},
            detalhes: {}
        };

        fluxoTipos.forEach(tipo => {

            resultado[indice + 1].categorias[tipo] = 0;
            resultado[indice + 1].detalhes[tipo] = {};

        });

    });

    dados.forEach(mov => {

        const data = obterMesAnoFluxo(mov.data);

        if (!data || data.ano !== Number(anoSelecionado)) {
            return;
        }

        const tipo = mov.tipo;

        if (!fluxoTipos.includes(tipo)) return;

        const mes = data.mes;

        const valor = Number(mov.valor) || 0;

        const descricao = String(mov.descricao || "").trim();

        if (!descricao || mes < 1 || mes > 12) return;

        const grupo = resultado[mes];

        grupo.categorias[tipo] += valor;

        if (!grupo.detalhes[tipo][descricao]) {
            grupo.detalhes[tipo][descricao] = 0;
        }

        grupo.detalhes[tipo][descricao] += valor;

    });

    return resultado;
}


/* ==========================================
   CALCULAR RESULTADOS MENSAIS
========================================== */

function calcularResultadosFluxo(categorias) {

    const receitas = categorias["RECEITAS"];

    const despesas = categorias["DESPESAS"];

    const cartoes = categorias["CARTÕES"];

    const investimentos = categorias["INVESTIMENTOS"];

    const gastosNaoOperacionais =
        categorias["SAÍDAS NÃO-OPER."];

    const receitasNaoOperacionais =
        categorias["RECEITAS NÃO-OPER."];

    const margemContribuicao = receitas + despesas;

    const lucroAntesInvestimentos =
        margemContribuicao + cartoes;

    const lucroAposInvestimentos =
        lucroAntesInvestimentos + investimentos;

    const lucroLiquido =
        lucroAposInvestimentos +
        gastosNaoOperacionais +
        receitasNaoOperacionais;

    return {
        "RECEITAS": receitas,

        "DESPESAS": despesas,

        "MARGEM DE CONTRIBUIÇÃO":
            margemContribuicao,

        "CARTÕES": cartoes,

        "LUCRO OPERAC. (antes dos inv.)":
            lucroAntesInvestimentos,

        "INVESTIMENTOS": investimentos,

        "LUCRO OPERAC. (pós inv.)":
            lucroAposInvestimentos,

        "GASTOS NÃO-OPERACIONAIS":
            gastosNaoOperacionais,

        "RECEITAS NÃO-OPERACIONAIS":
            receitasNaoOperacionais,

        "LUCRO LÍQUIDO":
            lucroLiquido
    };
}


/* ==========================================
   DEFINIÇÃO DAS LINHAS
========================================== */

const estruturaFluxo = [

    {
        titulo: "RECEITAS",
        sinal: "+",
        tipo: "RECEITAS",
        categoria: true
    },

    {
        titulo: "DESPESAS",
        sinal: "-",
        tipo: "DESPESAS",
        categoria: true
    },

    {
        titulo: "MARGEM DE CONTRIBUIÇÃO",
        sinal: "=",
        resultado: true
    },

    {
        titulo: "CARTÕES",
        sinal: "-",
        tipo: "CARTÕES",
        categoria: true
    },

    {
        titulo: "LUCRO OPERAC. (antes dos inv.)",
        sinal: "=",
        resultado: true
    },

    {
        titulo: "INVESTIMENTOS",
        sinal: "-",
        tipo: "INVESTIMENTOS",
        categoria: true
    },

    {
        titulo: "LUCRO OPERAC. (pós inv.)",
        sinal: "=",
        resultado: true
    },

    {
        titulo: "GASTOS NÃO-OPERACIONAIS",
        sinal: "-",
        tipo: "SAÍDAS NÃO-OPER.",
        categoria: true
    },

    {
        titulo: "RECEITAS NÃO-OPERACIONAIS",
        sinal: "+",
        tipo: "RECEITAS NÃO-OPER.",
        categoria: true
    },

    {
        titulo: "LUCRO LÍQUIDO",
        sinal: "=",
        resultado: true,
        final: true
    }

];


/* ==========================================
   CÁLCULO DOS PERCENTUAIS
========================================== */

function percentualFluxo(valor, base) {

    if (!base) return 0;

    return (valor / base) * 100;
}


/* ==========================================
   CRIAR CÉLULAS
========================================== */

function criarCelulasFluxo(valores, percentuais, negativo = false) {

    let html = "";

    valores.forEach((valor, indice) => {

        const numeroMes = indice + 1;

        html += `
            <td data-mes="${numeroMes}">
                ${formatarValorFluxo(valor)}
            </td>

            <td data-mes="${numeroMes}">
                ${formatarPercentualFluxo(percentuais[indice])}
            </td>
        `;

        if (indice !== 11) {
            html += `
                <td class="fluxo-espacador"
                    data-mes="${numeroMes}"></td>
            `;
        }

    });

    return html;
}


/* ==========================================
   CABEÇALHO DA TABELA
========================================== */


function renderizarCabecalhoFluxo() {

    const cabecalho = document.getElementById("fluxoCabecalhoTabela");

    const trimestres = [
        "1º TRIMESTRE",
        "2º TRIMESTRE",
        "3º TRIMESTRE",
        "4º TRIMESTRE"
    ];

    let linhaTrimestres = `<tr>
        <th rowspan="2">DESCRIÇÃO</th>`;

    trimestres.forEach((nome, indice) => {

        const trimestre = indice + 1;

        linhaTrimestres += `
            <th colspan="8" data-trimestre="${trimestre}">
                ${nome}
            </th>`;

        if (indice !== 3) {
            linhaTrimestres += `
                <th class="fluxo-espacador"
                    data-separador-trimestre="true"></th>`;
        }

    });

    linhaTrimestres += `
        <th colspan="2" rowspan="2" class="fluxo-coluna-anual">
            TOTAL ANUAL
        </th>
    </tr>`;

    let linhaMeses = "<tr>";

    fluxoMeses.forEach((mes, indice) => {

        const numeroMes = indice + 1;

        linhaMeses += `
            <th colspan="2" data-mes="${numeroMes}">
                ${mes.toUpperCase()}
            </th>`;

        if (indice !== 11) {
            linhaMeses += `
                <th class="fluxo-espacador"
                    data-mes="${numeroMes}"></th>`;
        }

    });

    linhaMeses += "</tr>";

    cabecalho.innerHTML = linhaTrimestres + linhaMeses;
}


/* ==========================================
   GERAR LINHA DA TABELA
========================================== */

function gerarLinhaFluxo(
    titulo,
    valores,
    percentuais,
    classe = "",
    sinal = "",
    detalhes = false
) {

    const total = somarFluxo(valores);

    const totalPercentual = percentuais.length
        ? percentuais[12] || 0
        : 0;

    const identificacao = detalhes
        ? escaparFluxo(titulo)
        : `${sinal ? `(${sinal}) ` : ""}${escaparFluxo(titulo)}`;

    const classeValor = total < 0
        ? "fluxo-negativo"
        : "";

    let html = `
        <tr class="${classe}">

            <td title="${escaparFluxo(titulo)}">
                ${identificacao}
            </td>

            ${criarCelulasFluxo(valores, percentuais)}

            <td class="${classeValor} fluxo-coluna-anual">
                ${formatarValorFluxo(total)}
            </td>

            <td class="fluxo-percentual fluxo-coluna-anual">
                ${formatarPercentualFluxo(totalPercentual)}
            </td>

        </tr>
    `;

    return html;
}


/* ==========================================
   GERAR LINHA DE DETALHAMENTO
========================================== */

function gerarLinhaDetalheFluxo(
    descricao,
    valores,
    percentuais
) {

    return gerarLinhaFluxo(
        descricao,
        valores,
        percentuais,
        "fluxo-linha-detalhe",
        "",
        true
    );

}


/* ==========================================
   RENDERIZAR FLUXO DE CAIXA
========================================== */

function renderizarFluxoCaixa() {
    filtrarTrimestreFluxo(0);

    const seletorAno = document.getElementById("fluxoAno");

    const corpo = document.getElementById("fluxoCorpoTabela");

    if (!seletorAno || !corpo) return;

    // Monta os títulos dos trimestres e meses
    renderizarCabecalhoFluxo();

    const ano = Number(seletorAno.value);

    const dados = organizarDadosFluxo(ano);

    const categoriasMensais = {};

    const resultadosMensais = {};

    // Calcula os totais de cada mês
    fluxoMeses.forEach((mes, indice) => {

        const numeroMes = indice + 1;

        const categorias = dados[numeroMes].categorias;

        categoriasMensais[numeroMes] = categorias;

        resultadosMensais[numeroMes] =
            calcularResultadosFluxo(categorias);

    });

    let html = "";

    // Percorre a estrutura do fluxo
    estruturaFluxo.forEach(linha => {

        const valores = [];

        const percentuais = [];

        // Valores de janeiro a dezembro
        for (let mes = 1; mes <= 12; mes++) {

            const categorias = categoriasMensais[mes];

            const resultados = resultadosMensais[mes];

            let valor = 0;

            let base = categorias["RECEITAS"];

            if (linha.resultado) {

                valor = resultados[linha.titulo];

            } else {

                valor = categorias[linha.tipo];

                // Exibe as categorias sempre positivas
                valor = Math.abs(valor);

            }

            valores.push(valor);

            if (linha.resultado) {

                percentuais.push(
                    percentualFluxo(valor, base)
                );

            } else {

                percentuais.push(
                    percentualFluxo(valor, base)
                );

            }

        }

        // Total anual de receitas
        const totalReceitas = somarFluxo(
            Array.from({ length: 12 }, (_, i) =>
                categoriasMensais[i + 1]["RECEITAS"]
            )
        );

        const totalLinha = somarFluxo(valores);

        // Percentual anual
        let percentualAnual;

        if (linha.resultado) {

            percentualAnual = percentualFluxo(
                totalLinha,
                totalReceitas
            );

        } else {

            percentualAnual = percentualFluxo(
                totalLinha,
                totalReceitas
            );

        }

        percentuais.push(percentualAnual);

        let classe = "";

        if (linha.final) {

            classe = "fluxo-linha-final";

        } else if (linha.resultado) {

            classe = "fluxo-linha-resultado";

            if (
                linha.titulo.includes("LUCRO OPERAC.")
            ) {
                classe += " fluxo-linha-resultado-operacional";
            }

        } else {

            const classesCategorias = {
                "RECEITAS": "fluxo-grupo-receitas",
                "DESPESAS": "fluxo-grupo-despesas",
                "CARTÕES": "fluxo-grupo-cartoes",
                "INVESTIMENTOS": "fluxo-grupo-investimentos",
                "SAÍDAS NÃO-OPER.": "fluxo-grupo-saidas",
                "RECEITAS NÃO-OPER.": "fluxo-grupo-receitas-extra"
            };

            classe = "fluxo-linha-grupo " +
                (classesCategorias[linha.tipo] || "");
        }

        html += gerarLinhaFluxo(
            linha.titulo,
            valores,
            percentuais,
            classe,
            linha.sinal
        );

        // Detalhamento dos itens
        if (
            linha.categoria &&
            fluxoMostrarDetalhes
        ) {

            // Identifica todas as descrições do tipo no ano
            const descricoes = new Set();

            for (let mes = 1; mes <= 12; mes++) {

                Object.keys(
                    dados[mes].detalhes[linha.tipo]
                ).forEach(descricao => {
                    descricoes.add(descricao);
                });

            }

            descricoes.forEach(descricao => {

                const valoresDetalhe = [];

                const percentuaisDetalhe = [];

                for (let mes = 1; mes <= 12; mes++) {

                    const valor = Math.abs(
                        dados[mes].detalhes[linha.tipo][descricao] || 0
                    );

                    const totalCategoria = Math.abs(
                        categoriasMensais[mes][linha.tipo]
                    );

                    valoresDetalhe.push(valor);

                    percentuaisDetalhe.push(
                        percentualFluxo(valor, totalCategoria)
                    );

                }

                const totalDetalhe = somarFluxo(
                    valoresDetalhe
                );

                const totalCategoriaAnual = Math.abs(
                    somarFluxo(
                        Array.from({ length: 12 }, (_, i) =>
                            categoriasMensais[i + 1][linha.tipo]
                        )
                    )
                );

                percentuaisDetalhe.push(
                    percentualFluxo(
                        totalDetalhe,
                        totalCategoriaAnual
                    )
                );

                html += gerarLinhaDetalheFluxo(
                    descricao,
                    valoresDetalhe,
                    percentuaisDetalhe
                );

            });

        }

    });

    corpo.innerHTML = html;

    document.getElementById("fluxoStatus").textContent =
        `Fluxo de caixa de ${ano} atualizado.`;
}


/* ==========================================
   ALTERNAR DETALHES
========================================== */

function alternarDetalhesFluxo() {
    let __ = trimestreFluxo;

    fluxoMostrarDetalhes = !fluxoMostrarDetalhes;

    const botao = document.getElementById(
        "fluxoAlternarDetalhes"
    );

    botao.textContent = fluxoMostrarDetalhes
        ? "Ocultar detalhes"
        : "Mostrar detalhes";

    renderizarFluxoCaixa();
    filtrarTrimestreFluxo(__);
}


/* ==========================================
   CARREGAR ANOS DISPONÍVEIS
========================================== */

function carregarAnosFluxo() {

    const seletor = document.getElementById("fluxoAno");

    if (!seletor) return;

    const dados = obterDadosFluxo();

    const anos = new Set();

    dados.forEach(mov => {

        const data = obterMesAnoFluxo(mov.data);

        if (data && data.ano) {
            anos.add(data.ano);
        }

    });

    // Inclui o ano atual mesmo sem movimentações
    anos.add(new Date().getFullYear());

    const anoAnterior = Number(seletor.value);

    const listaAnos = Array.from(anos).sort(
        (a, b) => b - a
    );

    seletor.innerHTML = listaAnos.map(ano => `
        <option value="${ano}">${ano}</option>
    `).join("");

    // Mantém o ano selecionado quando atualizar
    if (anos.has(anoAnterior)) {

        seletor.value = anoAnterior;

    } else {

        seletor.value = new Date().getFullYear();

    }

    renderizarFluxoCaixa();
}

let trimestreFluxo = 0;
function filtrarTrimestreFluxo(trimestre) {

    trimestreFluxo = trimestre;

    const tabela = document.getElementById("fluxoTabela");

    if (!tabela) return;

    // Atualiza os botões
    document.querySelectorAll(".fluxo-btn-trimestre").forEach(botao => {

        botao.classList.remove("ativo");

        if (
            (trimestre === 0 && botao.textContent.trim() === "Anual") ||
            botao.textContent.trim() === `${trimestre}º Trimestre`
        ) {
            botao.classList.add("ativo");
        }

    });

    // Define os meses que devem permanecer visíveis
    const primeiroMes = trimestre === 0
        ? 1
        : (trimestre - 1) * 3 + 1;

    const ultimoMes = trimestre === 0
        ? 12
        : primeiroMes + 2;

    // Oculta ou mostra as colunas dos meses
    tabela.querySelectorAll("[data-mes]").forEach(elemento => {

        const mes = Number(elemento.dataset.mes);

        elemento.hidden = mes < primeiroMes || mes > ultimoMes;

    });

    // Oculta ou mostra o TOTAL ANUAL
    tabela.querySelectorAll(".fluxo-coluna-anual").forEach(elemento => {

        elemento.hidden = trimestre !== 0;

    });

    // Oculta ou mostra os títulos dos trimestres
    tabela.querySelectorAll("[data-trimestre]").forEach(elemento => {

        const numero = Number(elemento.dataset.trimestre);

        elemento.hidden = trimestre !== 0 && numero !== trimestre;

    });

    // Oculta os separadores entre trimestres no modo individual
    tabela.querySelectorAll("[data-separador-trimestre]").forEach(elemento => {

        elemento.hidden = trimestre !== 0;

    });

}

/* ==========================================
   EVENTOS
========================================== */

document.getElementById("fluxoAno").addEventListener("change", renderizarFluxoCaixa);



// ==========================================
// ANÁLISES ESTRATÉGICAS
// ==========================================

let analisesGraficos = {};

const analisesMeses = [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO"
];

const analisesMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const analisesPercentual = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});


// ==========================================
// FORMATAÇÃO
// ==========================================

function formatarValorAnalises(valor) {

    return analisesMoeda.format(valor || 0);
}


function formatarPercentualAnalises(valor, base) {

    if (!base) return "—";

    return analisesPercentual.format((valor / base) * 100) + "%";
}


function escaparAnalises(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}


function converterValorAnalises(valor) {

    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
    }

    let texto = String(valor ?? "").trim();

    if (!texto) return 0;

    texto = texto
        .replace(/\s/g, "")
        .replace(/R\$/gi, "");

    const negativo = texto.includes("-");

    texto = texto.replace(/[^\d.,]/g, "");

    if (texto.includes(",")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    }

    const numero = Number(texto);

    if (!Number.isFinite(numero)) return 0;

    return negativo ? -Math.abs(numero) : numero;
}


// ==========================================
// IDENTIFICAÇÃO DA DATA
// ==========================================

function obterDataAnalises(data) {

    if (!data) return null;

    // Formato DD/MM/AAAA
    const brasileira = String(data).match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (brasileira) {

        const dia = Number(brasileira[1]);
        const mes = Number(brasileira[2]);
        const ano = Number(brasileira[3]);

        if (
            mes < 1 || mes > 12 ||
            dia < 1 || dia > 31
        ) {
            return null;
        }

        return {
            ano,
            mes
        };
    }

    // Formato AAAA-MM-DD
    const iso = String(data).match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

    if (iso) {

        const ano = Number(iso[1]);
        const mes = Number(iso[2]);

        if (mes < 1 || mes > 12) return null;

        return {
            ano,
            mes
        };
    }

    // Outros formatos de data reconhecidos pelo JavaScript
    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return null;
    }

    return {
        ano: dataConvertida.getFullYear(),
        mes: dataConvertida.getMonth() + 1
    };
}


// ==========================================
// IDENTIFICAÇÃO DOS TIPOS
// ==========================================

function normalizarTipoAnalises(tipo) {

    return String(tipo ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " ");
}


function identificarTipoAnalises(tipo) {

    const normalizado = normalizarTipoAnalises(tipo);

    if (normalizado === "RECEITAS") {
        return "receitas";
    }

    if (normalizado === "DESPESAS") {
        return "despesas";
    }

    if (normalizado === "CARTOES") {
        return "cartoes";
    }

    if (normalizado === "INVESTIMENTOS") {
        return "investimentos";
    }

    if (
        normalizado === "RECEITAS NAO-OPER." ||
        normalizado === "RECEITAS NAO OPER." ||
        normalizado === "RECEITAS NAO OPERACIONAIS"
    ) {
        return "receitasNaoOperacionais";
    }

    if (
        normalizado === "SAIDAS NAO-OPER." ||
        normalizado === "SAIDAS NAO OPER." ||
        normalizado === "SAIDAS NAO OPERACIONAIS" ||
        normalizado === "GASTOS NAO-OPERACIONAIS"
    ) {
        return "gastosNaoOperacionais";
    }

    return null;
}


// ==========================================
// ORGANIZAÇÃO DOS DADOS
// ==========================================

function organizarDadosAnalises() {

    const dados = typeof movimentacoes !== "undefined"
        ? movimentacoes
        : [];

    const anos = {};

    dados.forEach(movimentacao => {

        const data = obterDataAnalises(movimentacao.data);

        if (!data) return;

        const tipo = identificarTipoAnalises(movimentacao.tipo);

        if (!tipo) return;

        const valor = Math.abs(
            converterValorAnalises(movimentacao.valor)
        );

        if (!anos[data.ano]) {

            anos[data.ano] = Array.from(
                { length: 12 },
                () => ({
                    receitas: 0,
                    despesas: 0,
                    cartoes: 0,
                    investimentos: 0,
                    receitasNaoOperacionais: 0,
                    gastosNaoOperacionais: 0
                })
            );
        }

        anos[data.ano][data.mes - 1][tipo] += valor;
    });

    return anos;
}


// ==========================================
// CÁLCULO DOS RESULTADOS
// ==========================================

function calcularResultadosAnalises(meses) {

    const resultados = meses.map(mes => {

        const margem =
            mes.receitas - mes.despesas;

        const lucroAntesInvestimentos =
            margem - mes.cartoes;

        const lucroAposInvestimentos =
            lucroAntesInvestimentos - mes.investimentos;

        const lucroLiquido =
            lucroAposInvestimentos +
            mes.receitasNaoOperacionais -
            mes.gastosNaoOperacionais;

        return {
            ...mes,
            margem,
            lucroAntesInvestimentos,
            lucroAposInvestimentos,
            lucroLiquido
        };
    });

    const total = {};

    const campos = [
        "receitas",
        "despesas",
        "cartoes",
        "investimentos",
        "receitasNaoOperacionais",
        "gastosNaoOperacionais",
        "margem",
        "lucroAntesInvestimentos",
        "lucroAposInvestimentos",
        "lucroLiquido"
    ];

    campos.forEach(campo => {
        total[campo] = resultados.reduce(
            (soma, mes) => soma + mes[campo],
            0
        );
    });

    return {
        meses: resultados,
        total
    };
}


// ==========================================
// CÉLULAS DA TABELA
// ==========================================

function criarCelulaAnalises(valor, classe = "") {

    return `
        <td class="${classe}">
            ${formatarValorAnalises(valor)}
        </td>
    `;
}


function criarCelulaPercentualAnalises(valor, receita) {

    return `
        <td class="analises-percentual">
            ${formatarPercentualAnalises(valor, receita)}
        </td>
    `;
}


function classeResultadoAnalises(valor) {

    if (valor > 0) return "analises-positivo";

    if (valor < 0) return "analises-negativo";

    return "analises-neutro";
}


// ==========================================
// CABEÇALHO DA TABELA
// ==========================================

function gerarCabecalhoAnalises() {

    return `
        <thead>

            <tr>

                <th rowspan="2">MÊS</th>

                <th rowspan="2" class="analises-grupo-receitas">
                    (+) RECEITAS
                </th>

                <th rowspan="2" class="analises-grupo-despesas">
                    (-) DESPESAS
                </th>

                <th colspan="2" class="analises-grupo-margem">
                    (=) MARGEM DE CONTRIBUIÇÃO
                </th>

                <th rowspan="2" class="analises-grupo-cartoes">
                    (-) CARTÕES
                </th>

                <th colspan="2" class="analises-grupo-lucro">
                    (=) LUCRO OPERAC. (antes dos inv.)
                </th>

                <th rowspan="2" class="analises-grupo-investimentos">
                    (-) INVESTIMENTOS
                </th>

                <th colspan="2" class="analises-grupo-lucro">
                    (=) LUCRO OPERAC. (pós inv.)
                </th>

                <th rowspan="2" class="analises-grupo-nao-operacional">
                    (+) RECEITAS NÃO-OPER.
                </th>

                <th rowspan="2" class="analises-grupo-nao-operacional">
                    (-) GASTOS NÃO-OPER.
                </th>

                <th colspan="2" class="analises-grupo-lucro">
                    (=) LUCRO LÍQUIDO
                </th>

            </tr>

            <tr>

                <th>R$</th>
                <th>%</th>

                <th>R$</th>
                <th>%</th>

                <th>R$</th>
                <th>%</th>

                <th>R$</th>
                <th>%</th>

            </tr>

        </thead>
    `;
}


// ==========================================
// GERAÇÃO DAS LINHAS
// ==========================================

function gerarLinhaAnalises(mes, nome, total = false) {

    const classeLinha = total
        ? "analises-total"
        : "";

    const classeResultado = valor =>
        `analises-resultado ${classeResultadoAnalises(valor)}`;

    return `
        <tr class="${classeLinha}">

            <td>${nome}</td>

            ${criarCelulaAnalises(mes.receitas, "analises-grupo-receitas")}

            ${criarCelulaAnalises(mes.despesas, "analises-grupo-despesas")}

            ${criarCelulaAnalises(mes.margem, classeResultado(mes.margem))}
            ${criarCelulaPercentualAnalises(mes.margem, mes.receitas)}

            ${criarCelulaAnalises(mes.cartoes, "analises-grupo-cartoes")}

            ${criarCelulaAnalises(
                mes.lucroAntesInvestimentos,
                classeResultado(mes.lucroAntesInvestimentos)
            )}

            ${criarCelulaPercentualAnalises(
                mes.lucroAntesInvestimentos,
                mes.receitas
            )}

            ${criarCelulaAnalises(
                mes.investimentos,
                "analises-grupo-investimentos"
            )}

            ${criarCelulaAnalises(
                mes.lucroAposInvestimentos,
                classeResultado(mes.lucroAposInvestimentos)
            )}

            ${criarCelulaPercentualAnalises(
                mes.lucroAposInvestimentos,
                mes.receitas
            )}

            ${criarCelulaAnalises(
                mes.receitasNaoOperacionais,
                "analises-grupo-nao-operacional"
            )}

            ${criarCelulaAnalises(
                mes.gastosNaoOperacionais,
                "analises-grupo-nao-operacional"
            )}

            ${criarCelulaAnalises(
                mes.lucroLiquido,
                classeResultado(mes.lucroLiquido)
            )}

            ${criarCelulaPercentualAnalises(
                mes.lucroLiquido,
                mes.receitas
            )}

        </tr>
    `;
}


// ==========================================
// TABELA ANUAL
// ==========================================

function gerarTabelaAnalises(ano, meses) {

    const calculo = calcularResultadosAnalises(meses);

    const linhas = calculo.meses.map((mes, indice) => {

        return gerarLinhaAnalises(
            mes,
            analisesMeses[indice]
        );

    }).join("");

    const linhaTotal = gerarLinhaAnalises(
        calculo.total,
        "ANO =",
        true
    );

    return `
        <div class="analises-ano">

            <div class="analises-ano-titulo">

                <h3>Demonstrativo financeiro de ${ano}</h3>

                <span>
                    Resultado anual: ${formatarValorAnalises(
                        calculo.total.lucroLiquido
                    )}
                </span>

            </div>

            <div class="analises-tabela-container">

                <table class="analises-tabela">

                    ${gerarCabecalhoAnalises()}

                    <tbody>

                        ${linhas}

                        ${linhaTotal}

                    </tbody>

                </table>

            </div>

            <div class="analises-graficos">

                <div class="analises-grafico-card">

                    <h4>Receitas x Despesas por mês</h4>

                    <canvas id="analisesReceitasDespesas${ano}"></canvas>

                </div>

                <div class="analises-grafico-card">

                    <h4>Evolução dos resultados</h4>

                    <canvas id="analisesResultados${ano}"></canvas>

                </div>

                <div class="analises-grafico-card analises-grafico-composicao">

                    <h4>Composição financeira do ano</h4>

                    <canvas id="analisesComposicao${ano}"></canvas>

                </div>

            </div>

        </div>
    `;
}


// ==========================================
// GRÁFICOS
// ==========================================

function destruirGraficosAnalises() {

    Object.values(analisesGraficos).forEach(grafico => {
        if (grafico) grafico.destroy();
    });

    analisesGraficos = {};
}


function opcoesGraficoAnalises() {

    return {
        responsive: true,
        maintainAspectRatio: true,

        plugins: {
            legend: {
                labels: {
                    color: "#bdbdbd",
                    usePointStyle: true,
                    padding: 18
                }
            },

            tooltip: {
                callbacks: {
                    label: contexto => {

                        return `${contexto.dataset.label}: ${
                            formatarValorAnalises(contexto.raw)
                        }`;

                    }
                }
            }
        },

        scales: {
            x: {
                ticks: {
                    color: "#999"
                },

                grid: {
                    color: "rgba(255,255,255,0.05)"
                }
            },

            y: {
                ticks: {
                    color: "#999",

                    callback: valor => {

                        return analisesMoeda.format(valor);

                    }
                },

                grid: {
                    color: "rgba(255,255,255,0.07)"
                }
            }
        }
    };
}



function criarGraficosAnalises(ano, meses) {

    if (typeof Chart === "undefined") {
        return;
    }

    const calculo = calcularResultadosAnalises(meses);

    const nomesMeses = analisesMeses.map(
        mes => mes.substring(0, 3)
    );

    const opcoes = opcoesGraficoAnalises();


    // GRÁFICO 1: TODOS OS TIPOS DE MOVIMENTAÇÃO

    const canvasReceitas = document.getElementById(
        `analisesReceitasDespesas${ano}`
    );

    analisesGraficos[`receitas${ano}`] = new Chart(
        canvasReceitas,
        {
            type: "bar",

            data: {
                labels: nomesMeses,

                datasets: [
                    {
                        label: "Receitas",
                        data: meses.map(m => m.receitas),
                        backgroundColor: "#35c98a",
                        borderRadius: 3
                    },
                    {
                        label: "Despesas",
                        data: meses.map(m => m.despesas),
                        backgroundColor: "#f16c6c",
                        borderRadius: 3
                    },
                    {
                        label: "Cartões",
                        data: meses.map(m => m.cartoes),
                        backgroundColor: "#e6b85c",
                        borderRadius: 3
                    },
                    {
                        label: "Investimentos",
                        data: meses.map(m => m.investimentos),
                        backgroundColor: "#bd91ed",
                        borderRadius: 3
                    },
                    {
                        label: "Receitas não operacionais",
                        data: meses.map(m => m.receitasNaoOperacionais),
                        backgroundColor: "#55b8e8",
                        borderRadius: 3
                    },
                    {
                        label: "Gastos não operacionais",
                        data: meses.map(m => m.gastosNaoOperacionais),
                        backgroundColor: "#e6a16a",
                        borderRadius: 3
                    }
                ]
            },

            options: opcoes
        }
    );


    // GRÁFICO 2: EVOLUÇÃO DOS RESULTADOS

    const canvasResultados = document.getElementById(
        `analisesResultados${ano}`
    );

    analisesGraficos[`resultados${ano}`] = new Chart(
        canvasResultados,
        {
            type: "line",

            data: {
                labels: nomesMeses,

                datasets: [
                    {
                        label: "(+) Receitas",
                        data: calculo.meses.map(m => m.receitas),
                        borderColor: "#35c98a",
                        backgroundColor: "#35c98a",
                        tension: 0.3
                    },
                    {
                        label: "(=) Margem de contribuição",
                        data: calculo.meses.map(m => m.margem),
                        borderColor: "#55b8e8",
                        backgroundColor: "#55b8e8",
                        tension: 0.3
                    },
                    {
                        label: "(=) Lucro operacional antes dos investimentos",
                        data: calculo.meses.map(
                            m => m.lucroAntesInvestimentos
                        ),
                        borderColor: "#e6b85c",
                        backgroundColor: "#e6b85c",
                        tension: 0.3
                    },
                    {
                        label: "(=) Lucro operacional após investimentos",
                        data: calculo.meses.map(
                            m => m.lucroAposInvestimentos
                        ),
                        borderColor: "#bd91ed",
                        backgroundColor: "#bd91ed",
                        tension: 0.3
                    },
                    {
                        label: "(=) Lucro líquido",
                        data: calculo.meses.map(m => m.lucroLiquido),
                        borderColor: "#f16c6c",
                        backgroundColor: "#f16c6c",
                        tension: 0.3
                    }
                ]
            },

            options: opcoes
        }
    );


    // GRÁFICO 3: COMPOSIÇÃO FINANCEIRA

    const canvasComposicao = document.getElementById(
        `analisesComposicao${ano}`
    );

    const total = calculo.total;

    analisesGraficos[`composicao${ano}`] = new Chart(
        canvasComposicao,
        {
            type: "doughnut",

            data: {
                labels: [
                    "Receitas",
                    "Despesas",
                    "Cartões",
                    "Investimentos",
                    "Receitas não operacionais",
                    "Gastos não operacionais"
                ],

                datasets: [
                    {
                        data: [
                            total.receitas,
                            total.despesas,
                            total.cartoes,
                            total.investimentos,
                            total.receitasNaoOperacionais,
                            total.gastosNaoOperacionais
                        ],

                        backgroundColor: [
                            "#35c98a",
                            "#f16c6c",
                            "#e6b85c",
                            "#bd91ed",
                            "#55b8e8",
                            "#e6a16a"
                        ],

                        borderWidth: 2,
                        borderColor: "#202020"
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: true,

                plugins: {
                    legend: {
                        position: "bottom",

                        labels: {
                            color: "#bdbdbd",
                            padding: 18,
                            usePointStyle: true
                        }
                    },

                    tooltip: {
                        callbacks: {
                            label: contexto => {

                                return `${contexto.label}: ${
                                    formatarValorAnalises(contexto.raw)
                                }`;

                            }
                        }
                    }
                }
            }
        }
    );
}



// ==========================================
// RENDERIZAÇÃO PRINCIPAL
// ==========================================

function renderizarAnalises() {

    const container = document.getElementById("analisesConteudo");
    const seletorAno = document.getElementById("analisesAno");

    if (!container || !seletorAno) return;

    destruirGraficosAnalises();

    const anos = organizarDadosAnalises();

    const listaAnos = Object.keys(anos)
        .sort((a, b) => Number(b) - Number(a));

    if (!listaAnos.length) {

        seletorAno.innerHTML = "";

        container.innerHTML = `
            <div class="analises-vazio">
                Nenhuma movimentação encontrada para gerar as análises.
            </div>
        `;

        return;
    }

    // Guarda o ano anteriormente selecionado
    const anoAnterior = seletorAno.value;

    // Atualiza as opções do seletor
    seletorAno.innerHTML = listaAnos.map(ano => `
        <option value="${ano}">${ano}</option>
    `).join("");

    // Mantém o ano selecionado, se ainda existir
    if (listaAnos.includes(anoAnterior)) {
        seletorAno.value = anoAnterior;
    } else {
        seletorAno.value = listaAnos[0];
    }

    // Obtém somente o ano selecionado
    const anoSelecionado = seletorAno.value;

    // Renderiza apenas a tabela daquele ano
    container.innerHTML = gerarTabelaAnalises(
        anoSelecionado,
        anos[anoSelecionado]
    );

    // Cria somente os gráficos daquele ano
    criarGraficosAnalises(
        anoSelecionado,
        anos[anoSelecionado]
    );

}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    renderizarAnalises();

});


/* =========================================
   DRE E BALANÇO FINANCEIRO PESSOAL
========================================= */

const dreMeses = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro",
    "Outubro", "Novembro", "Dezembro"
];

const drePeriodos = [
    { nome: "Janeiro a Março", inicio: 0, fim: 2 },
    { nome: "Abril a Junho", inicio: 3, fim: 5 },
    { nome: "Julho a Setembro", inicio: 6, fim: 8 },
    { nome: "Outubro a Dezembro", inicio: 9, fim: 11 },
    { nome: "Janeiro a Junho", inicio: 0, fim: 5 },
    { nome: "Julho a Dezembro", inicio: 6, fim: 11 },
    { nome: "Janeiro a Dezembro", inicio: 0, fim: 11 }
];

const dreMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const dreNumero = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
});

function formatarValorDRE(valor) {
    return dreMoeda.format(valor || 0);
}

function formatarPercentualDRE(valor) {
    return (valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + "%";
}

function escaparDRE(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);
}

function converterValorDRE(valor) {
    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
    }

    let texto = String(valor ?? "")
        .replace(/R\$/gi, "")
        .replace(/\s/g, "")
        .trim();

    if (!texto) return 0;

    if (texto.includes(",")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : 0;
}

function obterDataDRE(data) {
    if (!data) return null;

    if (data instanceof Date && !isNaN(data)) {
        return {
            ano: data.getFullYear(),
            mes: data.getMonth()
        };
    }

    const texto = String(data).trim();

    let resultado = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (resultado) {
        return {
            ano: Number(resultado[3]),
            mes: Number(resultado[2]) - 1
        };
    }

    resultado = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (resultado) {
        return {
            ano: Number(resultado[1]),
            mes: Number(resultado[2]) - 1
        };
    }

    const dataConvertida = new Date(texto);

    if (!isNaN(dataConvertida)) {
        return {
            ano: dataConvertida.getFullYear(),
            mes: dataConvertida.getMonth()
        };
    }

    return null;
}

function normalizarTipoDRE(tipo) {
    return String(tipo ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();
}

function identificarTipoDRE(tipo) {
    const texto = normalizarTipoDRE(tipo);

    if (texto === "RECEITAS") return "receitas";
    if (texto === "DESPESAS") return "despesas";
    if (texto === "CARTOES") return "cartoes";
    if (texto === "INVESTIMENTOS") return "investimentos";

    if (
        texto.includes("RECEITAS NAO OPER") ||
        texto.includes("RECEITAS NAO-OPER")
    ) {
        return "receitasNaoOperacionais";
    }

    if (
        texto.includes("SAIDAS NAO OPER") ||
        texto.includes("SAIDAS NAO-OPER") ||
        texto.includes("GASTOS NAO OPER")
    ) {
        return "saidasNaoOperacionais";
    }

    return null;
}

function obterMovimentacoesDRE() {
    return Array.isArray(movimentacoes) ? movimentacoes : [];
}

function criarEstruturaDRE() {
    return {
        receitas: 0,
        despesas: 0,
        cartoes: 0,
        investimentos: 0,
        receitasNaoOperacionais: 0,
        saidasNaoOperacionais: 0
    };
}

function organizarDadosDRE(ano) {
    const dados = dreMeses.map(() => criarEstruturaDRE());

    obterMovimentacoesDRE().forEach(movimento => {
        const data = obterDataDRE(movimento.data);

        if (!data || data.ano !== ano) return;

        const tipo = identificarTipoDRE(movimento.tipo);

        if (!tipo || data.mes < 0 || data.mes > 11) return;

        dados[data.mes][tipo] += Math.abs(
            converterValorDRE(movimento.valor)
        );
    });

    return dados;
}

function calcularResultadoDRE(dados) {
    const resultado = { ...dados };

    resultado.margem =
        resultado.receitas - resultado.despesas;

    resultado.lucroAntesInvestimentos =
        resultado.margem - resultado.cartoes;

    resultado.lucroOperacional =
        resultado.lucroAntesInvestimentos - resultado.investimentos;

    resultado.resultadoLiquido =
        resultado.lucroOperacional +
        resultado.receitasNaoOperacionais -
        resultado.saidasNaoOperacionais;

    return resultado;
}

function somarPeriodoDRE(meses, inicio, fim) {
    const total = criarEstruturaDRE();

    for (let i = inicio; i <= fim; i++) {
        Object.keys(total).forEach(chave => {
            total[chave] += meses[i][chave];
        });
    }

    return calcularResultadoDRE(total);
}

function percentualDRE(valor, base) {
    if (!base) return 0;
    return (valor / base) * 100;
}

function classeValorDRE(valor) {
    return valor < 0 ? "dre-negativo" : "dre-positivo";
}

function criarLinhaDRE(nome, valor, base, classe = "") {
    return `
        <tr class="${classe}">
            <td>${nome}</td>
            <td class="${classeValorDRE(valor)}">
                ${formatarValorDRE(valor)}
            </td>
            <td class="dre-percentual ${classeValorDRE(percentualDRE(valor, base))}">
                ${formatarPercentualDRE(percentualDRE(valor, base))}
            </td>
        </tr>
    `;
}

function gerarTabelaDRE(resultado) {
    const base = resultado.receitas;

    return `
        <div class="dre-tabela-container">
            <table class="dre-tabela">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Percentual</th>
                    </tr>
                </thead>

                <tbody>
                    ${criarLinhaDRE("(+) Receitas", resultado.receitas, base, "dre-linha-receita")}

                    ${criarLinhaDRE("(-) Despesas", resultado.despesas, base, "dre-linha-despesa")}

                    ${criarLinhaDRE("(=) Margem de Contribuição / Lucro Bruto", resultado.margem, base, "dre-linha-margem")}

                    ${criarLinhaDRE("(-) Cartões", resultado.cartoes, base, "dre-linha-cartao")}

                    ${criarLinhaDRE("(=) Lucro Operacional antes dos Investimentos", resultado.lucroAntesInvestimentos, base, "dre-linha-operacional")}

                    ${criarLinhaDRE("(-) Investimentos", resultado.investimentos, base, "dre-linha-investimento")}

                    ${criarLinhaDRE("(=) Lucro Operacional", resultado.lucroOperacional, base, "dre-linha-operacional")}

                    ${criarLinhaDRE("(+) Entradas não operacionais", resultado.receitasNaoOperacionais, base, "dre-linha-receita")}

                    ${criarLinhaDRE("(-) Saídas não operacionais", resultado.saidasNaoOperacionais, base, "dre-linha-despesa")}

                    ${criarLinhaDRE("(=) Resultado Líquido", resultado.resultadoLiquido, base, "dre-linha-resultado")}
                </tbody>
            </table>
        </div>
    `;
}

function gerarDREsAno(ano, meses) {
    return drePeriodos.map(periodo => {
        const resultado = somarPeriodoDRE(
            meses,
            periodo.inicio,
            periodo.fim
        );

        return `
            <div class="dre-bloco">
                <div class="dre-titulo">
                    <h3>${periodo.nome}</h3>
                    <span>${ano}</span>
                </div>

                ${gerarTabelaDRE(resultado)}
            </div>
        `;
    }).join("");
}

/* =========================================
   ÍNDICES FINANCEIROS
========================================= */

function criarIndiceDRE(nome, sigla, formula, valor, descricao, status) {
    const classe =
        status === "POSITIVO" ? "dre-status-positivo" :
        status === "ATENÇÃO" ? "dre-status-atencao" :
        "dre-status-negativo";

    return `
        <div class="dre-indice">
            <div class="dre-indice-topo">
                <h4>${nome} (${sigla})</h4>
                <div class="dre-indice-valor ${valor < 0 ? "dre-negativo" : "dre-positivo"}">
                    ${dreNumero.format(valor)}
                </div>
            </div>

            <div class="dre-indice-formula">${formula}</div>

            <div class="dre-indice-descricao">${descricao}</div>

            <span class="dre-status ${classe}">${status}</span>
        </div>
    `;
}

function calcularIndicesDRE(resultado, saldoInicial = 0) {
    const entradasOperacionais = resultado.receitas;
    const entradasNaoOperacionais = resultado.receitasNaoOperacionais;

    const saidasOperacionais =
        resultado.despesas + resultado.cartoes;

    const investimentos = resultado.investimentos;

    const saidasNaoOperacionais =
        investimentos + resultado.saidasNaoOperacionais;

    const entradasTotais =
        entradasOperacionais + entradasNaoOperacionais;

    const saidasTotais =
        saidasOperacionais + saidasNaoOperacionais;

    const resultadoLiquido =
        entradasTotais - saidasTotais;

    const indices = [];

    const lg = saidasTotais
        ? entradasTotais / saidasTotais
        : 0;

    let statusLG = lg >= 1 ? "POSITIVO" : "NEGATIVO";

    let descricaoLG = saidasTotais
        ? `Para cada R$ 1,00 em saídas, houve ${formatarValorDRE(lg)} em entradas. ${lg >= 1 ? "As entradas foram suficientes para cobrir todas as saídas." : "As entradas não foram suficientes para cobrir todas as saídas."}`
        : "Não houve saídas registradas no período.";

    indices.push(criarIndiceDRE(
        "Liquidez Geral", "LG",
        "(Entradas Operacionais + Entradas Não Operacionais) ÷ (Saídas Operacionais + Saídas Não Operacionais)",
        lg, descricaoLG, statusLG
    ));

    const lo = saidasOperacionais
        ? entradasOperacionais / saidasOperacionais
        : 0;

    const statusLO = lo >= 1 ? "POSITIVO" : "NEGATIVO";

    const descricaoLO = saidasOperacionais
        ? `Existem ${formatarValorDRE(lo)} em receitas operacionais para cada R$ 1,00 gasto na operação. ${lo >= 1 ? "As receitas operacionais cobrem as despesas operacionais." : "As receitas operacionais não cobrem as despesas operacionais."}`
        : "Não houve saídas operacionais registradas.";

    indices.push(criarIndiceDRE(
        "Liquidez Operacional", "LO",
        "Entradas Operacionais ÷ Saídas Operacionais",
        lo, descricaoLO, statusLO
    ));

    const ic = saidasTotais
        ? (saldoInicial + entradasTotais) / saidasTotais
        : 0;

    const statusIC = ic >= 1 ? "POSITIVO" : "NEGATIVO";

    const descricaoIC = saidasTotais
        ? `Considerando o saldo inicial de ${formatarValorDRE(saldoInicial)}, havia ${formatarValorDRE(saldoInicial + entradasTotais)} disponíveis para cada R$ ${formatarValorDRE(saidasTotais)} em saídas. ${ic >= 1 ? "O caixa foi suficiente para cobrir as saídas." : "O caixa não foi suficiente para cobrir as saídas."}`
        : "Não houve saídas registradas no período.";

    indices.push(criarIndiceDRE(
        "Índice de Cobertura", "IC",
        "(Saldo Inicial + Entradas Totais) ÷ Saídas Totais",
        ic, descricaoIC, statusIC
    ));

    const rl = entradasTotais
        ? resultadoLiquido / entradasTotais
        : 0;

    const statusRL =
        resultadoLiquido > 0 ? "POSITIVO" :
        resultadoLiquido === 0 ? "ATENÇÃO" : "NEGATIVO";

    const descricaoRL =
        `O resultado líquido corresponde a ${formatarPercentualDRE(rl * 100)} das entradas totais. ` +
        (rl > 0 ? "Houve geração de resultado positivo." :
        rl === 0 ? "O período terminou sem lucro ou prejuízo." :
        "O período apresentou resultado negativo.");

    indices.push(criarIndiceDRE(
        "Resultado Líquido", "RL",
        "Resultado Líquido ÷ Entradas Totais",
        rl, descricaoRL, statusRL
    ));

    const mo = entradasOperacionais
        ? (entradasOperacionais - saidasOperacionais) / entradasOperacionais
        : 0;

    const statusMO =
        mo >= 0.30 ? "POSITIVO" :
        mo >= 0.10 ? "ATENÇÃO" : "NEGATIVO";

    const descricaoMO =
        `A margem operacional foi de ${formatarPercentualDRE(mo * 100)}. ` +
        (mo >= 0.30 ? "Margem excelente." :
        mo >= 0.10 ? "Margem positiva, mas merece acompanhamento." :
        mo >= 0 ? "Margem operacional reduzida." :
        "As despesas operacionais superaram as receitas operacionais.");

    indices.push(criarIndiceDRE(
        "Margem Operacional", "MO",
        "(Entradas Operacionais − Saídas Operacionais) ÷ Entradas Operacionais",
        mo, descricaoMO, statusMO
    ));

    const pd = entradasTotais
        ? saidasOperacionais / entradasTotais
        : 0;

    const statusPD =
        pd <= 0.60 ? "POSITIVO" :
        pd <= 0.80 ? "ATENÇÃO" : "NEGATIVO";

    const descricaoPD =
        `${formatarPercentualDRE(pd * 100)} das entradas totais foram destinadas às despesas operacionais. ` +
        (pd <= 0.60 ? "Controle adequado." :
        pd <= 0.80 ? "As despesas merecem acompanhamento." :
        "As despesas operacionais representam uma parcela elevada das entradas.");

    indices.push(criarIndiceDRE(
        "Peso das Despesas", "PD",
        "Saídas Operacionais ÷ Entradas Totais",
        pd, descricaoPD, statusPD
    ));

    const ti = entradasTotais
        ? investimentos / entradasTotais
        : 0;

    const statusTI =
        ti >= 0.20 ? "POSITIVO" :
        ti >= 0.10 ? "ATENÇÃO" : "NEGATIVO";

    const descricaoTI =
        `${formatarPercentualDRE(ti * 100)} das entradas totais foram destinadas a investimentos. ` +
        (ti >= 0.20 ? "Excelente capacidade de investimento." :
        ti >= 0.10 ? "Há destinação de recursos para investimentos." :
        "A taxa de investimento está reduzida.");

    indices.push(criarIndiceDRE(
        "Taxa de Investimento", "TI",
        "Investimentos ÷ Entradas Totais",
        ti, descricaoTI, statusTI
    ));

    const drno = entradasTotais
        ? entradasNaoOperacionais / entradasTotais
        : 0;

    const statusDRNO =
        drno <= 0.15 ? "POSITIVO" :
        drno <= 0.30 ? "ATENÇÃO" : "NEGATIVO";

    const descricaoDRNO =
        `${formatarPercentualDRE(drno * 100)} das entradas são provenientes de receitas não operacionais. ` +
        (drno <= 0.15 ? "Dependência controlada." :
        drno <= 0.30 ? "Dependência moderada de receitas extraordinárias." :
        "Alta dependência de receitas não operacionais.");

    indices.push(criarIndiceDRE(
        "Dependência de Receitas Não Operacionais", "DRNO",
        "Entradas Não Operacionais ÷ Entradas Totais",
        drno, descricaoDRNO, statusDRNO
    ));

    const ief = saidasTotais
        ? resultadoLiquido / saidasTotais
        : 0;

    const statusIEF =
        ief > 0.10 ? "POSITIVO" :
        ief >= 0 ? "ATENÇÃO" : "NEGATIVO";

    const descricaoIEF =
        `O índice foi de ${dreNumero.format(ief)} para cada R$ 1,00 em saídas. ` +
        (ief > 0.10 ? "Boa eficiência financeira." :
        ief >= 0 ? "Eficiência financeira equilibrada, com margem reduzida." :
        "As saídas superaram as entradas, gerando resultado negativo.");

    indices.push(criarIndiceDRE(
        "Índice de Eficiência Financeira", "IEF",
        "Resultado Líquido ÷ Saídas Totais",
        ief, descricaoIEF, statusIEF
    ));

    return `
        <div class="dre-indices-grid">
            ${indices.join("")}
        </div>
    `;
}

/* =========================================
   BALANÇO FINANCEIRO ANUAL
========================================= */

function agruparMovimentosDRE(ano, tipos) {
    const grupos = {};

    obterMovimentacoesDRE().forEach(movimento => {
        const data = obterDataDRE(movimento.data);

        if (!data || data.ano !== ano) return;

        const tipo = identificarTipoDRE(movimento.tipo);

        if (!tipos.includes(tipo)) return;

        const descricao = String(
            movimento.descricao || "Sem descrição"
        ).trim();

        if (!grupos[descricao]) {
            grupos[descricao] = 0;
        }

        grupos[descricao] += Math.abs(
            converterValorDRE(movimento.valor)
        );
    });

    return Object.entries(grupos)
        .map(([descricao, valor]) => ({ descricao, valor }))
        .sort((a, b) => b.valor - a.valor);
}

function gerarLinhasBalancoDRE(itens, totalGrupo) {
    return itens.map((item, indice) => `
        <tr class="balanco-detalhe">
            <td>${indice + 1} , ${escaparDRE(item.descricao)}</td>
            <td>${formatarValorDRE(item.valor)}</td>
            <td>${formatarPercentualDRE(percentualDRE(item.valor, totalGrupo))}</td>
        </tr>
    `).join("");
}

function gerarTabelaBalancoDRE(titulo, itens, totalGrupo, classe) {
    return `
        <div class="balanco-card ${classe}">
            <div class="balanco-card-titulo">${titulo}</div>

            <div class="dre-tabela-container">
                <table class="balanco-tabela">
                    <tbody>
                        <tr class="balanco-total">
                            <td>${titulo}</td>
                            <td>${formatarValorDRE(totalGrupo)}</td>
                            <td>100,00%</td>
                        </tr>

                        ${gerarLinhasBalancoDRE(itens, totalGrupo)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


function gerarBalancoAnualDRE(ano) {
    const dados = movimentacoes.filter(m => {
        if (!m.data) return false;

        let anoMovimento;

        if (/^\d{4}-\d{2}-\d{2}/.test(m.data)) {
            anoMovimento = Number(m.data.substring(0, 4));
        } else {
            const partes = m.data.split("/");
            anoMovimento = Number(partes[2]);
        }

        return anoMovimento === Number(ano);
    });

    const normalizar = texto => String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();

    const grupos = {
        entradasOperacionais: {},
        entradasNaoOperacionais: {},
        saidasOperacionais: {},
        saidasNaoOperacionais: {}
    };

    dados.forEach(m => {
        const tipo = normalizar(m.tipo);
        const descricao = String(m.descricao || "Sem descrição").trim();
        const valor = Math.abs(Number(m.valor) || 0);

        if (tipo === "RECEITAS") {
            grupos.entradasOperacionais[descricao] =
                (grupos.entradasOperacionais[descricao] || 0) + valor;

        } else if (
            tipo === "RECEITAS NAO-OPER." ||
            tipo === "RECEITAS NAO OPER."
        ) {
            grupos.entradasNaoOperacionais[descricao] =
                (grupos.entradasNaoOperacionais[descricao] || 0) + valor;

        } else if (tipo === "DESPESAS" || tipo === "CARTOES") {
            grupos.saidasOperacionais[descricao] =
                (grupos.saidasOperacionais[descricao] || 0) + valor;

        } else if (
            tipo === "INVESTIMENTOS" ||
            tipo === "SAIDAS NAO-OPER." ||
            tipo === "SAIDAS NAO OPER."
        ) {
            grupos.saidasNaoOperacionais[descricao] =
                (grupos.saidasNaoOperacionais[descricao] || 0) + valor;
        }
    });

    const somarGrupo = grupo =>
        Object.values(grupo).reduce((total, valor) => total + valor, 0);

    const totalEntradasOperacionais =
        somarGrupo(grupos.entradasOperacionais);

    const totalEntradasNaoOperacionais =
        somarGrupo(grupos.entradasNaoOperacionais);

    const totalSaidasOperacionais =
        somarGrupo(grupos.saidasOperacionais);

    const totalSaidasNaoOperacionais =
        somarGrupo(grupos.saidasNaoOperacionais);

    const totalEntradas =
        totalEntradasOperacionais + totalEntradasNaoOperacionais;

    const totalSaidas =
        totalSaidasOperacionais + totalSaidasNaoOperacionais;

    const patrimonioLiquido = totalEntradas - totalSaidas;

    const percentual = valor =>
        totalEntradas > 0
            ? (valor / totalEntradas * 100).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + "%"
            : "0,00%";

    const escapar = texto => String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    function organizarItens(grupo) {
        return Object.entries(grupo)
            .sort((a, b) => b[1] - a[1]);
    }

    function gerarCelulasDetalhe(item) {
        if (!item) {
            return `
                <td></td>
                <td></td>
                <td></td>
            `;
        }

        const [descricao, valor] = item;

        return `
            <td>${escapar(descricao)}</td>
            <td>${formatarValorDRE(valor)}</td>
            <td>${percentual(valor)}</td>
        `;
    }

    function gerarLinhaPareada(entrada, saida) {
        return `
            <tr class="balanco-detalhe">
                ${gerarCelulasDetalhe(entrada)}
                ${gerarCelulasDetalhe(saida)}
            </tr>
        `;
    }

    function gerarLinhaTitulo(entrada, saida) {
        return `
            <tr class="balanco-subtitulo">
                <td colspan="3">${entrada}</td>
                <td colspan="3">${saida}</td>
            </tr>
        `;
    }

    function gerarLinhaTotal(entrada, valorEntrada, saida, valorSaida) {
        return `
            <tr class="balanco-total">
                <td colspan="2">${entrada}</td>
                <td>${formatarValorDRE(valorEntrada)}</td>
                <td colspan="2">${saida}</td>
                <td>${formatarValorDRE(valorSaida)}</td>
            </tr>
        `;
    }

    const entradasOp = organizarItens(grupos.entradasOperacionais);
    const saidasOp = organizarItens(grupos.saidasOperacionais);

    const entradasNaoOp = organizarItens(grupos.entradasNaoOperacionais);
    const saidasNaoOp = organizarItens(grupos.saidasNaoOperacionais);

    let html = `
        <div class="balanco-card">
            <div class="balanco-card-titulo">
                Balanço Financeiro Pessoal Anual
            </div>

            <div class="dre-tabela-container">
                <table class="balanco-tabela balanco-tabela-dupla">
                    <thead>
                        <tr>
                            <th colspan="3">ENTRADAS</th>
                            <th colspan="3">SAÍDAS</th>
                        </tr>
                    </thead>
                    <tbody>

                        ${gerarLinhaTotal(
                            "Total das Entradas",
                            totalEntradas,
                            "Total das Saídas",
                            totalSaidas
                        )}

                        ${gerarLinhaTitulo(
                            "ENTRADAS OPERACIONAIS",
                            "SAÍDAS OPERACIONAIS"
                        )}

                        <tr class="balanco-total">
                            <td colspan="2">Total Operacional</td>
                            <td>${formatarValorDRE(totalEntradasOperacionais)}</td>
                            <td colspan="2">Total Operacional</td>
                            <td>${formatarValorDRE(totalSaidasOperacionais)}</td>
                        </tr>
    `;

    const quantidadeOperacional = Math.max(
        entradasOp.length,
        saidasOp.length
    );

    for (let i = 0; i < quantidadeOperacional; i++) {
        html += gerarLinhaPareada(
            entradasOp[i],
            saidasOp[i]
        );
    }

    html += `
                        ${gerarLinhaTitulo(
                            "ENTRADAS NÃO OPERACIONAIS",
                            "SAÍDAS NÃO OPERACIONAIS"
                        )}

                        <tr class="balanco-total">
                            <td colspan="2">Total Não Operacional</td>
                            <td>${formatarValorDRE(totalEntradasNaoOperacionais)}</td>
                            <td colspan="2">Total Não Operacional</td>
                            <td>${formatarValorDRE(totalSaidasNaoOperacionais)}</td>
                        </tr>
    `;

    const quantidadeNaoOperacional = Math.max(
        entradasNaoOp.length,
        saidasNaoOp.length
    );

    for (let i = 0; i < quantidadeNaoOperacional; i++) {
        html += gerarLinhaPareada(
            entradasNaoOp[i],
            saidasNaoOp[i]
        );
    }

    html += `
                        <tr class="balanco-total balanco-patrimonio-linha">
                            <td colspan="2">Patrimônio Líquido</td>
                            <td class="${patrimonioLiquido >= 0 ? 'positivo' : 'negativo'}">
                                ${formatarValorDRE(patrimonioLiquido)}
                            </td>

                            <td colspan="2">Patrimônio Líquido</td>
                            <td class="${patrimonioLiquido >= 0 ? 'positivo' : 'negativo'}">
                                ${formatarValorDRE(patrimonioLiquido)}
                            </td>
                        </tr>

                    </tbody>
                </table>
            </div>
        </div>
    `;

    return html;
}


/* =========================================
   RENDERIZAÇÃO E SELETOR DE ANO
========================================= */

function carregarAnosDRE() {
    const seletor = document.getElementById("dreAno");
    if (!seletor) return;

    const anos = obterMovimentacoesDRE()
        .map(movimento => obterDataDRE(movimento.data))
        .filter(Boolean)
        .map(data => data.ano);

    const anoAtual = new Date().getFullYear();

    if (!anos.length) anos.push(anoAtual);

    const anosUnicos = [...new Set(anos)].sort((a, b) => b - a);
    const anoAnterior = seletor.value;

    seletor.innerHTML = anosUnicos.map(ano => `
        <option value="${ano}">${ano}</option>
    `).join("");

    if (anosUnicos.includes(Number(anoAnterior))) {
        seletor.value = anoAnterior;
    } else {
        seletor.value = anosUnicos[0];
    }
}

function renderizarDREBalanço() {
    const conteudo = document.getElementById("dreConteudo");
    const seletor = document.getElementById("dreAno");

    if (!conteudo || !seletor) return;

    carregarAnosDRE();

    const ano = Number(seletor.value);
    const meses = organizarDadosDRE(ano);

    const resultadoAnual = somarPeriodoDRE(meses, 0, 11);

    conteudo.innerHTML = `
        <div class="dre-secao">
            <div class="dre-titulo">
                <h3>Demonstrativos de Resultados do Exercício</h3>
                <span>Ano ${ano}</span>
            </div>

            ${gerarDREsAno(ano, meses)}
        </div>

        <div class="dre-secao">
            <div class="dre-titulo">
                <p></p>
                <h3>Índices do Balanço Financeiro Pessoal</h3>
                <span>Referência anual, ${ano}</span>
            </div>

            <div class="dre-saldo-inicial">
                <label for="dreSaldoInicial">Saldo inicial do ano (R$)</label>
                <input
                    type="number"
                    id="dreSaldoInicial"
                    value="0"
                    step="0.01"
                    oninput="atualizarIndicesDRE()"
                >
            </div>

            <div id="dreIndices">
                ${calcularIndicesDRE(resultadoAnual).replace(
                    'class="dre-indices-grid"',
                    'class="dre-indices-grid"'
                )}
            </div>
        </div>

        <div class="dre-secao">
            <div class="dre-titulo">
                <h3>Balanço Financeiro Pessoal Anual</h3>
                <span>${ano}</span>
            </div>

            ${gerarBalancoAnualDRE(ano, resultadoAnual)}

            <p class="dre-observacao">
                Os percentuais dos grupos de entradas e saídas são calculados
                sobre o total de entradas. Os percentuais dos lançamentos
                individuais são calculados sobre o respectivo grupo.
            </p>
        </div>
    `;
}

function atualizarIndicesDRE() {
    const campo = document.getElementById("dreSaldoInicial");
    const destino = document.getElementById("dreIndices");
    const seletor = document.getElementById("dreAno");

    if (!campo || !destino || !seletor) return;

    const ano = Number(seletor.value);
    const meses = organizarDadosDRE(ano);
    const resultado = somarPeriodoDRE(meses, 0, 11);
    const saldoInicial = converterValorDRE(campo.value);

    destino.innerHTML = calcularIndicesDRE(resultado, saldoInicial);
}

document.addEventListener("DOMContentLoaded", () => {
    const seletor = document.getElementById("dreAno");

    if (seletor) {
        seletor.addEventListener("change", renderizarDREBalanço);
    }

    renderizarDREBalanço();
});



/* ==========================================
   BOLETINS MENSAIS
========================================== */

const boletinsMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];


/* ==========================================
   INICIALIZAR SELETOR DE ANO
========================================== */

function carregarAnosBoletins() {

    const seletor = document.getElementById("boletinsAno");

    if (!seletor) return;

    const anoAtual = new Date().getFullYear();

    const anos = new Set([anoAtual]);

    movimentacoes.forEach(m => {

        if (!m.data) return;

        let ano;

        if (/^\d{4}-\d{2}-\d{2}/.test(m.data)) {
            ano = Number(m.data.substring(0, 4));
        } else {
            const partes = m.data.split("/");
            ano = Number(partes[2]);
        }

        if (ano > 1900 && ano < 9999) {
            anos.add(ano);
        }

    });

    const anoSelecionado = seletor.value;

    seletor.innerHTML = [...anos]
        .sort((a, b) => b - a)
        .map(ano => `
            <option value="${ano}">${ano}</option>
        `)
        .join("");

    if (anos.has(Number(anoSelecionado))) {
        seletor.value = anoSelecionado;
    }

}


/* ==========================================
   CONVERTER DATA
========================================== */

function converterDataBoletim(data) {

    if (!data) return null;

    let ano, mes, dia;

    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {

        [ano, mes, dia] = data.substring(0, 10).split("-");

    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {

        [dia, mes, ano] = data.split("/");

    } else {

        return null;

    }

    ano = Number(ano);
    mes = Number(mes);
    dia = Number(dia);

    if (
        ano < 1900 ||
        mes < 1 || mes > 12 ||
        dia < 1 || dia > 31
    ) {
        return null;
    }

    return {
        ano,
        mes,
        dia
    };

}


/* ==========================================
   CONVERTER VALOR
========================================== */

function converterValorBoletim(valor) {

    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
    }

    if (valor === null || valor === undefined) {
        return 0;
    }

    let texto = String(valor)
        .replace(/R\$/g, "")
        .replace(/\s/g, "")
        .trim();

    if (texto.includes(",")) {
        texto = texto
            .replace(/\./g, "")
            .replace(",", ".");
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : 0;

}


/* ==========================================
   FORMATAR MOEDA
========================================== */

function formatarMoedaBoletim(valor) {

    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


/* ==========================================
   ESCAPAR TEXTO HTML
========================================== */

function escaparTextoBoletim(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);

}


/* ==========================================
   CLASSE DA COR FINANCEIRA
========================================== */

function classeValorBoletim(valor) {

    if (valor > 0) return "boletim-positivo";

    if (valor < 0) return "boletim-negativo";

    return "boletim-neutro";

}


/* ==========================================
   CLASSIFICAR TIPO PARA O DRE
========================================== */

function classificarTipoDRE(tipo) {

    const texto = normalizarTextoBoletim(tipo)
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (texto.includes("receitas nao oper")) return "receitasNaoOper";
    if (texto.includes("saidas nao oper")) return "saidasNaoOper";
    if (texto.includes("receitas")) return "receitas";
    if (texto.includes("despesas")) return "despesas";
    if (texto.includes("cartoes")) return "cartoes";
    if (texto.includes("investimentos")) return "investimentos";

    return null;
}


/* ==========================================
   FORMATAR MOEDA DO DRE
========================================== */

function formatarMoedaDRE(valor) {

    const sinal = valor < 0 ? "-" : "";

    return `${sinal}R$ ${formatarMoedaBoletim(Math.abs(valor))}`;

}


/* ==========================================
   GERAR DRE MENSAL
========================================== */

function gerarDREMensal(dadosMes, nomeMes, ano) {

    const totais = {
        receitas: 0,
        despesas: 0,
        cartoes: 0,
        investimentos: 0,
        receitasNaoOper: 0,
        saidasNaoOper: 0
    };

    /* Somar movimentações por categoria */

    dadosMes.forEach(m => {

        const categoria = classificarTipoDRE(m.tipo);

        if (!categoria) return;

        const valor = Math.abs(converterValorBoletim(m.valor));

        totais[categoria] += valor;

    });

    /* Calcular resultados */

    const margemContribuicao =
        totais.receitas - totais.despesas;

    const lucroAntesInvestimentos =
        margemContribuicao - totais.cartoes;

    const lucroOperacional =
        lucroAntesInvestimentos - totais.investimentos;

    const resultadoLiquido =
        lucroOperacional +
        totais.receitasNaoOper -
        totais.saidasNaoOper;

    /* Calcular percentual sobre receitas */

    function percentual(valor) {

        if (totais.receitas === 0) return 0;

        return (valor / totais.receitas) * 100;

    }

    /* Gerar linha */

    function linhaDRE(
        descricao,
        valor,
        classeExtra = "",
        valorPercentual = valor,
        valorCor = valor
    ) {

        const classe = classeValorBoletim(valorCor);

        return `
            <tr class="${classeExtra}">

                <td>${descricao}</td>

                <td class="${classe}">
                    ${formatarMoedaDRE(valor)}
                </td>

                <td class="${classe}">
                    ${percentual(valorPercentual).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}%
                </td>

            </tr>
        `;

    }

    /* Montar tabela */

    return `

        <div class="boletim-dre">

            <div class="boletim-dre-titulo">

                <h4>DRE de ${nomeMes}</h4>

                <span>${ano}</span>

            </div>

            <div class="boletim-tabela-container">

                <table class="boletim-dre-tabela">

                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Percentual</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${linhaDRE(
                            "(+) Receitas",
                            totais.receitas,
                            "dre-destaque"
                        )}

                        ${linhaDRE(
                            "(-) Despesas",
                            -totais.despesas
                        )}

                        ${linhaDRE(
                            "(=) Margem de Contribuição / Lucro Bruto",
                            margemContribuicao,
                            "dre-resultado"
                        )}

                        ${linhaDRE(
                            "(-) Cartões",
                            -totais.cartoes
                        )}

                        ${linhaDRE(
                            "(=) Lucro Operacional antes dos Investimentos",
                            lucroAntesInvestimentos,
                            "dre-resultado"
                        )}

                        ${linhaDRE(
                            "(-) Investimentos",
                            -totais.investimentos
                        )}

                        ${linhaDRE(
                            "(=) Lucro Operacional",
                            lucroOperacional,
                            "dre-resultado"
                        )}

                        ${linhaDRE(
                            "(+) Entradas não operacionais",
                            totais.receitasNaoOper
                        )}

                        ${linhaDRE(
                            "(-) Saídas não operacionais",
                            -totais.saidasNaoOper
                        )}

                        ${linhaDRE(
                            "(=) Resultado Líquido",
                            resultadoLiquido,
                            "dre-resultado"
                        )}

                    </tbody>

                </table>

            </div>

        </div>

    `;

}

/* ==========================================
   NORMALIZAR TEXTO
========================================== */

function normalizarTextoBoletim(texto) {

    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


/* ==========================================
   OBTER FILTROS
========================================== */

function obterFiltrosBoletins() {

    const campo = document.getElementById("boletinsFiltro");

    if (!campo) return [];

    return campo.value
        .split(/[,;\n]+/)
        .map(item => normalizarTextoBoletim(item))
        .filter(item => item.length > 0);

}


/* ==========================================
   VERIFICAR DESCRIÇÃO
========================================== */

function correspondeFiltroBoletim(descricao, filtros) {

    if (filtros.length === 0) return true;

    const texto = normalizarTextoBoletim(descricao);

    return filtros.some(filtro => texto.includes(filtro));

}


/* ==========================================
   RENDERIZAR BOLETINS
========================================== */

function renderizarBoletins() {

    const seletorAno = document.getElementById("boletinsAno");
    const campoFiltro = document.getElementById("boletinsFiltro");
    const container = document.getElementById("boletinsPlanilhas");
    const resultado = document.getElementById("boletinsResultadoFiltro");

    if (!seletorAno || !campoFiltro || !container || !resultado) {
        return;
    }

    carregarAnosBoletins();

    const ano = Number(seletorAno.value);
    const filtros = obterFiltrosBoletins();

    const emPesquisa = filtros.length > 0;

    container.classList.toggle("boletins-em-pesquisa", emPesquisa);

    /* Filtrar movimentações pelo ano */

    const dadosAno = movimentacoes
        .map((m, indice) => {

            const data = converterDataBoletim(m.data);

            return {
                ...m,
                dataConvertida: data,
                indiceOriginal: indice
            };

        })
        .filter(m => {

            return m.dataConvertida &&
                   m.dataConvertida.ano === ano;

        });

    let totalGeral = 0;
    let quantidadeGeral = 0;
    let html = "";

    /* Percorrer os 12 meses */

    boletinsMeses.forEach((nomeMes, indiceMes) => {

        const mes = indiceMes + 1;

        let dadosMes = dadosAno.filter(m => {

            return m.dataConvertida.mes === mes;

        });

        /* Aplicar pesquisa */

        if (emPesquisa) {

            dadosMes = dadosMes.filter(m =>
                correspondeFiltroBoletim(m.descricao, filtros)
            );

        }

        /* Ordenar pelo dia */

        dadosMes.sort((a, b) => {

            const diferenca = a.dataConvertida.dia - b.dataConvertida.dia;

            return diferenca || a.indiceOriginal - b.indiceOriginal;

        });

        /* Ocultar meses sem resultados */

        if (emPesquisa && dadosMes.length === 0) {
            return;
        }

        let saldo = 0;
        let totalMes = 0;
        let linhas = "";

        /* Gerar movimentações */

        dadosMes.forEach(m => {

            const valor = converterValorBoletim(m.valor);

            totalMes += valor;
            saldo += valor;

            totalGeral += valor;
            quantidadeGeral++;

            const descricao = escaparTextoBoletim(m.descricao);

            const dia = String(m.dataConvertida.dia).padStart(2, "0");

            const classeValor = classeValorBoletim(valor);
            const classeSaldo = classeValorBoletim(saldo);

            linhas += `
                <tr>
                    <td>${descricao}</td>

                    <td class="${classeValor}">
                        ${formatarMoedaBoletim(valor)}
                    </td>

                    <td>${dia}</td>

                    ${!emPesquisa ? `
                        <td class="${classeSaldo}">
                            ${formatarMoedaBoletim(saldo)}
                        </td>
                    ` : ""}
                </tr>
            `;

        });

        /* Gerar planilha mensal */

        html += `
            <div class="boletim-mes">

                <div class="boletim-mes-titulo">

                    <h3>${nomeMes}</h3>

                    <span>
                        ${dadosMes.length} movimentações
                    </span>

                </div>

                <div class="boletim-tabela-container">

                    <table class="boletim-tabela">

                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Dia</th>

                                ${!emPesquisa ? `
                                    <th>Saldo</th>
                                ` : ""}
                            </tr>
                        </thead>

                        <tbody>
                            ${linhas}
                        </tbody>

                    </table>

                </div>

                ${!emPesquisa ? `
                    <div class="boletim-total-pesquisa">

                        <span>Saldo final do mês</span>

                        <span class="${classeValorBoletim(saldo)}">
                            ${formatarMoedaBoletim(saldo)}
                        </span>
            
                    </div>
                    ${!emPesquisa ? gerarDREMensal(dadosMes, nomeMes, ano) : ""}
                ` : ""}

            </div>
        `;

    });

    /* Exibir planilhas */

    container.innerHTML = html || `
        <div class="boletim-vazio">
            Nenhuma movimentação encontrada para este ano.
        </div>
    `;

    /* Resultado da pesquisa */

    if (emPesquisa) {

        resultado.hidden = false;

        resultado.innerHTML = `

            <div class="boletins-resultado-info">

                <div>

                    <div style="font-size:12px; color:var(--texto-secundario,#999);">
                        Resultado da pesquisa
                    </div>

                    <div style="font-weight:600; margin-top:4px;">
                        ${quantidadeGeral} movimentações encontradas
                    </div>

                </div>

                <div style="text-align:right;">

                    <div style="font-size:12px; color:var(--texto-secundario,#999);">
                        Somatório total
                    </div>

                    <div class="boletins-resultado-total ${classeValorBoletim(totalGeral)}">
                        R$ ${formatarMoedaBoletim(totalGeral)}
                    </div>

                </div>

            </div>

        `;

    } else {

        resultado.hidden = true;
        resultado.innerHTML = "";

    }

}


/* ==========================================
   EVENTOS
========================================== */

function inicializarBoletins() {

    const seletorAno = document.getElementById("boletinsAno");
    const campoFiltro = document.getElementById("boletinsFiltro");
    const botaoLimpar = document.getElementById("boletinsLimparFiltro");

    if (!seletorAno || !campoFiltro || !botaoLimpar) {
        return;
    }

    seletorAno.addEventListener("change", renderizarBoletins);

    campoFiltro.addEventListener("input", renderizarBoletins);

    botaoLimpar.addEventListener("click", () => {

        campoFiltro.value = "";

        renderizarBoletins();

        campoFiltro.focus();

    });

    renderizarBoletins();

}


/* ==========================================
   INICIALIZAÇÃO
========================================== */

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", inicializarBoletins);

} else {

    inicializarBoletins();

}



/* ==========================================
   RANKING DAS MOVIMENTAÇÕES
========================================== */


/* ==========================================
   CONVERTER DATA
========================================== */

function converterDataRanking(data) {

    if (!data) return null;

    let ano, mes, dia;

    if (/^\d{4}-\d{2}-\d{2}/.test(data)) {

        [ano, mes, dia] = data.substring(0, 10).split("-");

    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {

        [dia, mes, ano] = data.split("/");

    } else {

        return null;

    }

    ano = Number(ano);
    mes = Number(mes);
    dia = Number(dia);

    if (
        ano < 1900 ||
        mes < 1 || mes > 12 ||
        dia < 1 || dia > 31
    ) {
        return null;
    }

    return { ano, mes, dia };

}


/* ==========================================
   FORMATAR MOEDA
========================================== */

function formatarMoedaRanking(valor) {

    const sinal = valor < 0 ? "-" : "";

    return `${sinal}R$ ${Math.abs(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

}


/* ==========================================
   NORMALIZAR TEXTO
========================================== */

function normalizarTextoRanking(texto) {

    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


/* ==========================================
   ESCAPAR HTML
========================================== */

function escaparTextoRanking(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[caractere]);

}


/* ==========================================
   CLASSE FINANCEIRA
========================================== */

function classeValorRanking(valor) {

    if (valor > 0) return "ranking-positivo";

    if (valor < 0) return "ranking-negativo";

    return "ranking-neutro";

}


/* ==========================================
   ABREVIAÇÃO DOS MESES
========================================== */

const rankingMeses = [
    "Jan", "Fev", "Mar", "Abr",
    "Mai", "Jun", "Jul", "Ago",
    "Set", "Out", "Nov", "Dez"
];


/* ==========================================
   AGRUPAR MOVIMENTAÇÕES
========================================== */


function agruparMovimentacoesRanking() {
    const agrupados = new Map();

    const totaisObrigatorios = [
        "RECEITAS",
        "CARTÕES",
        "INVESTIMENTOS",
        "DESPESAS",
        "RECEITAS NÃO-OPER.",
        "SAÍDAS NÃO-OPER."
    ];

    // Cria previamente as linhas de totais
    totaisObrigatorios.forEach(tipo => {
        const descricao = `${tipo} Valor Total`;
        const chave = JSON.stringify([
            normalizarTextoRanking(descricao),
            "0"
        ]);

        agrupados.set(chave, {
            descricao,
            tipo: "",
            total: 0,
            meses: new Set(),
            resumo: true
        });
    });

    movimentacoes.forEach(m => {
        if (!m.descricao || !m.data) return;

        const data = converterDataRanking(m.data);
        if (!data) return;

        const descricao = String(m.descricao).trim();
        const tipo = String(m.tipo || "").trim();

        const chave = JSON.stringify([
            normalizarTextoRanking(descricao),
            normalizarTextoRanking(tipo)
        ]);

        if (!agrupados.has(chave)) {
            agrupados.set(chave, {
                descricao,
                tipo,
                total: 0,
                meses: new Set(),
                resumo: false
            });
        }

        const item = agrupados.get(chave);

        // Todos os valores são acumulados como positivos
        item.total += Math.abs(converterValorBoletim(m.valor));

        const chaveMes = `${data.ano}-${String(data.mes).padStart(2, "0")}`;
        item.meses.add(chaveMes);

        // Alimenta automaticamente as linhas de totais
        const tipoNormalizado = normalizarTextoRanking(tipo);

        const tipoTotal = totaisObrigatorios.find(t =>
            normalizarTextoRanking(t) === tipoNormalizado
        );

        if (tipoTotal) {
            const descricaoTotal = `${tipoTotal} Valor Total`;
            const chaveTotal = JSON.stringify([
                normalizarTextoRanking(descricaoTotal),
                "0"
            ]);

            const total = agrupados.get(chaveTotal);

            total.total += Math.abs(converterValorBoletim(m.valor));
            total.meses.add(chaveMes);
        }
    });

    return Array.from(agrupados.values());
}



/* ==========================================
   RENDERIZAR RANKING
========================================== */


function obterTipoRanking(item) {
    if (item.resumo) {
        return item.descricao.replace(/\s+Valor Total$/i, "").trim();
    }

    return item.tipo;
}

function classeTipoRanking(tipo) {
    const tipoNormalizado = normalizarTextoRanking(tipo)
        .replace(/[.]/g, "")
        .trim();

    if (tipoNormalizado === "receitas") return "tipo-receitas";
    if (tipoNormalizado === "despesas") return "tipo-despesas";
    if (tipoNormalizado === "cartoes") return "tipo-cartoes";
    if (tipoNormalizado === "investimentos") return "tipo-investimentos";
    if (tipoNormalizado === "receitas nao-oper") return "tipo-receitas-nao-oper";
    if (tipoNormalizado === "saidas nao-oper") return "tipo-saidas-nao-oper";

    return "";
}

function inicializarFiltrosRanking() {
    const container = document.getElementById("rankingFiltrosTipos");

    if (!container) return;

    const tipos = [
        "RECEITAS",
        "CARTÕES",
        "INVESTIMENTOS",
        "DESPESAS",
        "RECEITAS NÃO-OPER.",
        "SAÍDAS NÃO-OPER."
    ];

    container.innerHTML = `
        <label>
            <input type="checkbox" id="rankingSelecionarTodos" checked>
            Todos os tipos
        </label>
        <hr>
        ${tipos.map((tipo, index) => `
            <label>
                <input
                    type="checkbox"
                    class="ranking-tipo-checkbox"
                    value="${tipo}"
                    checked
                    id="rankingTipo${index}"
                >
                ${tipo}
            </label>
        `).join("")}
    `;

    container.addEventListener("change", function(e) {
        if (e.target.id === "rankingSelecionarTodos") {
            container.querySelectorAll(".ranking-tipo-checkbox")
                .forEach(cb => cb.checked = e.target.checked);
        } else if (e.target.classList.contains("ranking-tipo-checkbox")) {
            const todos = [...container.querySelectorAll(".ranking-tipo-checkbox")]
                .every(cb => cb.checked);

            document.getElementById("rankingSelecionarTodos").checked = todos;
        }

        renderizarRanking();
    });
}

function renderizarRanking() {
    const corpo = document.getElementById("rankingTabelaCorpo");
    const pesquisa = normalizarTextoRanking(
        document.getElementById("rankingFiltro")?.value || ""
    );

    if (!corpo) return;

    const tiposSelecionados = [
        ...document.querySelectorAll(".ranking-tipo-checkbox:checked")
    ].map(cb => normalizarTextoRanking(cb.value));

    const ranking = agruparMovimentacoesRanking()
        .filter(item => {
            const descricao = normalizarTextoRanking(item.descricao);
            const tipo = normalizarTextoRanking(obterTipoRanking(item));

            const correspondePesquisa =
                !pesquisa ||
                descricao.includes(pesquisa) ||
                tipo.includes(pesquisa);

            const correspondeTipo =
                tiposSelecionados.includes(tipo);

            return correspondePesquisa && correspondeTipo;
        })
        .sort((a, b) => b.total - a.total);

    document.getElementById("rankingContagem").textContent =
        `${ranking.length} movimentações`;

    if (!ranking.length) {
        corpo.innerHTML = `
            <tr>
                <td colspan="5">Nenhuma movimentação encontrada.</td>
            </tr>
        `;
        return;
    }

    corpo.innerHTML = ranking.map((item, index) => {
        const meses = [...item.meses]
            .sort()
            .map(chave => {
                const [ano, mes] = chave.split("-");
                return `${rankingMeses[Number(mes) - 1]}-${ano.slice(-2)}`;
            })
            .join(", ");

        const classe = classeTipoRanking(obterTipoRanking(item));

        return `
            <tr class="${classe}">
                <td>${index + 1}</td>
                <td>${escaparTextoBoletim(item.descricao)}</td>
                <td>${escaparTextoBoletim(item.tipo)}</td>
                <td class="${classeValorBoletim(item.total)}">
                    ${formatarMoedaRanking(Math.abs(item.total))}
                </td>
                <td>${meses}</td>
            </tr>
        `;
    }).join("");
}



/* ==========================================
   INICIALIZAR RANKING
========================================== */

function inicializarRanking() {
    const filtro = document.getElementById("rankingFiltro");

    if (filtro) {
        filtro.addEventListener("input", renderizarRanking);
    }

    inicializarFiltrosRanking();
    renderizarRanking();
}

document.addEventListener("DOMContentLoaded", inicializarRanking);


/* ==========================================
   INICIALIZAÇÃO
========================================== */

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", inicializarRanking);

} else {

    inicializarRanking();

}



// ========================================
// DASHBOARD FINANCEIRO
// ========================================

const dashboardMeses = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro",
    "Outubro", "Novembro", "Dezembro"
];

const dashboardMesesAbreviados = [
    "Jan", "Fev", "Mar", "Abr",
    "Mai", "Jun", "Jul", "Ago",
    "Set", "Out", "Nov", "Dez"
];

const dashboardCores = {
    receitas: "#2ecc71",
    despesas: "#e74c3c",
    cartoes: "#f1c40f",
    investimentos: "#3498db",
    receitasNaoOper: "#1abc9c",
    saidasNaoOper: "#e67e22",
    resultado: "#3498db"
};

const dashboardGraficos = {};

let dashboardDadosAno = null;


// ========================================
// CONVERSÕES
// ========================================

function dashboardNormalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function dashboardConverterValor(valor) {
    if (typeof valor === "number") {
        return Math.abs(valor);
    }

    let texto = String(valor || "0")
        .replace(/[R$\s]/g, "")
        .trim();

    if (texto.includes(",")) {
        texto = texto.replace(/\./g, "").replace(",", ".");
    }

    const numero = Number(texto);

    return Number.isFinite(numero) ? Math.abs(numero) : 0;
}

function dashboardFormatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function dashboardConverterData(data) {
    if (!data) return null;

    const texto = String(data).trim();

    let ano, mes, dia;

    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        const partes = texto.substring(0, 10).split("-");
        ano = Number(partes[0]);
        mes = Number(partes[1]);
        dia = Number(partes[2]);
    } else {
        const partes = texto.substring(0, 10).split("/");

        if (partes.length !== 3) return null;

        dia = Number(partes[0]);
        mes = Number(partes[1]);
        ano = Number(partes[2]);
    }

    const dataValida = new Date(ano, mes - 1, dia);

    if (
        !ano ||
        mes < 1 || mes > 12 ||
        dia < 1 || dia > 31 ||
        dataValida.getFullYear() !== ano ||
        dataValida.getMonth() !== mes - 1 ||
        dataValida.getDate() !== dia
    ) {
        return null;
    }

    return { ano, mes, dia };
}


// ========================================
// CLASSIFICAÇÃO DAS MOVIMENTAÇÕES
// ========================================

function dashboardClassificarTipo(tipo) {
    const normalizado = dashboardNormalizar(tipo);

    if (normalizado === "receitas") return "receitas";
    if (normalizado === "despesas") return "despesas";
    if (normalizado === "cartoes" || normalizado === "cartao") return "cartoes";
    if (normalizado === "investimentos") return "investimentos";

    if (
        normalizado === "receitas nao oper" ||
        normalizado === "receitas nao operacional"
    ) {
        return "receitasNaoOper";
    }

    if (
        normalizado === "saidas nao oper" ||
        normalizado === "saidas nao operacional"
    ) {
        return "saidasNaoOper";
    }

    // Caso exista uma categoria de custos diretos,
    // ela também será considerada uma saída.
    if (
        normalizado.includes("custo") ||
        normalizado.includes("despesa")
    ) {
        return "despesas";
    }

    return null;
}


// ========================================
// PREPARAÇÃO DOS DADOS DO ANO
// ========================================

function dashboardPrepararDados(ano) {

    const meses = Array.from({ length: 12 }, () => ({
        entradas: 0,
        saidas: 0,
        resultado: 0,

        receitas: 0,
        despesas: 0,
        cartoes: 0,
        investimentos: 0,
        receitasNaoOper: 0,
        saidasNaoOper: 0,

        quantidade: 0
    }));

    const maioresDespesas = new Map();
    const maioresEntradas = new Map();

    let quantidadeTotal = 0;

    movimentacoes.forEach(m => {

        if (!m.data || !m.tipo) return;

        const data = dashboardConverterData(m.data);

        if (!data || data.ano !== Number(ano)) return;

        const categoria = dashboardClassificarTipo(m.tipo);

        if (!categoria) return;

        const valor = dashboardConverterValor(m.valor);

        const mes = meses[data.mes - 1];

        mes[categoria] += valor;
        mes.quantidade++;

        quantidadeTotal++;

       // Entradas
        if (
            categoria === "receitas" ||
            categoria === "receitasNaoOper"
        ) {
            mes.entradas += valor;

            const descricao = String(
                m.descricao || "Sem descrição"
            ).trim();

            // Ignora linhas de totais no ranking
            if (!/valor total$/i.test(descricao)) {
                maioresEntradas.set(
                    descricao,
                    (maioresEntradas.get(descricao) || 0) + valor
                );
            }
        }

        // Saídas
        if (
            categoria === "despesas" ||
            categoria === "cartoes" ||
            categoria === "investimentos" ||
            categoria === "saidasNaoOper"
        ) {
            mes.saidas += valor;

            const descricao = String(m.descricao || "Sem descrição").trim();

            // Não contabiliza linhas de totais como despesas individuais
            if (!/valor total$/i.test(descricao)) {
                maioresDespesas.set(
                    descricao,
                    (maioresDespesas.get(descricao) || 0) + valor
                );
            }
        }
    });

    meses.forEach(m => {
        m.resultado = m.entradas - m.saidas;
    });

    const totalEntradas = meses.reduce(
        (soma, m) => soma + m.entradas, 0
    );

    const totalSaidas = meses.reduce(
        (soma, m) => soma + m.saidas, 0
    );

    const resultado = totalEntradas - totalSaidas;

    const mesesAtivos = meses.filter(
        m => m.quantidade > 0
    ).length;

    const totalPorCategoria = {
        receitas: meses.reduce((s, m) => s + m.receitas, 0),
        despesas: meses.reduce((s, m) => s + m.despesas, 0),
        cartoes: meses.reduce((s, m) => s + m.cartoes, 0),
        investimentos: meses.reduce((s, m) => s + m.investimentos, 0),
        receitasNaoOper: meses.reduce((s, m) => s + m.receitasNaoOper, 0),
        saidasNaoOper: meses.reduce((s, m) => s + m.saidasNaoOper, 0)
    };

    return {
        meses,
        totalEntradas,
        totalSaidas,
        resultado,
        quantidadeTotal,
        mesesAtivos,
        totalPorCategoria,

        maioresDespesas: [...maioresDespesas.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8),

        maioresEntradas: [...maioresEntradas.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
    };
}


// ========================================
// INDICADORES
// ========================================

function dashboardAtualizarIndicadores(dados) {

    document.getElementById("dashTotalEntradas").textContent =
        dashboardFormatarMoeda(dados.totalEntradas);

    document.getElementById("dashTotalSaidas").textContent =
        dashboardFormatarMoeda(dados.totalSaidas);

    const resultadoElemento = document.getElementById("dashResultado");

    resultadoElemento.textContent =
        dashboardFormatarMoeda(dados.resultado);

    resultadoElemento.style.color =
        dados.resultado >= 0 ? "#2ecc71" : "#e74c3c";

    document.getElementById("dashMediaEntradas").textContent =
        `Média mensal: ${dashboardFormatarMoeda(dados.totalEntradas / 12)}`;

    document.getElementById("dashMediaSaidas").textContent =
        `Média mensal: ${dashboardFormatarMoeda(dados.totalSaidas / 12)}`;

    const percentual = dados.totalEntradas > 0
        ? (dados.resultado / dados.totalEntradas) * 100
        : 0;

    document.getElementById("dashPercentualResultado").textContent =
        `${percentual.toLocaleString("pt-BR", {
            maximumFractionDigits: 2
        })}% das entradas`;

    document.getElementById("dashQuantidade").textContent =
        dados.quantidadeTotal.toLocaleString("pt-BR");

    document.getElementById("dashMesesAtivos").textContent =
        `${dados.mesesAtivos} meses com movimentações`;
}


// ========================================
// CONFIGURAÇÃO GERAL DOS GRÁFICOS
// ========================================

function dashboardCriarGrafico(id, configuracao) {

    if (dashboardGraficos[id]) {
        dashboardGraficos[id].destroy();
    }

    const canvas = document.getElementById(id);

    if (!canvas) return;

    dashboardGraficos[id] = new Chart(canvas, configuracao);
}

function dashboardOpcoesGrafico(tipoValor = "moeda") {

    return {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            intersect: false,
            mode: "index"
        },

        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#aeb7c4",
                    usePointStyle: true,
                    padding: 18,
                    font: {
                        size: 11
                    }
                }
            },

            tooltip: {
                callbacks: {
                    label: function(context) {
                        const valor = context.parsed.y ?? context.parsed;

                        return `${context.dataset.label}: ${
                            tipoValor === "moeda"
                                ? dashboardFormatarMoeda(valor)
                                : valor
                        }`;
                    }
                }
            }
        },

        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: "#aeb7c4"
                },
                border: {
                    display: false
                }
            },

            y: {
                beginAtZero: true,
                grid: {
                    color: "rgba(150, 160, 180, 0.10)"
                },
                ticks: {
                    color: "#aeb7c4",
                    callback: function(valor) {
                        return Number(valor).toLocaleString("pt-BR", {
                            notation: "compact",
                            maximumFractionDigits: 1
                        });
                    }
                },
                border: {
                    display: false
                }
            }
        }
    };
}


// ========================================
// GRÁFICO 1
// RECEITAS X DESPESAS EM LINHA
// ========================================

function dashboardGraficoReceitasDespesas(dados) {

    const opcoes = dashboardOpcoesGrafico();

    dashboardCriarGrafico("graficoReceitasDespesas", {
        type: "line",

        data: {
            labels: dashboardMesesAbreviados,

            datasets: [
                {
                    label: "Entradas",
                    data: dados.meses.map(m => m.entradas),
                    borderColor: dashboardCores.receitas,
                    backgroundColor: "rgba(46, 204, 113, 0.10)",
                    borderWidth: 3,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true
                },
                {
                    label: "Saídas",
                    data: dados.meses.map(m => m.saidas),
                    borderColor: dashboardCores.despesas,
                    backgroundColor: "rgba(231, 76, 60, 0.08)",
                    borderWidth: 3,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true
                }
            ]
        },

        options: opcoes
    });
}


// ========================================
// GRÁFICO 2
// RECEITAS X DESPESAS EM BARRAS
// ========================================

function dashboardGraficoBarras(dados) {

    const opcoes = dashboardOpcoesGrafico();

    dashboardCriarGrafico("graficoBarrasMensais", {
        type: "bar",

        data: {
            labels: dashboardMesesAbreviados,

            datasets: [
                {
                    label: "Entradas",
                    data: dados.meses.map(m => m.entradas),
                    backgroundColor: dashboardCores.receitas,
                    borderRadius: 5,
                    maxBarThickness: 25
                },
                {
                    label: "Saídas",
                    data: dados.meses.map(m => m.saidas),
                    backgroundColor: dashboardCores.despesas,
                    borderRadius: 5,
                    maxBarThickness: 25
                }
            ]
        },

        options: opcoes
    });
}


// ========================================
// GRÁFICO 3
// RESULTADO MENSAL
// ========================================

function dashboardGraficoResultado(dados) {

    const opcoes = dashboardOpcoesGrafico();

    opcoes.scales.y.beginAtZero = false;

    dashboardCriarGrafico("graficoResultado", {
        type: "line",

        data: {
            labels: dashboardMesesAbreviados,

            datasets: [
                {
                    label: "Resultado",
                    data: dados.meses.map(m => m.resultado),
                    borderColor: dashboardCores.resultado,
                    backgroundColor: "rgba(52, 152, 219, 0.15)",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    tension: 0.35,
                    fill: true,
                    segment: {
                        borderColor: ctx => {
                            return ctx.p1.parsed.y >= 0
                                ? "#3498db"
                                : "#e74c3c";
                        }
                    }
                }
            ]
        },

        options: opcoes
    });
}


// ========================================
// GRÁFICO 4
// COMPOSIÇÃO DAS SAÍDAS
// ========================================

function dashboardGraficoComposicao(dados) {

    const categorias = [
        {
            nome: "Despesas",
            valor: dados.totalPorCategoria.despesas,
            cor: dashboardCores.despesas
        },
        {
            nome: "Cartões",
            valor: dados.totalPorCategoria.cartoes,
            cor: dashboardCores.cartoes
        },
        {
            nome: "Investimentos",
            valor: dados.totalPorCategoria.investimentos,
            cor: dashboardCores.investimentos
        },
        {
            nome: "Saídas não operacionais",
            valor: dados.totalPorCategoria.saidasNaoOper,
            cor: dashboardCores.saidasNaoOper
        }
    ].filter(c => c.valor > 0);

    dashboardCriarGrafico("graficoComposicao", {
        type: "doughnut",

        data: {
            labels: categorias.map(c => c.nome),

            datasets: [{
                data: categorias.map(c => c.valor),
                backgroundColor: categorias.map(c => c.cor),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#aeb7c4",
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 10
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${
                                dashboardFormatarMoeda(context.raw)
                            }`;
                        }
                    }
                }
            }
        }
    });
}


// ========================================
// GRÁFICO 5
// MAIORES DESPESAS
// ========================================

function dashboardGraficoMaioresDespesas(dados) {

    const despesas = dados.maioresDespesas;

    dashboardCriarGrafico("graficoMaioresDespesas", {
        type: "bar",

        data: {
            labels: despesas.map(d => d[0]),

            datasets: [{
                label: "Total",
                data: despesas.map(d => d[1]),
                backgroundColor: "#e67e22",
                borderRadius: 5,
                maxBarThickness: 24
            }]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: context =>
                            dashboardFormatarMoeda(context.raw)
                    }
                }
            },

            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(150, 160, 180, 0.10)"
                    },
                    ticks: {
                        color: "#aeb7c4",
                        callback: valor =>
                            Number(valor).toLocaleString("pt-BR", {
                                notation: "compact"
                            })
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#aeb7c4",
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}


// ========================================
// GRÁFICO 6
// RESULTADO ACUMULADO
// ========================================

function dashboardGraficoAcumulado(dados) {

    let acumulado = 0;

    const valores = dados.meses.map(m => {
        acumulado += m.resultado;
        return acumulado;
    });

    const opcoes = dashboardOpcoesGrafico();

    opcoes.scales.y.beginAtZero = false;

    dashboardCriarGrafico("graficoAcumulado", {
        type: "line",

        data: {
            labels: dashboardMesesAbreviados,

            datasets: [{
                label: "Saldo acumulado",
                data: valores,
                borderColor: "#9b59b6",
                backgroundColor: "rgba(155, 89, 182, 0.13)",
                borderWidth: 3,
                pointRadius: 3,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: true
            }]
        },

        options: opcoes
    });
}



// ========================================
// GRÁFICO 7
// COMPOSIÇÃO DAS ENTRADAS
// ========================================

function dashboardGraficoComposicaoEntradas(dados) {

    const categorias = [
        {
            nome: "Receitas",
            valor: dados.totalPorCategoria.receitas,
            cor: dashboardCores.receitas
        },
        {
            nome: "Receitas não operacionais",
            valor: dados.totalPorCategoria.receitasNaoOper,
            cor: dashboardCores.receitasNaoOper
        }
    ].filter(c => c.valor > 0);

    dashboardCriarGrafico("graficoComposicaoEntradas", {
        type: "doughnut",

        data: {
            labels: categorias.map(c => c.nome),

            datasets: [{
                data: categorias.map(c => c.valor),
                backgroundColor: categorias.map(c => c.cor),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#aeb7c4",
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 10
                        }
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${
                                dashboardFormatarMoeda(context.raw)
                            }`;
                        }
                    }
                }
            }
        }
    });
}


// ========================================
// GRÁFICO 8
// MAIORES ENTRADAS
// ========================================

function dashboardGraficoMaioresEntradas(dados) {

    const entradas = dados.maioresEntradas;

    dashboardCriarGrafico("graficoMaioresEntradas", {
        type: "bar",

        data: {
            labels: entradas.map(e => e[0]),

            datasets: [{
                label: "Total",
                data: entradas.map(e => e[1]),
                backgroundColor: dashboardCores.receitas,
                borderRadius: 5,
                maxBarThickness: 24
            }]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            dashboardFormatarMoeda(context.raw)
                    }
                }
            },

            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(150, 160, 180, 0.10)"
                    },
                    ticks: {
                        color: "#aeb7c4",
                        callback: valor =>
                            Number(valor).toLocaleString("pt-BR", {
                                notation: "compact"
                            })
                    }
                },

                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#aeb7c4",
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}


// ========================================
// GRÁFICO 9
// EVOLUÇÃO MENSAL POR TIPO
// ========================================

function dashboardGraficoEvolucaoTipos(dados) {

    const categorias = [
        {
            label: "Receitas",
            campo: "receitas",
            cor: dashboardCores.receitas
        },
        {
            label: "Receitas não operacionais",
            campo: "receitasNaoOper",
            cor: dashboardCores.receitasNaoOper
        },
        {
            label: "Despesas",
            campo: "despesas",
            cor: dashboardCores.despesas
        },
        {
            label: "Cartões",
            campo: "cartoes",
            cor: dashboardCores.cartoes
        },
        {
            label: "Investimentos",
            campo: "investimentos",
            cor: dashboardCores.investimentos
        },
        {
            label: "Saídas não operacionais",
            campo: "saidasNaoOper",
            cor: dashboardCores.saidasNaoOper
        }
    ];

    const datasets = categorias.map(categoria => ({
        label: categoria.label,

        data: dados.meses.map(m => m[categoria.campo]),

        borderColor: categoria.cor,
        backgroundColor: categoria.cor,

        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.35,

        fill: false
    }));

    dashboardCriarGrafico("graficoEvolucaoTipos", {
        type: "line",

        data: {
            labels: dashboardMesesAbreviados,
            datasets: datasets
        },

        options: dashboardOpcoesGrafico()
    });
}


// ========================================
// TABELA RESUMO MENSAL
// ========================================

function dashboardAtualizarTabela(dados) {

    const corpo = document.getElementById("dashboardTabelaCorpo");
    const rodape = document.getElementById("dashboardTabelaRodape");

    corpo.innerHTML = dados.meses.map((m, i) => {

        const margem = m.entradas > 0
            ? (m.resultado / m.entradas) * 100
            : 0;

        const classeResultado = m.resultado >= 0
            ? "dashboard-positivo"
            : "dashboard-negativo";

        return `
            <tr>
                <td>${dashboardMeses[i]}</td>

                <td class="dashboard-positivo">
                    ${dashboardFormatarMoeda(m.entradas)}
                </td>

                <td class="dashboard-negativo">
                    ${dashboardFormatarMoeda(m.saidas)}
                </td>

                <td class="${classeResultado}">
                    ${dashboardFormatarMoeda(m.resultado)}
                </td>

                <td class="${classeResultado}">
                    ${margem.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}%
                </td>
            </tr>
        `;
    }).join("");

    const margemTotal = dados.totalEntradas > 0
        ? (dados.resultado / dados.totalEntradas) * 100
        : 0;

    const classeTotal = dados.resultado >= 0
        ? "dashboard-positivo"
        : "dashboard-negativo";

    rodape.innerHTML = `
        <tr>
            <td>TOTAL DO ANO</td>

            <td class="dashboard-positivo">
                ${dashboardFormatarMoeda(dados.totalEntradas)}
            </td>

            <td class="dashboard-negativo">
                ${dashboardFormatarMoeda(dados.totalSaidas)}
            </td>

            <td class="${classeTotal}">
                ${dashboardFormatarMoeda(dados.resultado)}
            </td>

            <td class="${classeTotal}">
                ${margemTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}%
            </td>
        </tr>
    `;
}


// ========================================
// ATUALIZAÇÃO COMPLETA DO DASHBOARD
// ========================================

function atualizarDashboard() {

    const seletor = document.getElementById("dashboardAno");

    if (!seletor || !seletor.value) return;

    const ano = Number(seletor.value);

    const dados = dashboardPrepararDados(ano);

    dashboardDadosAno = dados;

    dashboardAtualizarIndicadores(dados);

    dashboardGraficoReceitasDespesas(dados);
    dashboardGraficoBarras(dados);
    dashboardGraficoResultado(dados);

    // GRÁFICOS DE SAÍDAS
    dashboardGraficoComposicao(dados);
    dashboardGraficoMaioresDespesas(dados);

    // GRÁFICOS DE ENTRADAS
    dashboardGraficoComposicaoEntradas(dados);
    dashboardGraficoMaioresEntradas(dados);

    // COMPARAÇÃO MENSAL
    dashboardGraficoEvolucaoTipos(dados);

    // RESULTADO ACUMULADO
    dashboardGraficoAcumulado(dados);

    dashboardAtualizarTabela(dados);
}


// ========================================
// INICIALIZAÇÃO
// ========================================

function inicializarDashboard() {

    const seletor = document.getElementById("dashboardAno");

    if (!seletor || typeof movimentacoes === "undefined") return;

    const anos = [...new Set(
        movimentacoes
            .map(m => dashboardConverterData(m.data))
            .filter(Boolean)
            .map(data => data.ano)
    )].sort((a, b) => b - a);

    const anoAtual = new Date().getFullYear();

    if (!anos.length) {
        anos.push(anoAtual);
    }

    seletor.innerHTML = anos.map(ano => `
        <option value="${ano}">${ano}</option>
    `).join("");

    seletor.value = anos.includes(anoAtual)
        ? anoAtual
        : anos[0];

    seletor.addEventListener("change", atualizarDashboard);

    atualizarDashboard();
}

document.addEventListener("DOMContentLoaded", inicializarDashboard);



/* ==========================================
   INICIALIZAÇÃO
========================================== */

carregarAnosFluxo();


