function limparDadosMovimentacaoLivreCaixa(id) {
    const tabela = document.getElementById(id);
    const linhas = tabela.querySelectorAll('tr');

    const dataAtual = new Date();
    const linhasParaRemover = [];

    linhas.forEach(linha => {
        const campoData = linha.querySelector('.caixa-movimentacao-livre-data');
        if (!campoData || !campoData.value) return;

        const data = new Date(campoData.value);

        if (
            data.getMonth() !== dataAtual.getMonth() ||
            data.getFullYear() !== dataAtual.getFullYear()
        ) {
            linhasParaRemover.push(linha);
        }
    });

    linhasParaRemover.forEach(linha => {
        linha.querySelector('.remover-linha')?.click();
    });
}

function obterValorCelulaPlanilha(celula){

    if (celula === undefined) return '';

    var elemento = celula.querySelector('[data-valor]');

    if (elemento) {
        var valor = elemento.dataset.valor;

        // se for número → retorna número
        if (!isNaN(valor)) return parseFloat(valor);

        return valor.toString().toLowerCase();
    }

    var texto = celula.textContent.trim();

    if (!isNaN(texto)) return parseFloat(texto);

    return texto.toLowerCase();
}

function ordenarTabelaPlanilha(tabela, indiceColuna, ordem) {

    var tbody = tabela.querySelector('tbody');
    var todasLinhas = Array.from(tbody.querySelectorAll('tr'));

    // linhas que não devem se mover
    var linhasFixas = todasLinhas.filter(linha =>
        linha.classList.contains('boletim-mensal-total-filtro') ||
        linha.classList.contains('boletim-mensal-saldoMesPassado') ||
        linha.offsetParent === null
    );

    // linhas que serão ordenadas
    var linhasOrdenar = todasLinhas.filter(linha =>
        !linhasFixas.includes(linha)
    );

    linhasOrdenar.sort((a, b) => {
        var valorA = obterValorCelulaPlanilha(a.children[indiceColuna]);
        var valorB = obterValorCelulaPlanilha(b.children[indiceColuna]);

        if (valorA === '' || valorB === '') return 0;

        if (typeof valorA === 'number' && typeof valorB === 'number') {
            return ordem === 'asc'
                ? valorA - valorB
                : valorB - valorA;
        }

        return ordem === 'asc'
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
    });

    // limpa tbody
    tbody.innerHTML = '';

    // adiciona ordenadas primeiro
    linhasOrdenar.forEach(l => tbody.appendChild(l));

    // adiciona fixas no final (sempre última)
    linhasFixas.forEach(l => tbody.appendChild(l));
}

function ativarOrdenacaoPlanilha(tabela){

    var cabecalhos = tabela.querySelectorAll('thead th');

    cabecalhos.forEach((th, index) => {
        // evita registrar evento 2x
        if (th.dataset.ordenacaoAtiva) return;
        th.dataset.ordenacaoAtiva = true;

        // ordem inicial
        th.dataset.ordem = 'desc';

        th.style.cursor = 'pointer';

        th.addEventListener('click', () => {

            // alterna ordem
            var novaOrdem = th.dataset.ordem === 'asc' ? 'desc' : 'asc';
            th.dataset.ordem = novaOrdem;

            ordenarTabelaPlanilha(tabela, index, novaOrdem);
        });
    });
}

function iniciarOrdenacaoPlanilhas(ehChackList = false) {
    if (ehChackList) {

        document.querySelectorAll('.classCheckList table').forEach(tabela => {
            ativarOrdenacaoPlanilha(tabela);
        });
        return;
    }

    document.querySelectorAll('.boletim table').forEach(tabela => {
        ativarOrdenacaoPlanilha(tabela);
    });
}

function obterValorCelula(celula){
    var elemento = celula.querySelector('[data-valor]');

    if (elemento) { return parseFloat(elemento.dataset.valor) || 0;}

    return celula.textContent.trim().toLowerCase();
}

function ordenarTabelaPorColuna(tabela, indiceColuna, ordem){

    var tbody = tabela.querySelector('tbody');
    var linhas = Array.from(tbody.querySelectorAll('tr'));

    linhas.sort((a, b) => {

        var valorA = obterValorCelula(a.children[indiceColuna]);
        var valorB = obterValorCelula(b.children[indiceColuna]);

        if (typeof valorA === 'number' && typeof valorB === 'number') {
            return ordem === 'asc' ? valorA - valorB : valorB - valorA;
        }

        // ordenação texto
        if (valorA < valorB) return ordem === 'asc' ? -1 : 1;
        if (valorA > valorB) return ordem === 'asc' ? 1 : -1;
        return 0;
    });

    // reordena DOM
    linhas.forEach(linha => tbody.appendChild(linha));
}

function ativarOrdenacaoTabela(tabela){

    var cabecalhos = tabela.querySelectorAll('thead th');

    cabecalhos.forEach((th, index) => {

        // ignora colunas 0 e 1
        if (index <= 1) return;

        var ordemAtual = 'desc';

        th.style.cursor = 'pointer';

        th.addEventListener('click', () => {

            ordemAtual = ordemAtual === 'asc' ? 'desc' : 'asc';

            ordenarTabelaPorColuna(tabela, index, ordemAtual);
        });
    });
}

function atualizarDadosGrupos (){
    var linhas = document.getElementsByClassName('linha-grupo-investimento');
    listaCodAcoes();

    for (let i = 0; i < linhas.length; i++) {
        let novaLinha = linhas[i];

        var codAcao = novaLinha.querySelector('.cod-acoes-escolha');
        var empresaInput = novaLinha.querySelector('.descricao-input');
        var valorAplicadoInput = novaLinha.querySelector('.valor-aplicado-parte-grupo');
        var valorizacaoLabel = novaLinha.querySelector('.valorizacao');
        var qtdeCotas = novaLinha.querySelector('.qtde-cota');
        var valorMediaAcao = novaLinha.querySelector('.valor-media-acao');

        var id = novaLinha.classList[1].replace('id-', '');

        prenecherDadosGrupos(codAcao, empresaInput, valorAplicadoInput, valorizacaoLabel, qtdeCotas, valorMediaAcao);
        atualizaTotaisGrupo(id);
    }
}

var obcoesColunasGrupos = {
    empresa: { index: 1, nome: 'Empresa' },
    valorTotal: { index: 2, nome: 'Valor Total' },
    valorizacao: { index: 3, nome: 'Valorização' },
    taxaRetorno: { index: 4, nome: 'Taxa Retorno' },
    qtdeCotas: { index: 5, nome: 'Qtd. Ações' },
    valorMediaAcao: { index: 6, nome: 'Valor Média' },
    taxaRetornoReal: { index: 7, nome: 'Taxa Retorno Aplicado' },
    Provento: { index: 8, nome: 'Provento' },
};

function exibirOuOcultarColunaGrupos(chave, mostrar){

    var indiceColuna = obcoesColunasGrupos[chave].index; // tabela começa em 0

    document.querySelectorAll('.grupoInvestimento table').forEach(tabela => {

        tabela.querySelectorAll('tr').forEach(linha => {

            var celula = linha.children[indiceColuna];
            if (!celula) return;

            celula.style.display = mostrar ? 'table-cell' : 'none';
        });

    });
}

function criarCaixasSelecaoColunasGrupos(){

    var div = document.getElementById('grupos-investimentos-colunas-selecao');
    div.innerHTML = '';

    Object.entries(obcoesColunasGrupos).forEach(([chave, config]) => {

        // container opcional (organização visual)
        var container = document.createElement('div');

        // checkbox
        var caixa = document.createElement('input');
        caixa.type = 'checkbox';
        caixa.id = `coluna-grupo-${chave}`;
        caixa.name = 'coluna-grupo';
        caixa.value = chave;
        caixa.checked = true; // começa visível

        // quando mudar → oculta/exibe
        caixa.addEventListener('change', function(){
            exibirOuOcultarColunaGrupos(chave, this.checked);
        });

        // label
        var label = document.createElement('label');
        label.setAttribute('for', caixa.id);
        label.textContent = config.nome;

        container.appendChild(caixa);
        container.appendChild(label);
        div.appendChild(container);

        // garante estado inicial
        exibirOuOcultarColunaGrupos(chave, true);
    });
}

criarCaixasSelecaoColunasGrupos();

function atualizarVisibilidadeColunasGrupos(){

    Object.keys(obcoesColunasGrupos).forEach(chave => {

        var checkbox = document.getElementById(`coluna-grupo-${chave}`);
        if (!checkbox) return;

        exibirOuOcultarColunaGrupos(chave, checkbox.checked);
    });
}

function addLinhasAcoesDistribuicaoPonderada() {
    var movimentacoes = criarDicionarioDistribuicaoPonderada();
    var acoes = document.getElementsByClassName('acao');

    for (let i = 0; i < acoes.length; i++) {
        let acao = acoes[i];
        let codigo = acao.querySelector('.codigos-acoes').value;

        for (const chave in movimentacoes) {
            if (movimentacoes[chave].codigo === codigo) {

                acao.querySelector('.adicionar-linha-acao').click();

                var tabela = acao.querySelector('.tabela-corpo-acao');
                var linhas = tabela.getElementsByTagName('tr');

                // pega a linha criada (última ou primeira dependendo do seu carregou)
                var linha = linhas[0]; 
                var celulas = linha.getElementsByTagName('td');

                const valorInput = celulas[1].querySelector('.valor-input');
                const QtdeInput = celulas[3].querySelector('.qtde-cota');
                const valorTotalInput = celulas[4].querySelector('.valor-total');

                QtdeInput.value = movimentacoes[chave].qtdeCota;
                valorInput.value = movimentacoes[chave].valorCota;
                formatarMoeda(valorInput, '0')

                // ✅ executa as 3 funções na ordem
                var id = acao.id; // ou como você obtém o id
                id = id.split('-')[1];

                atualizarValorTotalAcao(valorInput, QtdeInput, valorTotalInput, id);
                atualizarQtdeCotas(id);
                atualizarTodosProventos();

                delete movimentacoes[chave];
                linha.classList.add('acao-adicionada-distribuicao-ponderada');
            }
        }
    }
}

function removerLinhasAcoesDistribuicaoPonderada() {
    var linhas = document.getElementsByClassName('acao-adicionada-distribuicao-ponderada');

    while (linhas.length > 0) {
        var celulas = linhas[0].getElementsByTagName('td');
        celulas[5].querySelector('.remover-linha').click();
    }
}

function criarDicionarioDistribuicaoPonderada() {
    const tabela = document.getElementById('distribuicao-ponderada-tabela-corpo');
    const linhas = tabela.getElementsByTagName('tr');
    var dicionario = {};

    for (let i = 0; i < linhas.length; i++) {
        const celulas = linhas[i].getElementsByTagName('td');
        var codigo = celulas[0].querySelector('.cod-acoes-escolha').value;
        var valorCota = celulas[2].querySelector('.valor-cota-acao').value;
        var qtdeCota = celulas[5].querySelector('.qtde-cota').value;

        if (qtdeCota === '' || qtdeCota === '0') continue;

        dicionario[i] = {
            codigo: codigo,
            valorCota: valorCota,
            qtdeCota: qtdeCota
        }
    }

    return dicionario;
}

function criarCronogramaCaixas (){
    let saldoStatus = true;
    let dicionarioValoresMensaisCartoes = calcularValoresMensais(dicionarioReceitas, dicionarioCartoes, dicionarioDiversos, dicionarioCofrinho, dicionarioAcoes, dicionarioProventosAcoes, dicionarioMoedas, hoje, 12);
    criarBaseBoletimCaixa(dicionarioValoresMensaisCartoes["1"], true);
    const divsCronogramasCaixas = document.querySelectorAll('.cronograma-caixas');
    const saldosCaixasIniciais = document.querySelectorAll('.caixa-saldo-input');
    const saldoAtuais = document.querySelectorAll('.caixa-saldo-atual-input'); 
    let diaHoje = hoje.getDate();

    let contador = 0;

    divsCronogramasCaixas.forEach(divCronogramaCaixa => {
        let saldo = 0;
        let saldoInicial = parseFloat(saldosCaixasIniciais[contador].getAttribute('data-valor')) || 0;
        saldo = saldoInicial;
        
        let saldoFormatado = parseFloat(saldo).toFixed(2);
        saldoFormatado = formatarResultado(saldoFormatado, 2)
        
        let dados = dicionarioCronogramaCaixas[contador];
        
        let _valor = parseFloat(saldo).toFixed(2);
        _valor = formatarResultado(saldo.toString(), 2);
        
        var novaLinha = document.createElement('tr');
        
        novaLinha.innerHTML = `
            <td><label style="width: 200px;" data-valor="saldo Passado">Saldo Passado</label></td>
            <td><label data-valor="${saldo}" style="width: 85px;">R$ ${_valor}</label></td>
            <td><label style="width: 200px;" data-valor="1">1</label></td>
            <td class='boletim-mensal-saldo'><label data-valor="${saldo}">R$ ${_valor}</label></td>
        `;

        novaLinha.style.backgroundColor = 'rgba(211, 249, 216, 0.5)' // verde claro, 50% transparente
        novaLinha.style.color = 'black';

        divCronogramaCaixa.innerHTML = '';
        divCronogramaCaixa.appendChild(novaLinha);

        for (let dia = 1; dia <= 31; dia++) {
            // Verifica se o dia está presente nos dados
            for (const chave in dados) {
                if (dados[chave].dia === dia) {
                    const descricao = dados[chave].descricao;
                    const valor = dados[chave].valor;

                    //if (valor > 0) {entradas += valor}
                    //else {saidas += valor}

                    // Formata o valor
                    let _valor = parseFloat(valor).toFixed(2);
                    _valor = formatarResultado(_valor.toString(), 2);

                    // Atualiza o saldo
                    saldo += valor;
                    saldoFormatado = parseFloat(saldo).toFixed(2);
                    saldoFormatado = formatarResultado(saldoFormatado, 2)

                    // Cria uma nova linha
                    const novaLinha = document.createElement('tr');
                    if (dados[chave].tipo === 'boletim-mensal-cofrinho'){
                        totalCofrinho += valor*-1;
                        novaLinha.title = `Total Aplicado: ${formatarMoeda_resultado(totalCofrinho)}`;
                        dados[chave].explicacao = `Total Aplicado: ${formatarMoeda_resultado(totalCofrinho)}`;
                    } else {
                        novaLinha.title = dados[chave].explicacao;
                    }
                    if (dados[chave].movimentacao === 'entrada'){
                        novaLinha.style.backgroundColor = 'rgba(211, 249, 216, 0.5)' // verde claro, 50% transparente
                    } else if (dados[chave].movimentacao === 'saida'){
                        novaLinha.style.backgroundColor = 'rgba(255, 204, 204, 0.5)' // rosa claro, 50% transparente
                    } else {
                        novaLinha.style.backgroundColor = 'rgba(211, 237, 249, 0.5)' 
                    }

                    novaLinha.style.color = 'black';  // Cor do texto 

                    novaLinha.className = `${dados[chave].tipo} boletim-mensal-Descricao-Item  linha-${dados[chave].movimentacao}`;
                    novaLinha.setAttribute('movimentacao', `movimentacao-${dados[chave].movimentacao}`);

                    novaLinha.setAttribute('valorLinha', valor);
                    novaLinha.innerHTML = `
                        <td><label style="width: 200px;" data-valor="${descricao}">${descricao}</label></td>
                        <td><label data-valor="${valor}" style="width: 85px;">R$ ${_valor}</label></td>
                        <td><label style="width: 200px;" data-valor="${dia}">${dia}</label></td>
                        <td class='boletim-mensal-saldo'data-valor="${saldo}"><label>R$ ${saldoFormatado}</label></td>
                    `;

                    novaLinha.addEventListener('click', () => {
                        notificacaoExplicacaoLinha(dados[chave].explicacao);
                    });

                    // Adiciona a nova linha ao tbody
                    divCronogramaCaixa.appendChild(novaLinha);
                }
            }

             if (dia === diaHoje) {
                saldoAtuais[contador].value = saldoFormatado;
            }
        }
        contador++;
    });
}

let contadorCaixas = 0;

function addCaixa() {
    const divContainer = document.getElementById('caixas-container');

    const novaDiv = document.createElement('div');
    novaDiv.className = 'caixa-item';
    novaDiv.setAttribute('data-caixa-id', contadorCaixas);

    novaDiv.innerHTML = `
        <div class="caixa-header" id="caixa-header-${contadorCaixas}">
            <label for="caixa-nome-${contadorCaixas}">Nome da Caixa:</label>
            <input type="text" id="caixa-nome-${contadorCaixas}" class="caixa-nome-input descricao-input" placeholder="Nome da Caixa">

            <label for="caixa-saldo-${contadorCaixas}">Saldo Inicial:</label>
            <input type="text" id="caixa-saldo-${contadorCaixas}" class="caixa-saldo-input valor-input" placeholder="R$ 0,00" data-valor="0" onblur="formatarValorCaixaLivre(this, ${contadorCaixas})">

            <label for="caixa-saldo-atual-${contadorCaixas}">Saldo Atual:</label>
            <input type="text" id="caixa-saldo-atual-${contadorCaixas}" class="caixa-saldo-atual-input valor-input" placeholder="R$ 0,00" disabled data-valor="0">

            <button class="remover-linha" onclick="removerCaixa(${contadorCaixas})">Remover Caixa</button>

            <p></p>
            <div class="caixa-body">
                <h3>Itens da Caixa Livre 
                <button onclick="adicionarItemCaixaLivre(${contadorCaixas})" class="remover-linha">Adicionar Item</button>
                <button onclick="limparDadosMovimentacaoLivreCaixa('tabela-caixa-${contadorCaixas}-movimentacao-livre')" class="remover-linha limpar-dados-movimentacao-livre-caixa">Limpar Dados</button>
                </h3>
                <div class="itens-caixa-container" id="itens-caixa-container-${contadorCaixas}"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Movimentação</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody class="tabela-caixa-movimentacao-livre" id="tabela-caixa-${contadorCaixas}-movimentacao-livre">
                        <!-- Linhas da tabela serão adicionadas aqui -->
                    </tbody>
                </table>
            </div>

            <p></p>
            <div class="caixa-body">
                <h3>Itens da Caixa Fixa <button onclick="adicionarItemCaixaFixa(${contadorCaixas})" class="remover-linha">Adicionar Item</button></h3>
                <div class="itens-caixa-container" id="itens-caixa-fixa-container-${contadorCaixas}"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Fonte</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody class="tabela-caixa-movimentacao-fixa" id="tabela-caixa-${contadorCaixas}-movimentacao-fixa">
                        <!-- Linhas da tabela serão adicionadas aqui -->
                    </tbody>
                </table>
            </div>

            <p></p>
            <div class="caixa-body">
                <h3> Cronograma</h3>
                <div class="cronograma-container" id="cronograma-container-caixa-${contadorCaixas}">
                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Dia</th>
                                <th>Saldo</th>
                            </tr>
                        </thead>
                        <tbody class="cronograma-caixas" id="cronograma-caixa-${contadorCaixas}">
                            <!-- Linhas da tabela serão adicionadas aqui -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
    divContainer.appendChild(novaDiv);
    contadorCaixas++;
}

function removerCaixa(idCaixa) {
    const divContainer = document.getElementById('caixas-container');
    const caixaParaRemover = divContainer.querySelector(`div[data-caixa-id="${idCaixa}"]`);
    if (caixaParaRemover) {
        divContainer.removeChild(caixaParaRemover);
    }
}

function adicionarItemCaixaLivre(idCaixa) {
    const tabelaCorpo = document.getElementById(`tabela-caixa-${idCaixa}-movimentacao-livre`);
    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>
            <select class="caixa-movimentacao-livre-tipo descricao-input ">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="retorno">Retornar</option>
            </select>
        </td>
        <td><input type="text" class="caixa-movimentacao-livre-descricao descricao-input" placeholder="Descrição"></td>
        <td><input type="text" class="caixa-movimentacao-livre-valor valor-input" placeholder="R$ 0,00" onblur="formatarValorCaixaLivre(this, ${idCaixa})"></td>
        <td><input type="date" class="caixa-movimentacao-livre-data data-input"></td>
        <td><button class="remover-linha" onclick="removerItemCaixaLivre(this)">Remover</button></td>
    `;

    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    var dataInput = novaLinha.querySelector('.caixa-movimentacao-livre-data');
    const hoje = new Date();
    dataInput.value = hoje.toISOString().split('T')[0];

    const btnRemover = novaLinha.querySelector('.remover-linha');
    btnRemover.addEventListener('click', function() {
        removerItemCaixaLivre(this);
        ataulizarSaldoCaixas(idCaixa);
    });

    var inputMovimentaca = novaLinha.querySelector('.caixa-movimentacao-livre-tipo');
    inputMovimentaca.addEventListener('change', function() {
        ataulizarSaldoCaixas(idCaixa);
    });

    dataInput.addEventListener('change', function() {
        ataulizarSaldoCaixas(idCaixa);
    })
    ataulizarSaldoCaixas(idCaixa);
}

function formatarValorCaixaLivre(input, idCaixa) {
    let valorTexto = input.value.replace('R$','').replace(/\./g,'').replace(',','.');
    let valorNum = parseFloat(valorTexto);
    if (isNaN(valorNum)) {
        valorNum = 0;
    }
    input.value = `R$ ${formatarResultado(valorNum.toFixed(2), 2)}`;
    input.setAttribute('data-valor', valorNum);
    ataulizarSaldoCaixas(idCaixa);
}

function removerItemCaixaLivre(botao) {
    const linha = botao.closest('tr');
    linha.remove();
}

function adicionarItemCaixaFixa(idCaixa) {
    const tabelaCorpo = document.getElementById(`tabela-caixa-${idCaixa}-movimentacao-fixa`);
    const novaLinha = document.createElement('tr');
    novaLinha.classList.add(`movimentacao-caixa-fixa-linha-${idCaixa}`);
    novaLinha.innerHTML = `
        <td>
            <select class="caixa-movimentacao-fixa-fonte descricao-input">
                <option value="cartao">Cartão</option>
                <option value="receita">Receita</option>
                <option value="dividas-diversas">Dívidas Diversas</option>
                <option value="investimento">Investimento</option>
                <option value="cambio">Câmbio</option>
                <option value="cofrinho">Cofrinho</option>
            </select>
        </td>
        <td>
            <select class="caixa-movimentacao-fixa-tipo descricao-input">
        </td>
        <td><input type="text" class="caixa-movimentacao-fixa-valor valor-input" placeholder="R$ 0,00" disabled></td>
        <td><button class="remover-linha" onclick="removerItemCaixaFixa(this, ${idCaixa})">Remover</button></td>
    `;
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    const btnRemover = novaLinha.querySelector('.remover-linha');
    btnRemover.addEventListener('click', function() {
        removerItemCaixaFixa(this, idCaixa);
    });

    const selectFonte = novaLinha.querySelector('.caixa-movimentacao-fixa-fonte');
    const selectTipo = novaLinha.querySelector('.caixa-movimentacao-fixa-tipo');
    const inputValorFixa = novaLinha.querySelector('.caixa-movimentacao-fixa-valor');

    selectFonte.addEventListener('change', function() {
        atualizarSelectTipo(selectFonte, selectTipo, inputValorFixa);
        ataulizarSaldoCaixas(idCaixa);
    });
    atualizarSelectTipo(selectFonte, selectTipo, inputValorFixa);

    selectTipo.addEventListener('change', function() {
        let valor = parseFloat(selectTipo.value).toFixed(2) *1;
        let valor_ = `R$ ${formatarResultado(valor.toString(), 2)}`;
        inputValorFixa.value = valor_;
        inputValorFixa.setAttribute('data-valor', valor);
        ataulizarSaldoCaixas(idCaixa);
    });
    ataulizarSaldoCaixas(idCaixa);
    lsitaItensFixos.push(novaLinha);
}


function atualizarSelectTipo(selectFonte, selectTipo, inputValorFixa) {
    inputValorFixa.value = 'R$ 0,00';
    inputValorFixa.setAttribute('data-valor', '0');
    const dicionarioGeralTipoCaixaFixa = criarDicionarioGeralTipoCaixaFixa();
    const fonteSelecionada = selectFonte.value;
    let opcoesTipo = {};
    switch (fonteSelecionada) {
        case 'cartao':
            opcoesTipo = dicionarioGeralTipoCaixaFixa['cartao'] || {};
            break;
        case 'receita':
            opcoesTipo = dicionarioGeralTipoCaixaFixa['receita'] || {};
            break;
        case 'dividas-diversas':
            opcoesTipo = dicionarioGeralTipoCaixaFixa['dividas-diversas'] || {};
            break;
        case 'investimento':
            opcoesTipo = dicionarioGeralTipoCaixaFixa['investimento'] || {};
            break;
        case 'cambio':
            opcoesTipo = dicionarioGeralTipoCaixaFixa['cambio'] || {};
            break;
        case 'cofrinho':
            opcoesTipo = dicionarioGeralTipoCaixaFixa['cofrinho'] || {};
            break;
        default:
            opcoesTipo = {};
    }

    selectTipo.innerHTML = '';
    for (const chave in opcoesTipo) {
        const descricao = opcoesTipo[chave].descricao;
        const valor = opcoesTipo[chave].valor;
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = descricao;
        selectTipo.appendChild(option);
    }

}

function criarDicionarioGeralTipoCaixaFixa() {
    dicionarioReceitas = atualizarDadosReceitas();
    dicionarioCartoes = atualizarDadosCartoes();
    dicionarioDiversos = atualizarDadosDiversos();
    dicionarioCofrinho = criarDicionarioCofrinho();
    dicionarioAcoes = criarDicionarioAcao();
    dicionarioProventosAcoes = criarDicionarioProventosAcoes();
    dicionarioMoedas = criarDicionarioMoedas();
    let dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), 5);

    let dicionarioValoresMensaisCartoes = calcularValoresMensais(dicionarioReceitas, dicionarioCartoes, dicionarioDiversos, dicionarioCofrinho, dicionarioAcoes, dicionarioProventosAcoes, dicionarioMoedas, dataHoje);

    var dicionarioGeralTipoCaixaFixa = {
        'receita': {
            0: {
                descricao: 'Selecione',
                valor: 0
            }
        },
        'cartao': {
            0: {
                descricao: 'Selecione',
                valor: 0
            }
        },
        'dividas-diversas': {
            0: {
                descricao: 'Selecione',
                valor: 0
            }
        },
        'investimento': {
            0: {
                descricao: 'Selecione',
                valor: 0
            }
        },
        'cambio': {
            0: {
                descricao: 'Selecione',
                valor: 0
            }
        },
        'cofrinho': {
            0: {
                descricao: 'Selecione',
                valor: 0
            }
        }
    };

    let contador = {'receita': 1, 'cartao': 1, 'dividas-diversas': 1, 'investimento': 1, 'cambio': 1, 'cofrinho': 1};
    let totais = {'receita': 0, 'cartao': 0, 'dividas-diversas': 0, 'investimento': 0, 'cambio': 0, 'cofrinho': 0, 'investimento-proventos': 0, 'investimento-venda': 0, 'investimento-compra': 0, 'cofrinho-entrada': 0, 'cofrinho-saida': 0};

    let dicionarioTotaisAdicional = {1:['investimento', 'investimento-proventos', 'provento'], 2:['investimento', 'investimento-venda', 'venda'], 3:['investimento', 'investimento-compra', 'compra'], 4:['cofrinho', 'cofrinho-entrada', 'entrada'], 5:['cofrinho', 'cofrinho-saida', 'saida']};

    for (const chave in dicionarioValoresMensaisCartoes[1]) {
        let dicionario = dicionarioValoresMensaisCartoes[1];
        if (chave !== "data") {
            let tipo = dicionario[chave].tipo.replace('boletim-mensal-', '').toLowerCase();
            if (!(tipo in dicionarioGeralTipoCaixaFixa)) {
                dicionarioGeralTipoCaixaFixa[tipo] = {};
                dicionarioGeralTipoCaixaFixa[tipo][contador[tipo]] = {
                    descricao: 'Selecione',
                    valor: 0
                };
                contador[tipo]++;
            }
            dicionarioGeralTipoCaixaFixa[tipo][contador[tipo]] = {
                descricao: dicionario[chave].descricao,
                valor: dicionario[chave].valor
            }
            totais[tipo] += dicionario[chave].valor;
            
            let subtipo = ''
            if (tipo === 'investimento') {
                if (dicionario[chave].descricao.toLowerCase().includes('provento')) {
                    subtipo = 'proventos';
                } else if (dicionario[chave].descricao.toLowerCase().includes('compra')) {
                    subtipo = 'compra';
                } else if (dicionario[chave].descricao.toLowerCase().includes('venda')) {
                    subtipo = 'venda';
                }
                totais[`investimento-${subtipo}`] += dicionario[chave].valor || 0;
            } else if (tipo === 'cofrinho') {
                if (dicionario[chave].descricao.toLowerCase().includes('retirar')) {
                    subtipo = 'entrada';
                } else if (dicionario[chave].descricao.toLowerCase().includes('Depositar')) {
                    subtipo = 'saida';
                }
                totais[`cofrinho-${subtipo}`] += dicionario[chave].valor || 0;
            }
            contador[tipo]++;
        }
    }

    for (const tipo in dicionarioGeralTipoCaixaFixa) {
        dicionarioGeralTipoCaixaFixa[tipo][contador[tipo]] = {
            descricao: 'Total',
            valor: totais[tipo]
        };
    }

    for (const chave in dicionarioTotaisAdicional) {
        const [tipo, subtipo, descricao] = dicionarioTotaisAdicional[chave];
        contador[tipo]++;
        dicionarioGeralTipoCaixaFixa[tipo][contador[tipo]] = {
            descricao: `Total ${descricao}`,
            valor: totais[subtipo]
        };
    }

    return dicionarioGeralTipoCaixaFixa;    
}

function removerItemCaixaFixa(botao, idCaixa) {
    const linha = botao.closest('tr');
    linha.remove();
    ataulizarSaldoCaixas(idCaixa)
}


function ataulizarSaldoCaixas(idCaixa) {
    const inputSaldoAtual = document.getElementById(`caixa-saldo-atual-${idCaixa}`);
    let saldoAtual = 0;

    const inputSaldoInicial = document.getElementById(`caixa-saldo-${idCaixa}`);
    let saldoInicial = parseFloat(inputSaldoInicial.getAttribute('data-valor')) || 0;
    saldoAtual += saldoInicial;

    const tabelaCorpoLivre = document.getElementById(`tabela-caixa-${idCaixa}-movimentacao-livre`);
    const tabelaCorpoFixa = document.getElementById(`tabela-caixa-${idCaixa}-movimentacao-fixa`);
    
    const linhasLivre = tabelaCorpoLivre.getElementsByTagName('tr');
    const linhasFixa = tabelaCorpoFixa.getElementsByTagName('tr');
    
    for (let i = 0; i < linhasLivre.length; i++) {
        const linha = linhasLivre[i];
        const celulas = linha.getElementsByTagName('td');
        let inputValor = celulas[2].querySelector('.caixa-movimentacao-livre-valor');
        let tipoMovimentacao = celulas[0].querySelector('.caixa-movimentacao-livre-tipo').value;
        let valor = parseFloat(inputValor.getAttribute('data-valor')) || 0;
        if (tipoMovimentacao === 'entrada') {
            saldoAtual += valor;
        } else if (tipoMovimentacao === 'saida' || tipoMovimentacao === 'retorno') {
            saldoAtual -= valor;
        }
    }
    
    for (let i = 0; i < linhasFixa.length; i++) {
        const linha = linhasFixa[i];
        const celulas = linha.getElementsByTagName('td');
        let inputValor = celulas[2].querySelector('.caixa-movimentacao-fixa-valor');
        let valor = parseFloat(inputValor.getAttribute('data-valor')) || 0;
        saldoAtual += valor;
    }
    
    //inputSaldoAtual.value = `R$ ${formatarResultado(saldoAtual.toFixed(2), 2)}`;
    criarCronogramaCaixas();
}

function CriarDicionarioCaixas (){
    let dicionarioCaixas = {};
    const caixas = document.getElementsByClassName("caixa-item");

    if (!caixas) return

    for (let i = 0; i < caixas.length; i++){
        let caixa = caixas[i];
        let idCaixa = caixa.getAttribute('data-caixa-id');
        let nomeCaixa = caixa.querySelector('.caixa-nome-input').value;
        let saldoInicial = parseFloat(caixa.querySelector('.caixa-saldo-input').getAttribute('data-valor')) || 0;

        let movimentacoesLivres = {}
        let movimentacoesFixas = {}
        let contador = 0

        const tabelaMovimentacaoLivre = caixa.querySelector('.tabela-caixa-movimentacao-livre');
        const linhasMovimentacaoLivre = tabelaMovimentacaoLivre.getElementsByTagName('tr');

        for (l = 0; l < linhasMovimentacaoLivre.length; l++){
            let celulas = linhasMovimentacaoLivre[l].getElementsByTagName('td');
            let data = new Date(celulas[3].querySelector('.caixa-movimentacao-livre-data').value) || new Date();
            movimentacoesLivres[contador] = {
                tipo: celulas[0].querySelector('.caixa-movimentacao-livre-tipo').value,
                descricao: celulas[1].querySelector('.caixa-movimentacao-livre-descricao').value,
                valor: parseFloat(celulas[2].querySelector('.caixa-movimentacao-livre-valor').getAttribute('data-valor')) || 0,
                data: data
            }
            contador++;
        }

        contador = 0;
        const tabelamovimentacaoFixas = caixa.querySelector('.tabela-caixa-movimentacao-fixa');
        const linhasMovimentacaoFixas = tabelamovimentacaoFixas.getElementsByTagName('tr');

        for (l = 0; l < linhasMovimentacaoFixas.length; l++){
            let celulas = linhasMovimentacaoFixas[l].getElementsByTagName('td');
            var select = celulas[1].querySelector('.caixa-movimentacao-fixa-tipo');
            movimentacoesFixas[contador] = {
                fonte: celulas[0].querySelector('.caixa-movimentacao-fixa-fonte').value,
                tipo: select.options[select.selectedIndex].text,
                valor: parseFloat(select.value) || 0
            }
            contador++;
        }

        dicionarioCaixas[idCaixa] = {
            nome: nomeCaixa,
            saldoInicial: saldoInicial,
            movimentacaoLivre: movimentacoesLivres,
            movimentacaoFixa: movimentacoesFixas
        }
    }
    return dicionarioCaixas;
}


function atualizarDicionarioBoletimCaixa(dicionarios){
    let contador = 0;
    Object.values(dicionarios).forEach((dado) => {
        if (contador === 0) {
            dado = criarBaseBoletimCaixa(dado, true);
        }
        dado = criarBaseBoletimCaixa(dado);
        contador++;
    })
    return dicionarios;
}


var dicionarioCronogramaCaixas = {};

function criarBaseBoletimCaixa(dicionario = {}, ehPrimeiro = false) {
    var baseDescricao = {
        'Total provento': 'provento',
        'Total venda':'entrada',
        'Total compra':'saida',
        'Total entrada':'entrada',
        'Total saida':'saida',
    }

    dicionarioCronogramaCaixas = {};

    var dicionarioCaixas = CriarDicionarioCaixas();

    let contador = 0; let contadorCaixas = 0;

    Object.values(dicionarioCaixas).forEach((dado) => {
        var nomeCaixa = dado.nome;
        var movimentacoesFixas = dado.movimentacaoFixa;
        var movimentacoesLivres = dado.movimentacaoLivre;

        let movimentou = false;
        dicionarioCronogramaCaixas[contadorCaixas] = {};

        Object.values(movimentacoesFixas).forEach((movimentacao) => {
            var fonte = `boletim-mensal-${movimentacao.fonte.toLowerCase()}`;
            var descricao = movimentacao.tipo;

            if (descricao === 'Selecione') return;

            Object.values(dicionario).forEach((item) => {
                if (item.ignorar === true) return;
                var descricaoItem = item.descricao;
                var valor = item.valor;
                var tipoItem = item.tipo;
                var movimentacaoItem = item.movimentacao;

                if (tipoItem != fonte){ return; }
                let valorOriginal = valor;

                var itemModificado = { ...item }; // cria cópia real

                if(descricao === 'Total'){
                    item.descricao = `Caixa ${nomeCaixa} - ${descricaoItem} - Valor R$ ${formatarResultado(valor.toFixed(2), 2)}`;
                    item.valor = 0;
                    item.ignorar = true;
                    item.tipo = `${tipoItem} - boletim-mensal-caixa`;
                    item.movimentacao = 'caixa';
                } else if (descricao in baseDescricao){
                    var descrcaioBase = baseDescricao[descricao];
                    if (descrcaioBase === 'provento'){
                        if (descricaoItem.includes('Provento')){
                            item.descricao = `Caixa ${nomeCaixa} - ${descricaoItem} - Valor R$ ${formatarResultado(valor.toFixed(2), 2)}`;
                            item.valor = 0;
                            item.ignorar = true;
                            item.tipo = `${tipoItem} - boletim-mensal-caixa`;
                            item.movimentacao = 'caixa';
                        }
                    } else if (movimentacaoItem === descrcaioBase){
                        if (descricaoItem.includes('Provento')){return;}

                        item.descricao = `Caixa ${nomeCaixa} - ${descricaoItem} - Valor R$ ${formatarResultado(valor.toFixed(2), 2)}`;
                        item.valor = 0;
                        item.ignorar = true;
                        item.tipo = `${tipoItem} - boletim-mensal-caixa`;
                        item.movimentacao = 'caixa';
                    }
                } else {
                    if (descricaoItem === descricao){
                        item.descricao = `Caixa ${nomeCaixa} - ${descricaoItem} - Valor R$ ${formatarResultado(valor.toFixed(2), 2)}`;
                        item.valor = 0;
                        item.ignorar = true;
                        item.tipo = `${tipoItem} - boletim-mensal-caixa`;
                        item.movimentacao = 'caixa';
                    }
                }

                if (item.ignorar === true) {
                    dicionarioCronogramaCaixas[contadorCaixas][contador] = itemModificado;
                    dicionarioCronogramaCaixas[contadorCaixas][contador].valor = valorOriginal;
                    contador++;
                }
            });
        });

        if (!ehPrimeiro) return;

        Object.values(movimentacoesLivres).forEach((movimentacaoLivre) => {

            var descricao = movimentacaoLivre.descricao;
            var valor = movimentacaoLivre.valor;
            let ultimaChave = proximaChave(dicionario);

            const dataISO = new Date(movimentacaoLivre.data);
            const hoje = new Date();

            if (dataISO.getMonth() !== hoje.getMonth() || dataISO.getFullYear() !== hoje.getFullYear()) return;

            const diaOriginal = dataISO.getUTCDate();

            const ultimoDiaMes = new Date(hoje.getFullYear(),hoje.getMonth() + 1,0).getDate();

            const dia = Math.min(diaOriginal, ultimoDiaMes);

            var descricao_ = ''; var valor_ = 0;

            if (movimentacaoLivre.tipo === 'entrada') {
                descricao_ = `Caixa ${nomeCaixa} - Entrada - ${descricao}`;
                valor_ = valor*-1;
            } else {
                descricao_ = `Caixa ${nomeCaixa} - Saida - ${descricao}`;
                valor_ = valor;
            }

            const dataFormatada =`${String(dia).padStart(2, '0')}/` + `${String(hoje.getMonth() + 1).padStart(2, '0')}/` +`${hoje.getFullYear()}`;

            var _ = {
                descricao: descricao_,
                dia: dia,
                valor: valor_,
                tipo: `boletim-mensal-caixa`,
                ignorar: true,
                movimentacao: 'caixa',
                explicacao:'',
                data: dataFormatada,
            };

            if (movimentacaoLivre.tipo != 'saida'){
                dicionario[ultimaChave] = _;
            }
            
            var itemModificado = { ..._ }; // cria cópia real
            dicionarioCronogramaCaixas[contadorCaixas][contador] = itemModificado;
            dicionarioCronogramaCaixas[contadorCaixas][contador].valor = valor_*-1;
            dicionarioCronogramaCaixas[contadorCaixas][contador].descricao = `${movimentacaoLivre.tipo} - ${descricao}`;
            contador++;
        });

        contadorCaixas++;
    });

    return dicionario;
}

function proximaChave(dicionario) {
    const ultima = Math.max(
        ...Object.keys(dicionario)
            .filter(k => !isNaN(k)) // só números
            .map(Number)
    );

    return String(ultima + 1);
}

let lsitaItensFixos = [];

function atualizarCaixaValoresFixos () {
    lsitaItensFixos = lsitaItensFixos.filter(item => item.isConnected);
    let listaItens = lsitaItensFixos;

    if (listaItens.length === 0) return;

    listaItens.forEach((item) => {
        const colunas = item.getElementsByTagName('td');

        const selectFonte = colunas[0].querySelector('select');
        const selectTipo  = colunas[1].querySelector('select');
        const inputValorFixa = colunas[2].querySelector('input');

        // guarda o texto atualmente selecionado
        const textoSelecionado =
            selectTipo.options[selectTipo.selectedIndex]?.textContent;

        // força atualizar tipos conforme a fonte atual
        atualizarSelectTipo(selectFonte, selectTipo, inputValorFixa);

        // reaplica o tipo se ainda existir
        if (textoSelecionado) {
            const opcao = [...selectTipo.options].find(opt =>
                opt.textContent.trim() === textoSelecionado
            );

            if (opcao) {
                selectTipo.selectedIndex = opcao.index;
                selectTipo.dispatchEvent(new Event('change'));
            }
        }

        let id = item.classList[0].replace('movimentacao-caixa-fixa-linha-', '');
        ataulizarSaldoCaixas(id);
    });
}



function chamarCaixas(){
    atualizarCaixaValoresFixos();
    criarCronogramaCaixas();
    mostrarIconer('Icone12');
}









async function baixarModelo() {
    function formatarData(data) {
        let _ = new Date(data);
        var resultado = new Date(_.getFullYear(), _.getMonth(), _.getDate() +2);
        return resultado;
    }



  dicionarioAcoes = criarDicionarioAcao();
  var dicionarioDadosProventos = {};

  const response = await fetch("public/Preencher_Dividendos.xlsx")
  const arrayBuffer = await response.arrayBuffer()

  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  var novosDados = []
    Object.values(dicionarioAcoes).forEach(dados => {
        novosDados.push([
            dados.codigo,
            dados.nomeEmpresa
        ])
    })

    let tabelaCorpo = document.getElementById("proventos-tabela-corpo");
    let linhas = tabelaCorpo.getElementsByTagName("tr");
    let contador = 0;
    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const celulas = linha.getElementsByTagName("td");
        dicionarioDadosProventos[contador] = {
            codigo: celulas[0].querySelector('.cod-acoes-escolha').value,
            dataCorte: formatarData(celulas[2].querySelector('.data-corte-acoes').valueAsDate),
            dataPagamento: formatarData(celulas[3].querySelector('.data-pagamento-acao').valueAsDate),
            valorUnitario: parseFloat(celulas[4].querySelector('.valor-unitario-acao').getAttribute('data-valor'))
        }
        contador++;
    }

  // ⬇️ começa em F2
  XLSX.utils.sheet_add_aoa(sheet, novosDados, { origin: "F2" })

    // ⬇️ começa em A2
    let dadosProventos = []
    Object.values(dicionarioDadosProventos).forEach(dado => {
        dadosProventos.push([
            dado.codigo,
            dado.dataCorte,
            dado.dataPagamento,
            dado.valorUnitario
        ])
    })
    XLSX.utils.sheet_add_aoa(sheet, dadosProventos, { origin: "A2" })

  XLSX.writeFile(workbook, "Preencher_Dividendos.xlsx")
}

document.getElementById("btnImportarExcelProventos")
  .addEventListener("click", selecionarELerExcel)

function selecionarELerExcel() {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".xlsx,.xls"

  input.onchange = function (event) {
    const arquivo = event.target.files[0]
    if (!arquivo) return

    const leitor = new FileReader()

    leitor.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        // 🔹 Lê de A2 até D (até acabar as linhas)
        const linhas = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          range: "A2:D1000",
          blankrows: false
        })

        const dicionarioValidos = {}

        let contador = 1;
        linhas.forEach((linha, index) => {
          const linhaExcel = index + 2

          const codigo = linha[0]
          const dataCorte = linha[1]
          const dataPagamento = linha[2]
          const valor = linha[3]

          // 1️⃣ codigo existe
          if (!codigo || !codigoExiste(codigo)) return

          // 2️⃣ datas validas
          const corte = validarDataExcel(dataCorte)
          const pagamento = validarDataExcel(dataPagamento)
          if (!corte || !pagamento) return

          // 3️⃣ valor numerico positivo
          const valorNum = Number(valor)
          if (isNaN(valorNum) || valorNum <= 0) return

          // 4️⃣ adiciona ao dicionario final
          dicionarioValidos[contador] = {
            codigo,
            dataCorte: corte,
            dataPagamento: pagamento,
            valorUnitario: valorNum
          }
            contador++;
        })

        adicionarProventosDoDicionario(dicionarioValidos);

      } catch (erro) {
        console.error(erro)
        alert("Erro ao ler a planilha.")
      }
    }

    leitor.onerror = function () {
      alert("Erro ao ler o arquivo.")
    }

    leitor.readAsArrayBuffer(arquivo)
  }

  input.click()
}

function codigoExiste(codigo) {
  return Object.values(dicionarioAcoes).some(
    acao => acao.codigo === codigo
  )
}

function validarDataExcel(valor) {
  if (!valor) return null

  if (valor instanceof Date && !isNaN(valor)) {
    return valor
  }

  if (typeof valor === "number") {
    const d = XLSX.SSF.parse_date_code(valor)
    if (!d) return null
    return new Date(d.y, d.m - 1, d.d)
  }

  if (typeof valor === "string") {
    const partes = valor.split("/")
    if (partes.length !== 3) return null

    const dia = parseInt(partes[0], 10)
    const mes = parseInt(partes[1], 10) - 1
    const ano = parseInt(partes[2], 10)

    const data = new Date(ano, mes, dia)
    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes ||
      data.getDate() !== dia
    ) return null

    return data
  }

  return null
}

function adicionarProventosDoDicionario(dicionario) {
    var tabelaCorpo = document.getElementById("proventos-tabela-corpo");
    var btnsExcluir = tabelaCorpo.querySelectorAll('.remover-linha');
    btnsExcluir.forEach(btn => btn.click());
    Object.values(dicionario).forEach(dado => {
        addProvento();
        let novaLinha = tabelaCorpo.querySelectorAll('tr')[0];
        let caixaSelecao = novaLinha.querySelector('.cod-acoes-escolha');
        let empresaInput = novaLinha.querySelector('.nome-empresa');
        let dataCorteInput = novaLinha.querySelector('.data-corte-acoes');
        let dataPagamento = novaLinha.querySelector('.data-pagamento-acao');
        let valorUnitarioInput = novaLinha.querySelector('.valor-unitario-acao');
        let qtdeInput = novaLinha.querySelector('.qtde-cota');
        let valorTotalInput = novaLinha.querySelector('.valor-total-acao');

        caixaSelecao.value = dado.codigo;
        dataCorteInput.valueAsDate = dado.dataCorte;
        dataPagamento.valueAsDate = dado.dataPagamento;
        valorUnitarioInput.value = dado.valorUnitario;

        formatarValorInput(valorUnitarioInput);
        preencherProventosAcoes(caixaSelecao, empresaInput, dataCorteInput, qtdeInput, valorUnitarioInput, valorTotalInput); // Chama a função passando o valor selecionado
        listaCodAcoes();

        novaLinha.style.backgroundColor = "rgba(211, 249, 216, 0.5)";
        novaLinha.style.color = "black";
    });
}



function boletimGraficoBnt() {
    graficoFuncao();
    boletimGraficoCronograma();
    mostrarIconer("Icone11");
}

function boletimGraficoCronograma() {
    const container = document.getElementById('boletimgraficoContainer');
    container.innerHTML = ''; // limpa antes de adicionar
    var dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    for (let i = 1; i <= 12; i++) {
        var h3 = document.createElement('h3');
        let div = document.createElement('div');
        div.className = 'boletimgraficoContainer';
        const boletim = document.getElementById(`boletim${i}`);

        if (!boletim) {
            console.warn(`boletim${i} não encontrado`);
            continue;
        }

        // 1) Clona o boletim e adiciona no container
        const boletimClone = boletim.cloneNode(true);
        container.appendChild(boletimClone);

        // 2) Cria um novo canvas para o gráfico dentro do container
        const novoCanvas = document.createElement('canvas');
        novoCanvas.id = `chart${i}_clone`; // evita conflito com o original
        container.appendChild(novoCanvas);

        // 3) Agora cria o gráfico nesse novo canvas
        createChart(`chart${i}_clone`, `boletim-${i}`, `boletim${i}`);

        // 4) adiciona boletim e grafino no div
        div.appendChild(boletimClone);
        div.appendChild(novoCanvas);
        container.appendChild(div);

        // 4) adciona o cronograma
        const cronogramaContainer = document.createElement('div');
        cronogramaContainer.id = `cronograma-boletim-${i}`;
        container.appendChild(cronogramaContainer);
        if (i === 1) {
            criarCronogramaBoletimMensal(i, cronogramaContainer, dataAtual, true);
        } else{
            criarCronogramaBoletimMensal(i, cronogramaContainer, dataAtual);
        }

        
        container.appendChild(h3);
        dataAtual.setMonth(dataAtual.getMonth() + 1);
    }
}

function criarCronogramaBoletimMensal(numeroBoletim, container, data, primeiro = false) {
    // total de dias do mês
    const diasNoMes = new Date(
        data.getFullYear(),
        data.getMonth() + 1,
        0
    ).getDate();

    // dia da semana do primeiro dia do mês
    // 0 = domingo, 6 = sábado
    const primeiroDiaSemana = new Date(
        data.getFullYear(),
        data.getMonth(),
        1
    ).getDay();

    // número real de semanas de calendário
    const semanas = Math.ceil((diasNoMes + primeiroDiaSemana) / 7);

    dicionarios = calcularValoresMensais( 
        atualizarDadosReceitas(),
        atualizarDadosCartoes(),
        atualizarDadosDiversos(),
        criarDicionarioCofrinho(),
        criarDicionarioAcao(),
        criarDicionarioProventosAcoes(),
        criarDicionarioMoedas(),
        data
    );

    dicionarioValoresMensaisCartoes = atualizarDicionarioBoletimCaixa(dicionarios);

    calcularSemanasCronograma(
        dicionarios,
        data,
        [],
        false,
        `cronograma-boletim-${numeroBoletim}`,
        semanas
    );
}



let hoje = new Date();

let marcadoresCheckListOcultarOuMostrar = true;

function checkListOcultarOuMostrarMacados(){
    if (marcadoresCheckListOcultarOuMostrar){
        checkListOcultarMacados();
        marcadoresCheckListOcultarOuMostrar = false;
        document.getElementById('bntOcultarOuMostrarMarcadores').innerText = "Mostrar Marcados";
    } else {
        checkListMostrarMacados();
        marcadoresCheckListOcultarOuMostrar = true;
        document.getElementById('bntOcultarOuMostrarMarcadores').innerText = "Ocultar Marcados";
    }
}

function checkListOcultarMacados(){
    let checkboxes = document.querySelectorAll('#tabelaCheckList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const statusFiltrado = tr.getAttribute('data-filtrado');
        if (statusFiltrado === 'false'){
            tr.style.display = 'none';
        } else if (checkbox.checked){
            tr.style.display = 'none';
        }
    });
    checkboxes = document.querySelectorAll('#tabelaCheckList2 input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const statusFiltrado = tr.getAttribute('data-filtrado');
        if (statusFiltrado === 'false'){
            tr.style.display = 'none';
        } else if (checkbox.checked){
            tr.style.display = 'none';
        }
    });
}

function checkListMostrarMacados(){
    let checkboxes = document.querySelectorAll('#tabelaCheckList input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const statusFiltrado = tr.getAttribute('data-filtrado');
        if (statusFiltrado === 'false'){
            tr.style.display = 'none';
        } else if (checkbox.checked){
            tr.style.display = '';
        }
    });
    checkboxes = document.querySelectorAll('#tabelaCheckList2 input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const statusFiltrado = tr.getAttribute('data-filtrado');
        if (statusFiltrado === 'false'){
            tr.style.display = 'none';
        } else if (checkbox.checked){
            tr.style.display = '';
        }
    });
}


let barraFiltroBoletinsAltenativo = criarBarraDeFiltros('filtrosBoletinsAltenativo', filtrarPorDescricaoAltenativo);
let barraFiltroBoletins = criarBarraDeFiltros('filtrosBoletins', filtrarPorDescricao);
let barraFiltroCheckList = criarBarraDeFiltros('filtrosCheckList', aplicarFiltroCheckList);

function criarBarraDeFiltros(containerId, callbackQuandoAtualizar, tipo = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Digite um filtro...';
  input.classList.add('input-filtro');
  
  let select = null; // ← declare aqui

  if (!tipo) {
    select = document.createElement('select'); // ← e inicialize aqui
    select.classList.add('filtroBoletinsTipo', 'descricao-input');

    const opcoes = [
      { value: '', label: 'Selecione' },
      { value: 'cartao', label: 'Cartões' },
      { value: 'receita', label: 'Receitas' },
      { value: 'dividas-diversas', label: 'Dívidas Diversas' },
      { value: 'investimento', label: 'Investimento' },
      { value: 'cambio', label: 'Câmbio' },
      { value: 'cofrinho', label: 'Cofrinho' },
      { value: 'caixa', label: 'Caixa' },
      { value: 'movimentacao-entrada', label: 'Movimentação de Entrada' },
      { value: 'movimentacao-saida', label: 'Movimentação de Saída' }
    ];

    opcoes.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
  }
  

  const modoCheckbox = document.createElement('input');
  modoCheckbox.type = 'checkbox';
  modoCheckbox.checked = true;
  modoCheckbox.title = "Modo conjunto (todos os filtros devem coincidir)";
  modoCheckbox.classList.add('modo-checkbox');

  const modoLabel = document.createElement('label');
  modoLabel.textContent = 'Conjunto ';
  modoLabel.appendChild(modoCheckbox);

  const btnLimpar = document.createElement('button');
    btnLimpar.textContent = 'Limpar filtros';
    btnLimpar.classList.add('btn-limpar-filtros', 'remover-linha');
    btnLimpar.onclick = () => {
        filtros.length = 0; // zera o array
        const chips = container.querySelectorAll('.chip');
        chips.forEach(chip => container.removeChild(chip));
        notificarAtualizacao();
    };

    container.appendChild(btnLimpar);

  container.classList.add('filtro-container');
  container.appendChild(modoLabel);
  container.appendChild(input);
  if (!tipo) {container.appendChild(select)};

  const filtros = [];

  function notificarAtualizacao() {
    callbackQuandoAtualizar?.([...filtros], modoCheckbox.checked);
  }

  function criarChip(valorFiltro, textoExibicao = null) {
    const valor = valorFiltro.trim().toLowerCase();
    if (!valor || filtros.includes(valor)) return;

    filtros.push(valor);

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = textoExibicao || valor;

    const btn = document.createElement('span');
    btn.className = 'close-btn';
    btn.textContent = '×';
    btn.onclick = () => {
      container.removeChild(chip);
      const index = filtros.indexOf(valor);
      if (index > -1) filtros.splice(index, 1);
      notificarAtualizacao();
    };

    chip.appendChild(btn);
    container.insertBefore(chip, input);
    input.value = '';
    notificarAtualizacao();
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      criarChip(input.value);
    }
  });

  input.addEventListener('blur', function () {
    criarChip(input.value);
  });
  
  if (!tipo){
    select.addEventListener('change', function () {
      if (select.value) {
        const selectedOption = select.options[select.selectedIndex];
        criarChip(selectedOption.value, selectedOption.textContent);
        select.value = '';
      }
    });
  }
  
  modoCheckbox.addEventListener('change', notificarAtualizacao);

  return {
    getFiltros: () => ({
      filtros: [...filtros],
      modoConjunto: modoCheckbox.checked
    }),
    adicionarFiltro: criarChip,
    limparTodos: () => {
      filtros.length = 0;
      const chips = container.querySelectorAll('.chip');
      chips.forEach(chip => container.removeChild(chip));
      notificarAtualizacao();
    },
    forcarAtualizacao: notificarAtualizacao // ← aqui está o que você precisa
  };
}


function aplicarFiltroCheckList(listaDeFiltros, conjunto) {
  var filtros = listaDeFiltros; // Array de filtros
  function ocultarLinhas(tabelaCorpo) {
    let linhas = tabelaCorpo.getElementsByTagName("tr");

    for (let i = 0; i < linhas.length; i++) {
        if (i === linhas.length - 1) {
            // Sempre mostra a última linha
            linhas[i].style.display = "";
            linhas[i].setAttribute('data-filtrado', 'true');
            continue;
        }
      let colunaDescricao = linhas[i].getElementsByTagName("td")[0];
      let colunaDia = linhas[i].getElementsByTagName("td")[2];
      let tipo = linhas[i].getAttribute('class').split(' ')[0];
      let movimentacao = linhas[i].getAttribute('movimentacao');

      if (colunaDescricao && colunaDia) {
        let textoDescricao = colunaDescricao.getElementsByTagName('label')[0].textContent.toLowerCase();
        let textoDia = colunaDia.getElementsByTagName('label')[0].textContent.toLowerCase();

        let mostrarLinha;

        if (listaDeFiltros.length === 0) {
          mostrarLinha = true;
        } else if (conjunto) {
          // Modo conjunto: o item deve conter todos os filtros (AND)
          mostrarLinha = listaDeFiltros.every(termo =>
            textoDescricao.includes(termo) || textoDia === termo || tipo === `boletim-mensal-${termo.toLowerCase()}` || movimentacao === termo.toLowerCase()
          );
        } else {
          // Modo simples: o item deve conter pelo menos um (OR)
          mostrarLinha = listaDeFiltros.some(termo =>
            textoDescricao.includes(termo) || textoDia === termo || tipo === `boletim-mensal-${termo.toLowerCase()}` || movimentacao === termo.toLowerCase()
          );

        }

        if (mostrarLinha){
            linhas[i].style.display = "";
            linhas[i].setAttribute('data-filtrado', 'true');
        } else {
            linhas[i].style.display = "none";
            linhas[i].setAttribute('data-filtrado', 'false');
        }
        

      }
    }
    atualizarMarcacoesCheckList();
    atualizarSaldoCheckGeral();
  }

  let tabela1 = document.getElementById("tabelaCheckList");
  let tabela2 = document.getElementById("tabelaCheckList2");

  ocultarLinhas(tabela1);
  ocultarLinhas(tabela2);
  atualizarMarcacoesCheckList();
  document.getElementById('bntOcultarOuMostrarMarcadores').innerText = "Ocultar Marcados";
  marcadoresCheckListOcultarOuMostrar = true;
  cronogramaCheckListFuncao(filtros, conjunto);
}


function filtrarPorDescricaoAltenativo(filtros, conjunto) {
  if (!Array.isArray(filtros)) return;

  dicionarioValorCadaMes['13'] = 0;
  dicionarioValorCadaMes['14'] = 0;
  dicionarioValorCadaMes['15'] = 0;

  document.querySelectorAll('.boletim-mensal-Descricao-Item-altenativo').forEach(tr => {
    const explicacao = tr.getAttribute('title')?.toLowerCase() || '';
    const numeroBoletim = tr.getAttribute('numeroboletim');
    const primeiroTd = tr.querySelectorAll('td');
    const label = primeiroTd[0].querySelector('label');
    const labelTexto = label?.textContent.toLowerCase() || '';
    const movimentacao = tr.getAttribute('movimentacao')?.toLowerCase() || '';
    const classList = tr.classList;
    let mostrar;

    const correspondeAoFiltro = (textoFiltro) => {
      textoFiltro = textoFiltro.toLowerCase();
      return (
        labelTexto.includes(textoFiltro) ||
        explicacao.includes(textoFiltro) ||
        movimentacao.includes(textoFiltro) ||
        Array.from(classList).some(classe => classe.includes(textoFiltro))
      );
    };

    if (filtros.length === 0) {
      mostrar = true;
    } else if (conjunto) {
      // Modo conjunto (AND): todos os filtros devem ser atendidos
      mostrar = filtros.every(correspondeAoFiltro);
    } else {
      // Modo simples (OR): pelo menos um filtro deve ser atendido
      mostrar = filtros.some(correspondeAoFiltro);
    }

    if (mostrar) {
      tr.style.display = '';
      dicionarioValorCadaMes[numeroBoletim] += parseFloat(tr.getAttribute('valorlinha'));
    } else {
      tr.style.display = 'none';
    }
  });

  if (filtros.length === 0) {
    removerLinhaTotalBoletimFiltroAltenativo();
    filtrarPorTipoAltenativo()
  } else {
    addLinhaTotalBoletimFiltroAltenativo();
    ocultarPorTipoAltenativo();
  }
}

function filtrarPorTipoAltenativo() {
  var listaTotais = ["boletim-mensal-totais", "boletim-mensal-saldo", "boletim-mensal-saldoMesPassado"];

  listaTotais.forEach(tipo => {
    document.querySelectorAll(`.${tipo}`).forEach(item => {
      item.style.display = ''; // Mostra o item (usa o valor padrão do CSS)
    });
  });
}

function ocultarPorTipoAltenativo() {
  var listaTotais = ["boletim-mensal-totais", "boletim-mensal-saldo", "boletim-mensal-saldoMesPassado"];

  listaTotais.forEach(tipo => {
    document.querySelectorAll(`.${tipo}`).forEach(item => {
      item.style.display = 'none'; // Oculta o item
    });
  });
}



var dicionarioValorCadaMes = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0, '11': 0, '12': 0, '13': 0, '14': 0, '15': 0}
// === 1) filtrarPorDescricaoAltenativo (versão “antiga”) ===
function filtrarPorDescricao(filtros, conjunto) {
  if (!Array.isArray(filtros)) return;

  // zera só de 1 a 12
  for (let m = 1; m <= 12; m++) {
    dicionarioValorCadaMes[String(m)] = 0;
  }

  document
    .querySelectorAll('.boletim-mensal-Descricao-Item')
    .forEach(tr => {
      const explicacao = (tr.getAttribute('title') || '').toLowerCase();
      const numero     = tr.getAttribute('numeroboletim');
      const labelElem  = tr.querySelector('td:first-child label');
      const labelTexto = (labelElem?.textContent || '').toLowerCase();
      const movimentacao = tr.getAttribute('movimentacao')?.toLowerCase() || '';
      const classes    = Array.from(tr.classList);
      let   mostrar;

      const corresponde = txt => {
        txt = txt.toLowerCase();
        return (
          labelTexto.includes(txt) ||
          explicacao.includes(txt) ||
          movimentacao.includes(txt) ||
          classes.some(c => c.includes(txt))
        );
      };

      if (filtros.length === 0) {
        mostrar = true;
      } else if (conjunto) {
        mostrar = filtros.every(corresponde);
      } else {
        mostrar = filtros.some(corresponde);
      }

      if (mostrar) {
        tr.style.display = '';
        dicionarioValorCadaMes[numero] += parseFloat(tr.getAttribute('valorlinha'));
      } else {
        tr.style.display = 'none';
      }
    });

  if (filtros.length === 0) {
    removerLinhaTotalBoletimFiltro();
    filtrarPorTipoAltenativo();
  } else {
    addLinhaTotalBoletimFiltro();
    ocultarPorTipoAltenativo();
  }
}

function addLinhaTotalBoletimFiltro() {
  for (let c = 1; c < 13; c++) {
    var tabelaCorpoBoletim = document.querySelector(`#boletim-${c}`);
    let valor = dicionarioValorCadaMes[`${c}`];


    if (tabelaCorpoBoletim) {
      var linha = tabelaCorpoBoletim.querySelector('.boletim-mensal-total-filtro');

      if (linha) {
        // Atualiza o conteúdo da linha existente
        linha.innerHTML = `<td colspan="3"><h3>Total: R$ ${formatarResultado(parseFloat(valor).toFixed(2), 2)}</h3></td>`;
      } else {
        // Cria a linha se não existir
        const novaLinha = document.createElement('tr');
        novaLinha.className = 'boletim-mensal-total-filtro';
        novaLinha.innerHTML = `<td colspan="3"><h3>Total: R$ ${formatarResultado(parseFloat(valor).toFixed(2), 2)}</h3></td>`;
        tabelaCorpoBoletim.appendChild(novaLinha);
      }
    }
  }
}

function removerLinhaTotalBoletimFiltro() {
  document.querySelectorAll('.boletim-mensal-total-filtro').forEach(tr => {
    if (tr.parentNode) {
      tr.parentNode.removeChild(tr); // Remove a linha corretamente
    }
  });
}


function cronogramaCheckListFuncao(filtro=[], conjunto=false){
    let _ = new Date();
    let data = new Date(_.getFullYear(), _.getMonth() - 1, 1);
    let dataAtual = new Date(_.getFullYear(), _.getMonth(), 1);
    dicionarioReceitas = atualizarDadosReceitas();
    dicionarioCartoes = atualizarDadosCartoes();
    dicionarioDiversos = atualizarDadosDiversos();
    dicionarioCofrinho = criarDicionarioCofrinho();
    dicionarioAcoes = criarDicionarioAcao();
    dicionarioProventosAcoes = criarDicionarioProventosAcoes();
    dicionarioMoedas = criarDicionarioMoedas();
    let dataHoje = new Date();

    dicionarioValoresMensaisCartoes = calcularValoresMensais(dicionarioReceitas, dicionarioCartoes, dicionarioDiversos, dicionarioCofrinho, dicionarioAcoes, dicionarioProventosAcoes, dicionarioMoedas, dataHoje);

    dicionarioValoresMensaisCartoes = atualizarDicionarioBoletimCaixa(dicionarioValoresMensaisCartoes);

    calcularSemanasCronograma(dicionarioValoresMensaisCartoes, dataAtual, filtro, conjunto, identificador = 'Cronograma-tabela-corpo-1');
}

function calcularSemanasCronograma(dadosCompostos, data, filtro, conjunto, identificador, semanas = 6) {
    let domingo = obterDomingo(data);
    let dicionario = {};

    const tbody = document.getElementById(identificador);
    tbody.innerHTML = ""; 

    const diasSemana = ["1", "2", "3", "4", "5", "6", "7"];
    let saldo = 0;

    for (let semana = 0; semana < semanas; semana++) { // Loop para 3 semanas
        let semanaDicionario = {};

        for (let d = 1; d < 8; d++) {
            let dia = new Date(domingo);
            dia.setDate(domingo.getDate() + d - 1);
            let dados = {};

            for (const [rendKey, dados_] of Object.entries(dadosCompostos)) {
                if (dados_.data instanceof Date && dados_.data.getMonth() === dia.getMonth()) {
                    dados = dadosCompostos[rendKey];
                    break;
                }
            }
            semanaDicionario[d] = calcularDiaCronograma(dados, dia.getDate(), filtro, conjunto) || { total: 0 };
            semanaDicionario[d].data = dia;
        }

        dicionario[semana] = semanaDicionario;

        // Criar a linha de datas e totais para essa semana
        const rowDatas = document.createElement("tr");
        rowDatas.style.backgroundColor = "green"; 
        rowDatas.style.color = "black";

        diasSemana.forEach(dia => {
            const cell = document.createElement("td");
            cell.style.textAlign = "center"; 

            if (semanaDicionario[dia]) {
                const dataFormatada = semanaDicionario[dia].data.toLocaleDateString("pt-BR");
                const totalFormatado = formatarMoeda_resultado(semanaDicionario[dia].total);

                // Obtém a data de hoje no mesmo formato
                const hoje = new Date().toLocaleDateString("pt-BR");

                // Se a data for igual à de hoje, aplica a cor desejada ao texto da célula inteira
                if (dataFormatada === hoje) {
                    cell.style.color = "rgb(249, 211, 0)";
                }

                cell.innerHTML = `<strong>${dataFormatada}</strong><br>
                                  <strong>Total: ${totalFormatado}</strong>`;
            }

            rowDatas.appendChild(cell);
        });
        tbody.appendChild(rowDatas);

        // Determinar quantas linhas serão criadas com base no maior número de movimentações
        let maxLinhas = 1;
        for (const dia of diasSemana) {
            if (semanaDicionario[dia]) {
                const itens = Object.keys(semanaDicionario[dia]).filter(key => key !== "total" && key !== "data").length;
                maxLinhas = Math.max(maxLinhas, itens);
            }
        }

        // Criar as linhas das movimentações
        for (let i = 0; i < maxLinhas; i++) {
            const row = document.createElement("tr");

            diasSemana.forEach(dia => {
                const cell = document.createElement("td");
                if (semanaDicionario[dia]) {
                    const itens = Object.keys(semanaDicionario[dia]).filter(key => key !== "total" && key !== "data");
                    if (itens[i]) {
                        const item = semanaDicionario[dia][itens[i]];
                        cell.innerHTML = `${item.descricao}<br><strong>${formatarMoeda_resultado(item.valor)}</strong>`;
                        cell.classList.add('cronograma-item');
                        cell.setAttribute('descricao', item.descricao);
                        cell.setAttribute('tipo', item.tipo);
                        cell.setAttribute('movimentacao', `movimentacao-${item.movimentacao}`);

                        if (item.movimentacao === 'entrada') {
                            cell.style.backgroundColor = 'rgba(211, 249, 216, 0.5)';
                        } else if (item.movimentacao === 'saida') {
                            cell.style.backgroundColor = 'rgba(249, 211, 211, 0.5)';
                        } else {
                            cell.style.backgroundColor = 'rgba(211, 237, 249, 0.5)';
                        }

                        cell.style.color = 'black';
                    }
                }
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        }

        // Avançar para o próximo domingo
        domingo.setDate(domingo.getDate() + 7);
    }
}

function calcularDiaCronograma(dados, dia, filtros, conjunto) {
  let dicionario = {}
  
  let contador = 1; let total = 0;
  for (const [rendKey, dado] of Object.entries(dados)) {
    if (dia === dado.dia){
      let mostrarItem = true;
      if (filtros.length > 0){
        mostrarItem = false;
        let contador = 0;
        for (let i = 0; i < filtros.length; i++){
          let filtro = filtros[i];

          if (conjunto){
            if (dado.descricao.toLowerCase().includes(filtro.toLowerCase())) {
              contador++;
            }

            if (dado.tipo.toLowerCase() === `boletim-mensal-${filtro.toLowerCase()}`) {
              contador++;
            }

            if (`movimentacao-${dado.movimentacao.toLowerCase()}` === filtro.toLowerCase()) {
              contador++;
            }

            if (contador >= filtros.length) {
              mostrarItem = true;
            }

          } else {
            if (dado.descricao.toLowerCase().includes(filtro.toLowerCase()) || dado.tipo.toLowerCase().includes(filtro.toLowerCase()) || `movimentacao-${dado.movimentacao.toLowerCase()}` === filtro.toLowerCase()) {
            mostrarItem = true;
            }
          }
        }
        contador = 0;
      }
      if (mostrarItem) {
        dicionario[contador] = {
        descricao: dado.descricao,
        valor: dado.valor,
        movimentacao: dado.movimentacao,
        tipo: dado.tipo,
      }
      contador ++;
      total += dado.valor;
      }
    }
  }
  dicionario['total'] = total;
  return dicionario;
}

function obterDomingo(data) {
    const domingo = new Date(data); // Clona a data original
    domingo.setDate(data.getDate() - data.getDay()); // Subtrai o dia da semana
    return domingo;
}

function limparDistribuicaoPonderada(){
    const tabelaCorpo = document.getElementById(`distribuicao-ponderada-tabela-corpo`);
    while (tabelaCorpo.firstChild) {
        tabelaCorpo.removeChild(tabelaCorpo.firstChild);
    }
    calcularDistribuicaoPonderadaInvestimento();
}

function addgrupoLinhaDistribuicaoPonderada() {
    limparDistribuicaoPonderada();
    const selectGrupo = document.getElementById('Distribuicao-Grupos');
    const grupoSelecionado = selectGrupo.value;

    if (!grupoSelecionado) {
        return;
    }

    let acoes = selectGrupo.options[selectGrupo.selectedIndex]
        .getAttribute('data-acoes')
        .split(', ');

    const tabelaCorpo = document.getElementById('distribuicao-ponderada-tabela-corpo');

    acoes.forEach(acao => {
        const novaLinha = addLinhaDistribuicaoPonderada();
        const caixaSelecao = novaLinha.querySelector('.cod-acoes-escolha');
        caixaSelecao.value = acao;
        caixaSelecao.dispatchEvent(new Event('change'));
    });
}


function atualizarDistribuicaoPonderadaGrupos(){
    const selectGrupos = document.getElementById('Distribuicao-Grupos');
    selectGrupos.innerHTML = '';
    let grupos = obterListaGruposAcoes();
    grupos.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo[0];
        option.textContent = grupo[0];
        selectGrupos.appendChild(option);
        option.setAttribute('data-acoes', grupo[1].join(', '));
    });
}

function obterListaGruposAcoes(){
    let gruposSet = new Set();
    let grupos = document.getElementsByClassName('grupoInvestimento');
    for (let i = 0; i < grupos.length; i++) {
        let acoes = []
        let tabelaGrupo = grupos[i].getElementsByClassName('grupo-investimento-tabela-corpo')[0];
        let linhas = tabelaGrupo.getElementsByTagName("tr");
        for (let j = 0; j < linhas.length; j++) {
            let acao = linhas[j].getElementsByClassName('valor-input cod-acoes-escolha')[0]?.value.trim();
            if (acao) {
                acoes.push(acao);
            }
        }
        let grupoNome = grupos[i].getElementsByClassName('descricao-input nome-grupo-investimento')[0]?.value.trim();
        if (grupoNome) {
            gruposSet.add([grupoNome, acoes]);
        }
    }
    return Array.from(gruposSet).sort();
}

function addLinhaDistribuicaoPonderada() {
  const tabelaCorpo = document.getElementById(`distribuicao-ponderada-tabela-corpo`);

  const novaLinha = document.createElement('tr');
  novaLinha.innerHTML = `
      <td><select class="valor-input cod-acoes-escolha"></select></td>
      <td><input class="descricao-input nome-empresa" disabled></td> 
      <td><input type="text" class="valor-input valor-cota-acao" value="R$ 0,00" data-valor="0" disabled></td>
      <td><input type="text" class="valor-input valor-provento-medio-acao" data-valor="0" disabled></td>
      <td><input type="text" class="valor-input taxa-retorno-acao" data-valor="0" disabled></td>
      <td><input type="number" class="valor-input qtde-cota" disabled></td></td>
      <td><input type="text" class="valor-input valor-total-acao" value="R$ 0,00" data-valor="0" disabled></td>
      <td><input type="text" class="valor-input valor-provento-acao" value="R$ 0,00" data-valor="0" disabled></td>
      <td><button class="remover-linha">Remover</button></td>
  `;

  tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);

  novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
    tabelaCorpo.removeChild(novaLinha);
    calcularDistribuicaoPonderadaInvestimento();
  });

  let caixaSelecao = novaLinha.querySelector('.cod-acoes-escolha');
  let empresaInput = novaLinha.querySelector('.nome-empresa');
  let valorCota = novaLinha.querySelector('.valor-cota-acao');
  let proventoMedio = novaLinha.querySelector('.valor-provento-medio-acao');
  let taxaRetorno = novaLinha.querySelector('.taxa-retorno-acao');

  novaLinha.querySelector('.cod-acoes-escolha').addEventListener('change', (event) => {
      preencherDistribuicaoPonderada(caixaSelecao, empresaInput, valorCota, proventoMedio, taxaRetorno);
  });

  listaCodAcoes();

  return novaLinha;
}


function preencherDistribuicaoPonderada(caixaSelecao, empresaInput, valorCota, proventoMedio, taxaRetorno){
  if (caixaSelecao.value === ''){
    empresaInput.value = '';
    
    valorCota.setAttribute('data-valor', 0);
    valorCota.value = 'R$ 0,00';
    
    proventoMedio.setAttribute('data-valor', 0);
    proventoMedio.value = 0;
    return
  }
  
  dicionarioAcoes = criarDicionarioAcao();
  dicionarioProventosAcoes = criarDicionarioProventosAcoes();
  
  let codigoAcao = caixaSelecao.value;
  
  for (const [rendKey, acao] of Object.entries(dicionarioAcoes)) {
    if (acao.codigo === codigoAcao){
      empresaInput.value = acao.nomeEmpresa;
      
      let valorTotal = acao.valorCota;
      valorCota.setAttribute('data-valor', parseFloat(valorTotal.toFixed(2)));
      valorCota.value = formatarMoeda_resultado(valorTotal);
      break
    }
  }
  
  let contadorProvento = 0; let valorTotalProvento = 0;
  for (const [rendKey, provento] of Object.entries(dicionarioProventosAcoes)) {
    if (provento.codigo === codigoAcao){
      contadorProvento ++;
      valorTotalProvento += parseFloat(provento.valorUnitario);
    }
  }
  if (valorTotalProvento != 0){
    let resultadoProvento = valorTotalProvento / contadorProvento;
    proventoMedio.setAttribute('data-valor', resultadoProvento.toFixed(2));
    proventoMedio.value = resultadoProvento.toFixed(5);
    formatarValorInput(proventoMedio);

    let taxa = resultadoProvento / parseFloat(valorCota.getAttribute('data-valor')) * 100;
    taxaRetorno.setAttribute('data-valor', parseFloat(taxa.toFixed(2)));
    taxaRetorno.value = taxa.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';

  } else {
    proventoMedio.setAttribute('data-valor', 0);
    proventoMedio.value = 0;
    taxaRetorno.setAttribute('data-valor', 0);

  }
  calcularDistribuicaoPonderadaInvestimento();
}

function calcularTaxaRetornoDistribuicaoPonderada(codigoAcao){
    dicionarioProventosAcoes = criarDicionarioProventosAcoes();
    dicionarioAcoes = criarDicionarioAcao();

    let contadorProvento = 0; let valorTotalProvento = 0;
    for (const [rendKey, provento] of Object.entries(dicionarioProventosAcoes)) {
        if (provento.codigo === codigoAcao){
            contadorProvento ++;
            valorTotalProvento += parseFloat(provento.valorUnitario);
        }
    }
    let media = contadorProvento === 0 ? 0 : valorTotalProvento / contadorProvento;

    let valorCota = 0;
    for (const [rendKey, acao] of Object.entries(dicionarioAcoes)) {
        if (acao.codigo === codigoAcao){      
            valorCota = acao.valorCota;
            break
        }
    }

    let taxa = valorCota === 0 ? 0 : media / valorCota * 100;
    taxa = parseFloat(taxa.toFixed(3));


    return [taxa, parseFloat(media.toFixed(5))];
}

function calcularDistribuicaoPonderadaInvestimento(){
  let valorDisponivel = parseFloat(document.querySelector('#valor-disponivel-distribuicao-ponderada-investimentos').getAttribute('data-valor'));
  if (valorDisponivel === 0){return}
  
  let porcentualTotal = 0;
  
  let dicionario = {};
  
  const tabelaCorpo = document.getElementById(`distribuicao-ponderada-tabela-corpo`);
  let linhas = tabelaCorpo.getElementsByTagName("tr");
  
  for (let i = 0; i < linhas.length; i++) {
    let retornoMedio = parseFloat(linhas[i].querySelector('.valor-provento-medio-acao').getAttribute('data-valor'));
    let valorCota = parseFloat(linhas[i].querySelector('.valor-cota-acao').getAttribute('data-valor'));
    if (retornoMedio != 0){
      porcentualTotal += retornoMedio / valorCota;
      dicionario[i] = {
        valorCota: valorCota,
        redimentoMedio: retornoMedio,
        linha: linhas[i],
      }
    }
  }
  
  let total = 0; let proventoTotal = 0;
  for (const [rendKey, dado] of Object.entries(dicionario)) {
    let porcentual = dado.redimentoMedio / dado.valorCota
    let peso = porcentual / porcentualTotal * 100;
    let valorASerAplicado = valorDisponivel / 100 * peso;
    let qtde = Math.trunc(valorASerAplicado / dado.valorCota);
    let valorAplicado = qtde * dado.valorCota;
    let retorno = qtde * dado.redimentoMedio;
    total += valorAplicado;
    proventoTotal += retorno;
    
    let linha = dado.linha;
    linha.querySelector('.qtde-cota').value = qtde
    
    linha.querySelector('.valor-total-acao').setAttribute('data-valor', parseFloat(valorAplicado.toFixed(2)));
    linha.querySelector('.valor-total-acao').value = formatarMoeda_resultado(valorAplicado);
    
    linha.querySelector('.valor-provento-acao').setAttribute('data-valor', parseFloat(retorno.toFixed(2)));
    linha.querySelector('.valor-provento-acao').value = formatarMoeda_resultado(retorno);
  }
  
  let sobrou = valorDisponivel - total;
  document.querySelector('#valor-sobra-distribuicao-ponderada-investimentos').setAttribute('data-valor', parseFloat(sobrou.toFixed(2)));
  document.querySelector('#valor-sobra-distribuicao-ponderada-investimentos').value = formatarMoeda_resultado(sobrou);
  
  document.querySelector('#valor-provento-total-distribuicao-ponderada-investimentos').setAttribute('data-valor', parseFloat(proventoTotal.toFixed(2)));
  document.querySelector('#valor-provento-total-distribuicao-ponderada-investimentos').value = formatarMoeda_resultado(proventoTotal);
}
  
function formatarValorDisponivelDistribuicaoPonderada(){
  let inputValor = document.querySelector('#valor-disponivel-distribuicao-ponderada-investimentos');
  formatarMoeda(inputValor, 0);
  calcularDistribuicaoPonderadaInvestimento();
}

function addLinhaTotalBoletimFiltroAltenativo() {
  for (let c = 1; c < 4; c++) {
    var tabelaCorpoBoletim = document.querySelector(`#boletim-${c}-Altenativo`);
    let valor = dicionarioValorCadaMes[`${c+12}`];

    if (tabelaCorpoBoletim) {
      var linha = tabelaCorpoBoletim.querySelector('.boletim-mensal-total-filtro-altenativo');

      if (linha) {
        // Atualiza o conteúdo da linha existente
        linha.innerHTML = `<td colspan="3"><h3>Total: R$ ${formatarResultado(parseFloat(valor).toFixed(2), 2)}</h3></td>`;
      } else {
        // Cria a linha se não existir
        const novaLinha = document.createElement('tr');
        novaLinha.className = 'boletim-mensal-total-filtro-altenativo';
        novaLinha.innerHTML = `<td colspan="3"><h3>Total: R$ ${formatarResultado(parseFloat(valor).toFixed(2), 2)}</h3></td>`;
        tabelaCorpoBoletim.appendChild(novaLinha);
      }
    }
  }
}

function removerLinhaTotalBoletimFiltroAltenativo() {
  document.querySelectorAll('.boletim-mensal-total-filtro-altenativo').forEach(tr => {
    if (tr.parentNode) {
      tr.parentNode.removeChild(tr); // Remove a linha corretamente
    }
  });
}

document.getElementById("grupos-investimentos").style.display = "none";
document.getElementById("proventos-investimentos").style.display = "none";
document.getElementById("historia-investimentos").style.display = "none";
document.getElementById("distribuicao-ponderada-investimentos").style.display = "none";


document.getElementById("div-distribuicao-ponderada-Investimento").addEventListener("click", function() {
    let div = document.getElementById("distribuicao-ponderada-investimentos");
    if (div.style.display === "none") {
        div.style.display = "block"; // Mostra a div
    } else {
        div.style.display = "none"; // Oculta a div
    }
    atualizarDistribuicaoPonderadaGrupos();
});

document.getElementById("div-historico-Investimento").addEventListener("click", function() {
    let div = document.getElementById("historia-investimentos");
    if (div.style.display === "none") {
        div.style.display = "block"; // Mostra a div
    } else {
        div.style.display = "none"; // Oculta a div
    }
});

document.getElementById("div-Grupos-Investimento").addEventListener("click", function() {
    let div = document.getElementById("grupos-investimentos");
    if (div.style.display === "none") {
        div.style.display = "block"; // Mostra a div
    } else {
        div.style.display = "none"; // Oculta a div
    }
});

document.getElementById("div-Proventos-Investimento").addEventListener("click", function() {
    let div = document.getElementById("proventos-investimentos");
    if (div.style.display === "none") {
        div.style.display = "block"; // Mostra a div
    } else {
        div.style.display = "none"; // Oculta a div
    }
});

function coresCartoes_() {
  dicionarioCartoes = atualizarDadosCartoes();
  let cores = {};
  
  for (const [key, cartao] of Object.entries(dicionarioCartoes)) {
    cores[cartao.nomeCartao] = cartao.corCartao;
  }
  return cores
}

function filtroHistoricoCartoes() {
  let textoFiltro = document.getElementById("filtro-Historico-cartoes").value.toLowerCase();
  let tabelaCorpo = document.getElementById("historico-cartoes-tabela-corpo"); 
  let linhas = tabelaCorpo.getElementsByTagName("tr");

  for (let i = 0; i < linhas.length; i++) { // Começa de 1 se houver cabeçalho
    let coluna = linhas[i].getElementsByTagName("td")[0]; // Segunda coluna

    if (coluna) {
      let textoColuna = coluna.querySelector('label').textContent.toLowerCase();
      
      if (textoColuna.includes(textoFiltro)) {
        linhas[i].style.display = "";
      } else {
        linhas[i].style.display = "none";
      }
    }
  }
}

function limparFiltroHistoricoCartoes(){
  document.getElementById("filtro-Historico-cartoes").value = '';
  filtroHistoricoCartoes();
}

function extrairCartao(texto) {
    const match = texto.match(/cartão (.+?):/i); // Captura tudo após "cartão " até o ":"
    return match ? match[1].trim() : null; // Remove espaços extras e retorna o nome
}

function historicoCartoes(){
  var lista = dicionariohistoricoCartoes();
  var tabelaCorpo = document.getElementById('historico-cartoes-tabela-corpo');
  tabelaCorpo.innerHTML = '';
    
  for (let i = 0; i < lista.length; i++) {
    var novaLinha = document.createElement('tr');
    
    novaLinha.style.backgroundColor = coresCartoes[extrairCartao(lista[i])];
    novaLinha.style.color = 'black';
      
    novaLinha.innerHTML = `
        <td><label style="background-color: rgba(200, 200, 200, 0.7); padding: 1px;">${lista[i]}</label></td>
    `;
    tabelaCorpo.appendChild(novaLinha);
  }
}

function dicionariohistoricoCartoes(){
  dicionarioCartoes = atualizarDadosCartoes();
  
  var dicionario = {}
  var texto = ''
  let contador = 0;
  for (const [key, cartao] of Object.entries(dicionarioCartoes)) {
    for (const [key, linha] of Object.entries(cartao.linhas)) {
      let marcacoes = calcularParcelasHistorico(new Date(linha.data), parseInt(cartao.diaVencimento), parseInt(linha.parcela))
      let total = parseFloat(linha.valor) * parseFloat(linha.parcela);
      texto = `${inverterData(linha.data)} - Compra no cartão ${cartao.nomeCartao}: ${linha.descricao} em ${linha.parcela} parcela(s) de ${formatarMoeda_resultado(parseFloat(linha.valor))}, totalizando ${formatarMoeda_resultado(total)}, primeira parcela na fatura ${marcacoes[0].replace(". ", "-")}.`
      dicionario[contador] = {
        data: linha.data,
        texto: texto,
      }
      contador ++;
      texto = `${inverterData(marcacoes[2])} - Ultima Parcela da compra ${linha.descricao} no cartão ${cartao.nomeCartao}: -${formatarMoeda_resultado(parseFloat(linha.valor))} na proxima fatura.`
      dicionario[contador] = {
        data: marcacoes[2],
        texto: texto,
      }
      contador ++;
    }
  }
  
  return ordenarTextosPorDataDesc(dicionario);
}

function calcularParcelasHistorico(data, dia, parcelas) {
    let resultado = [];
    
    // Se o dia da data for maior que o dia fornecido, adiciona um mês
    if (data.getDate()+1 > dia) {
        data.setMonth(data.getMonth() + 1);
    }
    
    // Gera as parcelas
    for (let i = 0; i < parcelas; i++) {
        let mesAno = data.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace("de ", "");
        resultado.push(mesAno.charAt(0).toUpperCase() + mesAno.slice(1));
        data.setMonth(data.getMonth() + 1);
    }
    
    // A primeira parte é o primeiro mês
    let primeiraParcela = resultado[0];

    // Ajusta a data para o mês final e o dia fornecido
    data.setMonth(data.getMonth() - 1); // Ajusta para o mês correto
    let ultimaParcela = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    // Retorna os resultados conforme solicitado
    return [primeiraParcela, resultado[resultado.length - 1], ultimaParcela];
}

function filtroHistoricoInvestimento() {
  let textoFiltro = document.getElementById("filtro-Historico-Investimento").value.toLowerCase();
  let tabelaCorpo = document.getElementById("historico-tabela-corpo"); 
  let linhas = tabelaCorpo.getElementsByTagName("tr");

  for (let i = 0; i < linhas.length; i++) { // Começa de 1 se houver cabeçalho
    let coluna = linhas[i].getElementsByTagName("td")[0]; // Segunda coluna

    if (coluna) {
      let textoColuna = coluna.querySelector('label').textContent.toLowerCase();
      
      if (textoColuna.includes(textoFiltro)) {
        linhas[i].style.display = "";
      } else {
        linhas[i].style.display = "none";
      }
    }
  }
}

function limparFiltroHistoricoInvestimento(){
  document.getElementById("filtro-Historico-Investimento").value = '';
  filtroHistoricoInvestimento();
}

function historicoInvestimentos(){
  var lista = dicionariohistoricoInvestimentos();
  var tabelaCorpo = document.getElementById('historico-tabela-corpo');
  tabelaCorpo.innerHTML = '';
    
  for (let i = 0; i < lista.length; i++) {
    var cor = '';
    var novaLinha = document.createElement('tr');
    
    if (lista[i].includes('- provento de')){cor = '#d0e8ff'}
    else {cor = lista[i].includes('- compra de') ? '#d3f9d8' : '#f9d3d3'}
    
    novaLinha.style.backgroundColor = cor;
    novaLinha.style.color = 'black';
      
    novaLinha.innerHTML = `
        <td><label>${lista[i]}</label></td>
    `;
    tabelaCorpo.appendChild(novaLinha);
  }
  filtroHistoricoInvestimento();
}


function dicionariohistoricoInvestimentos(){
  dicionarioAcoes = criarDicionarioAcao();
  dicionarioProventosAcoes = criarDicionarioProventosAcoes();
  
  let dados = gruposInvestimentosDados();
  let grupoSelecionado = document.querySelector('#selecao-grupo-investimento-grafico').value;
  
  var dicionario = {}
  var texto = ''
  let contador = 0;
  for (const [key, acao] of Object.entries(dicionarioAcoes)) {
    for (const [key, movimentacao] of Object.entries(acao.movimentacoes)) {
      if (grupoSelecionado != ''){
        let lista = dados[grupoSelecionado]
        if (lista.includes(acao.codigo)){
          texto = `${inverterData(movimentacao.data)} - ${acao.nomeEmpresa} (${acao.codigo}) - ${movimentacao.movimentacao} de ${movimentacao.Qtde} cota(s) por ${formatarMoeda_resultado(movimentacao.valor)} a unidade, Total: ${formatarMoeda_resultado(movimentacao.valorTotal)}.`
          dicionario[contador] = {
            data: movimentacao.data,
            texto: texto,
          }
          contador ++;
        }
      } else {
        texto = `${inverterData(movimentacao.data)} - ${acao.nomeEmpresa} (${acao.codigo}) - ${movimentacao.movimentacao} de ${movimentacao.Qtde} cota(s) por ${formatarMoeda_resultado(movimentacao.valor)} a unidade, Total: ${formatarMoeda_resultado(movimentacao.valorTotal)}.`
        dicionario[contador] = {
          data: movimentacao.data,
          texto: texto,
        }
        contador ++;
      }
    }
  }
  
  for (const [key, provento] of Object.entries(dicionarioProventosAcoes)) {
    texto = `${inverterData(provento.dataPagamento)} - ${provento.empresa} (${provento.codigo}) - provento de ${provento.qtdeCota} cota(s) por ${provento.valorUnitario.replace('.', ',')} a unidade, Total: ${formatarMoeda_resultado(parseFloat(provento.valorTotal))}.`
    dicionario[contador] = {
      data: provento.dataPagamento,
      texto: texto,
    }
    contador ++;
  }
  return ordenarTextosPorDataDesc(dicionario);
}

function ordenarTextosPorDataDesc(dicionario) {
    return Object.values(dicionario)
        .sort((a, b) => new Date(b.data) - new Date(a.data)) // ordena por data decrescente
        .map(item => item.texto); // extrai apenas o texto
}

function inverterData(dataStr) {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
}

function filtroInvestimentos() {
  let textoFiltro = document.getElementById("filtro-Investimento").value.toLowerCase();
  let divsInvestimentos = document.getElementsByClassName("acao");
  let codigos = document.getElementsByClassName("codigos-acoes");
  let nomesEmpresas = document.getElementsByClassName("nome-empresa-investimento");
  
  for (let i = 0; i < codigos.length; i++) {
    let codigo = codigos[i].value.toLowerCase();
    let nomeEmpresa = nomesEmpresas[i].value.toLowerCase();
    if (codigo.includes(textoFiltro) || nomeEmpresa.includes(textoFiltro)){
      divsInvestimentos[i].style.display = "";
    } else {
      divsInvestimentos[i].style.display = "none";
    }
  }
}

function limparFiltroInvestimentos(){
  document.getElementById("filtro-Investimento").value = '';
  filtroInvestimentos();
}


function filtroCartoes() {
  let textoFiltro = document.getElementById("filtro-Cartoes").value.toLowerCase();
  let tabelas = document.getElementsByClassName("tabela-corpo-Cartoes"); // Seleciona todas as tabelas
  let divsCartoes = document.getElementsByClassName("cartaoadd"); // Seleciona todas as divs que contêm os cartões

  for (let i = 0; i < tabelas.length; i++) {
    let tabela = tabelas[i]; 
    let linhas = tabela.getElementsByTagName("tr");
    let contador = 0; // Reinicia o contador para cada tabela
    
    let nomeCartao = divsCartoes[i].querySelector('.nome-cartao').value.toLowerCase();
    if (nomeCartao.includes(textoFiltro) && textoFiltro != ''){
      contador += 1;
      for (let j = 0; j < linhas.length; j++) {
        linhas[j].style.display = "";
      }
    }
    else {
      for (let j = 0; j < linhas.length; j++) {
        let coluna = linhas[j].getElementsByTagName("td")[0]; // Primeira coluna

        if (coluna) {
          let descricaoInput = coluna.querySelector('.descricao-input');
          let textoColuna = descricaoInput ? descricaoInput.value.toLowerCase() : "";

          if (textoColuna.includes(textoFiltro)) {
            linhas[j].style.display = "";
            contador += 1;
          } else {
            linhas[j].style.display = "none";
          }
        }
      }
    }
    
    // Se nenhuma linha for encontrada, oculta a div correspondente
    if (contador === 0 && divsCartoes[i]) {
      divsCartoes[i].style.display = "none";
    } else if (divsCartoes[i]) {
      divsCartoes[i].style.display = ""; // Se houver correspondências, exibe a div
    }
  }
}



function limparFiltroCartoes(){
  document.getElementById("filtro-Cartoes").value = '';
  filtroCartoes();
}


function filtroReceitas() {
  let textoFiltro = document.getElementById("filtro-Receitas").value.toLowerCase();
  let tabelaCorpo = document.getElementById("Receitas-tabela-corpo"); 
  let linhas = tabelaCorpo.getElementsByTagName("tr");

  for (let i = 0; i < linhas.length; i++) { // Começa de 1 se houver cabeçalho
    let coluna = linhas[i].getElementsByTagName("td")[0]; // Segunda coluna

    if (coluna) {
      let textoColuna = coluna.querySelector('.descricao-input').value.toLowerCase();
      
      if (textoColuna.includes(textoFiltro)) {
        linhas[i].style.display = "";
      } else {
        linhas[i].style.display = "none";
      }
    }
  }
}

function limparFiltroReceitas(){
  document.getElementById("filtro-Receitas").value = '';
  filtroReceitas();
}

function filtroDividasDiversas() {
  let textoFiltro = document.getElementById("filtro-Dividas-Diversas").value.toLowerCase();
  let tabelaCorpo = document.getElementById("diversos-tabela-corpo");
  let linhas = tabelaCorpo.getElementsByTagName("tr");

  for (let i = 0; i < linhas.length; i++) { // Começa de 1 se houver cabeçalho
    let coluna = linhas[i].getElementsByTagName("td")[0]; // Segunda coluna

    if (coluna) {
      let textoColuna = coluna.querySelector('.descricao-input').value.toLowerCase();
      
      if (textoColuna.includes(textoFiltro)) {
        linhas[i].style.display = "";
      } else {
        linhas[i].style.display = "none";
      }
    }
  }
}

function limparFiltroDividasDiversas(){
  document.getElementById("filtro-Dividas-Diversas").value = '';
  filtroDividasDiversas();
}

function calcularSetores() {
  dicionarios = separarMovimentacoes(calcularValoresMensais(atualizarDadosReceitas(), atualizarDadosCartoes(), atualizarDadosDiversos(), criarDicionarioCofrinho(), criarDicionarioAcao(), criarDicionarioProventosAcoes(), criarDicionarioMoedas(), new Date()))
  criarGraficosPizzaSetores(dicionarios[0], dicionarios[1])
}

function criarGraficosPizzaSetores(entradasPorTipo, saidasPorTipo) {
    const container = document.getElementById("graficosPizzaSetores");
    container.innerHTML = ""; // Limpa os gráficos anteriores
    let coresEntradas = gerarCoresAleatorias(10);
    let coresSaidas = gerarCoresAleatorias(10);
    const meses = gerarMesesAte12();

    for (let mes = 1; mes <= 12; mes++) {
        // Dados das entradas
        const entradas = entradasPorTipo[mes] || {};
        const labelsEntradas = Object.keys(entradas);
        const valoresEntradas = Object.values(entradas);
        const totalEntradas = valoresEntradas.reduce((acc, val) => acc + val, 0);

        // Dados das saídas
        const saidas = saidasPorTipo[mes] || {};
        const labelsSaidas = Object.keys(saidas);
        const valoresSaidas = Object.values(saidas);
        const totalSaidas = valoresSaidas.reduce((acc, val) => acc + val, 0);

        // Criar div para o mês com título (h3)
        const divMes = document.createElement("div");
        divMes.className = "mes-container";
        const h3Mes = document.createElement("h3");
        h3Mes.textContent = meses[mes - 1]; // Nome do mês
        divMes.appendChild(h3Mes);

        // Criar elementos para os gráficos
        const divEntrada = document.createElement("div");
        divEntrada.className = "grafico-container";
        const canvasEntrada = document.createElement("canvas");
        canvasEntrada.id = `entrada-${mes}`;
        divEntrada.appendChild(canvasEntrada);

        const divSaida = document.createElement("div");
        divSaida.className = "grafico-container";
        const canvasSaida = document.createElement("canvas");
        canvasSaida.id = `saida-${mes}`;
        divSaida.appendChild(canvasSaida);

        // Criar div para gráfico de barras laterais
        const divBarra = document.createElement("div");
        divBarra.className = "grafico-container-barras";
        const canvasBarra = document.createElement("canvas");
        canvasBarra.id = `barra-${mes}`;
        divBarra.appendChild(canvasBarra);

        // Adicionar os gráficos à div do mês
        divMes.appendChild(divBarra); // Adiciona o gráfico de barras
        divMes.appendChild(divEntrada);
        divMes.appendChild(divSaida);

        // Adicionar a div do mês ao container
        container.appendChild(divMes);

        // Configuração dos rótulos dentro das fatias
        const dataLabelsConfig = {
            color: "#000",
            backgroundColor: "rgba(200, 200, 200, 0.7)",
            anchor: "center",
            align: "center",
            font: { weight: "bold", size: 12 },
            formatter: (value, ctx) => {
                const label = ctx.chart.data.labels[ctx.dataIndex];
                const total = ctx.chart.canvas.id.includes("entrada") ? totalEntradas : totalSaidas;
                const porcentagem = total ? ((value / total) * 100).toFixed(2) : 0;
                return `${label}: ${formatarMoeda_resultado(value)} (${porcentagem}%)`;
            }
        };

        // Configuração do tooltip ao passar o mouse
        const tooltipConfig = {
            callbacks: {
                label: function (tooltipItem) {
                    const dataset = tooltipItem.dataset;
                    const valor = dataset.data[tooltipItem.dataIndex];
                    const total = tooltipItem.chart.canvas.id.includes("entrada") ? totalEntradas : totalSaidas;
                    const porcentagem = total ? ((valor / total) * 100).toFixed(2) : 0;
                    return `${formatarMoeda_resultado(valor)} (${porcentagem}%)`;
                }
            }
        };

        // Criar gráfico de entrada se houver dados
if (labelsEntradas.length > 0) {
    new Chart(canvasEntrada, {
        type: "pie",
        data: {
            labels: labelsEntradas,
            datasets: [{
                data: valoresEntradas,
                backgroundColor: coresEntradas
            }]
        },
        options: {
            cutout: '40%', // Adiciona o efeito de rosquinha, sem miolo
            plugins: {
                title: { display: true, text: `Entradas ${formatarMoeda_resultado(totalEntradas)}` },
                datalabels: dataLabelsConfig,
                tooltip: tooltipConfig
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Criar gráfico de saída se houver dados
if (labelsSaidas.length > 0) {
    new Chart(canvasSaida, {
        type: "pie",
        data: {
            labels: labelsSaidas,
            datasets: [{
                data: valoresSaidas,
                backgroundColor: coresSaidas
            }]
        },
        options: {
            cutout: '40%', // Adiciona o efeito de rosquinha, sem miolo
            plugins: {
                title: { display: true, text: `Saídas ${formatarMoeda_resultado(totalSaidas)}` },
                datalabels: dataLabelsConfig,
                tooltip: tooltipConfig
            }
        },
        plugins: [ChartDataLabels]
    });
}

      
        const ctx = document.getElementById(`barra-${mes}`).getContext("2d");

        const saldo = Math.abs(totalEntradas - totalSaidas*-1); // Calcula a diferença entre entradas e saídas
        const isEntradasMaior = totalEntradas > totalSaidas*-1; // Verifica se as entradas são maiores que as saídas

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: [''], // Remova os labels de categoria
                datasets: [{
                    label: `Entradas: ${formatarMoeda_resultado(totalEntradas)}`,
                    data: [totalEntradas],
                    backgroundColor: '#4CAF50',
                    borderWidth: 0,
                    barThickness: 15,
                    stack: 'entradas', // Adiciona o empilhamento para as entradas
                }, {
                    label: `Saídas: ${formatarMoeda_resultado(totalSaidas)}`,
                    data: [totalSaidas * -1],
                    backgroundColor: '#F44336',
                    borderWidth: 0,
                    barThickness: 15,
                    stack: 'saidas', // Adiciona o empilhamento para as saídas
                }, {
                    label: `Saldo: ${isEntradasMaior ? formatarMoeda_resultado(saldo) : formatarMoeda_resultado(saldo*-1)}`,
                    data: [saldo],
                    backgroundColor: '#FFEB3B', // Cor para a barra do saldo
                    borderWidth: 0,
                    barThickness: 15,
                    // A chave "stack" vai garantir que o saldo apareça ao lado da menor barra
                    stack: isEntradasMaior ? 'saidas' : 'entradas', // Dependendo de qual barra é menor, o saldo vai aparecer ao lado
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true},
                },
                scales: {
                    x: {
                        display: false,
                    },
                    y: {
                        ticks: {
                            display: false, // Oculta os ticks do eixo Y
                        },
                        grid: {
                            offset: false,
                            lineWidth: 0,
                        },
                        stacked: true, // Empilha as barras
                        beginAtZero: true,
                    }
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    }
                },
                // Ajuste para barras agrupadas
                grouped: true,
                categoryPercentage: 0.8,
                barPercentage: 0.8,
            }
        });
    }
}

function separarMovimentacoes(dados) {
    let entradasPorTipo = {};
    let saidasPorTipo = {};

    // Inicializa os 12 meses
    for (let mes = 1; mes <= 12; mes++) {
        entradasPorTipo[mes] = {};
        saidasPorTipo[mes] = {};
    }

    // Função para formatar o tipo corretamente
    function formatarTipo(tipo) {
        let novoTipo = tipo.replace("boletim-mensal-", ""); // Remove prefixo
        let resultado = novoTipo.charAt(0).toUpperCase() + novoTipo.slice(1); // Primeira letra maiúscula
        return resultado === 'Dividas-diversas' ? 'Dividas Diversas' : resultado;
    }

    // Percorre os meses disponíveis nos dados
    for (const mes in dados) {
        for (const id in dados[mes]) {
            const item = dados[mes][id];
             if (Object.prototype.toString.call(item) === '[object Date]' || typeof item === 'string' && !isNaN(Date.parse(item))) {continue;}
            const { tipo, movimentacao, valor } = item;
            const tipoFormatado = formatarTipo(tipo);

            if (movimentacao === "entrada") {
                if (!entradasPorTipo[mes][tipoFormatado]) {
                    entradasPorTipo[mes][tipoFormatado] = 0;
                }
                entradasPorTipo[mes][tipoFormatado] += valor;
            } else if (movimentacao === "saida") {
                if (!saidasPorTipo[mes][tipoFormatado]) {
                    saidasPorTipo[mes][tipoFormatado] = 0;
                }
                saidasPorTipo[mes][tipoFormatado] += valor;
            }
        }
    }

    return [entradasPorTipo, saidasPorTipo];
}

function cambioFuncao() {
    mostrarIconer('Icone9');
}

let moedaIdCounter = 0;
function addMoeda(){
    moedaIdCounter ++;
    var containerCambio = document.getElementById('cambio-container');
    var novaMoeda = document.createElement('div');
    novaMoeda.classList.add('acaoAdd');

    novaMoeda.innerHTML = `
        <div class="cambio" id="cambio-${moedaIdCounter}">
            <label for="moeda-${moedaIdCounter}-nome">Nome:</label>
            <input type="text" id="moeda-${moedaIdCounter}-nome" placeholder="Nome" class="descricao-input">

            <label for="moeda-${moedaIdCounter}-cotas">Qtde:</label>
            <input id="moeda-${moedaIdCounter}-cotas" placeholder="0" disabled class="valor-input">

            <label for="moeda-${moedaIdCounter}-valor-cota">Valor:</label>
            <input id="moeda-${moedaIdCounter}-valor-cota" placeholder="R$ 0,00" class="valor-input" onblur="formatarValorMoeda(${moedaIdCounter})" value="R$ 0,00" data-valor="0.0">
            
            <label for="moeda-${moedaIdCounter}-valor-aplicado">Total Aplicado:</label>
            <input class="valor-aplicado-moeda valor-input" id="moeda-${moedaIdCounter}-valor-aplicado" placeholder="R$ 0,00" disabled>
            
            <label for="moeda-${moedaIdCounter}-valor-valorizacao">Valorização:</label>
            <label class="valor-valorizacao-moeda descricao-input" id="moeda-${moedaIdCounter}-valor-valorizacao" data-valor="0">R$ 0,00 (0,000)</label>

            <button onclick="apagarMoeda('${moedaIdCounter}')" class="remover-linha">Excluir Moeda</button>

            <div class="table-container">
            <button onclick="adicionarLinhaMoeda(${moedaIdCounter})" class="remover-linha">Adicionar Linha</button>
                <table>
                    <thead>
                        <tr>
                            <th>Movimentação</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Qtde</th>
                            <th>Valor Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="moeda-${moedaIdCounter}-tabela-corpo">
                    </tbody>
                </table>
            </div>
        </div>`
    containerCambio.appendChild(novaMoeda);
}

function apagarMoeda(id){
    var acao = document.getElementById(`cambio-${id}`);
    acao.remove();
    atualizarTotalAplicadoMoedaGeral();
}

function adicionarLinhaMoeda(id){
    var tabelaCorpo = document.getElementById(`moeda-${id}-tabela-corpo`);
    var novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>
            <select class="descricao-input movimentacao">
                <option value="compra">Compra</option>
                <option value="venda">Venda</option>
            </select>
        </td>
        <td><input type="text" class="valor-input" onblur="formatarMoeda(this, '0')" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="number" class="valor-input qtde-cota" value=1></td>
        <td><input type="text" class="valor-total" disabled placeholder="R$ 0,00" value="R$ 0,00" data-valor="0.0"></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizarQtdeCotasMoeda(id);
    });
  
    var valorInput = novaLinha.querySelector('.valor-input');
    var QtdeInput = novaLinha.querySelector('.qtde-cota');
    var valorTotalInput = novaLinha.querySelector('.valor-total');
    var movimentacaoInput = novaLinha.querySelector('.movimentacao');

    valorInput.addEventListener('input', () => { atualizarValorTotalMoeda(valorInput, QtdeInput, valorTotalInput, id) });
    QtdeInput.addEventListener('input', () => { atualizarValorTotalMoeda(valorInput, QtdeInput, valorTotalInput, id) });
    movimentacaoInput.addEventListener('change', () => { atualizarQtdeCotasMoeda(id) });
}

function atualizarValorTotalMoeda(valorInput, QtdeInput, valorTotalInput, id){
    var valor = parseFloat(valorInput.value.replace('R$ ', '').replace('.', '').replace(',', '.')) || 0;
    var Qtde = parseFloat(QtdeInput.value) || 0;
    var valorTotal = valor * Qtde;
    valorTotalInput.setAttribute('data-valor', parseFloat(valorTotal.toFixed(2)));
    valorTotalInput.value = formatarMoeda_resultado(valorTotal);
    
    atualizarQtdeCotasMoeda(id);
    atualizarTotalAplicadoMoeda(id);
}

function atualizarQtdeCotasMoeda(id){
    var tabelaCorpo = document.getElementById(`moeda-${id}-tabela-corpo`);
    var linhas = tabelaCorpo.getElementsByTagName('tr');
    var QtdeCotas = 0.0;
    var casasDecimalMaior = 2;

    for (var i = 0; i < linhas.length; i++){
        var linha = linhas[i];
        var QtdeInput = linha.querySelector('.qtde-cota');
        var Qtde = parseFloat(QtdeInput.value) || 0;    
        var movimentacao = linha.querySelector('.movimentacao').value;
      
        var parteDecimal = Qtde.toString().split('.')[1];
        var casasDecimal = parteDecimal ? parteDecimal.length : 2;
        if (casasDecimal > casasDecimalMaior) casasDecimalMaior = casasDecimal;
        if (movimentacao === 'compra') {
          QtdeCotas += Qtde;
        }
        else {
          QtdeCotas -= Qtde
        }
        
        QtdeCotas = parseFloat(QtdeCotas.toFixed(casasDecimalMaior));
        var cotaInput = document.getElementById(`moeda-${id}-cotas`);
        cotaInput.value = QtdeCotas;
        formatarValorInput(cotaInput);
    }
  atualizarTotalAplicadoMoeda(id);
}

function atualizarTotalAplicadoMoeda(id) {
  // Corrigir o seletor para incluir o prefixo de ID (#)
  var qtd = document.querySelector(`#moeda-${id}-cotas`);
  
  // Corrigir o seletor para incluir o prefixo de ID (#)
  var valorCotaElement = document.querySelector(`#moeda-${id}-valor-cota`);
  var valorCota = parseFloat(valorCotaElement?.getAttribute('data-valor')) || 0;

  // Corrigir multiplicação: verificar se qtd é um elemento válido e obter seu valor
  var quantidade = parseFloat(qtd?.getAttribute('data-valor')) || 0;
  var total = valorCota * quantidade;

  var inputTotalAcoes = document.getElementById(`moeda-${id}-valor-aplicado`);
  
  inputTotalAcoes?.setAttribute('data-valor', total.toFixed(2));
  inputTotalAcoes.value = formatarMoeda_resultado(total);
  atualizarValorizacaoMoeda(id);
}

function formatarValorMoeda(id){
    var valorCotaInput = document.getElementById(`moeda-${id}-valor-cota`);
    formatarMoeda(valorCotaInput, 0);
    atualizarTotalAplicadoMoeda(id);
}

function atualizarValorizacaoMoeda(id) {
  var tabelaCorpo = document.getElementById(`moeda-${id}-tabela-corpo`);
  var linhas = tabelaCorpo.getElementsByTagName('tr');
  var dicionarioDados = {};
  var total = 0.0;

  // Criar dicionário com os dados da tabela
  for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    dicionarioDados[i] = {
      movimentacao: linha.querySelector('.movimentacao').value,
      valor: parseFloat(linha.querySelector('.valor-input').getAttribute('data-valor')) || 0.0,
      qtd: parseFloat(linha.querySelector('.qtde-cota').value) || 0,
    };
  }

  // Processar "compra" e "venda" no dicionário
  for (var [chave, dados] of Object.entries(dicionarioDados)) {
    if (dados.movimentacao === "venda") {
      for (var [chave_, dado] of Object.entries(dicionarioDados)) {
        if (dado.movimentacao === "compra") {
          if (dados.qtd > dado.qtd) {
            // Decrementa a quantidade e remove a "compra"
            dados.qtd -= dado.qtd;
            delete dicionarioDados[chave_];
          } else {
            // Remove a "venda" ou ajusta as quantidades
            dado.qtd -= dados.qtd;
            delete dicionarioDados[chave];
            break; // Não há mais quantidade para ajustar
          }
        }
      }
    }
  }
  
  for (var [chave, dados] of Object.entries(dicionarioDados)) {
    total += dados.qtd * dados.valor;
  }
  var valorAplicado = parseFloat(document.getElementById(`moeda-${id}-valor-aplicado`).getAttribute('data-valor')) || 0.0;
  var valorizacao = valorAplicado - total;
  var valorizacaoPorcentual = valorizacao * 100 / valorAplicado;
  
  var labelValorizacao = document.getElementById(`moeda-${id}-valor-valorizacao`);
  labelValorizacao.setAttribute('data-valor', parseFloat(valorizacao.toFixed(2)));
  var texto = formatarMoeda_resultado(valorizacao);
  texto += (valorizacaoPorcentual > 0) ? ` (↑${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)` : ` (↓${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)`;
  labelValorizacao.textContent = texto.replace('NaN', '0,000');
  atualizarTotalAplicadoMoedaGeral();
}

function criarDicionarioMoedas() {
    var containerAcao = document.getElementById('cambio-container');
    var moedas = containerAcao.getElementsByClassName('cambio');
    var dicionario = {};

    for (var i = 0; i < moedas.length; i++) {
        var moeda = moedas[i];
        var id = moeda.id.split('-')[1];
        var nome = moeda.querySelector(`[id$='moeda-${id}-nome']` ) ? moeda.querySelector(`[id$='moeda-${id}-nome']`).value : '';
        var valorCota = parseFloat(moeda.querySelector(`[id$='moeda-${id}-valor-cota']`) ? moeda.querySelector(`[id$='moeda-${id}-valor-cota']`).getAttribute('data-valor') : 0) || 0;
      
        var linhas = moeda.getElementsByTagName('tr');

        for (var j = 1; j < linhas.length; j++) {
            var linha = linhas[j];
            var movimentacao = linha.querySelector('.movimentacao') ? linha.querySelector('.movimentacao').value : '';
            var valor = parseFloat(linha.querySelector('.valor-input') ? linha.querySelector('.valor-input').getAttribute('data-valor') : 0) || 0;
            var data = linha.querySelector('.data-input') ? linha.querySelector('.data-input').value : '';
            var Qtde = parseFloat(linha.querySelector('.qtde-cota') ? linha.querySelector('.qtde-cota').value : 0) || 0;
            var valorTotal = parseFloat(linha.querySelector('.valor-total') ? linha.querySelector('.valor-total').getAttribute('data-valor') : 0) || 0;

            if (dicionario[id] === undefined) {
                dicionario[id] = {
                    nome: nome,
                    valorCota: valorCota,
                    movimentacoes: {},
                };
            }

            dicionario[id].movimentacoes[j] = {
                movimentacao: movimentacao,
                valor: valor,
                data: data,
                Qtde: Qtde,
                valorTotal: valorTotal
            };
        }
    }
    return dicionario;
}

function atualizarTotalAplicadoMoedaGeral(){
  var inputTotal = document.getElementById(`moeda-total-aplicado`);
  var valorTotal = 0;
  
  var totais = document.querySelectorAll('#cambio-container .valor-aplicado-moeda');
  for (i = 0; i < totais.length; i ++){
    var valor = parseFloat(totais[i].getAttribute('data-valor')) || 0;
    valorTotal += valor;
  }
  inputTotal.setAttribute('data-valor', valorTotal.toFixed(2));
  inputTotal.textContent = formatarMoeda_resultado(valorTotal);
  atualizarTotalValorizacaoMoedaGeral();
}

function atualizarTotalValorizacaoMoedaGeral() {
  var inputTotalValorizacao = document.getElementById(`moeda-total-valorizacao`);
  var valorValorizacaoTotal = 0;
  
  var totais = document.querySelectorAll('#cambio-container .valor-valorizacao-moeda');
  for (i = 0; i < totais.length; i ++){
    var valor = parseFloat(totais[i].getAttribute('data-valor')) || 0;
    valorValorizacaoTotal += valor;
  }
  var inputTotal = parseFloat(document.getElementById(`moeda-total-aplicado`).getAttribute('data-valor')) || 0;
  var valorizacaoPorcentual = valorValorizacaoTotal * 100 / inputTotal;
  
  var texto = formatarMoeda_resultado(valorValorizacaoTotal);
  texto += (valorizacaoPorcentual > 0) ? ` (↑${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)` : ` (↓${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)`;
  
  inputTotalValorizacao.setAttribute('data-valor', valorValorizacaoTotal.toFixed(2));
  inputTotalValorizacao.textContent = texto.replace('NaN', '0,000')
}



function limparDados(id) {
  var tabela = document.querySelector(`${id}`);
  var linhas = Array.from(tabela.getElementsByTagName('tr')); // Converte para array
  
  linhas.forEach((linha) => {
    let totalElement = linha.querySelector('.valor-total');
    if (totalElement) {
      let total = parseFloat(totalElement.getAttribute('data-valor')) || 0; // Obtém o valor como número
      if (total === 0) {
        var btnremover = linha.querySelector('.remover-linha');
        if (btnremover) {
          btnremover.click(); // Simula o clique no botão
        }
      }
    }
  });
}

function limparDadosCartoes() {
  var tabelas = document.getElementsByClassName('table-container-cartoes'); // Seleciona as tabelas
  
  Array.from(tabelas).forEach((tabela) => { // Converte para array e itera
    var id = `.${tabela.classList[0]}`; // Obtém a primeira classe (adiciona . para o seletor CSS)
    limparDados(id); // Passa o seletor para a função limparDados
  });
}


carregou = false;
function gerarCoresAleatorias(quantidade){
    return Array.from({ length: quantidade }, () =>
        `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`
    );
}

let coresInvestimento = [];

function gerarGraficoPizzaInvestimento(dados) {
    // Pegando o total
    const total = parseFloat(document.getElementById("acoes-total-aplicado").getAttribute("data-valor"));

    // Pegando os valores dos setores
    const setores = document.querySelectorAll("input.valor-aplicado");
    const nomes = document.querySelectorAll("[id$='-nome-empresa']");
    const codigos = document.querySelectorAll("[id$='-nome-codigo']");

    const valores = [];
    const labels = [];

    // Preenchendo os valores e nomes para o gráfico
    setores.forEach((setor, index) => {
        if (dados.includes(codigos[index].value) || dados.length === 0){
          const valor = parseFloat(setor.getAttribute("data-valor"));
          valores.push(valor);
          labels.push(nomes[index].value);
        }
    });
    coresInvestimento = gerarCoresAleatorias(valores.length)

    // Pegando o canvas
    const canvas = document.getElementById("graficoPizzaInvestimentos");

    // Verificando se já existe um gráfico, e destruindo-o se necessário
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Criando o gráfico de pizza
    const ctx = canvas.getContext("2d");

    canvas.chart = new Chart(ctx, {
      type: 'pie',
      data: {
          labels: labels, // Nomes dos setores
          datasets: [{
              label: "Investimentos", // Título do gráfico (pode ser dinâmico)
              data: valores, // Valores de cada setor
              backgroundColor: coresInvestimento,
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          cutout: '40%', // Adiciona o efeito de rosquinha, sem miolo
          plugins: {
              legend: {
                  position: 'bottom', // A legenda estará abaixo
                  labels: {
                      font: {
                          size: 14
                      }
                  }
              },
              title: {
                  display: true, // Habilita o título
                  text: 'Distribuição dos Investimentos', // Título do gráfico
                  font: {
                      size: 18, // Tamanho da fonte do título
                      weight: 'bold' // Peso da fonte (negrito)
                  },
                  padding: {
                      top: 10, // Distância entre o título e o gráfico
                      bottom: 30 // Distância entre o título e o gráfico
                  },
                  color: '#333' // Cor do título
              },
              datalabels: {
                  color: "#000", // Cor do texto dentro das fatias
                  backgroundColor: "rgba(200, 200, 200, 0.7)",
                  font: {
                      size: 14,
                      weight: "bold"
                  },
                  formatter: (value, ctx) => {
                      const label = ctx.chart.data.labels[ctx.dataIndex];
                      const porcentagem = ((value / total) * 100).toFixed(2);
                      return `${label}: ${porcentagem}%`;
                  },
                  anchor: 'center',  // Ancorando no centro da fatia
                  align: 'center'    // Alinhando o texto ao centro
              }
          }
      },
      plugins: [ChartDataLabels] // Usando o plugin para mostrar os rótulos dentro do gráfico
  });
}

function gerarGraficoBarrasInvestimento(dados) {
    if (!carregou) { return; }

    // Pegando os valores
    const setores = document.querySelectorAll("input.valor-aplicado");
    const nomes = document.querySelectorAll("[id$='-nome-empresa']");
    const valorizacoes = document.querySelectorAll("label.valor-valorizacao");
    const codigos = document.querySelectorAll("[id$='-nome-codigo']");

    const valores = [];
    const labels = [];
    const valoresValorizacao = [];
    const valoresTotais = [];
    let totalValorAplicado = 0; let totalValorizacao = 0; let totalValorTotal = 0;

    setores.forEach((setor, index) => {
      if (dados.includes(codigos[index].value) || dados.length === 0){
        const valor = parseFloat(setor.getAttribute("data-valor"));
        const valorValorizacao = parseFloat(valorizacoes[index].getAttribute("data-valor"));
      
        totalValorAplicado += valor - valorValorizacao;
        totalValorizacao += valorValorizacao;
        totalValorTotal += valor;
      
        valores.push(valor - valorValorizacao); // Valor base
        valoresValorizacao.push(valorValorizacao); // Valorização
        labels.push(nomes[index].value);
        valoresTotais.push(valor);
      }
    });

    // Pegando o canvas
    const canvas = document.getElementById("graficoBarrasInvestimentos");

    // Verificando se já existe um gráfico, e destruindo-o se necessário
    if (canvas.chart) {
        canvas.chart.destroy();
    }

    // Criando o gráfico de barras empilhadas
    const ctx = canvas.getContext("2d");

    canvas.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Valor Aplicado: ${formatarMoeda_resultado(totalValorAplicado)}`,
                    data: valores,
                    backgroundColor: coresInvestimento,
                    borderColor: "#000",
                    borderWidth: 2,
                    stack: 'grupo1' // Mantém empilhado com Valorização
                },
                {
                    label: `Valorização: ${formatarMoeda_resultado(totalValorizacao)}`,
                    data: valoresValorizacao,
                    backgroundColor: valoresValorizacao.map(valor => valor >= 0 ? "#CCFF33" : "#D50000"), // Verde para positivos, vermelho para negativos
                    borderColor: "#000",
                    borderWidth: 2,
                    stack: 'grupo1' // Mantém empilhado com Valor Aplicado
                },
                {
                    label:`Total: ${formatarMoeda_resultado(totalValorTotal)}`,
                    data: valoresTotais,
                    backgroundColor: coresInvestimento, // Mesma cor da primeira barra
                    borderColor: "#000",
                    borderWidth: 2,
                    stack: 'grupo2' // Grupo separado para não empilhar com os outros
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Valores Aplicado, Valorização e Total',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    },
                    color: '#333'
                },
                datalabels: {
                    color: "#000",
                    backgroundColor: "rgba(200, 200, 200, 0.7)",
                    font: {
                        size: 14,
                        weight: "bold"
                    },
                    formatter: (value, ctx) => {
                        return formatarMoeda_resultado(value)
                    },
                    anchor: 'center',
                    align: 'center'
                }
            },
            scales: {
                x: {
                    stacked: false // Mantém as barras independentes, exceto onde especificado
                },
                y: {
                    stacked: true // Somente afeta o grupo1, garantindo que a valorização empilhe sobre o valor aplicado
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function filtroProvento() {
  let textoFiltro = document.getElementById("filtro-Proventos").value.toLowerCase();
  let tabelaCorpo = document.getElementById("proventos-tabela-corpo");
  let linhas = tabelaCorpo.getElementsByTagName("tr");

  for (let i = 0; i < linhas.length; i++) { // Começa de 1 se houver cabeçalho
    let coluna = linhas[i].getElementsByTagName("td")[1]; // Segunda coluna
    let colunaCodigo = linhas[i].getElementsByTagName("td")[0];

    if (coluna) {
      let textoColuna = coluna.querySelector('.nome-empresa').value.toLowerCase();
      let textoColunaCodigo = colunaCodigo.querySelector('.cod-acoes-escolha').value.toLowerCase();
      
      if (textoColuna.includes(textoFiltro) || textoColunaCodigo.includes(textoFiltro)) {
        linhas[i].style.display = "";
      } else {
        linhas[i].style.display = "none";
      }
    }
  }
}

function limparFiltroProvento(){
  document.getElementById("filtro-Proventos").value = '';
  filtroProvento();
}

function atualizarTodosProventos(){
  const tabelaCorpo = document.getElementById(`proventos-tabela-corpo`);
  var linhas = tabelaCorpo.getElementsByTagName('tr');
  
  for (let i = 0; i < linhas.length; i++) {
    var novaLinha = linhas[i];
    let caixaSelecao = novaLinha.querySelector('.cod-acoes-escolha');
    let empresaInput = novaLinha.querySelector('.nome-empresa');
    let dataCorteInput = novaLinha.querySelector('.data-corte-acoes');
    let dataPagamento = novaLinha.querySelector('.data-pagamento-acao');
    let valorUnitarioInput = novaLinha.querySelector('.valor-unitario-acao');
    let qtdeInput = novaLinha.querySelector('.qtde-cota');
    let valorTotalInput = novaLinha.querySelector('.valor-total-acao');
    
    preencherProventosAcoes(caixaSelecao, empresaInput, dataCorteInput, qtdeInput, valorUnitarioInput, valorTotalInput);
  }
}

function addProvento() {
  const tabelaCorpo = document.getElementById(`proventos-tabela-corpo`);

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td><select class="valor-input cod-acoes-escolha"></select></td>
        <td><input class="descricao-input nome-empresa" disabled></td> 
        <td><input type="date" class="data-input data-corte-acoes"></td>
        <td><input type="date" class="data-input data-pagamento-acao"></td>
        <td><input type="text" class="valor-input valor-unitario-acao" data-valor="0"></td>
        <td><input type="number" class="valor-input qtde-cota" disabled></td></td>
        <td><input type="text" class="valor-input valor-total-acao" value="R$ 0,00" data-valor="0" disabled></td>
        <td><button class="remover-linha">Remover</button></td>
    `;

    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
    });
  
    let caixaSelecao = novaLinha.querySelector('.cod-acoes-escolha');
    let empresaInput = novaLinha.querySelector('.nome-empresa');
    let dataCorteInput = novaLinha.querySelector('.data-corte-acoes');
    let dataPagamento = novaLinha.querySelector('.data-pagamento-acao');
    let valorUnitarioInput = novaLinha.querySelector('.valor-unitario-acao');
    let qtdeInput = novaLinha.querySelector('.qtde-cota');
    let valorTotalInput = novaLinha.querySelector('.valor-total-acao');
  
    novaLinha.querySelector('.cod-acoes-escolha').addEventListener('change', (event) => {
        preencherProventosAcoes(caixaSelecao, empresaInput, dataCorteInput, qtdeInput, valorUnitarioInput, valorTotalInput); // Chama a função passando o valor selecionado
    });
    
    dataCorteInput.addEventListener('input', () => { preencherProventosAcoes(caixaSelecao, empresaInput, dataCorteInput, qtdeInput, valorUnitarioInput, valorTotalInput) });
    valorUnitarioInput.addEventListener('change', () => { formatarValorInput(valorUnitarioInput); preencherProventosAcoes(caixaSelecao, empresaInput, dataCorteInput, qtdeInput, valorUnitarioInput, valorTotalInput) });
    listaCodAcoes();
}


function preencherProventosAcoes(selectInput, empresaInput, dataCorteInput, qtdeInput, valorInput, valorTotalInput){
  if (selectInput.value === ''){
    empresaInput.value = '';
    qtdeInput.value = 0;
    return
  }
  var dadosProcessados = dicionarioAcoesModificado();
  
  let codigoAcao = selectInput.value;
  if (dadosProcessados[codigoAcao]){
    empresaInput.value = dadosProcessados[codigoAcao].nomeEmpresa;
    if (dataCorteInput.value){
      let qtd = calcularQtdeAcoesData(new Date(dataCorteInput.value), dadosProcessados[codigoAcao].movimentacoes);
      qtdeInput.value = qtd;
      let valorTotal = parseFloat(valorInput.getAttribute('data-valor')) * qtd;
      valorTotalInput.setAttribute('data-valor', parseFloat(valorTotal.toFixed(2)));
      valorTotalInput.value = formatarMoeda_resultado(valorTotal);
    } else {
      qtdeInput.value = 0;
    }
  } else {
    empresaInput.value = '';
    qtdeInput.value = 0;
    selectInput.value = '';
    valorInput.value = '';
    valorInput.setAttribute('data-valor', 0);
    valorTotalInput.setAttribute('data-valor', 0);
    valorTotalInput.value = formatarMoeda_resultado(0);
  }
}

function dicionarioAcoesModificado (){
  var dicionarioBase = criarDicionarioAcao();
  var dicionario = {};
  
  let contador = 1;
  for (var [_, dados] of Object.entries(dicionarioBase)) {
    _ = {
      nomeEmpresa: dados.nomeEmpresa,
      movimentacoes: organizarMovimentacoesAcoes(dados.movimentacoes),
    }
    dicionario[dados.codigo] = _
    contador++;
  }
  return dicionario;
}

function organizarMovimentacoesAcoes(movimentacoes){
  let resultado = [];
  let listaMovimentacaoCompra = [];
  let listaMovimentacaoVenda = [];

    for (var [_, dados] of Object.entries(movimentacoes)){
        if (dados.movimentacao === 'compra'){
            listaMovimentacaoCompra.push(dados);
        } else if (dados.movimentacao === 'venda'){
            listaMovimentacaoVenda.push(dados);
        }
    }

    let data = new Date();
    listaMovimentacaoCompra.push({data: data.toISOString().split("T")[0], Qtde: 0, valor: 0, valorTotal: 0}); // Sentinela para facilitar o loop

    // Ordenar as listas por data
    listaMovimentacaoCompra.sort((a, b) => new Date(a.data) - new Date(b.data));
    listaMovimentacaoVenda.sort((a, b) => new Date(a.data) - new Date(b.data));

    let dataAntiga = new Date('1900-01-01');
    let qtdeAtual = 0;
    for (c = 0; c < listaMovimentacaoCompra.length; c++){
        let dataAtual = new Date(listaMovimentacaoCompra[c].data);
        qtdeAtual += listaMovimentacaoCompra[c].Qtde;

        for (d = 0; d < listaMovimentacaoVenda.length; d++){
            let dataVenda = new Date(listaMovimentacaoVenda[d].data);
            let qtdeVenda = listaMovimentacaoVenda[d].Qtde;

            if (dataVenda > dataAntiga && dataVenda <= dataAtual && qtdeVenda > 0){
                qtdeAtual -= qtdeVenda;
                listaMovimentacaoVenda[d].Qtde = 0; // Marca como processado
            }
        }
        dataAntiga = dataAtual;
        resultado.push({
            movimentacao: 'compra',
            data: listaMovimentacaoCompra[c].data,
            Qtde: qtdeAtual,
        });
    }

return resultado
}

function calcularQtdeAcoesData(data, movimentadoes){
  let qtdeTotal = 0;
  let ultimaData = new Date('1900-01-01');
  for (var [_, dados] of Object.entries(movimentadoes)){
    let dataMovimentacao = new Date(dados.data);
    if (dataMovimentacao <= data && dataMovimentacao >= ultimaData){
      qtdeTotal = dados.Qtde;
    }
    ultimaData = dataMovimentacao;
  }
  return qtdeTotal;
}

function listaCodAcoes() {
  var codigos = Array.from(document.querySelectorAll('.codigos-acoes')).map(input => input.value);
  var selects = document.querySelectorAll('.valor-input.cod-acoes-escolha');

  selects.forEach(select => {
    // Armazena a opção selecionada antes da atualização
    var opcaoSelecionada = select.value;

    // Remove todas as opções existentes antes de adicionar as novas
    select.innerHTML = "";

    // Adiciona uma opção inicial vazia
    var opcaoVazia = document.createElement("option");
    opcaoVazia.value = "";
    opcaoVazia.textContent = "Selecione";
    select.appendChild(opcaoVazia);

    // Adiciona cada código das ações como opção no select
    codigos.forEach(codigo => {
      var option = document.createElement("option");
      option.value = codigo;
      option.textContent = codigo;
      select.appendChild(option);
    });

    // Se a opção previamente selecionada ainda existir, seleciona novamente
    if (codigos.includes(opcaoSelecionada)) {
      select.value = opcaoSelecionada;
    }
  });
}

function criarDicionarioProventosAcoes(){
  const tabelaCorpo = document.getElementById('proventos-tabela-corpo');
  const linhas = tabelaCorpo.getElementsByTagName('tr');
  const dicionario = {};
  
   for (let i = 0; i < linhas.length; i++) {
     const linha = linhas[i];
     var data = new Date (linha.querySelector('.data-pagamento-acao').value);
     if (linha.querySelector('.nome-empresa').value !== '') {
       dicionario[i] = {
         codigo: linha.querySelector('.cod-acoes-escolha').value,
         empresa: linha.querySelector('.nome-empresa').value,
         dataCorte: linha.querySelector('.data-corte-acoes').value,
         dataPagamento: linha.querySelector('.data-pagamento-acao').value,
         valorUnitario: linha.querySelector('.valor-unitario-acao').getAttribute('data-valor'),
         valorTotal: linha.querySelector('.valor-total-acao').getAttribute('data-valor'),
         qtdeCota: linha.querySelector('.qtde-cota').value,
         mesAno: `${data.getMonth() + 1}-${data.getFullYear()}`,
       };
     }
   }
  return dicionario;
}

function gerarDicionarioProximos12Meses() {
    const dicionario = {};
    const dataAtual = new Date();

    for (let i = 0; i < 6; i++) {
        const mes = dataAtual.getMonth() + 1; // getMonth() é de 0 a 11
        const ano = dataAtual.getFullYear();
        const chave = `${mes}-${ano}`;
        dicionario[chave] = 0;

        // Avança um mês
        dataAtual.setMonth(dataAtual.getMonth() + 1);
    }

    return dicionario;
}

let graficoProventos = null; // Variável global para armazenar o gráfico

function criarGraficoProventos(dicionario, dados) {
    const totaisMesAno = gerarDicionarioProximos12Meses(); // Total geral por mesAno
    const totaisPorCodigo = {}; // Total por codigo por mesAno
    const codigosSet = new Set(); // Guardar códigos únicos
    const codigoParaEmpresa = {}; // Mapear código para empresa

    // Processar o dicionário
    for (const key in dicionario) {
        const item = dicionario[key];
        const { mesAno, codigo, valorTotal, empresa } = item;
        if (dados.includes(codigo) || dados.length === 0) {
          const valor = parseFloat(valorTotal);

          // Soma total por mesAno
          if (!totaisMesAno[mesAno]) totaisMesAno[mesAno] = 0;
          totaisMesAno[mesAno] += valor;

          // Soma total por codigo por mesAno
          if (!totaisPorCodigo[codigo]) totaisPorCodigo[codigo] = {};
          if (!totaisPorCodigo[codigo][mesAno]) totaisPorCodigo[codigo][mesAno] = 0;
          totaisPorCodigo[codigo][mesAno] += valor;

          codigosSet.add(codigo);

          // Mapear código para empresa (garante que a primeira encontrada será usada)
          if (!codigoParaEmpresa[codigo]) {
              codigoParaEmpresa[codigo] = empresa;
          }
        }
    }


    // Ordenar os meses cronologicamente
    const mesesOrdenados = Object.keys(totaisMesAno).sort((a, b) => {
        const [mesA, anoA] = a.split('-').map(Number);
        const [mesB, anoB] = b.split('-').map(Number);
        return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
    });
    
    // Labels formatados para o gráfico
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labelsFormatados = mesesOrdenados.map(mesAno => {
        const [mes, ano] = mesAno.split('-').map(Number);
        return `${nomesMeses[mes - 1]}-${ano}`;
    });

    // Registrar o plugin de datalabels
    Chart.register(ChartDataLabels);

    // Dados da barra principal
    const dadosBarras = mesesOrdenados.map(mes => totaisMesAno[mes]);

    // Cores para as linhas
    const codigosArray = Array.from(codigosSet);
    const coresAleatorias = gerarCoresAleatorias(codigosArray.length);

    // Datasets das linhas (sem datalabels)
    const datasetsLinhas = codigosArray.map((codigo, index) => {
        const dadosLinha = mesesOrdenados.map(mes => totaisPorCodigo[codigo][mes] || 0);
        return {
            label: codigoParaEmpresa[codigo],
            data: dadosLinha,
            borderColor: coresAleatorias[index],
            backgroundColor: coresAleatorias[index],
            type: 'line',
            tension: 0.5,
            yAxisID: 'y'
            // Nenhuma config de datalabels aqui = não exibe nas linhas
        };
    });

    // Dataset da barra (com datalabels personalizados)
    const datasetBarras = {
        label: 'Total Geral',
        data: dadosBarras,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y',
        datalabels: {
            display: true,
            color: "#000",
            backgroundColor: "rgba(200, 200, 200, 0.7)",
            font: {
                size: 14,
                weight: "bold"
            },
            formatter: (value) => {
                return formatarMoeda_resultado(value);  // Sua função de formatação
            },
            anchor: 'center',
            align: 'center'
        }
    };

    // Contexto do canvas
    const ctx = document.getElementById('graficoProventosAcoes').getContext('2d');

    // Destrói gráfico anterior se existir
    if (graficoProventos !== null) {
        graficoProventos.destroy();
    }

    // Criação do gráfico com datalabels habilitados apenas na barra
    graficoProventos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelsFormatados,
            datasets: [
                datasetBarras,    // Barra com datalabels
                ...datasetsLinhas // Linhas sem datalabels
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            stacked: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor Total (R$)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Proventos',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                datalabels: {
                    display: false // Desativa datalabels globais
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function limparProventosPassados() {
  let validade = new Date();

  validade.setMonth(validade.getMonth() - 4);
  validade.setDate(1);
  
  const tabelaCorpo = document.getElementById('proventos-tabela-corpo');
  const linhas = tabelaCorpo.getElementsByTagName('tr');

  const linhasParaRemover = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const data = new Date(linha.querySelector('.data-pagamento-acao').value);
    if (data < validade) {
      linhasParaRemover.push(linha);
    }
  }

  linhasParaRemover.forEach(linha => {
    linha.querySelector('.remover-linha').click();
  });
}

function dadosCompletosAcoes() {
  var dicionario = {};
  let codigos = document.querySelectorAll('.codigos-acoes');
  let empresas = document.querySelectorAll('.nome-empresa-investimento');
  let valoresAplicados = document.querySelectorAll('.valor-aplicado');
  let valoresValorizacoes = document.querySelectorAll('.valor-valorizacao'); // label
  let QtdeCotas = document.querySelectorAll('.qtde-cotas-acoes');

  for (let i = 0; i < codigos.length; i++) {
    let qtdeCota = QtdeCotas[i].value || 0;
    let valorGasto = valoresAplicados[i].getAttribute('data-valor') - valoresValorizacoes[i].getAttribute('data-valor');
    let valorMedioCota = valorGasto / qtdeCota;
    let valorMedioCota_ = valorMedioCota.toFixed(2).replace('.', ',');

    dicionario[codigos[i].value] = {
      empresa: empresas[i].value,
      valorAplicadoTexto: valoresAplicados[i].value,
      valorAplicadoNumero: valoresAplicados[i].getAttribute('data-valor'),
      valorValorizacaoTexto: valoresValorizacoes[i].textContent, // Pega o texto do label e remove espaços extras
      valorValorizacaoNumero: valoresValorizacoes[i].getAttribute('data-valor'),
      qtdeCotas: qtdeCota,
      valorMedioCota: valorMedioCota.toFixed(2).replace('.', ','),
      valorMedioCota_: valorMedioCota_,
    };
  }
  return dicionario;
}

function prenecherDadosGrupos(cod, empresaInput, valorAplicadoInput, valorizacaoLabel, qtdeCotas, valorMedioCota) {
  var dicionario = dadosCompletosAcoes();
  let codigo = cod.value;
  if (dicionario[codigo]){
    empresaInput.value = dicionario[codigo].empresa;
    valorAplicadoInput.value = dicionario[codigo].valorAplicadoTexto;
    valorAplicadoInput.setAttribute('data-valor', parseFloat(dicionario[codigo].valorAplicadoNumero));
    valorizacaoLabel.textContent = dicionario[codigo].valorValorizacaoTexto;
    valorizacaoLabel.setAttribute('data-valor', parseFloat(dicionario[codigo].valorValorizacaoNumero));
    qtdeCotas.textContent = dicionario[codigo].qtdeCotas;
    qtdeCotas.setAttribute('data-valor', parseFloat(dicionario[codigo].qtdeCotas));
    valorMedioCota.textContent = `R$ ${dicionario[codigo].valorMedioCota}`;
    valorMedioCota.setAttribute('data-valor', dicionario[codigo].valorMedioCota_);
  } else{
    cod.value = '';
    empresaInput.value = '';
    valorAplicadoInput.value = '';
    valorAplicadoInput.setAttribute('data-valor', 0);
    valorizacaoLabel.textContent = '';
    valorizacaoLabel.setAttribute('data-valor', 0);
    qtdeCotas.textContent = '';
    valorMedioCota.textContent = '';
    qtdeCotas.setAttribute('data-valor', 0);
    valorMedioCota.setAttribute('data-valor', 0);
  }
}


let grupoInvestimentoIdCounter = 0;
function addGrupoinvestimento(){
    grupoInvestimentoIdCounter ++;
    var container = document.getElementById('grupos-investimento-container');
    var novaAcao = document.createElement('div');
    novaAcao.classList.add('acaoAdd');

    novaAcao.innerHTML = `
        <div class="grupoInvestimento" id="grupo-investimento-${grupoInvestimentoIdCounter}">
            <label for="grupo-investimento-${grupoInvestimentoIdCounter}-nome">Nome:</label>
            <input type="text" id="grupo-investimento-${grupoInvestimentoIdCounter}-nome" class="descricao-input nome-grupo-investimento">
            
            <label for="grupo-investimento-${grupoInvestimentoIdCounter}-valor-aplicado">Total Aplicado:</label>
            <input class="valor-input" id="grupo-investimento-${grupoInvestimentoIdCounter}-valor-aplicado" placeholder="R$ 0,00" disabled>
            
            <label for="${grupoInvestimentoIdCounter}-valor-valorizacao">Valorização:</label>
            <label class="descricao-input" id="grupo-investimento-${grupoInvestimentoIdCounter}-valor-valorizacao" data-valor="0">R$ 0,00 (0,000)</label>

            <button onclick="apagarGrupoInvestimento('${grupoInvestimentoIdCounter}')" class="remover-linha">Excluir Grupo</button>

            <div class="table-container-grupo">
              <button onclick="adicionarLinhaGrupoInvestimento(${grupoInvestimentoIdCounter})" class="remover-linha">Adicionar Linha</button>
                <table id="grupo-investimento-${grupoInvestimentoIdCounter}-tabela-toda">
                    <thead>
                        <tr>
                            <th>Cod. Ação</th>
                            <th>Empresa</th>
                            <th>Valor Total</th>
                            <th>Valorização</th>
                            <th>Taxa Retorno</th>
                            <th>Qtd. Ações</th>
                            <th>Valor Média</th>
                            <th>Taxa Retorno Aplicado</th>
                            <th> Provento Médio</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody class="grupo-investimento-tabela-corpo" id="grupo-investimento-${grupoInvestimentoIdCounter}-tabela">
                        <!-- Linhas da tabela serão adicionadas aqui -->
                    </tbody>
                </table>
            </div>
        </div>`
    container.appendChild(novaAcao);

    // ativa ordenação da tabela criada
    var tabela = novaAcao.querySelector('table');
    ativarOrdenacaoTabela(tabela);

    gruposInvestimentosDados();
    atualizarVisibilidadeColunasGrupos();
}

function apagarGrupoInvestimento(id){
    var acao = document.getElementById(`grupo-investimento-${id}`);
    acao.remove();
    gruposInvestimentosDados();
}

function adicionarLinhaGrupoInvestimento(id){
    var tabelaCorpo = document.getElementById(`grupo-investimento-${id}-tabela`);
    var novaLinha = document.createElement('tr');
    novaLinha.classList.add(`linha-grupo-investimento`, `id-${id}`);
    novaLinha.innerHTML = `
        <td><select class="valor-input cod-acoes-escolha"></select></td>
        <td><input class="descricao-input" disabled></td>
        <td><input type="text" class="valor-input valor-aplicado-parte-grupo" data-valor="0" disabled></td>
        <td><label class="valorizacao" data-valor="0">R$ 0,00 (0,000)</label></td>
        <td><label class="taxa-retorno" data-valor="0"></label></td>
        <td><label type="number" class="valor-input qtde-cota" data-valor="0"></label></td>
        <td><label type="text" class="valor-input valor-media-acao" data-valor="0"></label></td>
        <td><label type="text" class="valor-input taxa-retorno-real" data-valor="0"></label></td>
        <td><label type="text" class="valor-input provento" data-valor="0"></label></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizaTotaisGrupo(id);
    });
  
    var codAcao = novaLinha.querySelector('.cod-acoes-escolha');
    var empresaInput = novaLinha.querySelector('.descricao-input');
    var valorAplicadoInput = novaLinha.querySelector('.valor-aplicado-parte-grupo');
    var valorizacaoLabel = novaLinha.querySelector('.valorizacao');
    var qtdeCotas = novaLinha.querySelector('.qtde-cota');
    var valorMediaAcao = novaLinha.querySelector('.valor-media-acao');
  
    codAcao.addEventListener('change', () => {
      prenecherDadosGrupos(codAcao, empresaInput, valorAplicadoInput, valorizacaoLabel, qtdeCotas, valorMediaAcao);
      atualizaTotaisGrupo(id);
    });
  listaCodAcoes();
}

function atualizaTotaisGrupo(id){
  var tabelaCorpo = document.getElementById(`grupo-investimento-${id}-tabela`);
  let linhas = tabelaCorpo.getElementsByTagName('tr');
  let valorAplicadoTotal = 0;
  let valorizacaoTotal = 0;
  let taxaRetorno = 0;
  let retornoReal = 0;
  let qtdeCotas = 0;
  
  for (let i = 0; i < linhas.length; i++) {
    var colunas = linhas[i].getElementsByTagName('td');
    let retornos = calcularTaxaRetornoDistribuicaoPonderada(colunas[0].querySelector('.cod-acoes-escolha').value);

    valorAplicadoTotal += parseFloat(colunas[2].querySelector('.valor-aplicado-parte-grupo').getAttribute('data-valor'));
    valorizacaoTotal += parseFloat(colunas[3].querySelector('.valorizacao').getAttribute('data-valor'));

    taxaRetorno = retornos[0];
    colunas[4].querySelector('.taxa-retorno').textContent = `${(taxaRetorno).toFixed(3).replace('.', ',')}%`;
    colunas[4].querySelector('.taxa-retorno').setAttribute('data-valor', taxaRetorno);

    qtdeCotas = parseFloat(colunas[5].querySelector('.qtde-cota').textContent);
    let labelValorMedio = colunas[6].querySelector('.valor-media-acao').textContent;
    let valorMediaAcao = parseFloat(labelValorMedio.replace('R$ ', '').replace('.', '').replace(',', '.'));
    retornoReal = retornos[1] * 100 / valorMediaAcao;

    let textoVariacaoRetorno = (retornoReal > taxaRetorno) ? ` (↓${(retornoReal - taxaRetorno).toFixed(3).replace('.', ',')}%)` : ` (↑${(taxaRetorno - retornoReal).toFixed(3).replace('.', ',')}%)`;
    colunas[7].querySelector('.taxa-retorno-real').textContent = `${(retornoReal).toFixed(3).replace('.', ',')}% ${textoVariacaoRetorno}`;
    colunas[7].querySelector('.taxa-retorno-real').setAttribute('data-valor', retornoReal.toFixed(3));

    let provento = retornos[1] * qtdeCotas;
    colunas[8].querySelector('.provento').textContent = `R$ ${(provento).toFixed(2).replace('.', ',')}`;
    colunas[8].querySelector('.provento').setAttribute('data-valor', provento.toFixed(2));
  }
  let valorAplicadoInput = document.getElementById(`grupo-investimento-${id}-valor-aplicado`);
  let valorizacaoLabel = document.getElementById(`grupo-investimento-${id}-valor-valorizacao`);
  
  valorAplicadoInput.value = formatarMoeda_resultado(parseFloat(valorAplicadoTotal.toFixed(2)))
  valorAplicadoInput.setAttribute('data-valor', parseFloat(valorAplicadoTotal.toFixed(2)));
  
  let valorizacaoPorcentual = valorizacaoTotal * 100 / valorAplicadoTotal;
  var texto = formatarMoeda_resultado(valorizacaoTotal);
  texto += (valorizacaoPorcentual > 0) ? ` (↑${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)` : ` (↓${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)`;
  valorizacaoLabel.textContent = texto.replace('NaN', '0,000');
  valorizacaoLabel.setAttribute('data-valor', parseFloat(valorizacaoTotal.toFixed(2)));
  gruposInvestimentosDados();
  atualizarDistribuicaoPonderadaGrupos();
}

function atualizaTotaisGrupoGeral() {
  var tabelas = document.querySelectorAll('.grupo-investimento-tabela-corpo');

  for (let i = 0; i < tabelas.length; i++) {
    var linhas = tabelas[i].getElementsByTagName('tr');
     for (let l = 0; l < linhas.length; l++) {
      var codAcao = linhas[l].querySelector('.cod-acoes-escolha');
      var empresaInput = linhas[l].querySelector('.descricao-input');
      var valorAplicadoInput = linhas[l].querySelector('.valor-aplicado-parte-grupo');
      var valorizacaoLabel = linhas[l].querySelector('.valorizacao');
        var qtdeCotas = linhas[l].querySelector('.qtde-cota');
        var valorMediaAcao = linhas[l].querySelector('.valor-media-acao');

      prenecherDadosGrupos(codAcao, empresaInput, valorAplicadoInput, valorizacaoLabel, qtdeCotas, valorMediaAcao);
     }
    var id = tabelas[i].id.replace('grupo-investimento-','')
    atualizaTotaisGrupo(id.replace('-tabela', ''));
  }
}

function addGrupoinvestimentoComTodos(){
    dicionarioAcoes = criarDicionarioAcao();

    addGrupoinvestimento();
    var tabelaCorpo = document.getElementById(`grupo-investimento-${grupoInvestimentoIdCounter}-tabela`);
    for (var [_, dados] of Object.entries(dicionarioAcoes)) {
        adicionarLinhaGrupoInvestimento(grupoInvestimentoIdCounter);
        let linhas = tabelaCorpo.getElementsByTagName('tr');
        var selectInput = linhas[0].querySelector('.cod-acoes-escolha');
        selectInput.value = dados.codigo;

        prenecherDadosGrupos(selectInput, linhas[0].querySelector('.descricao-input'), linhas[0].querySelector('.valor-aplicado-parte-grupo'), linhas[0].querySelector('.valorizacao'), linhas[0].querySelector('.qtde-cota'), linhas[0].querySelector('.valor-media-acao'));
    }
    atualizaTotaisGrupo(grupoInvestimentoIdCounter);
    atualizarVisibilidadeColunasGrupos();
}

function criarDicionarioGruposInvestimentos(){
  var grupos = document.querySelectorAll('.grupoInvestimento');
  var dicionario = {};
  
  for (let i = 0; i < grupos.length; i++) {
    var nome = grupos[i].querySelector('.nome-grupo-investimento').value;
    var codigos = [];
    
    var tabelaCorpo = grupos[i].querySelector('.grupo-investimento-tabela-corpo');
    var linhas = tabelaCorpo.getElementsByTagName('tr');
    
    for (let l = 0; l < linhas.length; l++) {
      var codigo = linhas[l].querySelector('.cod-acoes-escolha').value;
      if (codigo != '') {codigos.push(codigo);}
    }
    
    dicionario[i] = {
      nome: nome,
      codigos: codigos,
    }
  }
  return dicionario;
}

const BRAPI_TOKEN = "phxtxEeVjYsYqLzdfhdcQ3"

const LS_CHAVE_DADOS = "dicionarioAcoesValores"
const LS_CHAVE_DATA = "dataAtualizacaoAcoesValores"
const LS_CHAVE_FECHAMENTO = "dataFechamentoAcoes"
const intervaloAtualizacaoAcoesValores = 15 * 60 * 1000 // 15 minutos

// carrega cache inicial
var dicionarioDadosAcoes = localStorage.getItem(LS_CHAVE_DADOS)
    ? JSON.parse(localStorage.getItem(LS_CHAVE_DADOS))
    : {}


async function carregarDicionarioAcoes(codigos) {
    if (!codigos || codigos.length === 0) return {}

    try {
        // adiciona .SA e junta
        const symbols = codigos.map(c => c + ".SA").join(",")

        const response = await fetch(
            `https://brapi.dev/api/quote/${symbols}?token=${BRAPI_TOKEN}`
        )

        if (!response.ok) return {}

        const data = await response.json()

        if (!data.results) return {}

        const dicionario = {}

        data.results.forEach(item => {
            const codigoLimpo = item.symbol.replace(".SA", "")

            dicionario[codigoLimpo] = {
                name: item.longName,
                close: item.regularMarketPrice,
                change: item.regularMarketChangePercent,
                volume: item.regularMarketVolume,
                market_cap: item.marketCap,
                logo: item.logourl,
                sector: item.sector,
                type: item.type
            }
        })

        // merge com cache antigo
        dicionarioDadosAcoes = {
            ...dicionarioDadosAcoes,
            ...dicionario
        }

        localStorage.setItem(
            LS_CHAVE_DADOS,
            JSON.stringify(dicionarioDadosAcoes)
        )

        localStorage.setItem(
            LS_CHAVE_DATA,
            Date.now().toString()
        )

        return dicionario

    } catch (e) {
        console.error(e)
        return {}
    }
}

async function atualizarValorAcoes() {
    const acoes = document.querySelectorAll(".acao")

    const ultimaAtualizacao = localStorage.getItem(LS_CHAVE_DATA)
    const dataFechamentoSalvo = localStorage.getItem(LS_CHAVE_FECHAMENTO)

    const agora = Date.now()
    const hoje = new Date().toDateString()

    const codigosDOM = new Set()

    acoes.forEach(el => {
        const codigo = el.querySelector(".codigos-acoes")?.value?.trim()
        if (codigo) codigosDOM.add(codigo)
    })

    const codigos = Array.from(codigosDOM)

    const cacheExpirado =
        !ultimaAtualizacao ||
        agora - parseInt(ultimaAtualizacao) > intervaloAtualizacaoAcoesValores ||
        Object.keys(dicionarioDadosAcoes).length === 0

    const codigosFaltantes = codigos.filter(
        c => !dicionarioDadosAcoes[c]
    )

    const statusMercado = obterStatusMercadoB3()

    let deveBuscar = false
    let motivo = ""

    // REGRA 1 — ação nova sempre busca
    if (codigosFaltantes.length > 0) {
        deveBuscar = true
        motivo = "ação nova"
    }

    // REGRA 2 — horário normal pregão das 10hs ate as 18hs
    else if (statusMercado === "pregao") {
        if (cacheExpirado) {
            deveBuscar = true
            motivo = "pregão"
        }
    }

    // REGRA 3 — após 18h (pegar fechamento só 1x por dia)
    else if (statusMercado === "pos_fechamento") {
        const jaPegouFechamentoHoje = dataFechamentoSalvo === hoje

        if (!jaPegouFechamentoHoje) {
            deveBuscar = true
            motivo = "fechamento"
        }
    }

    if (deveBuscar) {
        console.log("Atualizando API →", motivo)

        await carregarDicionarioAcoes(codigos)

        // se foi atualização de fechamento → salva data
        if (motivo === "fechamento") {
            localStorage.setItem(
                LS_CHAVE_FECHAMENTO,
                new Date().toDateString()
            )
        }
    } else {
        console.log("Usando cache")
    }

    acoes.forEach(el => {
        const codigo = el.querySelector(".codigos-acoes")?.value?.trim()
        if (!codigo) return

        const dados = dicionarioDadosAcoes[codigo]
        if (!dados) return

        const inputValorCota = el.querySelector(".valor-cota-acao")
        const idAcao = el.id.split("-")[1]

        if (!inputValorCota) return

        const valor = dados.close

        inputValorCota.dataset.valor = valor
        inputValorCota.value = formatarMoeda_resultado(valor)

        formatarMoedaAcao(idAcao)
        atualizarValorDividendo(idAcao)
    })
}


function obterStatusMercadoB3() {
    const agora = new Date()

    const agoraBR = new Date(
        agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    )

    const diaSemana = agoraBR.getDay()
    const hora = agoraBR.getHours()

    const diaUtil = diaSemana >= 1 && diaSemana <= 5

    if (!diaUtil) return "fim_semana"

    if (hora >= 10 && hora < 18) return "pregao"

    if (hora >= 18 || hora < 10) return "pos_fechamento"

    return "fechado"
}

let acaoIdCounter = 0;
let listaTabelasAcoes = [];
function addAcao(){
    acaoIdCounter ++;
    var containerAcao = document.getElementById('acao-container');
    var novaAcao = document.createElement('div');
    novaAcao.classList.add('acaoAdd');

    novaAcao.innerHTML = `
        <div class="acao" id="acao-${acaoIdCounter}">
            <label for="${acaoIdCounter}-nome-empresa">Empresa:</label>
            <input type="text" id="${acaoIdCounter}-nome-empresa" placeholder="Nome da Empresa" class="descricao-input nome-empresa-investimento">

            <label for="${acaoIdCounter}-nome-codigo">Código:</label>
            <input type="text" id="${acaoIdCounter}-nome-codigo" placeholder="codigo" class="valor-input codigos-acoes">

            <label for="${acaoIdCounter}-valor-DY">Dividend Yield (DY):</label>
            <input id="${acaoIdCounter}-valor-DY"" placeholder="0,00" class="valor-input" onblur="formatarValorInputAcoes(this, ${acaoIdCounter})" value="0,0" data-valor="0.0" onblur="atualizarValorDividendo(${acaoIdCounter})">

            <label for="${acaoIdCounter}-cotas">Qtde Cotas:</label>
            <input id="${acaoIdCounter}-cotas" placeholder="0" disabled class="valor-input qtde-cotas-acoes">

            <label for="${acaoIdCounter}-valor-cota">Valor Cota:</label>
            <input id="${acaoIdCounter}-valor-cota" placeholder="R$ 0,00" class="valor-input valor-cota-acao" onblur="formatarMoedaAcao(${acaoIdCounter})" value="R$ 0,00" data-valor="0.0">

            <label for="${acaoIdCounter}-valor-dividendo">Valor Dividendo:</label>
            <input id="${acaoIdCounter}-valor-dividendo" placeholder="R$ 0,00" disabled class="valor-input">
            
            <label for="${acaoIdCounter}-valor-aplicado">Total Aplicado:</label>
            <input class="valor-aplicado valor-input" id="${acaoIdCounter}-valor-aplicado" placeholder="R$ 0,00" disabled>
            
            <label for="${acaoIdCounter}-valor-valorizacao">Valorização:</label>
            <label class="valor-valorizacao descricao-input" id="${acaoIdCounter}-valor-valorizacao" data-valor="0">R$ 0,00 (0,000)</label>

            <button onclick="apagarAcao('${acaoIdCounter}')" class="remover-linha">Excluir o Ação</button>

            <div class="table-container">
              <button onclick="adicionarLinhaAcao(${acaoIdCounter})" class="remover-linha adicionar-linha-acao">Adicionar Linha</button>
              <button onclick="ocutarOuMostrarTabelaAcao('${acaoIdCounter}')" class="remover-linha" id="${acaoIdCounter}-botao-ocultar">Ocultar linhas</button>
                <table>
                    <thead>
                        <tr>
                            <th>Movimentação</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Qtde</th>
                            <th>Valor Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody class="tabela-corpo-acao" id="${acaoIdCounter}-tabela-corpo-acao">
                        <!-- Linhas da tabela serão adicionadas aqui -->
                    </tbody>
                </table>
            </div>
        </div>`

    containerAcao.appendChild(novaAcao);
}

function ocutarOuMostrarTabelaAcao(id){
    var tabelaContainer = document.getElementById(`${id}-tabela-corpo-acao`);
    let linhas = tabelaContainer.getElementsByTagName('tr');
    if (linhas.length > 0){
        let estiloAtual = linhas[0].style.display;
        let novoEstilo = (estiloAtual === 'none') ? '' : 'none';
        var botao = document.getElementById(`${id}-botao-ocultar`);
        botao.textContent = (novoEstilo === 'none') ? 'Mostrar linhas' : 'Ocultar linhas';
        for (let i = 0; i < linhas.length; i++) {
            linhas[i].style.display = novoEstilo;
        }
    }
}

var todasTabelasOcultas = false;
function OcultaroOuMostrarTodasTabelasAcoes(){
    var tabelas = document.querySelectorAll('.tabela-corpo-acao');
    tabelas.forEach(tabela => {
        let linhas = tabela.getElementsByTagName('tr');
        if (linhas.length > 0){
            let novoEstilo = todasTabelasOcultas ? '' : 'none';
            var id = tabela.id.split('-')[0];
            var botao = document.getElementById(`${id}-botao-ocultar`);
            botao.textContent = todasTabelasOcultas ? 'Ocultar linhas' : 'Mostrar linhas';
            for (let i = 0; i < linhas.length; i++) {
                linhas[i].style.display = novoEstilo;
            }
        }
    });
    var btnGeral = document.getElementById('botao-ocultar-todas-tabelas-acoes');
    if (btnGeral.textContent === 'Ocultar todas as tabelas'){
        btnGeral.textContent = 'Mostrar todas as tabelas';
        todasTabelasOcultas = true;
    } else {
        btnGeral.textContent = 'Ocultar todas as tabelas';
        todasTabelasOcultas = false;
    }
}

function adicionarLinhaAcao(id){
    var tabelaCorpo = document.getElementById(`${id}-tabela-corpo-acao`);
    var novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>
            <select class="descricao-input movimentacao">
                <option value="compra">Compra</option>
                <option value="venda">Venda</option>
            </select>
        </td>
        <td><input type="text" class="valor-input" onblur="formatarMoeda(this, '0')" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="number" class="valor-input qtde-cota" value=1></td>
        <td><input type="text" class="valor-total" disabled placeholder="R$ 0,00" value="R$ 0,00" data-valor="0.0"></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizarQtdeCotas(id);
    });
  
    var valorInput = novaLinha.querySelector('.valor-input');
    var QtdeInput = novaLinha.querySelector('.qtde-cota');
    var valorTotalInput = novaLinha.querySelector('.valor-total');
    var movimentacaoInput = novaLinha.querySelector('.movimentacao');
    var dataInput = novaLinha.querySelector('.data-input');

    valorInput.addEventListener('input', () => { atualizarValorTotalAcao(valorInput, QtdeInput, valorTotalInput, id) });
    QtdeInput.addEventListener('input', () => { atualizarValorTotalAcao(valorInput, QtdeInput, valorTotalInput, id) });
    movimentacaoInput.addEventListener('change', () => { atualizarQtdeCotas(id) });
    dataInput.addEventListener('input', () => { atualizarTodosProventos() });
}

function escaparId(id) {
    return `#${id.replace(/^(\d)/, '\\3$1 ')}`;
}

function apagarAcao(id){
    var acao = document.getElementById(`acao-${id}`);
    acao.remove();
    atualizarTotalAplicadoAcoes()
}

function atualizarValorTotalAcao(valorInput, QtdeInput, valorTotalInput, id){
    var valor = parseFloat(valorInput.value.replace('R$ ', '').replace('.', '').replace(',', '.')) || 0;
    var Qtde = parseFloat(QtdeInput.value) || 0;
    var valorTotal = valor * Qtde;
    valorTotalInput.setAttribute('data-valor', parseFloat(valorTotal.toFixed(2)));
    valorTotalInput.value = formatarMoeda_resultado(valorTotal);
    
    var codigo = document.getElementById(`${id}-nome-codigo`).value;
    atualizarQtdeCotas(id);
}

function atualizarQtdeCotas(id){
    var tabelaCorpo = document.getElementById(`${id}-tabela-corpo-acao`);
    var linhas = tabelaCorpo.getElementsByTagName('tr');
    var QtdeCotas = 0;

    for (var i = 0; i < linhas.length; i++){
        var linha = linhas[i];
        var QtdeInput = linha.querySelector('.qtde-cota');
        var Qtde = parseFloat(QtdeInput.value) || 0;
        var movimentacao = linha.querySelector('.movimentacao').value;
        var valor = parseFloat(linha.querySelector('.valor-total').getAttribute('data-valor')) || 0.00;
        if (movimentacao === 'compra') {
          QtdeCotas += Qtde;
        }
        else {
          QtdeCotas -= Qtde
        }

        var cotaInput = document.getElementById(`${id}-cotas`);
        cotaInput.value = QtdeCotas;
    }
    if (Qtde)
    
    atualizarValorDividendo(id);
}

function atualizarValorDividendo(id){
    var inputTotal = document.getElementById(`${id}-valor-aplicado`);
    var valorDY = parseFloat(document.getElementById(`${id}-valor-DY`).getAttribute('data-valor')) || 0;
    var valorCota = parseFloat(document.getElementById(`${id}-valor-cota`).getAttribute('data-valor')) || 0;
    var QtdeCotas = parseFloat(document.getElementById(`${id}-cotas`).value) || 0;
    var valorDividendo = (valorCota * valorDY / 100) * QtdeCotas;
    var totalAplicado = valorCota * QtdeCotas;
  
    inputTotal.setAttribute('data-valor', parseFloat(totalAplicado.toFixed(2)));
    inputTotal.value = formatarMoeda_resultado(totalAplicado);
    document.getElementById(`${id}-valor-dividendo`).value = formatarMoeda_resultado(valorDividendo);
    atualizarValorizacao(id);
    atualizarTotalAplicadoAcoes();
    atualizarTotalValorizacao();
}

function atualizarValorizacao(id) {
  var tabelaCorpo = document.getElementById(`${id}-tabela-corpo-acao`);
  var linhas = tabelaCorpo.getElementsByTagName('tr');
  var dicionarioDados = {};
  var total = 0.0;

  // Criar dicionário com os dados da tabela
  for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    dicionarioDados[i] = {
      movimentacao: linha.querySelector('.movimentacao').value,
      valor: parseFloat(linha.querySelector('.valor-input').getAttribute('data-valor')) || 0.0,
      Qtde: parseFloat(linha.querySelector('.qtde-cota').value) || 0,
    };
  }

  // Processar "compra" e "venda" no dicionário
  dicionarioDados = processarComprVenda(dicionarioDados);
  
  for (var [chave, dados] of Object.entries(dicionarioDados)) {
    total += dados.Qtde * dados.valor;
  }
  
  var valorAplicado = parseFloat(document.getElementById(`${id}-valor-aplicado`).getAttribute('data-valor')) || 0.0;
  var valorizacao = valorAplicado - total;
  var valorizacaoPorcentual = valorizacao * 100 / valorAplicado;
  
  var labelValorizacao = document.getElementById(`${id}-valor-valorizacao`);
  labelValorizacao.setAttribute('data-valor', parseFloat(valorizacao.toFixed(2)));
  var texto = formatarMoeda_resultado(valorizacao);
  texto += (valorizacaoPorcentual > 0) ? ` (↑${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)` : ` (↓${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)`;
  labelValorizacao.textContent = texto.replace('NaN', '0,000');
}

function atualizarTotalAplicadoAcoes(){
  var inputTotalAcoes = document.getElementById(`acoes-total-aplicado`);
  var valorTotalAcoes = 0;
  
  var totais = document.querySelectorAll('#acao-container .valor-aplicado');
  for (i = 0; i < totais.length; i ++){
    var valor = parseFloat(totais[i].getAttribute('data-valor')) || 0;
    valorTotalAcoes += valor;
  }
  inputTotalAcoes.setAttribute('data-valor', valorTotalAcoes.toFixed(2));
  inputTotalAcoes.textContent = formatarMoeda_resultado(valorTotalAcoes);
  atualizarTotalValorizacao();
}

function processarComprVenda(dicionarioDados){
  for (var [chave, dados] of Object.entries(dicionarioDados)) {
    if (dados.movimentacao === "venda") {
      for (var [chave_, dado] of Object.entries(dicionarioDados)) {
        if (dado.movimentacao === "compra") {
          if (dados.Qtde > dado.Qtde) {
            // Decrementa a quantidade e remove a "compra"
            dados.Qtde -= dado.Qtde;
            delete dicionarioDados[chave_];
          } else {
            // Remove a "venda" ou ajusta as quantidades
            dado.Qtde -= dados.Qtde;
            delete dicionarioDados[chave];
            break; // Não há mais quantidade para ajustar
          }
        }
      }
    }
  }
  return dicionarioDados
}

function processarCompraVendaComposta (dicionarioDados){
    for (var [chave, dados] of Object.entries(dicionarioDados)) {

    }
}

function gruposInvestimentosDados(){
  let dicionario = criarDicionarioGruposInvestimentos();
  let dados = {}
  
  var select = document.querySelector('#selecao-grupo-investimento-grafico');
  var opcaoSelecionada = select.value;
  select.innerHTML = "";
  
  var opcaoVazia = document.createElement("option");
  opcaoVazia.value = "";
  opcaoVazia.textContent = "Selecione";
  select.appendChild(opcaoVazia);
  
  for (const [key, grupo] of Object.entries(dicionario)) {
    dados[grupo.nome] = grupo.codigos;
    var option = document.createElement("option");
    option.value = grupo.nome;
    option.textContent = grupo.nome;
    select.appendChild(option);
  }
  
  if (Object.keys(dados).includes(opcaoSelecionada)) {
    select.value = opcaoSelecionada;
  }
  return dados;
}

document.querySelector('#selecao-grupo-investimento-grafico').addEventListener('change', () => {
  graficosInvetimento();
});

function graficosInvetimento(){
  if (!carregou) {return};
  let dados = gruposInvestimentosDados();
  let grupoSelecionado = document.querySelector('#selecao-grupo-investimento-grafico').value;
  if (grupoSelecionado === ''){
    gerarGraficoPizzaInvestimento([]);
    gerarGraficoBarrasInvestimento([]);
    criarGraficoProventos(criarDicionarioProventosAcoes(), []);
  } else {
    gerarGraficoPizzaInvestimento(dados[grupoSelecionado]);
    gerarGraficoBarrasInvestimento(dados[grupoSelecionado]);
    criarGraficoProventos(criarDicionarioProventosAcoes(), dados[grupoSelecionado]);
    historicoInvestimentos();
  }
  historicoInvestimentos();
} 

function atualizarTotalValorizacao (){
  var inputTotalValorizacao = document.getElementById(`acoes-total-valorizacao`);
  var valorValorizacaoTotal = 0;
  
  var totais = document.querySelectorAll('#acao-container .valor-valorizacao');
  for (i = 0; i < totais.length; i ++){
    var valor = parseFloat(totais[i].getAttribute('data-valor')) || 0;
    valorValorizacaoTotal += valor;
  }
  var inputTotalAcoes = parseFloat(document.getElementById(`acoes-total-aplicado`).getAttribute('data-valor')) || 0;
  var valorizacaoPorcentual = valorValorizacaoTotal * 100 / inputTotalAcoes;
  
  var texto = formatarMoeda_resultado(valorValorizacaoTotal);
  texto += (valorizacaoPorcentual > 0) ? ` (↑${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)` : ` (↓${valorizacaoPorcentual.toFixed(3).replace('.', ',')}%)`;
  
  inputTotalValorizacao.setAttribute('data-valor', valorValorizacaoTotal.toFixed(2));
  inputTotalValorizacao.textContent = texto.replace('NaN', '0,000')
  atualizaTotaisGrupoGeral();
  atualizarTodosProventos();
  historicoInvestimentos();
}

function formatarMoedaAcao(id){
    var valorCotaInput = document.getElementById(`${id}-valor-cota`);
    formatarMoeda(valorCotaInput, 0);
    atualizarValorDividendo(id);
}

function criarDicionarioAcao() {
    var containerAcao = document.getElementById('acao-container');
    var acoes = containerAcao.getElementsByClassName('acao');
    var dicionario = {};

    for (var i = 0; i < acoes.length; i++) {
        var acao = acoes[i];
        var id = acao.id.split('-')[1];
        var nomeEmpresa = acao.querySelector(`[id$='${id}-nome-empresa']`) ? acao.querySelector(`[id$='${id}-nome-empresa']`).value : '';
        var codigo = acao.querySelector(`[id$='${id}-nome-codigo']`) ? acao.querySelector(`[id$='${id}-nome-codigo']`).value : '';
        var DY = parseFloat(acao.querySelector(`[id$='${id}-valor-DY']`) ? acao.querySelector(`[id$='${id}-valor-DY']`).getAttribute('data-valor') : 0) || 0;
        var valorCota = parseFloat(acao.querySelector(`[id$='${id}-valor-cota']`) ? acao.querySelector(`[id$='${id}-valor-cota']`).getAttribute('data-valor') : 0) || 0;

        var linhas = acao.getElementsByTagName('tr');

        for (var j = 1; j < linhas.length; j++) {
            var linha = linhas[j];
            var movimentacao = linha.querySelector('.movimentacao') ? linha.querySelector('.movimentacao').value : '';
            var valor = parseFloat(linha.querySelector('.valor-input') ? linha.querySelector('.valor-input').getAttribute('data-valor') : 0) || 0;
            var data = linha.querySelector('.data-input') ? linha.querySelector('.data-input').value : '';
            var Qtde = parseFloat(linha.querySelector('.qtde-cota') ? linha.querySelector('.qtde-cota').value : 0) || 0;
            var valorTotal = parseFloat(linha.querySelector('.valor-total') ? linha.querySelector('.valor-total').getAttribute('data-valor') : 0) || 0;

            if (dicionario[id] === undefined) {
                dicionario[id] = {
                    nomeEmpresa: nomeEmpresa,
                    codigo: codigo,
                    DY: DY,
                    valorCota: valorCota,
                    movimentacoes: {},
                };
            }

            dicionario[id].movimentacoes[j] = {
                movimentacao: movimentacao,
                valor: valor,
                data: data,
                Qtde: Qtde,
                valorTotal: valorTotal
            };
        }
    }
    return dicionario;
}

function cofrinhoFuncao() {
    atualizarTabelaReceitas();
    formatarValorInput(document.getElementById('rendimento'));
    mostrarIconer('icone7');
}

function addLinhaCofrinho(){
    const tabelaCorpo = document.getElementById(`cofrinho-tabela-corpo`);

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td>
            <select class="descricao-input movimentacao">
                <option value="depositar">Depositar</option>
                <option value="retirar">Retirar</option>
                <option value="rendimento">Rendimento</option>
            </select>
        </td>
        <td><input placeholder="Valor" class="valor-input" data-valor="0" onblur="formatarMoedaReceitas(this, 0)" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" onblur="atualizarTabelaReceitas()" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="number" class="parcela-input" onblur="atualizarTabelaReceitas()" value=1></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizarTabelaReceitas();
    });
    var inputMovimentacao = novaLinha.querySelector('.movimentacao');
    var qtdInput = novaLinha.querySelector('.parcela-input')
    novaLinha.querySelector('.movimentacao').addEventListener('change', () => { atualizarTabelaReceitas_Movimentacao(inputMovimentacao, qtdInput) });
}

function atualizarTabelaReceitas_Movimentacao (movimentacaoInput, qtdInput) {
  var movimentacao = movimentacaoInput.value;
  if (movimentacao === 'retirar' || movimentacao === 'rendimento'){
    qtdInput.value = 1;
    qtdInput.disabled = true;
  } else {
    qtdInput.disabled = false;
  }
  atualizarTabelaReceitas();
}

function addLinhaCofrinhoMetas(){
    const tabelaCorpo = document.getElementById(`cofrinho-metas-tabela-corpo`);

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td><input placeholder="Descrição" type="text" class="descricao-input" onblur="atualizarTabelaReceitas()"></td>
        <td><input placeholder="Valor" class="valor-input" data-valor="" onblur="formatarMoedaReceitas(this, 0)" value="R$ 0,00"></td>
        <td><button class="remover-linha">Remover</button></td>
    `;

    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizarTabelaReceitas();
    });
}

function criarDicionarioCofrinhoMetas() {
    const tabelaCorpo = document.getElementById('cofrinho-metas-tabela-corpo');
    const linhas = tabelaCorpo.getElementsByTagName('tr');
    const dicionario = {};

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const descricao = linha.querySelector('.descricao-input').value;
        const valorInput = linha.querySelector('.valor-input').getAttribute('data-valor');

        if (valorInput > 0 && descricao !== '') {
            dicionario[i] = {
                descricao: descricao,
                valor: valorInput,
            };
        }
    }
    if (Object.keys(dicionario).length > 0) { return dicionario; } else { return undefined; };
}

function formatarValorInput(input) {
    let valor = input.value;
    if (valor===''){input.value = 0; valor = '0.0'};
    // Substituir vírgula por ponto
    valor = valor.replace(',', '.');
    // Verificar se contém apenas números e ponto
    if (!isNaN(valor)) {
        // Atualizar data-valor com o valor numérico
        input.setAttribute('data-valor', parseFloat(valor));
        // Manter o valor com vírgula no input
        input.value = valor.replace('.', ',');
        atualizarTabelaReceitas();
    } else {
        alert("Por favor, insira um valor numérico válido.");
    }
}

function formatarValorInputCofrinho(input) {
    criarDicionarioCofrinho();
    formatarValorInput(input);
}

function formatarValorInputAcoes(input, id) {
    formatarValorInput(input);
    atualizarValorDividendo(id);
}


function formatarMoedaReceitas(input, casasDecimais) {
    formatarMoeda(input, casasDecimais);
    atualizarTabelaReceitas();
}

var cofrinhoSelect = document.getElementById('cofrinhoAteAnos');
var maximoTabelaRendimento = 12

// Adiciona um listener para o evento "change"
cofrinhoSelect.addEventListener('change', function () {
  maximoTabelaRendimento = this.value * 12;
  atualizarTabelaReceitas();
});

function diferencaEmMeses(mesInicial, anoInicial) {
    const dataInicial = new Date(anoInicial, mesInicial - 1); // Criar a data inicial
    const dataAtual = new Date(); // Obter a data atual

    const anosDiferenca = dataAtual.getFullYear() - dataInicial.getFullYear();
    const mesesDiferenca = dataAtual.getMonth() - dataInicial.getMonth();

    return anosDiferenca * 12 + mesesDiferenca;
}

function atualizarTabelaReceitas() {
    if (!carregou){return}
    let listaLabel = []
    let listaEntrada = []
    let listaValor = []
    let listaRendimento = []
    let listaTotal = []
    
    const tabelaCorpo = document.getElementById('cofrinho-tabela-corpo-redimento');
    tabelaCorpo.innerHTML = '';
    const rendimento = parseFloat(document.getElementById('rendimento').getAttribute('data-valor'));

    const dicionarioCofrinho = criarDicionarioCofrinho();
    if (Object.keys(dicionarioCofrinho).length === 0) {
        return;
    }

    const dicionarioCofrinhoMetas = criarDicionarioCofrinhoMetas();
    const dataInicial = dicionarioCofrinho[0].dataInicial.split('-');
    const mesInicial = parseInt(dataInicial[0]); // Mês inicial
    const anoInicial = parseInt(dataInicial[1]); // Ano inicial
  
    var diferenca = diferencaEmMeses(mesInicial, anoInicial);
    let status = false;

    // Calculando mesFinal e anoFinal
    let mesFinal = mesInicial + maximoTabelaRendimento - 1 + diferenca; // Ajusta para contagem correta
    let anoFinal = anoInicial;
  
    var data = new Date();
    var mesAnoAtual_ = `${String(data.getMonth()+1).padStart(2, '0')}-${data.getFullYear()}`

    // Se o mesFinal ultrapassar 12, ajusta o anoFinal e mesFinal
    while (mesFinal > 12) {
      mesFinal -= 12;
      anoFinal++;
    }

    let valorAnterior = 0;

    for (let ano = anoInicial; ano <= anoFinal; ano++) {
        for (let mes = (ano === anoInicial ? mesInicial : 1); mes <= (ano === anoFinal ? mesFinal : 12); mes++) {
            const mesAnoAtual = `${String(mes).padStart(2, '0')}-${ano}`;
            let somaMes = 0;
            let rendimentoValor = 0;
            let entradaValor = 0;
            let valorSaida = 0;

            for (let chave in dicionarioCofrinho) {
                //valorSaida = 0;
                if (chave !== '0') {
                    const dataInicialChave = dicionarioCofrinho[chave].dataInicial.split('-');
                    const dataFinalChave = dicionarioCofrinho[chave].dataFinal.split('-');
                    const mesInicialChave = parseInt(dataInicialChave[0]);
                    const anoInicialChave = parseInt(dataInicialChave[1]);
                    const mesFinalChave = parseInt(dataFinalChave[0]);
                    const anoFinalChave = parseInt(dataFinalChave[1]);
                    

                    const dataAtual = new Date(ano, mes - 1);
                    const dataInicialChaveDate = new Date(anoInicialChave, mesInicialChave - 1);
                    const dataFinalChaveDate = new Date(anoFinalChave, mesFinalChave - 1);
                    
                    if (dataAtual >= dataInicialChaveDate && dataAtual < dataFinalChaveDate) {
                        
                        if (dicionarioCofrinho[chave].movimentacao === 'retirar'){somaMes -= parseFloat(dicionarioCofrinho[chave].valor); valorSaida += parseFloat(dicionarioCofrinho[chave].valor);}
                        else if (dicionarioCofrinho[chave].movimentacao === 'rendimento') {rendimentoValor += parseFloat(dicionarioCofrinho[chave].valor);}
                        else {somaMes += parseFloat(dicionarioCofrinho[chave].valor); entradaValor += parseFloat(dicionarioCofrinho[chave].valor)}
                    }
                }
            }

            const valorColuna2 = valorAnterior + somaMes;
            let ReceitasCalculado = (valorColuna2 / 100 * rendimento) + rendimentoValor;
            let somaTotal = valorColuna2 + ReceitasCalculado;

            let metaAlcancada = '';
            if (dicionarioCofrinhoMetas !== undefined) {
                for (let chave in dicionarioCofrinhoMetas) {
                    const meta = dicionarioCofrinhoMetas[chave];
                    if (somaTotal >= meta.valor) {
                        if (metaAlcancada !== '') {
                            metaAlcancada += ', ';
                        }
                        const resultado = formatarMoeda_resultado(parseFloat(meta.valor));
                        metaAlcancada += `${meta.descricao} (${resultado})`;

                        somaTotal -= meta.valor;
                        delete dicionarioCofrinhoMetas[chave];
                    }
                }
            }
            
            if (status || mesAnoAtual_ === mesAnoAtual) {
              const novaLinha = document.createElement('tr');
              novaLinha.innerHTML = `
                  <td>${mesAnoAtual}</td>
                  <td>${formatarMoeda_resultado(entradaValor)}</td>
                  <td>${formatarMoeda_resultado(valorSaida)}</td>
                  <td>${formatarMoeda_resultado(valorAnterior)}</td>
                  <td>${formatarMoeda_resultado(ReceitasCalculado)}</td>
                  <td>${formatarMoeda_resultado(somaTotal)}</td>
                  <td>${metaAlcancada}</td>
              `;
              tabelaCorpo.appendChild(novaLinha);
              status = true
              	listaLabel.push(mesAnoAtual)
                listaEntrada.push(entradaValor.toFixed(2))
                listaValor.push(valorColuna2)
                listaRendimento.push(ReceitasCalculado)
                listaTotal.push(somaTotal)
            }

            valorAnterior = somaTotal;
        }
    }
  graficoLinhaCofrinho (listaLabel, listaEntrada, listaValor, listaRendimento, listaTotal);
}

function graficoLinhaCofrinho(listaLabel, listaEntrada, listaValor, listaRendimento, listaTotal) {
    const ctx = document.getElementById("graficoLinhaCofrinho").getContext("2d");
    
    const datasets = [
        {
            label: "Entrada",
            data: listaEntrada,
            borderColor: "green",
            backgroundColor: "rgba(0, 128, 0, 0.2)",
            borderWidth: 2,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: "green",
            pointBorderColor: "#fff",
            yAxisID: "y"
        },
        {
            label: "Valor",
            data: listaValor,
            borderColor: "blue",
            backgroundColor: "rgba(0, 0, 255, 0.2)",
            borderWidth: 2,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: "blue",
            pointBorderColor: "#fff",
            yAxisID: "y"
        },
        {
            label: "Total",
            data: listaTotal,
            borderColor: "purple",
            backgroundColor: "rgba(128, 0, 128, 0.2)",
            borderWidth: 3,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: "purple",
            pointBorderColor: "#fff",
            yAxisID: "y"
        },
        {
            label: "Rendimento",
            data: listaRendimento,
            borderColor: "yellow",
            backgroundColor: "rgba(255, 255, 0, 0.2)",
            borderWidth: 2,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: "yellow",
            pointBorderColor: "black",
            yAxisID: "y1"
        }
    ];
    
    if (window.meuGrafico) {
        window.meuGrafico.destroy();
    }
    
    window.meuGrafico = new Chart(ctx, {
        type: "line",
        data: {
            labels: listaLabel,
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        font: { size: 12 }
                    }
                },
                y: {
                    position: "left",
                    ticks: {
                        font: { size: 12 }
                    }
                },
                y1: {
                    position: "right",
                    ticks: {
                        font: { size: 12 }
                    },
                    grid: {
                        drawOnChartArea: false // Para não sobrepor a grade do eixo principal
                    }
                }
            },
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (tooltipItem) {
                            return formatarMoeda_resultado(tooltipItem.raw);
                        }
                    }
                },
                datalabels: {
                    display: false // Remove os rótulos de dados visíveis no gráfico
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}



function criarDicionarioCofrinho() {
    const tabelaCorpo = document.getElementById('cofrinho-tabela-corpo');
    const linhas = tabelaCorpo.getElementsByTagName('tr');
    const dicionario = {};

    let dataMaisNova = null;
    let dataMaisAntiga = null;

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        const valorInput = linha.querySelector('.valor-input').getAttribute('data-valor');
        const dataInput = linha.querySelector('.data-input').value; // Formato esperado: YYYY-MM-DD
        const parcelaInput = parseInt(linha.querySelector('.parcela-input').value);
        const movimentacaoInput = linha.querySelector('.movimentacao').value;

        const [anoInicial, mesInicial] = dataInput.split('-').map(Number);
        const dataInicial = new Date(anoInicial, mesInicial - 1); // Meses em JavaScript são baseados em zero

        const dataFinal = new Date(dataInicial);
        dataFinal.setMonth(dataFinal.getMonth() + parcelaInput);

        const mesFinal = String(dataFinal.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda se necessário
        const anoFinal = dataFinal.getFullYear();

        dicionario[i + 1] = {
            movimentacao: movimentacaoInput,
            valor: valorInput,
            dataInicial: `${String(mesInicial).padStart(2, '0')}-${anoInicial}`,
            qde: parcelaInput,
            dataFinal: `${mesFinal}-${anoFinal}`,
            data: dataInput,
            dia: dataInput.split('-')[2],
            codigo: i+1,
        };

        if (!dataMaisNova || dataInicial < dataMaisNova) {
            dataMaisNova = dataInicial;
        }
        if (!dataMaisAntiga || dataFinal > dataMaisAntiga) {
            dataMaisAntiga = dataFinal;
        }
    }

    if (dataMaisNova && dataMaisAntiga) {
        const mesMaisNovo = String(dataMaisNova.getMonth() + 1).padStart(2, '0');
        const anoMaisNovo = dataMaisNova.getFullYear();
        const mesMaisAntigo = String(dataMaisAntiga.getMonth() + 1).padStart(2, '0');
        const anoMaisAntigo = dataMaisAntiga.getFullYear();

        dicionario[0] = {
            dataInicial: `${mesMaisNovo}-${anoMaisNovo}`,
            dataFinal: `${mesMaisAntigo}-${anoMaisAntigo}`
        };
    }
    return dicionario;
}

let charts = [];
function getDataFromTable(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tbody tr');
    const labels = [];
    const data = [];
    const dayValues = {};

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const day = cells[2].innerText; // Dia
        const value = parseFloat(cells[3].innerText.replace('R$ ', '').replace('.', '').replace(',', '.')); // Saldo

        // Salva o valor mais recente para cada dia
        dayValues[day] = value;
    });

    for (const day in dayValues) {
        labels.push(day);
        data.push(dayValues[day]);
    }

    return { labels, data };
}

function createChart(chartId, tableId, divId) {
    const divMes = document.getElementById(divId);
    const tituloElement = divMes.getElementsByTagName('h1')[0];
    const titulo = tituloElement.innerText;
    const ctx = document.getElementById(chartId).getContext('2d');
    const tableData = getDataFromTable(tableId);

    if (charts[chartId]) {
        charts[chartId].destroy();
    }

    const isSmallScreen = window.innerWidth < 999;
    const fontSize = isSmallScreen ? 10 : 25;
    const borderSize = isSmallScreen ? 2 : 5;

    charts[chartId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: tableData.labels,
            datasets: [{
                label: titulo,
                data: tableData.data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: borderSize,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: fontSize
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Dia',
                        font: {
                            size: fontSize
                        }
                    },
                    ticks: {
                        font: {
                            size: fontSize
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Saldo',
                        font: {
                            size: fontSize
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10,
                        font: {
                            size: fontSize
                        },
                        callback: function(value) {
                            return `R$ ${value.toFixed(2)}`;
                        }
                    }
                }
            },
        }
    });
}



function graficoFuncao() {
    boletimFuncao();
    mostrarIconer('Icone5');

    for (let i = 1; i <= 12; i++) {
        createChart(`chart${i}`, `boletim-${i}`, `boletim${i}`);
    }
    createFinalChart();
    calcularSetores();
}

function getDataFromTable(tbodyId) {
    const labels = [];
    const data = [];
    const tbody = document.getElementById(tbodyId);

    if (tbody) {
        // Obtém o nome do mês e o ano a partir do ID do boletim
        const boletimDiv = tbody.closest('.boletim');
        const tituloMesAno = boletimDiv.querySelector('h1').innerText;
        const [mesNome, mesAno] = tituloMesAno.split(" "); // Exemplo: "Janeiro 01/2025"
        const mes = mesAno.split("/")[0].padStart(2, '0'); // Obtém o mês no formato "01", "02" etc.

        // Itera pelas linhas da tabela para coletar os dados
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const dia = row.cells[2]?.innerText.trim(); // Obtém o dia (coluna "Dia")
            const saldo = parseFloat(row.cells[3]?.querySelector('label').textContent.replace('R$', '').replace('.', '').replace(',', '.') || 0); // Obtém o saldo (coluna "Saldo")

            if (dia && !isNaN(saldo)) {
                labels.push(`${dia.padStart(2, '0')}/${mes}`); // Formata como "DD/MM"
                data.push(saldo);
            }
        });
    }

    return { labels, data };
}

function coletarDados() {
    const labels = [];
    const data = [];

    for (let i = 1; i <= 12; i++) {
        const tableData = getDataFromTable(`boletim-${i}`);
        labels.push(...tableData.labels);
        data.push(...tableData.data);
    }

    return { labels, data };
}

let finalChart; // Variável para armazenar a instância do gráfico

function createFinalChart() {
    const finalData = coletarDados();
    const ctx = document.getElementById('finalChart').getContext('2d');

    // Verifica se o gráfico já foi criado e o destrói
    if (finalChart) {
        finalChart.destroy();
    }

    // Cria um novo gráfico e armazena na variável finalChart
    finalChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: finalData.labels,
          datasets: [{
              label: 'Saldo ao longo do ano',
              data: finalData.data,
              borderColor: 'rgba(75, 192, 192, 1)', // Cor da linha
              backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fundo dos pontos
              borderWidth: 2, // Largura da linha
              pointRadius: 4, // Tamanho dos pontos
              pointHoverRadius: 6, // Tamanho do ponto ao passar o mouse
              tension: 0.4, // Suaviza as linhas
              fill: false, // Não preenche o fundo
          }]
      },
      options: {
          responsive: true,
          plugins: {
              tooltip: {
                  enabled: true, // Ativa o tooltip
                  callbacks: {
                      title: function(context) {
                          return `Dia: ${context[0].label}`; // Mostra o rótulo
                      },
                      label: function(context) {
                          return `Saldo: R$ ${context.raw.toFixed(2)}`; // Mostra o valor formatado
                      }
                  }
              },
              legend: {
                  display: true,
                  labels: {
                      font: {
                          size: 14
                      }
                  }
              }
          },
          scales: {
              x: {
                  title: {
                      display: true,
                      text: 'Dia',
                      font: {
                          size: 16
                      }
                  },
                  ticks: {
                      font: {
                          size: 12
                      }
                  }
              },
              y: {
                  title: {
                      display: true,
                      text: 'Saldo',
                      font: {
                          size: 16
                      }
                  },
                  beginAtZero: false,
                  ticks: {
                      autoSkip: true,
                      maxTicksLimit: 10,
                      font: {
                          size: 12
                      },
                      callback: function(value) {
                          return `R$ ${value.toFixed(2)}`; // Exibe valores formatados
                      }
                  }
              }
          },
          interaction: {
              mode: 'nearest', // Interação mais precisa com o ponto mais próximo
              axis: 'x',
              intersect: false
          }
      }
  });
}

//parei

function mudaTema() {
    const elements = document.querySelectorAll('.left-panel, .right-panel, .top-panel, .paginaPrincipal, .containerIcones, .icon, .icone, .tabela-calendario, .remover-linha, .valor-input, .valor-total, .data-input, .descricao-input, .dia-input, .parcela-input, .remover-linha, #expressao, .input-filtro');
    let verdade = 0;
    elements.forEach(element => {
        if (element.style.backgroundColor === 'rgb(65, 65, 65)' || verdade === 1) { 
            element.style.backgroundColor = 'white';
            element.style.color = 'black';
            verdade = 1;
        } else {
            element.style.backgroundColor = 'rgb(65, 65, 65)'; // cinza escuro
            element.style.color = 'rgb(175, 175, 175)'; // cinza claro
        }
    });
    // Atualiza os gráficos
    updateCharts();
}

function updateCharts() {
    const isDarkTheme = document.body.style.backgroundColor === 'rgb(65, 65, 65)';

    for (let i = 1; i <= 12; i++) {
        if (charts[`chart${i}`]) {
            charts[`chart${i}`].options.plugins.legend.labels.color = isDarkTheme ? 'white' : 'black';
            charts[`chart${i}`].options.scales.x.ticks.color = isDarkTheme ? 'white' : 'black';
            charts[`chart${i}`].options.scales.y.ticks.color = isDarkTheme ? 'white' : 'black';
            charts[`chart${i}`].update();
        }
    }
}
function copiarEabrirGraficos() {
     // Seleciona apenas os gráficos e converte para imagens
    let graficosHTML = '';
    for (let i = 1; i <= 12; i++) {
        var canvas = document.getElementById(`chart${i}`);
        var dataURL = canvas.toDataURL();
        graficosHTML += `<div class="chart-container"><img src="${dataURL}" alt="Gráfico ${i}"></div>`;
    }
    canvas = document.getElementById(`finalChart`);
    dataURL = canvas.toDataURL();
    let graficoFinal = `<div class="chart-container"><img src="${dataURL}" alt="Gráfico Final"></div>`;

    // Cria um novo documento HTML
    const novaJanela = window.open('', '_blank');
    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Gráficos Mensais</title>
            <link rel="stylesheet" href="styles.css">
            <style>
                .chart-container {
                    position: relative;
                    width: 100%;
                    margin: auto;
                }
                img {
                    width: 100% !important;
                    height: auto !important;
                }
                .graficosGrid{
                    display: grid;
                    gap: 10px; /* Espaço entre os itens */
                    grid-template-columns: repeat(2, 1fr);
                }
            </style>
        </head>
        <body>
            <div class='graficosGrid'>
                ${graficosHTML}
            </div>
            ${graficoFinal}
        </body>
        </html>
    `;

    // Escreve o conteúdo HTML na nova janela
    novaJanela.document.open();
    novaJanela.document.write(html);
    novaJanela.document.close(); // Necessário para garantir que o documento seja carregado
}

function copiarEabrir() {
    // Seleciona o conteúdo da div com a classe 'tabelaBoletim'
    const tabelaBoletim = document.querySelector('.tabelaBoletim').outerHTML;

    // Cria um novo documento HTML
    const novaJanela = window.open('', '_blank');
    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Boletins Mensais</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            ${tabelaBoletim}
        </body>
        </html>
    `;

    // Escreve o conteúdo HTML na nova janela
    novaJanela.document.write(html);
    novaJanela.document.close(); // Necessário para garantir que o documento seja carregado
}

function copiarEabrirCofrinho() {
    const tabelaCofrinho = document.querySelector('#cofrinho-rendimento').outerHTML;
    var ano = document.getElementById('cofrinhoAteAnos').value;

    // Cria um novo documento HTML
    const novaJanela = window.open('', '_blank');
    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Boletins Mensais</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
        <h1 style="text-align: center;">Cofrinho Rendimento: ${ano} ano(s)</h1>
            ${tabelaCofrinho}
        </body>
        </html>
    `;

    // Escreve o conteúdo HTML na nova janela
    novaJanela.document.write(html);
    novaJanela.document.close(); // Necessário para garantir que o documento seja carregado
}

function salvarDicionario() {
  let dicionarioReceitas = atualizarDadosReceitas();
  let dicionarioCartoes = atualizarDadosCartoes();
  let dicionarioDiversos = atualizarDadosDiversos();
  let saldoDoMesPassado = `${document.getElementById('saldoMesPassado').value}||${document.getElementById('saldoMesPassado').getAttribute('data-valor')}`;
  let rendimento = document.getElementById('rendimento').getAttribute('data-valor');
  if (rendimento === undefined) { rendimento = 0; }
  let dicionarioCofrinho = criarDicionarioCofrinho();
  let dicionarioCofrinhoMetas = criarDicionarioCofrinhoMetas();
  let dicionarioAcoes = criarDicionarioAcao();
  let dicionarioProventosAcoes = criarDicionarioProventosAcoes();
  let dicionarioGruposAcoes = criarDicionarioGruposInvestimentos();
  let dicionarioMoedas = criarDicionarioMoedas(); 
  if (dicionarioCofrinhoMetas === undefined) { dicionarioCofrinhoMetas = {}; }
  let DicionarioCaixas = CriarDicionarioCaixas();

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  const segundos = String(agora.getSeconds()).padStart(2, '0');
  let dataCompleta = `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`;
  
  let tempoDeTela = parseInt(localStorage.getItem('tempoDeTela')) || 0;
  let tempoPassadoCorrido = parseInt(localStorage.getItem('tempoPassadoCorrido')) || 0;
  let tempoTotalDeTela = tempoDeTela + tempoPassadoCorrido;
  localStorage.setItem('tempoDeTela', 0);
  let horarioDeUso = formatarCalculo(`${tempoTotalDeTela} * 00:00:01`);

  let dados = {
      ulitmaHoraSalvo: dataCompleta,
      tempoDeUso: tempoTotalDeTela,
      horarioDeUso: horarioDeUso,
      dicionarioReceitas: dicionarioReceitas,
      dicionarioCartoes: dicionarioCartoes,
      dicionarioDiversos: dicionarioDiversos,
      saldoDoMesPassado: saldoDoMesPassado,
      rendimento: rendimento,
      dicionarioCofrinho: dicionarioCofrinho,
      dicionarioCofrinhoMetas: dicionarioCofrinhoMetas,
      listaCheckList: listaCheckList,
      dicionarioAcoes: dicionarioAcoes,
      dicionarioProventosAcoes: dicionarioProventosAcoes,
      dicionarioGruposAcoes: dicionarioGruposAcoes,
      dicionarioMoedas: dicionarioMoedas,
      dicionarioCaixas: DicionarioCaixas
  };

  // ✅ NOVO FINAL: Salva como arquivo .txt
  const texto = JSON.stringify(dados, null, 2);
  const blob = new Blob([texto], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Orçamento Pessoal - Salvo:${dia}/${mes}/${ano}.txt`;
  a.click();

  URL.revokeObjectURL(url);

  notificacaoSalvamento(); // Opcional: sua função de feedback visual
  salvarProgresso(dados); // Chama a função para salvar o progresso

    // ✅ Salvar também no JSONBin
    fetch("https://api.jsonbin.io/v3/b/6992edca43b1c97be9831fc9", {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
        "X-Master-Key": "$2a$10$R5vvSGzscaFNnn8f5KeA4.G1UwBcAw83JNCsaHJ/CMGCMgIVP2Oxe"
    },
    body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(res => {
    console.log("Salvo no JSONBin:", res);
    })
    .catch(err => {
    console.error("Erro ao salvar no JSONBin:", err);
    });
}


function notificacaoSalvamento () {
    if (listaNotificacaoExplicacaoLinha.length > 0) {
        let toastRemover = listaNotificacaoExplicacaoLinha.pop();
        if (document.body.contains(toastRemover)) {
            toastRemover.style.animation = "fadeOut 0.5s ease-in-out";
            setTimeout(() => toastRemover.remove(), 500);
            listaNotificacaoExplicacaoLinha = listaNotificacaoExplicacaoLinha.filter(item => item !== toast);
        }
    }
    // Criar elemento da notificação
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = "Salvo com Sucesso";

    // Criar botão de fechar
    let closeButton = document.createElement("button");
    closeButton.className = 'remover-linha';
    closeButton.innerHTML = "✖";
    closeButton.onclick = function () {
        toast.style.animation = "fadeOut 0.5s ease-in-out";
        setTimeout(() => toast.remove(), 500);
        listaNotificacaoExplicacaoLinha = listaNotificacaoExplicacaoLinha.filter(item => item !== toast);
    };

    // Adicionar botão à notificação
    toast.appendChild(closeButton);

    // Adicionar à página
    document.body.appendChild(toast);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.animation = "fadeOut 0.5s ease-in-out";
            setTimeout(() => toast.remove(), 500);
        }
    }, 5000);
}

function redirectToLogin() {
    salvarDicionario()
    // Usa HTTPS para a URL do logout
    fetch('/logout', { method: 'GET' })
        .then(response => {
            if (response.ok) {
                // Redireciona para a página inicial
                window.location.href = '/';                
            } else {
                console.error('Erro ao efetuar logout');
            }
        })
        .catch(error => console.error('Erro ao se comunicar com o servidor:', error));
}

document.getElementById('logoutButton').addEventListener('click', selecionarElerTXT);

window.addEventListener('beforeunload', salvarTempoDeTela);

// Armazena o momento em que o usuário acessou a página
let tempoInicio = Date.now();

function salvarTempoDeTela() {
    const tempoFinal = Date.now();
    const tempoDeSessao = Math.floor((tempoFinal - tempoInicio) / 1000); // Tempo em segundos

    // Obtém o tempo acumulado do localStorage (se já existir)
    const tempoAcumulado = parseInt(localStorage.getItem('tempoDeTela'));

    // Soma o tempo da sessão atual ao tempo acumulado
    const novoTempoTotal = tempoAcumulado + tempoDeSessao;

    // Salva o novo tempo total no localStorage
    localStorage.setItem('tempoDeTela', novoTempoTotal);
}


function selecionarElerTXT() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';

  input.onchange = function (event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = async function (e) {
      const conteudo = e.target.result;

      try {
        const objeto = JSON.parse(conteudo);

        // ✅ Salva local
        localStorage.setItem('dadosSalvos', JSON.stringify(objeto));
        localStorage.setItem('deveCarregar', 'sim');

        // ✅ Envia para JSONBin
        try {
          await fetch("https://api.jsonbin.io/v3/b/6992edca43b1c97be9831fc9", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": "$2a$10$R5vvSGzscaFNnn8f5KeA4.G1UwBcAw83JNCsaHJ/CMGCMgIVP2Oxe"
            },
            body: JSON.stringify(objeto)
          });

          console.log("Arquivo enviado para JSONBin.");

        } catch (erroCloud) {
          console.warn("Falha ao enviar para JSONBin — continuando local:", erroCloud);
        }

        // ✅ Recarrega página
        location.reload();

      } catch (erro) {
        alert("Não foi possível carregar o arquivo.");
      }
    };

    leitor.onerror = function () {
      alert("Erro ao ler o arquivo.");
    };

    leitor.readAsText(arquivo);
  };

  input.click();
}

window.addEventListener('DOMContentLoaded', () => {
  carregou = false; // Reseta a variável carregou
  const deveCarregar = localStorage.getItem('deveCarregar');
  const dadosSalvos = localStorage.getItem('dadosSalvos');

  if (deveCarregar === 'sim' && dadosSalvos) {
    try {
      const objeto = JSON.parse(dadosSalvos);
      const dicionarios = parseDicionarios(objeto); // Sua função de conversão
      CarregarTudo(dicionarios); // Sua função principal de carregamento
      carregou = true; // Marca como carregado
      salvarProgresso(objeto); // Salva o progresso após carregar

      // Limpa os dados após carregar
      localStorage.removeItem('deveCarregar');
      localStorage.removeItem('dadosSalvos');
    } catch (erro) {
      console.error("Erro ao processar dados após o F5:", erro);
    }
  }
});


function salvarProgresso(dadosObjeto) {
  try {
    const dadosSalvos = JSON.stringify(dadosObjeto);
    localStorage.setItem('progressoSalvo', dadosSalvos);
  } catch (erro) {
    console.error("Erro ao salvar progresso no localStorage:", erro);
  }
}

async function carregarProgressoSalvo() {
  carregou = false;

  try {
    // 🔹 Tenta carregar do JSONBin primeiro
    const res = await fetch("https://api.jsonbin.io/v3/b/6992edca43b1c97be9831fc9/latest", {
      headers: {
        "X-Master-Key": "$2a$10$R5vvSGzscaFNnn8f5KeA4.G1UwBcAw83JNCsaHJ/CMGCMgIVP2Oxe"
      }
    });

    if (!res.ok) throw new Error("Falha no JSONBin");

    const json = await res.json();
    const objeto = json.record;

    const dicionarios = parseDicionarios(objeto);
    CarregarTudo(dicionarios);

    carregou = true;
    console.log("Progresso carregado do JSONBin.");

    // 🔹 Atualiza cache local (ótima prática)
    localStorage.setItem('progressoSalvo', JSON.stringify(objeto));

    return;

  } catch (erro) {
    console.warn("JSONBin falhou — usando localStorage:", erro);
  }

  // 🔹 Fallback local
  const dadosJSON = localStorage.getItem('progressoSalvo');
  if (!dadosJSON) {
    console.warn("Nenhum progresso encontrado localmente.");
    return;
  }

  try {
    const objeto = JSON.parse(dadosJSON);
    const dicionarios = parseDicionarios(objeto);
    CarregarTudo(dicionarios);

    carregou = true;
    console.log("Progresso carregado do localStorage.");

  } catch (erro) {
    console.error("Erro ao carregar progresso local:", erro);
  }
}

function parseDicionarios(data) {
    localStorage.setItem('tempoPassadoCorrido', data.tempoDeUso || 0);
    return [
        data.dicionarioReceitas || {},
        data.dicionarioCartoes || {},
        data.dicionarioDiversos || {},
        data.saldoDoMesPassado || 'R$ 0,00||0.00',
        data.rendimento || '0.00000',
        data.dicionarioCofrinho || {},
        data.dicionarioCofrinhoMetas || {},
        data.listaCheckList || [],
        data.dicionarioAcoes || {},
        data.dicionarioMoedas || {},
        data.dicionarioProventosAcoes || {},
        data.dicionarioGruposAcoes || {},
        data.dicionarioCaixas || {},
    ];
}

function CarregarTudo(dicionarios) {
    limparConteudo();
    let partesSaldo = dicionarios[3].split("||");
    document.getElementById('saldoMesPassado').value = partesSaldo[0];
    document.getElementById('saldoMesPassado').setAttribute('data-valor', partesSaldo[1]);
    listaCheckList = dicionarios[7];

    function pegarLinha(idTabela){
        const tabelaCorpoReceitas = document.getElementById(idTabela);
        const linhasReceitas = tabelaCorpoReceitas.getElementsByTagName('tr');
        return linhasReceitas;
    }

    let contador = 0;

    let dicionarioReceitas = dicionarios[0];
    for (const [rendKey, Receitas] of Object.entries(dicionarioReceitas)) {
        addLinhaReceitas()
        var linhas = pegarLinha('Receitas-tabela-corpo');
        const linha = linhas[contador];
        const colunas = linha.getElementsByTagName('td');
        colunas[0].querySelector('input').value = Receitas.descricao;

        const valorInput = colunas[1].querySelector('input');
        let valor = Receitas.valor.toString();
        valorInput.value = valor.replace('.',',');
        formatarMoeda(valorInput, 0); // Formata o valor para o formato de moeda

        colunas[2].querySelector('input').value = Receitas.dataInicial;
        colunas[3].querySelector('input').value = parseInt(Receitas.parcela);

        contador++;
    }
    atualizarTodosValoresReceitas();

    contador = 0;

    let dicionarioCartoes = dicionarios[1];
    let idCartao = 0
    for (const [key, cartao] of Object.entries(dicionarioCartoes)) {
        idCartao++;
        addCartao()
        const inputNomeCartao = document.getElementById(`cartao-${idCartao}-nome-cartao`);
        inputNomeCartao.value = cartao.nomeCartao;

        const inputDiaVencimento = document.getElementById(`cartao-${idCartao}-dia-vencimento`);
        inputDiaVencimento.value = parseInt(cartao.diaVencimento);

        const inputLimite = document.getElementById(`cartao-${idCartao}-limite`);
        let limite = cartao.limite
        inputLimite.value = limite.replace('.',',');
        formatarMoeda(inputLimite, 0);
      
        const inputCor = document.getElementById(`cartao-${idCartao}-cor`);
        inputCor.value = cartao.corCartao;

        contador = 0;
        for (const [linhaKey, linha] of Object.entries(cartao.linhas)) {
            adicionarLinha(`cartao-${idCartao}`);
            const linhasCartao = pegarLinha(`cartao-${idCartao}-tabela-corpo`);
            const linhaCartao = linhasCartao[contador];
            const colunas = linhaCartao.getElementsByTagName('td');
            
            colunas[0].querySelector('input').value = linha.descricao;

            const valorInput = colunas[1].querySelector('input');
            let valor = linha.valor;
            valorInput.value = valor.replace('.',',');
            formatarMoeda(valorInput, 0); // Formata o valor para o formato de moeda

            colunas[2].querySelector('input').value = linha.data;
            colunas[3].querySelector('input').value = parseInt(linha.parcela);

            atualizarTodosValores(`cartao-${idCartao}`);
            contador++;
        }
    }
    contador = 0;

    let dicionarioDiversos = dicionarios[2];
    for (const [key, diversos] of Object.entries(dicionarioDiversos)) {
        addLinhaDiversos()
        linhas = pegarLinha('diversos-tabela-corpo');
        const linha = linhas[contador];
        const colunas = linha.getElementsByTagName('td');
        colunas[0].querySelector('input').value = diversos.descricao;

        const valorInput = colunas[1].querySelector('input');
        let valor = diversos.valor;
        if (valor !== undefined) {
            valorInput.value = valor.replace('.', ',');
            formatarMoeda(valorInput, 0); // Formata o valor para o formato de moeda
        }

        colunas[2].querySelector('input').value = diversos.dataInicial;
        colunas[3].querySelector('input').value = diversos.parcela;
        atualizarTodosValoresDiversos();

        contador++;
    }

    let inputrendimento = document.getElementById('rendimento');
    inputrendimento.value = dicionarios[4];
    contador = 0;

    let dicionarioCofrinho = dicionarios[5];
    for (const [key, cofrinho] of Object.entries(dicionarioCofrinho)) {
        if (key === '0') {
            continue;
        }
        addLinhaCofrinho()
        linhas = pegarLinha('cofrinho-tabela-corpo');
        const linha = linhas[contador];
        const colunas = linha.getElementsByTagName('td');

        const valorInput = colunas[1].querySelector('input');
        let valor = cofrinho.valor;
        if (valor !== undefined) {
            valorInput.value = valor.replace('.', ',');
            formatarMoedaReceitas(valorInput, 0); // Formata o valor para o formato de moeda
        }

        colunas[2].querySelector('input').value = cofrinho.data;
        colunas[3].querySelector('input').value = cofrinho.qde;
        colunas[0].querySelector('.movimentacao').value = cofrinho.movimentacao;
        atualizarTabelaReceitas_Movimentacao (colunas[0].querySelector('.movimentacao'), colunas[3].querySelector('input'));
        
        contador++;
    }

    contador = 0;
    let dicionarioCofrinhoMetas = dicionarios[6];
    for (const [key, meta] of Object.entries(dicionarioCofrinhoMetas)) {
        addLinhaCofrinhoMetas();
        linhas = pegarLinha('cofrinho-metas-tabela-corpo');
        const linha = linhas[contador];
        const colunas = linha.getElementsByTagName('td');

        colunas[0].querySelector('input').value = meta.descricao;
        let valor = meta.valor;
        colunas[1].querySelector('input').value = valor.replace('.', ',');
        formatarMoedaReceitas(colunas[1].querySelector('input'), 0); // Formata o valor para o formato de moeda

        contador++;
    }

    
    let dicionarioAcoes = dicionarios[8];
    let id = 1;
    //parei
    for (const [key, acao] of Object.entries(dicionarioAcoes)) {
        contador = 0;
        addAcao();
        // var divAcao = document.getElementById(`acao-${id}`);
        document.getElementById(`${id}-nome-empresa`).value = acao.nomeEmpresa;
        document.getElementById(`${id}-nome-codigo`).value = acao.codigo;
        document.getElementById(`${id}-valor-DY`).value = acao.DY;
        formatarValorInputAcoes(document.getElementById(`${id}-valor-DY`), id);
        var valorCota = acao.valorCota;
        document.getElementById(`${id}-valor-cota`).value = formatarMoeda_resultado(valorCota);
        document.getElementById(`${id}-valor-cota`).setAttribute('data-valor', valorCota);
        formatarMoedaAcao(id);
        var tabelaCorpo = document.getElementById(`${id}-tabela-corpo-acao`);
        let linha_C = 0
        for (const [key, movimentacao] of Object.entries(acao.movimentacoes)) {
            linha_C ++;
            adicionarLinhaAcao(`${id}`);
            var linhas = tabelaCorpo.getElementsByTagName('tr');
            var linha = linhas[contador];
            var colunas = linha.getElementsByTagName('td');
            colunas[0].querySelector('select').value = movimentacao.movimentacao;
            colunas[2].querySelector('input').value = movimentacao.data;
            colunas[3].querySelector('input').value = movimentacao.Qtde;

            var valorInput = colunas[1].querySelector('input');
            var valor = movimentacao.valor;
            valorInput.value = formatarMoeda_resultado(valor);
            formatarMoeda(valorInput, 0); // Formata o valor para o formato de moeda

            atualizarValorTotalAcao(valorInput, colunas[3].querySelector('input'), colunas[4].querySelector('input'), id, movimentacao.movimentacao, linha_C);
            atualizarQtdeCotas(id);

            contador++;
        }
        atualizarValorDividendo(id);
        id++;
    }
    
    contador = 0;
    let dicionarioProventosAcoes = dicionarios[10];
    for (const [key, dado] of Object.entries(dicionarioProventosAcoes)) {
      addProvento();
      linhas = pegarLinha('proventos-tabela-corpo');
      const linha = linhas[contador];
      const colunas = linha.getElementsByTagName('td');
      colunas[0].querySelector('select').value = dado.codigo;
      colunas[2].querySelector('input').value = dado.dataCorte;
      colunas[3].querySelector('input').value = dado.dataPagamento;
      colunas[4].querySelector('input').value = dado.valorUnitario.replace('.', ',');
      
      formatarValorInput(colunas[4].querySelector('input'));
      preencherProventosAcoes(colunas[0].querySelector('select'), colunas[1].querySelector('input'), colunas[2].querySelector('input'), colunas[5].querySelector('input'), colunas[4].querySelector('input'), colunas[6].querySelector('input'))
      
      contador++;
    }
  
    id = 1;
    let dicionarioGruposAcoes = dicionarios[11];
    for (const [key, dado] of Object.entries(dicionarioGruposAcoes)) {
      addGrupoinvestimento();
      document.getElementById(`grupo-investimento-${id}-nome`).value = dado.nome;
      var codigos = dado.codigos;
      
      var tabelaCorpo = document.getElementById(`grupo-investimento-${id}-tabela`);
      contador = 0;
      for (let l = 0; l < codigos.length; l++) {
        adicionarLinhaGrupoInvestimento(id);
        var linhas = tabelaCorpo.getElementsByTagName('tr');
        var linha = linhas[contador];
        var colunas = linha.getElementsByTagName('td');
        
        colunas[0].querySelector('select').value = codigos[l];
        
        prenecherDadosGrupos(colunas[0].querySelector('select'), colunas[1].querySelector('input'), colunas[2].querySelector('input'), colunas[3].querySelector('label'), colunas[5].querySelector('label'), colunas[6].querySelector('label'))
        contador++;
      }
      atualizaTotaisGrupo(id);
      
      id++;
    }
    
    let dicionarioMoedas = dicionarios[9];
    id = 1;
    //parei
    for (const [key, moeda] of Object.entries(dicionarioMoedas)) {
        contador = 0;
        addMoeda();
        // var divAcao = document.getElementById(`acao-${id}`);
        document.getElementById(`moeda-${id}-nome`).value = moeda.nome;
        var valorCota = moeda.valorCota;
        document.getElementById(`moeda-${id}-valor-cota`).value = formatarMoeda_resultado(valorCota);
        document.getElementById(`moeda-${id}-valor-cota`).setAttribute('data-valor', valorCota);
        formatarValorMoeda(id);
      
        var tabelaCorpo = document.getElementById(`moeda-${id}-tabela-corpo`);
        let linha_C = 0
        for (const [key, movimentacao] of Object.entries(moeda.movimentacoes)) {
            linha_C ++;
            adicionarLinhaMoeda(`${id}`);
            var linhas = tabelaCorpo.getElementsByTagName('tr');
            var linha = linhas[contador];
            var colunas = linha.getElementsByTagName('td');
            colunas[0].querySelector('select').value = movimentacao.movimentacao;
            colunas[2].querySelector('input').value = movimentacao.data;
            colunas[3].querySelector('input').value = movimentacao.Qtde;

            var valorInput = colunas[1].querySelector('input');
            var valor = movimentacao.valor;
            valorInput.value = formatarMoeda_resultado(valor);
            formatarMoeda(valorInput, 0); // Formata o valor para o formato de moeda

            atualizarValorTotalMoeda(valorInput, colunas[3].querySelector('input'), colunas[4].querySelector('input'), id)
            atualizarQtdeCotasMoeda(id);

            contador++;
        }
        id++;
    }

    let dicionarioCaixas = dicionarios[12];
    id = 0;
    for (const [key, caixa] of Object.entries(dicionarioCaixas)) {
        addCaixa();
        document.getElementById(`caixa-nome-${id}`).value = caixa.nome;
        document.getElementById(`caixa-saldo-${id}`).value = formatarMoeda_resultado(caixa.saldoInicial);

        formatarValorCaixaLivre(document.getElementById(`caixa-saldo-${id}`), id);

        var movimentacoesLivres = caixa.movimentacaoLivre;
        var movimentacaoesFixas = caixa.movimentacaoFixa;

        contador = 0;
        for (const [key, movimentacao] of Object.entries(movimentacoesLivres)) {
            adicionarItemCaixaLivre(id);
            var linhas = document.getElementById(`tabela-caixa-${id}-movimentacao-livre`).getElementsByTagName('tr');
            var colunas = linhas[contador].getElementsByTagName('td');
            colunas[0].querySelector('select').value = movimentacao.tipo;
            colunas[1].querySelector('input').value = movimentacao.descricao;
            colunas[2].querySelector('input').value = formatarMoeda_resultado(movimentacao.valor);
            const inputData = colunas[3].querySelector('input');

            const dataISO = new Date(movimentacao.data);
            inputData.value = dataISO.toISOString().split('T')[0];

            formatarValorCaixaLivre(colunas[2].querySelector('input'), id);
            contador++;
        }

        contador = 0;
        for (const [key, movimentacao] of Object.entries(movimentacaoesFixas)) {
            adicionarItemCaixaFixa(id);

            const tabela = document.getElementById(`tabela-caixa-${id}-movimentacao-fixa`);
            const linhas = tabela.getElementsByTagName('tr');
            const colunas = linhas[contador].getElementsByTagName('td');

            const selectFonte = colunas[0].querySelector('select');
            const selectTipo = colunas[1].querySelector('select');
            const inputValorFixa = colunas[2].querySelector('input');

            atualizarSelectTipo(selectFonte, selectTipo, inputValorFixa);

            selectFonte.value = movimentacao.fonte;
            selectFonte.dispatchEvent(new Event('change'));

            const opcao = [...selectTipo.options].find(opt =>
                opt.textContent.trim() === movimentacao.tipo
            );

            if (opcao) {
                selectTipo.selectedIndex = opcao.index;
                selectTipo.dispatchEvent(new Event('change'));
            }
            contador++;
        }

        ataulizarSaldoCaixas(id);
        id++;
    }

    boletimFuncao();
    historicoInvestimentos();
}

function limparConteudo() {
    cartaoIdCounter = 0;
    acaoIdCounter = 0;
    moedaIdCounter = 0;

    // Remover todas as linhas das tabelas
    var tabelaReceitas = document.getElementById('Receitas-tabela-corpo');
    var tabelaDiversos = document.getElementById('diversos-tabela-corpo');
    var tabelaCofrinho = document.getElementById('cofrinho-tabela-corpo');
    var cartoesContainer = document.getElementById('cartoes-container');
    var cambioContainer = document.getElementById('cambio-container');

    // Limpar os containers de ações e proventos
    var acaosContainer = document.getElementById('acoes-container');
    var tabelaproventos = document.getElementById('proventos-tabela-corpo');
    var tabelagrupos = document.getElementById('grupos-investimento-container');
    var tabeldDistribuicaoPonderada = document.getElementById('distribuicao-ponderada-tabela-corpo');
    var caixas = document.getElementById('caixas-container');

    if (tabelaReceitas) {
        tabelaReceitas.innerHTML = ''; // Remove todo o conteúdo da tabela
    }

    if (tabelaDiversos) {
        tabelaDiversos.innerHTML = ''; // Remove todo o conteúdo da tabela
    }
    
    if (cartoesContainer) {
        cartoesContainer.innerHTML = ''; // Remove todo o conteúdo do container
    }

    if (tabelaCofrinho) {
        tabelaCofrinho.innerHTML = ''; // Remove todo o conteúdo da tabela
    }

    if (cambioContainer) {
        cambioContainer.innerHTML = ''; // Remove todo o conteúdo do container
    }

    if (acaosContainer) {
        acaosContainer.innerHTML = ''; // Remove todo o conteúdo do container de ações
    }

    if (tabelaproventos) {
        tabelaproventos.innerHTML = ''; // Remove todo o conteúdo da tabela de proventos
    }

    if (tabelagrupos) {
        tabelagrupos.innerHTML = ''; // Remove todo o conteúdo do container de grupos de investimento
    }

    if (tabeldDistribuicaoPonderada) {
        tabeldDistribuicaoPonderada.innerHTML = ''; // Remove todo o conteúdo da tabela de distribuição ponderada
    }

    if (caixas) {
        caixas.innerHTML = ''; // Remove todo o conteúdo do container de caixas
    }
}

let listaCheckList = [];
let listaCheckListAtuais = [];
function ChecklistFuncao() {
    listaCheckListAtuais = [];
    dicionarioDias = {};
    boletimFuncao();
    mostrarIconer("Icone6");  
    
    clonarEBaixarTabelaCheckList('boletim1', new Date(), 'CheckListDiv', 'tabelaCheckList', 'divCalendarioCheckList')
  
    const hoje = new Date();
    const primeiroDiaProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    clonarEBaixarTabelaCheckList('boletim2', primeiroDiaProximoMes, 'CheckListDiv2', 'tabelaCheckList2', 'divCalendarioCheckList2')
  
    var tabela = document.querySelector('#CheckListDiv2 #tabelaCheckList2');
    var primeiroTr = tabela.querySelector('tr');
    if (primeiroTr) {
        primeiroTr.remove();
        atualizarDicionarioDia(1, true, 'divCalendarioCheckList2');
    }

    for (let i = 0; i < listaCheckList.length; i++) {
        var identificador = listaCheckList[i];
        var descricao = identificador.split('||')[0].split(':')[1];
        var valor = identificador.split('||')[1].split(':')[1];
        var dia = identificador.split('||')[2].split(':')[1];
        var mesAno = identificador.split('||')[3].split(':')[1];
        identificador = `Descricao:${descricao}||Valor:${valor}||Data:${dia}||MesAno:${mesAno}`;
        if (listaCheckListAtuais.indexOf(identificador) === -1) {
            listaCheckList.splice(i, 1);
            i--;
        }
    }

    carregarCheckListMarcadas();
    cronogramaCheckListFuncao();
    barraFiltroCheckList.forcarAtualizacao();
    atualizarSaldoCheckGeral();
    iniciarOrdenacaoPlanilhas(true);
}

function clonarEBaixarTabelaCheckList(idDiv, data, idCheckList, idDias, idCalendario) {
    var divBoletim = document.getElementById(idDiv);  
    var copia = divBoletim.cloneNode(true);  
    
    // Modifica o ID e a classe da div copiada
    copia.id = 'divTabelaCheckList';  // Novo ID para a div copiada
    copia.className = 'classCheckList';  // Nova classe para a div copiada
    
    // Modifica o ID do tbody dentro da tabela
    var tabela = copia.querySelector('tbody');  // Seleciona o tbody dentro da tabela copiada
    tabela.id = idDias;  // Define um novo ID para o tbody
    
    // Modifica o conteúdo da quarta coluna para cada linha da tabela
    var linhas = tabela.querySelectorAll('tr');  // Seleciona todas as linhas da tabela
    linhas.forEach(function(linha, index) {
        linha.setAttribute('numeroboletim', '')
        var celulas = linha.querySelectorAll('td');  // Seleciona todas as células da linha
        if (celulas.length > 3) {  // Verifica se há uma quarta coluna
            var descricao = celulas[0].querySelector('label').textContent;
            var valor = celulas[1].querySelector('label').textContent;
            var dataCelula = celulas[2].querySelector('label').textContent;
            var mesAno = new Date(data).toLocaleString('pt-BR', { month: 'numeric', year: 'numeric' });
            var identificador = `Descricao:${descricao}||Valor:${valor}||Data:${dataCelula}||MesAno:${mesAno}`;
            listaCheckListAtuais.push(identificador);

            var countIdentificador = listaCheckListAtuais.filter(item => item === identificador).length;
            identificador += `||Numero:${countIdentificador}`;

            // Define o conteúdo da quarta coluna como uma caixa de marcação
            celulas[3].innerHTML = `<input type="checkbox" id="checkbox${index}" class="checkbox ${idCalendario} ${identificador}"/>`;
            
            // Adiciona um evento à caixa de marcação
            var checkbox = celulas[3].querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                var dia = parseInt(celulas[2].querySelector('label').textContent);
                atualizarSaldoCheckList(parseFloat(celulas[1].querySelector('label').getAttribute('data-valor')), checkbox.checked);
                atualizarDicionarioDia(dia, this.checked, idCalendario);
                if (checkbox.checked) {
                    listaCheckList.push(identificador);
                } else {
                    var index = listaCheckList.indexOf(identificador);
                    if (index > -1) {
                        listaCheckList.splice(index, 1);
                    }
                }
            });     
        }
    });
    // adicionar linha saldo restante:
    var linhaSaldo = document.createElement('tr');
    linhaSaldo.id = 'linhaSaldoCheckList';
    linhaSaldo.className = 'boletim-mensal-total-filtro';
    linhaSaldo.innerHTML = `
        <td colspan="2"><strong>Saldo Restante:</strong></td>
        <td colspan="2"><label id="${idDiv}-saldoCheckList" data-valor="0.00">R$ 0,00</label></td>
    `;
    tabela.appendChild(linhaSaldo);

    // Adiciona a div copiada à div CheckListDiv
    var divCheckList = document.getElementById(idCheckList);  // Seleciona a div de destino
    divCheckList.innerHTML = '';  // Limpa o conteúdo existente
    divCheckList.appendChild(copia);  // Adiciona a div copiada ao final da div de destino
            
    // Cria a nova div
    var divCalendario = document.createElement('div');
    divCalendario.id = idCalendario;

    // Adiciona a nova div à divCheckList
    divCheckList.appendChild(divCalendario);
    
    // Gera o calendário dentro da nova div
    criarDicionarioDias(idDias, idCalendario);
    criarCalendario(data.getMonth(), data.getFullYear(), idCalendario);
    
    // Atualiza o calendário com base nas caixas de seleção
    atualizarCalendario(idCalendario);

    // Seleciona o elemento <th> da quarta coluna
    var quartaColuna = document.querySelector("#divTabelaCheckList thead th:nth-child(4)");

    // Altera o texto da quarta coluna para "Status"
    quartaColuna.textContent = "Status";
}

function atualizarSaldoCheckListFinal(idSaldo, idBoletim) {
    var saldoLabel = document.getElementById(idSaldo);
    var valorAtual_ = 0;
    var linhas = document.querySelectorAll(`#${idBoletim} tr`);
    linhas.forEach(linha => {
        var celulas = linha.getElementsByTagName('td');
        if (celulas.length > 3) {
            var checkbox = celulas[3].querySelector('input[type="checkbox"]');
            var statusFiltradosaldo = '';
            try {
                var statusFiltradosaldo = linha.getAttribute('data-filtrado');
            } catch {
                var statusFiltradosaldo = 'true';
            }
            if (checkbox) {
                if (checkbox.checked) {
                    return; // Pula para a próxima iteração se estiver marcado
                } else if (statusFiltradosaldo === 'false') {
                    return; // Pula para a próxima iteração se estiver marcado via data-marcado
                }
                var valor = parseFloat(celulas[1].querySelector('label').getAttribute('data-valor'));

                valorAtual_ += valor;
            }
        }
    });
    saldoLabel.innerText = `R$ ${formatarResultado(valorAtual_.toFixed(2), 2)}`;
}

function atualizarSaldoCheckGeral(){
    atualizarSaldoCheckListFinal('boletim1-saldoCheckList', 'tabelaCheckList');
    atualizarSaldoCheckListFinal('boletim2-saldoCheckList', 'tabelaCheckList2');
}

function atualizarMarcacoesCheckList(){
    criarDicionarioDias('tabelaCheckList', 'divCalendarioCheckList');
    criarDicionarioDias('tabelaCheckList2', 'divCalendarioCheckList2');
    carregarCheckListMarcadas();
    atualizarCalendario('divCalendarioCheckList');
    atualizarCalendario('divCalendarioCheckList2');
}

function carregarCheckListMarcadas(){
    var saldoLabel = document.getElementById('saldoCheckList');
    saldoLabel.innerText = formatarResultado(0.00, 2);

    for (let i = 0; i < listaCheckList.length; i++) {
        var identificador = listaCheckList[i];
        var descricao = identificador.split('||')[0].split(':')[1];
        var valor = identificador.split('||')[1].split(':')[1];
        var data = identificador.split('||')[2].split(':')[1];
        var mesAno = identificador.split('||')[3].split(':')[1];
        var numero = identificador.split('||')[4].split(':')[1];
        var checkboxes = document.getElementsByClassName(`Descricao:${descricao}||Valor:${valor}||Data:${data}||MesAno:${mesAno}||Numero:${numero}`);
        if (checkboxes.length > 0) {
            checkboxes[0].checked = true;
            let valor_formatado = valor.replace('R$ ', '').replace('.', '').replace(',', '.');
            atualizarSaldoCheckList(parseFloat(valor_formatado), true);
            let calendario = checkboxes[0].classList[1];
            atualizarDicionarioDia(parseInt(data), true, calendario);
        }
    }
}

let dicionarioDias1 = {};
let dicionarioDias2 = {};

// Função para criar o dicionário a partir da tabela
function criarDicionarioDias(id, calendario) {
    const checkboxes = document.querySelectorAll(`#${id} input[type="checkbox"]`);
    if (calendario === 'divCalendarioCheckList'){
      dicionarioDias1 = {};
    } else {
      dicionarioDias2 = {};
    }

    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const display = window.getComputedStyle(tr).display;

        const dia = parseInt(tr.querySelectorAll('td')[2].querySelector('label').textContent);
        
        if (calendario === 'divCalendarioCheckList'){
          if (!dicionarioDias1[dia]) {
            dicionarioDias1[dia] = 0;
          }

          if (display === 'none') {
            return;
          }

          dicionarioDias1[dia]++;
          
        } else {
          if (!dicionarioDias2[dia]) {
            dicionarioDias2[dia] = 0;
          }

            if (display === 'none') {
              return;
          }

          dicionarioDias2[dia]++;
      }
    });
}

function atualizarDicionarioDia(dia, isChecked, calendario) {
    if (calendario === 'divCalendarioCheckList'){
        if (!dicionarioDias1[dia]) {
          dicionarioDias1[dia] = 0;
        }

        if (isChecked) {
            if (dicionarioDias1[dia] > 0){
                dicionarioDias1[dia]--;
            }
        } else {
            dicionarioDias1[dia]++;
        }
    } else {
      if (!dicionarioDias2[dia]) {
        dicionarioDias2[dia] = 0;
      }

      if (isChecked) {
        if (dicionarioDias2[dia] > 0) {
            dicionarioDias2[dia]--;
        }
      } else {
          dicionarioDias2[dia]++;
      }
    }
    // Verifica o estilo do dia no calendário após a atualização
    atualizarCalendario(calendario);
}

function atualizarCalendario(id) {
    const divCalendario = document.getElementById(id);
    const dias = divCalendario.querySelectorAll('td');
    
    // Atualiza o estilo dos dias no calendário
    dias.forEach(td => {
        const dia = parseInt(td.textContent);
        if (isNaN(dia)) return; // Ignora células que não são dias
        
        if (id === 'divCalendarioCheckList'){
          if (dia === hoje.getDate()) {
            td.style.color =  '#555555';  // Define a cor do texto como verde para o dia de hoje
            td.style.fontWeight = 'bold'; // Marca o dia em negrito se houver caixas não marcadas
            td.style.backgroundColor = '#D3F9D8'; // Fundo verde claro
            td.style.borderRadius = '50%'; // Torna o fundo circular
          } else if (dicionarioDias1[dia] > 0) {
            td.style.fontWeight = 'bold'; // Marca o dia em negrito se houver caixas não marcadas
            td.style.backgroundColor = '#F9D3D3'; // vermelho claro
            td.style.borderRadius = '50%'; // Torna o fundo circular
          } else {
            td.style.backgroundColor = ''; // Remove a cor de fundo se todas as caixas estiverem marcadas ou não houver caixas
            td.style.borderRadius = ''; // Remove o estilo de borda circular
            td.style.fontWeight = 'normal'; // Remove o negrito se todas as caixas estiverem marcadas ou não houver caixas
          }
        } else {
            if (dicionarioDias2[dia] > 0 && dia != 1) {
              td.style.fontWeight = 'bold'; // Marca o dia em negrito se houver caixas não marcadas
              td.style.backgroundColor = '#F9D3D3'; // vermelho claro
              td.style.borderRadius = '50%'; // Torna o fundo circular
          } else {
              td.style.backgroundColor = ''; // Remove a cor de fundo se todas as caixas estiverem marcadas ou não houver caixas
              td.style.borderRadius = ''; // Remove o estilo de borda circular
              td.style.fontWeight = 'normal'; // Remove o negrito se todas as caixas estiverem marcadas ou não houver caixas
          }
        }
    });
}


// Função para atualizar o saldo
function criarCalendario(mes, ano, divId) {
    const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const numDias = new Date(ano, mes + 1, 0).getDate();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const divCalendario = document.getElementById(divId);
    
    // Obtém a data atual
    const hoje = new Date();
    const hojeDia = hoje.getDate();
    const hojeMes = hoje.getMonth();
    const hojeAno = hoje.getFullYear();
    
    // Limpa a div caso já tenha um calendário
    divCalendario.innerHTML = '';

    // Cria o elemento <h1>
    var h1 = document.createElement('h1');
    h1.textContent = 'Calendário';
    h1.style.margin = '0px';
    h1.style.padding = '0px';

    divCalendario.appendChild(h1);

    // Cria a tabela do calendário
    const tabela = document.createElement('table');
    tabela.classList.add('tabela-calendario');
    
    // Cria o cabeçalho da tabela
    const thead = document.createElement('thead');
    const trCabecalho = document.createElement('tr');
    diasDaSemana.forEach(dia => {
        const th = document.createElement('th');
        th.textContent = dia;
        trCabecalho.appendChild(th);
    });
    thead.appendChild(trCabecalho);
    tabela.appendChild(thead);
    
    // Cria o corpo da tabela
    const tbody = document.createElement('tbody');
    let tr = document.createElement('tr');
    
    // Adiciona células vazias até o primeiro dia do mês
    for (let i = 0; i < primeiroDia; i++) {
        const td = document.createElement('td');
        tr.appendChild(td);
    }
    
    // Adiciona os dias do mês
    for (let dia = 1; dia <= numDias; dia++) {
        if ((primeiroDia + dia - 1) % 7 === 0 && dia !== 1) {
            tbody.appendChild(tr);
            tr = document.createElement('tr');
        }
        const td = document.createElement('td');
        td.textContent = dia;

        // Adiciona a classe para o dia de hoje
        if (dia === hojeDia && mes === hojeMes && ano === hojeAno) {
            //td.style.color = '';  // Define a cor do texto como verde para o dia de hoje
            td.style.backgroundColor = '#D3F9D8'; // Fundo verde claro
            td.style.borderRadius = '50%'; // Torna o fundo circular
        }

        tr.appendChild(td);
    }
    
    // Adiciona a última linha ao corpo da tabela
    tbody.appendChild(tr);
    tabela.appendChild(tbody);
    divCalendario.appendChild(tabela);
}

function atualizarSaldoCheckList(valor, isChecked) {
    var saldoLabel = document.getElementById('saldoCheckList');
    var saldoAtual = parseFloat(saldoLabel.innerText.replace('.', '').replace(',', '.'));
    if (isNaN(saldoAtual)){ saldoAtual = 0}; // Certifica que saldoAtual é um número
    
    if (isChecked) {
        saldoAtual += valor;  // Adiciona o valor ao saldo
    } else {
        saldoAtual -= valor;  // Subtrai o valor do saldo
    }

    // Atualiza o valor do saldo no formato brasileiro
    saldoLabel.innerText = formatarResultado(saldoAtual.toFixed(2), 2);
    atualizarSaldoCheckGeral();
}

let meses = ["Janeiro 01", "Fevereiro 02", "Março 03", "Abril 04", "Maio 05", "Junho 06", "Julho 07", "Agosto 08", "Setembro 09", "Outubro 10", "Novembro 11", "Dezembro 12"];

let dicionarioReceitas = {};
let dicionarioCartoes = {};
let dicionarioDiversos = {};
let dicionarioCofrinho = {};
let dicionarioValoresMensaisCartoes = {};
let dicionarioAcoes = {};
let dicionarioProventosAcoes = {};
let dicionarioMoedas = {};

function boletimFuncaoBtn() {
  boletimFuncao();
  barraFiltroBoletins.forcarAtualizacao();
  iniciarOrdenacaoPlanilhas();
}

function boletimFuncao() {
  mostrarIconer("Icone4");
  dicionarioReceitas = atualizarDadosReceitas();
  dicionarioCartoes = atualizarDadosCartoes();
  dicionarioDiversos = atualizarDadosDiversos();
  dicionarioCofrinho = criarDicionarioCofrinho();
  dicionarioAcoes = criarDicionarioAcao();
  dicionarioProventosAcoes = criarDicionarioProventosAcoes();
  dicionarioMoedas = criarDicionarioMoedas();
  let dataHoje = new Date();

  dicionarioValoresMensaisCartoes = calcularValoresMensais(dicionarioReceitas, dicionarioCartoes, dicionarioDiversos, dicionarioCofrinho, dicionarioAcoes, dicionarioProventosAcoes, dicionarioMoedas, dataHoje);

  dicionarioValoresMensaisCartoes = atualizarDicionarioBoletimCaixa(dicionarioValoresMensaisCartoes);

  let contadorBoletim = 1;
  let mesDataAtual = dataHoje.getMonth();
  let anoDataAtual = dataHoje.getFullYear();
  const boletins = document.querySelectorAll(".boletim");

  boletins.forEach((boletim, index) => {
    // Limpar o conteúdo da div .boletim
    while (boletim.firstChild) {
        boletim.removeChild(boletim.firstChild);
    }

    let nomeDoMes = nomeMes(mesDataAtual, anoDataAtual);

    // Criação do elemento <h1> com o nome do mês
    let h1 = document.createElement("h1");
    h1.style.margin = "0";
    h1.style.padding = "0";
    h1.textContent = nomeDoMes;

    let h3Eentradas = document.createElement("h3");
    h3Eentradas.textContent = 'Entradas: '
    h3Eentradas.className = 'boletim-mensal-totais'
    let labelEntradas = document.createElement('label');
    labelEntradas.id = `boletim-Entradas-${contadorBoletim}`

    let h3Saidas = document.createElement("h3");
    h3Saidas.textContent = 'Saidas: '
    h3Saidas.className = 'boletim-mensal-totais'
    let labelSaidas = document.createElement('label');
    labelSaidas.id = `boletim-Saidas-${contadorBoletim}`

    let h3Saldo = document.createElement("h3");
    h3Saldo.textContent = 'Saldo: '
    h3Saldo.className = 'boletim-mensal-totais'
    let labelSaldo = document.createElement('label');
    labelSaldo.id = `boletim-Saldo-${contadorBoletim}`

    // Adicionar o <h1> dentro da div .boletim
    boletim.appendChild(h1);
    boletim.appendChild(h3Eentradas);
    h3Eentradas.appendChild(labelEntradas);
    boletim.appendChild(h3Saidas);
    h3Saidas.appendChild(labelSaidas);
    boletim.appendChild(h3Saldo);
    h3Saldo.appendChild(labelSaldo);

    // Criação da tabela
    let table = document.createElement("table");

    // Criação do thead
    let thead = document.createElement("thead");
    let trHead = document.createElement("tr");

    // Colunas do cabeçalho
    ["Descrição", "Valor", "Dia", "Saldo"].forEach(text => {
        let th = document.createElement("th");
        th.textContent = text;
        if (text === 'Saldo'){
            th.className = 'boletim-mensal-saldo';
          }
        trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Criação do tbody
    let tbody = document.createElement("tbody");
    tbody.id = `boletim-${contadorBoletim}`;
    table.appendChild(tbody);

    // Adicionar a tabela dentro da div .boletim
    boletim.appendChild(table);

    // Adicionar as linhas nas tabelas
    if (contadorBoletim < 13){
      adicionarLinhasTabelaBoletim(dicionarioValoresMensaisCartoes[contadorBoletim], `boletim-${contadorBoletim}`, contadorBoletim)
    }

    // Incrementar os contadores
    mesDataAtual++;
    contadorBoletim++;
  });
}

function nomeMes(num, ano) {
    if (num > 11) { 
        return `${meses[num - 12]}/${ano+1}`;
    } else { 
        return `${meses[num]}/${ano}`;
    }
}      

function atualizarDadosReceitas() {
    const tabelaCorpo = document.getElementById('Receitas-tabela-corpo');
    const linhas = tabelaCorpo.querySelectorAll('tr');
    const dicionarioReceitas = {};

    linhas.forEach((linha, index) => {
        const descricao = linha.querySelector('td:nth-child(1) input').value;
        const valor = linha.querySelector('td:nth-child(2) input').getAttribute('data-valor');
        const dataInicial = linha.querySelector('td:nth-child(3) input').value;
        const Qtde = linha.querySelector('td:nth-child(4) input').value;

        dicionarioReceitas[index + 1] = {
            descricao: descricao,
            valor: parseFloat(valor) *-1,
            dataInicial: dataInicial,
            parcela: Qtde,
            dia: parseInt(dataInicial.split('-')[2], 10),
        };
    });

    return dicionarioReceitas;
}

function atualizarDadosCartoes() {
    const cartoes = document.querySelectorAll('.cartaoadd');
    const dicionarioCartoes = {};

    cartoes.forEach((cartao, indexCartao) => {
        const nomeCartao = cartao.querySelector(`#${cartao.id}-nome-cartao`).value;
        const diaVencimento = cartao.querySelector(`#${cartao.id}-dia-vencimento`).value;
        const limite = cartao.querySelector(`#${cartao.id}-limite`).getAttribute('data-valor');
        const tabelaCorpo = cartao.querySelector(`#${cartao.id}-tabela-corpo`);
        const corCartao = cartao.querySelector(`#${cartao.id}-cor`).value;
        const linhas = tabelaCorpo.querySelectorAll('tr');
        
        const dicionarioLinhas = {};

        linhas.forEach((linha, indexLinha) => {
            const descricao = linha.querySelector('td:nth-child(1) input').value;
            const valor = linha.querySelector('td:nth-child(2) input').getAttribute('data-valor');
            const data = linha.querySelector('td:nth-child(3) input').value;
            const parcela = linha.querySelector('td:nth-child(4) input').value;

            dicionarioLinhas[indexLinha + 1] = {
                descricao: descricao,
                valor: valor,
                data: data,
                parcela: parcela
            };
        });

        dicionarioCartoes[indexCartao + 1] = {
            nomeCartao: nomeCartao,
            diaVencimento: diaVencimento,
            limite: limite,
            corCartao: corCartao,
            linhas: dicionarioLinhas,
        };
    });
  
    return dicionarioCartoes;
}

function atualizarDadosDiversos() {
    const tabelaCorpo = document.getElementById('diversos-tabela-corpo');
    const linhas = tabelaCorpo.querySelectorAll('tr');
    const dicionarioDiversos = {};

    linhas.forEach((linha, index) => {
        const descricao = linha.querySelector('td:nth-child(1) input').value;
        const valor = linha.querySelector('td:nth-child(2) input').getAttribute('data-valor');
        const data = linha.querySelector('td:nth-child(3) input').value;
        const parcela = linha.querySelector('td:nth-child(4) input').value;

        let [ano, mes, dia] = data.split('-');

        dicionarioDiversos[index + 1] = {
            descricao: descricao,
            valor: valor,
            dia: dia,
            parcela: parcela,
            dataInicial: data,
        };
    });

    return dicionarioDiversos;
}

function calcularValoresMensais(dicionarioReceitas, dicionarioCartoes, dicionarioDiversos, dicionarioCofrinho, dicionarioAcoes, dicionarioProventosAcoes, dicionarioMoedas, data, qtdeMes = 12) {
  
  const hoje = data;
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  let explicacao = '';

  let dadosCofrinhoOrdenado = ordenarMovimentacoesCofrinho();
  let totalCofrinho = 0;
  
  let dataParaCalculo = new Date(anoAtual, mesAtual, 10);
  dataParaCalculo.setMonth(dataParaCalculo.getMonth() -1);
  for (const [rendKey, dados] of Object.entries(dadosCofrinhoOrdenado)) {
    for (const [rendKey, movimentacao] of Object.entries(dados)) {
      if (dataParaCalculo > new Date(movimentacao.data)){
        totalCofrinho += movimentacao.valor;
      } else {
        break
      }
    }
  }
  
  const dicionarioValoresMensais = {};
  for (let mes = 0; mes < qtdeMes; mes++) {
      const mesAno = new Date(anoAtual, mesAtual - 1 + mes, 10);
      let ultimoDiaMes = new Date(mesAno.getFullYear(), mesAno.getMonth() + 1, 0).getDate();
      const valorMesAno = mesAno.getFullYear() * 12 + mesAno.getMonth();
      dicionarioValoresMensais[mes + 1] = {
        data: mesAno,
      };

      let subChave = 1;

      // Adiciona os Receitas
      for (const [rendKey, Receitas] of Object.entries(dicionarioReceitas)) {
          const dataInicial = new Date(Receitas.dataInicial);
          const valorDataInicial = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
          let parcelasRestantes = (parseInt(Receitas.parcela) - (mesAno.getFullYear() * 12 + mesAno.getMonth())) + (dataInicial.getFullYear() * 12 + dataInicial.getMonth()) -1;

          if (parseInt(Receitas.dia, 10) === 1) {parcelasRestantes += 1}
          if (parcelasRestantes >= 0 && valorDataInicial <= valorMesAno) {
            if (parseInt(Receitas.parcela) === 1) {explicacao = '1/1'}
            else {explicacao = `${parseInt(Receitas.parcela) - parcelasRestantes}/${Receitas.parcela}`}
            let dia = parseInt(Receitas.dia, 10) > ultimoDiaMes ? ultimoDiaMes : parseInt(Receitas.dia, 10);

            dicionarioValoresMensais[mes + 1][subChave] = {
                descricao: Receitas.descricao,
                dia: dia,
                valor: Receitas.valor *-1,
                tipo: 'boletim-mensal-receita',
                movimentacao: 'entrada',
                explicacao: explicacao,
                data: `${String(parseInt(Receitas.dia, 10)).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
            };
            subChave++;
          }
      }

      // Adiciona os valores do proventos
      for (const [key, proventos] of Object.entries(dicionarioProventosAcoes)) {
          const dataInicial = new Date(proventos.dataPagamento);
          const valorDataInicial = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
          let parcelasRestantes = (1) - (mesAno.getFullYear() * 12 + mesAno.getMonth()) + (dataInicial.getFullYear() * 12 + dataInicial.getMonth()) -1;
          if (parseInt(proventos.dataPagamento.split('-')[2], 10) === 1) {parcelasRestantes += 1}
          if (parcelasRestantes >= 0 && valorDataInicial <= valorMesAno) {
              let dia = parseInt(proventos.dataPagamento.split('-')[2], 10) > ultimoDiaMes ? ultimoDiaMes : parseInt(proventos.dataPagamento.split('-')[2], 10);
              explicacao = `Data do corte: ${inverterData(proventos.dataCorte)}\nValor Unitário: ${proventos.valorUnitario.replace(".", ",")}\nQtde de cotas: ${proventos.qtdeCota}`;
              dicionarioValoresMensais[mes + 1][subChave] = {
                descricao: `${proventos.empresa} (${proventos.codigo}) - Provento`,
                dia: dia,
                valor: proventos.valorTotal *1,
                tipo: 'boletim-mensal-investimento',
                movimentacao: 'entrada',
                explicacao: explicacao,
                data: `${String(parseInt(proventos.dataPagamento.split('-')[2], 10),).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
              };
              subChave++;
            }
      }


         // Adiciona os valores do Cofrinho
      for (const [key, cofrinho] of Object.entries(dicionarioCofrinho)) {
        const dataInicial = new Date(cofrinho.data);
        const valorDataInicial = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
        let parcelasRestantes = (parseInt(cofrinho.qde) - (mesAno.getFullYear() * 12 + mesAno.getMonth())) + (dataInicial.getFullYear() * 12 + dataInicial.getMonth()) -1;

        if (parseInt(cofrinho.dia, 10) === 1) {parcelasRestantes += 1}
        if (cofrinho.movimentacao != 'rendimento') {
          let valor = cofrinho.movimentacao === 'retirar' ? cofrinho.valor*1 : cofrinho.valor*-1;
          var descricao = cofrinho.movimentacao === 'retirar' ? `Cofrinho (Retirar)` : "Cofrinho (Depositar)";
            if (parcelasRestantes >= 0 && valorDataInicial <= valorMesAno) {
              explicacao = ``;
              let dia = parseInt(cofrinho.dia, 10) > ultimoDiaMes ? ultimoDiaMes : parseInt(cofrinho.dia, 10);
              dicionarioValoresMensais[mes + 1][subChave] = {
                  descricao: descricao,
                  dia: dia,
                  valor: valor,
                  tipo: 'boletim-mensal-cofrinho',
                  movimentacao: cofrinho.movimentacao === 'retirar' ? `entrada` : "saida",
                  explicacao: explicacao,
                  data: `${String(parseInt(cofrinho.dia, 10)).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
              };
            }
        }
        subChave++;
      }

    // Adiciona os valores das Ações
      for (const [key, acoes] of Object.entries(dicionarioAcoes)) {
          for (const [movimentacaoKey, movimentacao] of Object.entries(acoes.movimentacoes)) {
              let dataInicial;
              if (parseInt(movimentacao.data.split('-')[2], 10) === 1) {
                let partes = movimentacao.data.split('-')
                dataInicial = new Date(parseInt(partes[0], 10), parseInt(partes[1]) -1 , parseInt(partes[2], 10));
              } else {
                dataInicial = new Date(movimentacao.data);
              }
              const valorDataInicial = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
              let parcelasRestantes = (parseInt(1) - (mesAno.getFullYear() * 12 + mesAno.getMonth())) + (dataInicial.getFullYear() * 12 + dataInicial.getMonth()) -1;
              var valor = movimentacao.valorTotal;
              if (movimentacao.movimentacao === 'compra') {
                  valor = valor * -1;
              }
              if (parseInt(movimentacao.data.split('-')[2], 10) === 1) {parcelasRestantes = 0}
              if (parcelasRestantes >= 0 && valorDataInicial === valorMesAno) {
                  let dia = parseInt(movimentacao.data.split('-')[2], 10) > ultimoDiaMes ? ultimoDiaMes : parseInt(movimentacao.data.split('-')[2], 10);
                  explicacao = `Valor Unitário: ${formatarMoeda_resultado(movimentacao.valor)}`;
                  dicionarioValoresMensais[mes + 1][subChave] = {
                      descricao: `${acoes.nomeEmpresa} (${acoes.codigo}) - ${movimentacao.movimentacao} de ${movimentacao.Qtde} cotas`,
                      dia: dia,
                      valor: valor,
                      tipo: 'boletim-mensal-investimento',
                      movimentacao: movimentacao.movimentacao === 'compra' ? `saida` : "entrada",
                      explicacao: explicacao,
                      data: `${String(parseInt(movimentacao.data.split('-')[2], 10)).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
                  };
                  subChave++;
              }
          }
      }
      // Adiciona os valores das moedas
      for (const [key, moeda] of Object.entries(dicionarioMoedas)) {
          for (const [movimentacaoKey, movimentacao] of Object.entries(moeda.movimentacoes)) {
            let dataInicial;
              if (parseInt(movimentacao.data.split('-')[2], 10) === 1) {
                let partes = movimentacao.data.split('-')
                dataInicial = new Date(parseInt(partes[0], 10), parseInt(partes[1]) -1 , parseInt(partes[2], 10));
              } else {
                dataInicial = new Date(movimentacao.data);
              }
              const valorDataInicial = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
              let parcelasRestantes = (parseInt(1) - (mesAno.getFullYear() * 12 + mesAno.getMonth())) + (dataInicial.getFullYear() * 12 + dataInicial.getMonth()) -1;
              var valor = movimentacao.valorTotal;
              if (movimentacao.movimentacao === 'compra') {
                  valor = valor * -1;
              }

              if (parseInt(movimentacao.data.split('-')[2], 10) === 1) {parcelasRestantes = 0}
              if (parcelasRestantes >= 0 && valorDataInicial === valorMesAno) {
                  let dia = parseInt(movimentacao.data.split('-')[2], 10) > ultimoDiaMes ? ultimoDiaMes : parseInt(movimentacao.data.split('-')[2], 10);
                  explicacao = `Valor Unitário: ${formatarMoeda_resultado(movimentacao.valor)}`;
                  dicionarioValoresMensais[mes + 1][subChave] = {
                      descricao: `Câmbio (${moeda.nome}) - ${movimentacao.movimentacao} de ${(movimentacao.Qtde).toString().replace('.', ',')}`,
                      dia: dia,
                      valor: valor,
                      tipo: 'boletim-mensal-cambio',
                      movimentacao: movimentacao.movimentacao === 'compra' ? `saida` : "entrada",
                      explicacao: explicacao,
                      data: `${String(parseInt(movimentacao.data.split('-')[2], 10)).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
                  };
                  subChave++;
              }
          }
      }

      // Adiciona os valores dos cartões de crédito
      for (const [key, cartao] of Object.entries(dicionarioCartoes)) {
          const nomeCartao = cartao.nomeCartao;
          const dia = parseInt(cartao.diaVencimento, 10);
          let valorMes = 0;
          explicacao = 'Fatura:';            

          for (const [linhaKey, linha] of Object.entries(cartao.linhas)) {
              let a_ = 0;
              const dataInicial = new Date(linha.data);
              const dataFaturaCartao = new Date (mesAno.getFullYear(), mesAno.getMonth(), dia);
              let dataFim = new Date(dataInicial);
              dataFim.setMonth(dataInicial.getMonth() + parseInt(linha.parcela));
              let dataFaturaAtual = new Date (hoje.getFullYear(), hoje.getMonth(), dia);
              if (dataInicial > dataFaturaAtual){
                  dataFim = new Date (dataInicial.getFullYear(), dataInicial.getMonth() + parseInt(linha.parcela), dataInicial.getDate());
              }
              if (dataInicial.getDate()<dia) {a_ = 1;}
              if (dataInicial <= dataFaturaCartao && dataFaturaCartao <= dataFim) {
                  const parcelasRestantes = parseInt(linha.parcela) - (mesAno.getMonth() + mesAno.getFullYear() * 12) + (dataInicial.getMonth() + dataInicial.getFullYear() * 12);
                  valorMes += parseFloat(linha.valor.replace('R$', '').replace(',', '.'));
                  let a__ = '';
                  if (parseInt(linha.parcela) === 1) {a__ = '1/1'}

                  else {a__ = `${parseInt(linha.parcela)-parcelasRestantes+a_}/${parseInt(linha.parcela)}`}                  
                  explicacao += `\n${linha.descricao} ${a__} ${formatarMoeda_resultado(parseFloat(linha.valor))}`;
              }
          }
          if (valorMes != 0) {
              dicionarioValoresMensais[mes + 1][subChave] = {
                  descricao: nomeCartao,
                  dia: dia,
                  valor: valorMes * -1,
                  tipo: 'boletim-mensal-cartao',
                  movimentacao: 'saida',
                  explicacao: explicacao,
                  data: `${String(dia).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
              };
          }
          subChave++;
      }

       // Adiciona os valores dos Diversos
      for (const [key, diversos] of Object.entries(dicionarioDiversos)) {
          const dataInicial = new Date(diversos.dataInicial);
          const valorDataInicial = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
          let parcelasRestantes = (parseInt(diversos.parcela) - (mesAno.getFullYear() * 12 + mesAno.getMonth())) + (dataInicial.getFullYear() * 12 + dataInicial.getMonth()) -1;

          if (parseInt(diversos.dia, 10) === 1) {parcelasRestantes += 1}
          if (parcelasRestantes >= 0 && valorDataInicial <= valorMesAno) {
              let dia = parseInt(diversos.dia, 10) > ultimoDiaMes ? ultimoDiaMes : parseInt(diversos.dia, 10);
              if (parseInt(diversos.parcela) === 1){explicacao = '1/1'}
              else {explicacao = `${parseInt(diversos.parcela)-parcelasRestantes}/${parseInt(diversos.parcela)}`}                
              dicionarioValoresMensais[mes + 1][subChave] = {
                  descricao: diversos.descricao,
                  dia: parseInt(diversos.dia, 10),
                  valor: diversos.valor *-1,
                  tipo: 'boletim-mensal-dividas-diversas',
                  movimentacao: 'saida',
                  explicacao: explicacao,
                  data: `${String(parseInt(diversos.dia, 10)).padStart(2, '0')}/${String(mesAno.getMonth() + 1).padStart(2, '0')}/${mesAno.getFullYear()}`,
              };
              subChave++;
          }
      }
  }
  return dicionarioValoresMensais;
}

let saldoAnterior;
function atualizarSaldoDoMesPassado (input) {
    let valor = input.value;
    let negativo = false
    var _ = '';
    if (valor.includes('-')) {negativo = true; _ = '-'}

    valor = valor.replace(/[^\d,]/g, '');
    valor = valor.replace(",", ".");
    let _valor = parseFloat(valor).toFixed(2);
    valor = formatarResultado(_valor.toString(), 2);
    if (valor === 'NaN,00') {valor = '0,00'}
    let valordado = valor.replace('.', '');
    input.setAttribute('data-valor', `${_}${valordado.replace(',', '.')}`);
    input.value = `R$ ${_}${valor}`;

    boletimFuncao()
}

function adicionarLinhasTabelaBoletim(dados, idTbody, id, saldoStatus=true) {
  // Encontrar o elemento tbody usando o ID fornecido
  const tbody = document.getElementById(idTbody);

  // Verifique se o tbody foi encontrado
  if (!tbody) {
      console.error(`tbody com ID '${idTbody}' não encontrado.`);
      return; // Se o tbody não for encontrado, saia da função
  }

  let saldo = 0;
  let entradas = 0;
  let saidas = 0;
  let saldo_doMes = 0;

  if (saldoStatus) {
    // saldo antetior
    const novaLinha = document.createElement('tr');
    novaLinha.style.backgroundColor = 'rgba(211, 249, 216, 0.5)' // verde claro, 50% transparente
    novaLinha.style.color = 'black';  // Cor do texto
    novaLinha.className = 'boletim-mensal-saldoMesPassado'
    let valor, _valor;
    if (idTbody != 'boletim-1') {
        saldo = saldoAnterior;
        valor = parseFloat(saldo).toFixed(2);
        _valor = formatarResultado(valor,2);
    } else {
        let saldoDoMesPassado = document.getElementById('saldoMesPassado').getAttribute('data-valor');
        saldo = parseFloat(saldoDoMesPassado);
        valor = parseFloat(saldo).toFixed(2);
        _valor = formatarResultado(valor,2);
    }
    novaLinha.innerHTML = `
        <td><label style="width: 200px;" data-valor="saldo Passado">Saldo Passado</label></td>
        <td><label data-valor="${valor}" style="width: 85px;">R$ ${_valor}</label></td>
        <td><label style="width: 200px;" data-valor="1">1</label></td>
        <td class='boletim-mensal-saldo'><label data-valor="${valor}">R$ ${_valor}</label></td>
    `;
    tbody.appendChild(novaLinha);
    }
  dataCofrinho = new Date(dados.data)
  dataCofrinho.setMonth( dataCofrinho.getMonth() - 1);
  let totalCofrinho = calcularTotalAplicadoCofrinho(dataCofrinho);
  // Itera de 1 a 31
  for (let dia = 1; dia <= 31; dia++) {
      // Verifica se o dia está presente nos dados
      for (const chave in dados) {
          if (dados[chave].dia === dia) {
              const descricao = dados[chave].descricao;
              const valor = dados[chave].valor;

              if (valor > 0) {entradas += valor}
              else {saidas += valor}

              // Formata o valor
              let _valor = parseFloat(valor).toFixed(2);
              _valor = formatarResultado(_valor.toString(), 2);

              // Atualiza o saldo
              saldo += valor;
              let saldoFormatado = parseFloat(saldo).toFixed(2);
              saldoFormatado = formatarResultado(saldoFormatado, 2)

              // Cria uma nova linha
              const novaLinha = document.createElement('tr');
              if (dados[chave].tipo === 'boletim-mensal-cofrinho'){
                totalCofrinho += valor*-1;
                novaLinha.title = `Total Aplicado: ${formatarMoeda_resultado(totalCofrinho)}`;
                dados[chave].explicacao = `Total Aplicado: ${formatarMoeda_resultado(totalCofrinho)}`;
              } else {
                novaLinha.title = dados[chave].explicacao;
              }
              if (dados[chave].movimentacao === 'entrada'){
                novaLinha.style.backgroundColor = 'rgba(211, 249, 216, 0.5)' // verde claro, 50% transparente
              } else if (dados[chave].movimentacao === 'saida'){
                novaLinha.style.backgroundColor = 'rgba(255, 204, 204, 0.5)' // rosa claro, 50% transparente
              } else {
                novaLinha.style.backgroundColor = 'rgba(211, 237, 249, 0.5)' 
              }

              novaLinha.style.color = 'black';  // Cor do texto 
              if (saldoStatus){
                novaLinha.setAttribute('numeroBoletim', id);
                novaLinha.className = `${dados[chave].tipo} boletim-mensal-Descricao-Item  linha-${dados[chave].movimentacao}`;
                novaLinha.setAttribute('movimentacao', `movimentacao-${dados[chave].movimentacao}`);
              } else {
                novaLinha.setAttribute('numeroBoletim', id + 12);
                novaLinha.className = `${dados[chave].tipo}-altenativo boletim-mensal-Descricao-Item-altenativo`;
                novaLinha.setAttribute('movimentacao', `movimentacao-${dados[chave].movimentacao}-altenativo`);
              }

              novaLinha.setAttribute('valorLinha', valor);
              novaLinha.innerHTML = `
                  <td><label style="width: 200px;" data-valor="${descricao}">${descricao}</label></td>
                  <td><label data-valor="${valor}" style="width: 85px;">R$ ${_valor}</label></td>
                  <td><label style="width: 200px; data-valor="${dia}">${dia}</label></td>
                  <td class='boletim-mensal-saldo' data-valor="${saldo}"><label>R$ ${saldoFormatado}</label></td>
              `;

              novaLinha.addEventListener('click', () => {
                notificacaoExplicacaoLinha(dados[chave].explicacao);
              });

              // Adiciona a nova linha ao tbody
              tbody.appendChild(novaLinha);
          }
      }
      saldoAnterior = saldo;
      saldo_doMes = entradas + saidas;
      if (saldoStatus) {
        atualizarValorTotalBoletim(`#boletim-Entradas-${id}`, entradas);
        atualizarValorTotalBoletim(`#boletim-Saidas-${id}`, saidas*-1);
        atualizarValorTotalBoletim(`#boletim-Saldo-${id}`, saldo_doMes);
      } else {
        atualizarValorTotalBoletim(`#boletim-Entradas-${id}-altenativo`, entradas);
        atualizarValorTotalBoletim(`#boletim-Saidas-${id}-altenativo`, saidas*-1);
        atualizarValorTotalBoletim(`#boletim-Saldo-${id}-altenativo`, saldo_doMes);
      }

  }
}

var listaNotificacaoExplicacaoLinha = [];

function notificacaoExplicacaoLinha(explicacao) {
    // Remover item da lista se existir
    if (listaNotificacaoExplicacaoLinha.length > 0) {
        let toastRemover = listaNotificacaoExplicacaoLinha.pop();
        if (document.body.contains(toastRemover)) {
            toastRemover.style.animation = "fadeOut 0.5s ease-in-out";
            setTimeout(() => toastRemover.remove(), 500);
        }
    }

    // Criar elemento da notificação
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = explicacao.replace(/\n/g, "<br>");

    // Criar botão de fechar
    let closeButton = document.createElement("button");
    closeButton.className = "remover-linha";
    closeButton.innerHTML = "✖";
    closeButton.onclick = function () {
        toast.style.animation = "fadeOut 0.5s ease-in-out";
        setTimeout(() => toast.remove(), 500);
        // Remover da lista quando fechado manualmente
        listaNotificacaoExplicacaoLinha = listaNotificacaoExplicacaoLinha.filter(item => item !== toast);
    };

    // Adicionar botão à notificação
    toast.appendChild(closeButton);

    // Adicionar à página
    document.body.appendChild(toast);

    // Adicionar à lista
    listaNotificacaoExplicacaoLinha.push(toast);

    // Remover automaticamente após 30 segundos
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.animation = "fadeOut 0.5s ease-in-out";
            setTimeout(() => toast.remove(), 500);
            // Remover da lista após remoção automática
            listaNotificacaoExplicacaoLinha = listaNotificacaoExplicacaoLinha.filter(item => item !== toast);
        }
    }, 30000);
}

function atualizarValorTotalBoletim(id, valor){
  let label = document.querySelector(id);
  label.setAttribute('data-valor', parseFloat(valor.toFixed(2)));
  label.textContent = formatarMoeda_resultado(valor);
}

function addLinhaReceitas(){
    const tabelaCorpo = document.getElementById(`Receitas-tabela-corpo`);

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td><input type="text" placeholder="Descrição" class="descricao-input"></td>
        <td><input placeholder="Valor" class="valor-input" data-valor="" onblur="formatarMoeda(this, -2)" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="number" class="dia-input parcela-input" value=1></td>
        <td><input placeholder="Valor Restante" class="valor-total" disabled data-valor=""></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    const valorInput = novaLinha.querySelector('.valor-input');
    const dataInput = novaLinha.querySelector('.data-input');
    const QtdeInput = novaLinha.querySelector('.dia-input');
    const valorTotalInput = novaLinha.querySelector('.valor-total');

    valorInput.addEventListener('input', () => atualizarTotalReceitas(valorInput, dataInput, QtdeInput, valorTotalInput));
    dataInput.addEventListener('input', () => atualizarTotalReceitas(valorInput, dataInput, QtdeInput, valorTotalInput));
    QtdeInput.addEventListener('input', () => atualizarTotalReceitas(valorInput, dataInput, QtdeInput, valorTotalInput));

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizarTotalTabela('#Receitas-tabela-corpo', '#totalReceitas');
    });
}

function atualizarTotalReceitas(valorInput, dataInput, QtdeInput, valorTotalInput) {
    const valor = parseFloat(valorInput.getAttribute('data-valor')) || 0;
    const Qtde = parseInt(QtdeInput.value) || 0;
    const valorData = dataInput.value; // Corrigido de 'dataInput.valor' para 'dataInput.value'
    
    const dataValida = valorData && /^\d{4}-\d{2}-\d{2}$/.test(valorData);
    const [anoData, mesData, diaData] = dataValida
        ? valorData.split('-').map(Number)
        : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

    const mesDataAtual = new Date().getMonth() + 1;
    const anoDataAtual = new Date().getFullYear();
    const a = mesDataAtual + (anoDataAtual * 12);
    const b = mesData + (anoData * 12);

    let result;
    if (b < a) {result = valor * (Qtde - (a - b));} else {result = valor * Qtde;}

    if (result < 0) { result = 0; }
    const valorTotal = result;
    valorTotalInput.value = formatarMoeda_resultado(result);
    valorTotalInput.setAttribute('data-valor', valorTotal);
    atualizarTotalTabela('#Receitas-tabela-corpo', '#totalReceitas');
}

function atualizarTodosValoresReceitas() {
    const tabelaCorpo = document.getElementById('Receitas-tabela-corpo');
    const linhas = tabelaCorpo.querySelectorAll('tr');

    linhas.forEach(linha => {
        const valorInput = linha.querySelector('.valor-input');
        const dataInput = linha.querySelector('.data-input');
        const QtdeInput = linha.querySelector('.dia-input');
        const valorTotalInput = linha.querySelector('.valor-total');

        atualizarTotalReceitas(valorInput, dataInput, QtdeInput, valorTotalInput);
    });
}

function addLinhaDiversos(){
    const tabelaCorpo = document.getElementById(`diversos-tabela-corpo`);

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td><input type="text" class="descricao-input"></td>
        <td><input class="valor-input" data-valor="" onblur="formatarMoeda(this, -1)" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="number" class="parcela-input" value=1></td>
        <td><input placeholder="Valor Restante" class="valor-total" disabled data-valor=""></td>
        <td><button class="remover-linha">Remover</button></td>
    `;

    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    const valorInput = novaLinha.querySelector('.valor-input');
    const dataInput = novaLinha.querySelector('.data-input');
    const parcelaInput = novaLinha.querySelector('.parcela-input');
    const valorTotalInput = novaLinha.querySelector('.valor-total');

    valorInput.addEventListener('input', () => atualizarTotalDiversos(valorInput, dataInput, parcelaInput, valorTotalInput));
    dataInput.addEventListener('input', () => atualizarTotalDiversos(valorInput, dataInput, parcelaInput, valorTotalInput));
    parcelaInput.addEventListener('input', () => atualizarTotalDiversos(valorInput, dataInput, parcelaInput, valorTotalInput));

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        atualizarTotalTabela('#diversos-tabela-corpo', '#totalDividasDiversas')
    });
}

function atualizarTotalDiversos(valorInput, dataInput, parcelaInput, valorTotalInput) {
    const valor = parseFloat(valorInput.getAttribute('data-valor')) || 0;
    const parcela = parseInt(parcelaInput.value) || 0;
    const valorData = dataInput.value; // Corrigido de 'dataInput.valor' para 'dataInput.value'
        
    const dataValida = valorData && /^\d{4}-\d{2}-\d{2}$/.test(valorData);
    const [anoData, mesData, diaData] = dataValida
        ? valorData.split('-').map(Number)
        : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

    const mesDataAtual = new Date().getMonth() + 1;
    const anoDataAtual = new Date().getFullYear();
    const a = mesDataAtual + (anoDataAtual * 12);
    const b = mesData + (anoData * 12);

    let result;
    if (b < a) {result = valor * (parcela - (a - b));} else {result = valor * parcela;}
    
    if (result < 0) { result = 0; }
    const valorTotal = result;
    valorTotalInput.value = formatarMoeda_resultado(result);
    valorTotalInput.setAttribute('data-valor', valorTotal);
    atualizarTotalTabela('#diversos-tabela-corpo', '#totalDividasDiversas');
}

function gerarMesesAte12() {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const dataAtual = new Date();
    const listaMeses = [];

    for (let i = 0; i < 12; i++) {
        const novoMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + i, 1);
        const nomeMes = `${meses[novoMes.getMonth()]}-${novoMes.getFullYear()}`;
        listaMeses.push(nomeMes);
    }

    return listaMeses;
}

let coresCartoes = {};
function graficosCartoes(){
  if (!carregou) { return }
  coresCartoes = coresCartoes_();
  criarGraficoDeLinhas(calcularValoresMensais({}, atualizarDadosCartoes(), {}, {}, {}, {}, {}, new Date()), 'grafico-Cartoes');
  calcularEPassarDados(calcularValoresMensais({}, atualizarDadosCartoes(), {}, {}, {}, {}, {}, new Date()))
  historicoCartoes();
}

let meuGrafico = null; // Variável global para armazenar a instância do gráfico

function criarGraficoDeLinhas(dados, canvasId) {
    // Remove o gráfico anterior, se existir
    if (window.meuGrafico) {
        window.meuGrafico.destroy();
    }

    // Verifica o tamanho da tela
    const isSmallScreen = window.innerWidth < 999;
    const fontSize = isSmallScreen ? 5 : 18;
    const borderSize = isSmallScreen ? 2 : 5;

    // Gerar os meses de 1 a 12
    const labels = gerarMesesAte12(); 

    // Processa os dados para o gráfico
    const series = {}; 
    const totalValores = new Array(12).fill(0); // Inicializa com 0 para o total

    // Preencher as séries de dados para cada item
    Object.keys(dados).forEach((mes) => {
        const valoresDoMes = dados[mes];
        
        Object.values(valoresDoMes).forEach(entry => {
            if (entry instanceof Date && !isNaN(entry)) {return}
            const descricao = entry.descricao;
            const valorPositivo = Math.abs(entry.valor);

            // Inicializa a série do item caso ainda não exista
            if (!series[descricao]) {
                series[descricao] = new Array(12).fill(0); // Inicializa com 0 para todos os meses
            }

            // Adiciona o valor no mês correto
            const mesIndex = parseInt(mes) - 1; // Meses começam em 1, mas em JS o índice começa em 0
            series[descricao][mesIndex] += valorPositivo;

            // Atualiza o total acumulado
            totalValores[mesIndex] += valorPositivo;
        });
    });

    // Função para gerar cores aleatórias

    // Criar os datasets com cores aleatórias
    const datasets = Object.keys(series).map((descricao, index) => ({
        label: descricao,
        data: series[descricao],
        borderColor: coresCartoes[descricao], // Cor da linha
        backgroundColor: coresCartoes[descricao] + "33", // Cor transparente (33 = 20% opacidade)
        borderWidth: borderSize,
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: coresCartoes[descricao], // Cor dos pontos
        pointBorderColor: "#fff" // Borda dos pontos
    }));

    // Adiciona a linha de "Total" com uma cor fixa e linha tracejada
    datasets.push({
        label: "Total",
        data: totalValores,
        borderColor: "#000", // Preto para o total
        borderWidth: borderSize + 1,
        borderDash: [5, 5], // Linha tracejada
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: "#000",
        pointBorderColor: "#fff"
    });

    // Seleciona o canvas
    const ctx = document.getElementById(canvasId).getContext("2d");

    // Cria o gráfico de linha
    window.meuGrafico = new Chart(ctx, {
        type: "line",
        data: {
            labels, // Meses de 1 a 12
            datasets
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        font: { size: fontSize }
                    }
                },
                y: {
                    ticks: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: { size: fontSize }
                    }
                },
                datalabels: {
                    align: "top",
                    anchor: "end",
                    color: "#000",
                    backgroundColor: "rgba(200, 200, 200, 0.7)",
                    font: {
                        size: fontSize,
                        weight: "bold"
                    },
                    formatter: value => formatarMoeda_resultado(value)
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function calcularEPassarDados(dados) {
    // Seleciona a div onde os gráficos de pizza serão inseridos
    const container = document.getElementById('grafico-pizza-Cartoes');
    
    // Limpa a div antes de adicionar novos gráficos
    container.innerHTML = '';

    // Obtém os títulos dos meses usando a função gerarMesesAte12
    const meses = gerarMesesAte12();

    // Loop para passar pelos 12 meses
    for (let mes = 1; mes <= 12; mes++) {
        const mesDados = dados[mes];
        const valores = [];
        const labels = [];
        let somaTotal = 0;

        // Verifica se há dados para o mês
        if (mesDados && Object.keys(mesDados).length > 0) {
            // Itera pelas dívidas do mês
            Object.keys(mesDados).forEach((id) => {
                const entry = mesDados[id];
                if (entry instanceof Date && !isNaN(entry)) {return}
                const descricao = entry.descricao;
                const valorPositivo = Math.abs(entry.valor);  // Usamos o valor absoluto
                somaTotal += valorPositivo; // Soma total do mês
                valores.push(valorPositivo); // Adiciona o valor
                labels.push(descricao); // Adiciona a descrição
            });

            // Calcula as porcentagens para cada item
            const porcentagens = valores.map((valor) => (valor / somaTotal) * 100);

            // Cria o container do gráfico (contendo o título e o canvas)
            const graficoContainer = document.createElement('div');
            graficoContainer.className = 'grafico-container';

            // Adiciona o título do gráfico
            const graficoTitulo = document.createElement('h3');
            graficoTitulo.className = 'grafico-titulo';
            graficoTitulo.innerText = meses[mes - 1];  // Pega o título correspondente
            graficoContainer.appendChild(graficoTitulo);

            // Cria o canvas dinamicamente
            const canvas = document.createElement('canvas');
            canvas.id = `grafico-pizza-${mes}`;
            graficoContainer.appendChild(canvas);  // Adiciona o canvas na div

            // Adiciona o container do gráfico na div principal
            container.appendChild(graficoContainer);

            // Chama a função para criar o gráfico de pizza
            criarGraficoDePizza(porcentagens, labels, canvas.id, meses[mes - 1]);
        } else {
            // Caso não tenha dados, cria o gráfico vazio
            const graficoContainer = document.createElement('div');
            graficoContainer.className = 'grafico-container';

            const graficoTitulo = document.createElement('h3');
            graficoTitulo.className = 'grafico-titulo';
            graficoTitulo.innerText = meses[mes - 1];  // Pega o título correspondente
            graficoContainer.appendChild(graficoTitulo);

            const canvas = document.createElement('canvas');
            canvas.id = `grafico-pizza-${mes}`;
            graficoContainer.appendChild(canvas);  // Adiciona o canvas na div

            // Adiciona o container do gráfico na div principal
            container.appendChild(graficoContainer);

            // Chama a função para criar o gráfico vazio
            criarGraficoDePizza([], [], canvas.id, meses[mes - 1]);
        }
    }
}

function criarGraficoDePizza(porcentagens, labels, canvasId, titulo) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Cria o gráfico de pizza
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: titulo, // Título do gráfico (Mes-Ano)
                data: porcentagens,
                backgroundColor: labels.map(label => coresCartoes[label]),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            cutout: '40%', // Adiciona o efeito de rosquinha, sem miolo
            plugins: {
                legend: {
                    position: 'bottom',  // A legenda agora estará abaixo
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                datalabels: {
                    color: "#000",
                    backgroundColor: "rgba(200, 200, 200, 0.7)",
                    font: {
                        size: 14,
                        weight: "bold"
                    },
                    formatter: (value, ctx) => {
                        const label = ctx.chart.data.labels[ctx.dataIndex];
                        return `${label}: ${value.toFixed(2)}%`;
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

let cartaoIdCounter = 0;
function addCartao() {
    cartaoIdCounter++;
    const cartaoId = `cartao-${cartaoIdCounter}`;
    
    const divCartoes = document.getElementById(`cartoes-container`);

    const container = document.createElement('div');
    container.id = cartaoId;
    container.classList.add('cartaoadd');
    container.innerHTML = `
        <div class="caixa-informacoes">
            <label for="${cartaoId}-nome-cartao">Nome do Cartão:</label>
            <input type="text" id="${cartaoId}-nome-cartao" placeholder="Nome do Cartão" class="descricao-input nome-cartao">

            <label for="${cartaoId}-dia-vencimento">Dia de Vencimento:</label>
            <input type="number" id="${cartaoId}-dia-vencimento" placeholder="Dia" class="dia-input">

            <label for="${cartaoId}-limite">Limite:</label>
            <input id="${cartaoId}-limite" placeholder="Limite" onblur="formatarMoeda(this, '${cartaoId}')" class="valor-input" value="R$ 0,00">

            <label for="${cartaoId}-disponivel">Limite Disponível:</label>
            <input id="${cartaoId}-disponivel" placeholder="Disponível" disabled class="valor-input">
            
            <label for="${cartaoId}-fatura">Fatura atual:</label>
            <input id="${cartaoId}-fatura" placeholder="R$ 0,00" disabled class="valor-input faturaCartao" data-valor="0">
            
            <label for="cor">Escolha uma cor:</label>
            <input type="color" id="${cartaoId}-cor" class="corCartao" name="cor">

            <button onclick="apagarCartao('${cartaoId}')" class="remover-linha">Excluir o Cartão</button>
            <button onclick="limparDados('.table-container-${cartaoId}')" class="remover-linha">Limpar Dados</button>
            
            <div class="table-container-${cartaoId} table-container-cartoes">
              <button id="${cartaoId}-adicionar-linha" class="remover-linha">Adicionar Linha</button>
                <table>
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Data</th>
                            <th>Parcela</th>
                            <th>Valor Restante</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody class="tabela-corpo-Cartoes" id="${cartaoId}-tabela-corpo">
                        <!-- Linhas da tabela serão adicionadas aqui -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    divCartoes.appendChild(container);

    document.getElementById(`${cartaoId}-adicionar-linha`).addEventListener('click', function() {
        adicionarLinha(cartaoId);
        atualizarFaturaCartao(cartaoId)
    });
}

function adicionarLinha(cartaoId) {
    const tabelaCorpo = document.getElementById(`${cartaoId}-tabela-corpo`);

    const novaLinha = document.createElement('tr');
    novaLinha.innerHTML = `
        <td><input type="text" placeholder="Descrição" class="descricao-input"></td>
        <td><input placeholder="Valor" class="valor-input" data-valor="" onblur="formatarMoeda(this, '${cartaoId}')" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="number" placeholder="Parcela" class="parcela-input" value=1></td>
        <td><input placeholder="Valor Restante" class="valor-total" disabled data-valor=""></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}
    

    const valorInput = novaLinha.querySelector('.valor-input');
    const dataInput = novaLinha.querySelector('.data-input');
    const parcelaInput = novaLinha.querySelector('.parcela-input');
    const valorTotalInput = novaLinha.querySelector('.valor-total');

    valorInput.addEventListener('input', () => atualizarValorTotal(valorInput, dataInput, parcelaInput, valorTotalInput, cartaoId));
    dataInput.addEventListener('input', () => atualizarValorTotal(valorInput, dataInput, parcelaInput, valorTotalInput, cartaoId));
    parcelaInput.addEventListener('input', () => atualizarValorTotal(valorInput, dataInput, parcelaInput, valorTotalInput, cartaoId));

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
        limiteDisponivel(cartaoId);
        atualizarFaturaCartao(cartaoId)
    });

}

function atualizarValorTotal(valorInput, dataInput, parcelaInput, valorTotalInput, cartaoId, ) {
    const valor = parseFloat(valorInput.getAttribute('data-valor')) || 0;
    let parcela = parseInt(parcelaInput.value) || 0;
    const diaVencimento = document.getElementById(`${cartaoId}-dia-vencimento`).value;

    if (dataInput.value) {
        const [anoData, mesData, diaData] = dataInput.value.split('-').map(Number);
        const mesDataAtual = new Date().getMonth() + 1;
        const anoDataAtual = new Date().getFullYear();
        const a = mesDataAtual + (anoDataAtual * 12);
        const b = mesData + (anoData * 12);

        if (parseInt(diaData) > parseInt(diaVencimento) && mesData > mesDataAtual) {parcela += 1}
        var result = valor * (parcela - (a - b));
        if (result < 0) { result = 0 }
        const valorTotal = result;
        valorTotalInput.value = formatarMoeda_resultado(result);
        valorTotalInput.setAttribute('data-valor', valorTotal);
    } else {
        valorTotalInput.value = '';
    }
    limiteDisponivel(cartaoId)
    atualizarFaturaCartao(cartaoId)
}

function atualizarFaturaCartao(cartaoId) {
  var tabela = document.querySelector(`#${cartaoId}-tabela-corpo`); // Seleciona a tabela correta
  var linhas = tabela.querySelectorAll('tr'); // Seleciona todas as linhas
  let total = 0;
  
  for (let i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    let dataInicial = new Date(linha.cells[2].querySelector('.data-input').value); // Acessando a célula correta
    let valor = parseFloat(linha.cells[1].querySelector('.valor-input').getAttribute('data-valor')) || 0;
    let parcela = parseInt(linha.cells[3].querySelector('.parcela-input').value, 10) || 0;
    var dataAtual = new Date();
    var diaVencimento = parseInt(document.querySelector(`#${cartaoId}-dia-vencimento`).value);
    
    let valorDataInical = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
    let valorDataAtual = dataAtual.getFullYear() * 12 + dataAtual.getMonth();
    
    if (dataInicial.getDate() === 1) { // Corrigindo a chamada da função
      parcela += 1;
    }
    if (dataInicial.getDate()+1 > diaVencimento){
      parcela += 1;
      if (valorDataInical === valorDataAtual || valorDataInical > valorDataAtual) {parcela = -1}
    }
    let valorDataFinal;
    
    if (parcela === -1) {valorDataFinal = 0}
    else {
      let dataFinal = new Date(dataInicial);
      dataFinal.setMonth(dataFinal.getMonth() + parcela);
      let valorDataFinal = dataFinal.getFullYear() * 12 + dataFinal.getMonth();

      if (valorDataFinal > valorDataAtual) {
        total += valor;
      }
    }
    
  }
  var inputFatura = document.querySelector(`#${cartaoId}-fatura`);
  valorFaturaAtual = inputFatura.getAttribute('data-valor');
  if (parseFloat(valorFaturaAtual) === total){return};
  inputFatura.setAttribute('data-valor', parseFloat(total.toFixed(2)));
  inputFatura.value = formatarMoeda_resultado(total);
  atualizarFaturaCartaoTotal();
}

function atualizarFaturaCartaoTotal() {
  var faturas = document.querySelectorAll(".faturaCartao");
  let total = 0;
  
  for (n = 0; n < faturas.length; n++) {
    let valor = parseFloat(faturas[n].getAttribute('data-valor')) || 0;
    total += valor;
  }
  var inputFaturaTotal = document.querySelector(`#totalFatura`);
  inputFaturaTotal.setAttribute('data-valor', parseFloat(total.toFixed(2)));
  inputFaturaTotal.textContent = formatarMoeda_resultado(total);
}

function atualizarTotalTabela(idTabela, idTotal) {
  var tabela = document.querySelector(idTabela); // Seleciona a tabela correta
  var linhas = tabela.querySelectorAll('tr'); // Seleciona todas as linhas
  let total = 0;
  
  for (let i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    let partesData = (linha.cells[2].querySelector('.data-input').value).split('-');
    let dataInicial = new Date(partesData[0], parseInt(partesData[1]) -1, 5);
    let valor = parseFloat(linha.cells[1].querySelector('.valor-input').getAttribute('data-valor')) || 0;
    let parcela = parseInt(linha.cells[3].querySelector('.parcela-input').value, 10) || 0;
    var dataAtual = new Date();
    let valorDataInical = dataInicial.getFullYear() * 12 + dataInicial.getMonth();
    let valorDataAtual = dataAtual.getFullYear() * 12 + dataAtual.getMonth();
    
    if (dataInicial.getDate() === 1) { // Corrigindo a chamada da função
      parcela += 1;
    }
    if (valorDataInical > valorDataAtual) {parcela = -1}
    
    let valorDataFinal;
    if (parcela === -1) {valorDataFinal = 0}
    else {
      let dataFinal = new Date(dataInicial);
      dataFinal.setMonth(dataFinal.getMonth() + parcela);
      let valorDataFinal = dataFinal.getFullYear() * 12 + dataFinal.getMonth();
      if (valorDataFinal > valorDataAtual) {
        total += valor;
      }
    }
  }
  var inputTotal = document.querySelector(idTotal);
  inputTotal.setAttribute('data-valor', parseFloat(total.toFixed(2)));
  inputTotal.textContent = formatarMoeda_resultado(total);
}


function formatarMoeda(input, cartaoId) {
    let valor = input.value;

    valor = valor.replace(/[^\d,]/g, '');
    valor = valor.replace(",", ".");
    let _valor = parseFloat(valor).toFixed(2);
    valor = formatarResultado(_valor.toString(), 2);

    if (valor === 'NaN,00') {valor = '0,00'}
    let valordado = valor.replace('.', '');
    input.setAttribute('data-valor', valordado.replace(',', '.'));
    input.value = `R$ ${valor}`;

    if (cartaoId == -1) {
        atualizarTodosValoresDiversos()
    } else if (cartaoId == -2) {
        atualizarTodosValoresReceitas()
    } else if (cartaoId != 0) {
        limiteDisponivel(cartaoId);
        // Atualizar valores total e limite disponível após formatação
        setTimeout(() => {
            limiteDisponivel(cartaoId);
            atualizarTodosValores(cartaoId);
        }, 0);
    }
}

function formatarMoeda_resultado(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function atualizarTodosValores(cartaoId) {
    const linhaInputs = document.querySelectorAll(`#${cartaoId}-tabela-corpo .valor-input, #${cartaoId}-tabela-corpo .data-input, #${cartaoId}-tabela-corpo .parcela-input`);
    linhaInputs.forEach(input => {
        const tr = input.closest('tr');
        const valorInput = tr.querySelector('.valor-input');
        const dataInput = tr.querySelector('.data-input');
        const parcelaInput = tr.querySelector('.parcela-input');
        const valorTotalInput = tr.querySelector('.valor-total');
        atualizarValorTotal(valorInput, dataInput, parcelaInput, valorTotalInput, cartaoId);
    });
}

function atualizarTodosValoresDiversos() {
    const linhaInputs = document.querySelectorAll(`#diversos-tabela-corpo .valor-input, #diversos-tabela-corpo .data-input, #diversos-tabela-corpo .parcela-input`);
    linhaInputs.forEach(input => {
        const tr = input.closest('tr');
        const valorInput = tr.querySelector('.valor-input');
        const dataInput = tr.querySelector('.data-input');
        const parcelaInput = tr.querySelector('.parcela-input');
        const valorTotalInput = tr.querySelector('.valor-total');
        atualizarTotalDiversos(valorInput, dataInput, parcelaInput, valorTotalInput);
    });
}

function limiteDisponivel(cartaoId) {
    const limiteInput = document.getElementById(`${cartaoId}-limite`);
    const disponivelInput = document.getElementById(`${cartaoId}-disponivel`);
    const valorTotalInputs = document.querySelectorAll(`#${cartaoId} .valor-total`);

    const limite = parseFloat(limiteInput.getAttribute('data-valor')) || 0;
    let somaValoresTotais = 0;

    valorTotalInputs.forEach(input => {
        const valorTotal = parseFloat(input.getAttribute('data-valor')) || 0;
        somaValoresTotais += valorTotal;
    });
    // Calcular o limite disponível
    const limiteDisponivel = limite - somaValoresTotais;

    // Formatar o limite disponível com duas casas decimais
    const limiteDisponivelFormatado = parseFloat(limiteDisponivel).toFixed(2);
    
    // Atualizar o valor do input de disponível
    disponivelInput.value = `R$ ${formatarResultado(limiteDisponivelFormatado.toString(), 2)}`;
}

function apagarCartao(cartaoId) {
    const divCartoes = document.getElementById('cartoes-container');
    const cartao = document.getElementById(cartaoId);
    if (cartao) {
        divCartoes.removeChild(cartao);
    }
}

function mostraCalculadora() {
    var topPanel = document.getElementById('topPanel');
    var paginaPrincipal = document.getElementById('paginaPrincipal');
    var paginaCalculadora = document.getElementById('paginaCalculadora');
    var expressao = document.getElementById('expressao');

    // Verifica se a calculadora está visível
    if (topPanel.style.height === "10%") {
        // Ocultar a calculadora e expandir a página principal
        topPanel.style.height = "0";
        paginaCalculadora.classList.add('hidden');
        expressao.classList.add('hidden');
    } else {
        // Mostrar a calculadora e ajustar as alturas
        topPanel.style.height = "10%";
        paginaCalculadora.classList.remove('hidden');
        expressao.classList.remove('hidden');
    }
}

function toggleMenu() {
    var leftPanel = document.getElementById('leftPanel');
    var rightPanel = document.getElementById('rightPanel');
    var iconPanel = document.getElementById('iconPanel');
    var menu = document.getElementById('menu');
    var btnmenu = document.getElementById('menuButton');

    if (leftPanel.style.width === "30%") {
        // Ocultar o menu e mostrar os ícones

        leftPanel.style.width = "0%";
        leftPanel.style.display = 'none'
        rightPanel.style.width = "100%";
        rightPanel.style.marginLeft = "0";
        menu.classList.add('hidden');
        btnmenu.classList.remove('hidden');
        // Remover a classe 'hidden' de todos os botões com a classe 'icon'
        document.querySelectorAll('.icon').forEach(function(button) {
            button.classList.remove('hidden');
        });
    } else {
        // Mostrar o menu e ocultar os ícones
        leftPanel.style.width = "30%";
        leftPanel.style.display = 'block';
        rightPanel.style.width = "70%";
        menu.classList.remove('hidden');
        btnmenu.classList.add('hidden');
        // Adicionar a classe 'hidden' a todos os botões com a classe 'icon'
        document.querySelectorAll('.icon').forEach(function(button) {
            button.classList.add('hidden');
        });
    }
}


mostrarIconer()
function mostrarIconer(icone) {
    document.querySelectorAll('.paginaPrincipal > div').forEach(function(div) {
        if (div.classList.contains(icone)) {
            div.classList.remove('hidden');
            div.style.width = '100%';
            div.style.height = '100%'; // Ajusta a altura para ocupar 100% do espaço
        } else {
            div.classList.add('hidden');
            div.style.width = ''; // Reseta a largura
            div.style.height = ''; // Reseta a altura
        }
    });
}


let ultimosCaracteres = ['', ''];
let tamanhoExpressao = 0;

let numeroCasasDecimais = 2;
let numeroCasasDecimaisAterior;

let calculoEmDataHoraQtd = 0;
let contaData = 0;

document.getElementById('expressao').addEventListener('input', function() {
    let expressao = this.value;
    var cursor = this.selectionStart;

    if (tamanhoExpressao < expressao.length){
        ultimosCaracteres = [];
        ultimosCaracteres.push(expressao.substring(cursor - 3, cursor-2));
        ultimosCaracteres.push(expressao.substring(cursor - 2, cursor-1));
        ultimosCaracteres.push(expressao.substring(cursor - 1, cursor));

        if (ultimosCaracteres[1] === '=' && ultimosCaracteres[2] === ' ') {
            calcular();
        } else if(ultimosCaracteres[0] === '=' && ultimosCaracteres[1] === ' ' && ultimosCaracteres[2] === '\n'){
            this.setSelectionRange(cursor-1, cursor-1);
            calcular();
        }
    }
    tamanhoExpressao = expressao.length;
});

function formatarCalculo(texto='') {
    texto = pontoParaVirgula(texto);
    var calculoEmHora = false;
    var calculoEmData = false;
    var calculoEmDataHora = false;
    calculoEmDataHoraQtd = 0;
    contaData = 0;
    let base = texto;
    let resultado = '';
    let partes = texto.split(' ');
    partes.forEach(function (parte, index) {
        let numero;
        let contadorBarras = (parte.match(/\//g) || []).length;
        let contadorDoisPontos = 0;
        if (parte.includes(":")) { contadorDoisPontos = 1;}

        if (contadorBarras == 2 && contadorDoisPontos == 1 && parte.includes("-")){
            calculoEmDataHora = true;
            texto = DataHoraParaSegudos(parte);
            calculoEmDataHoraQtd ++;
        } else if (parte.includes('%')) {
            numero = parte.replace('%', '');
            if (parte.includes('-') || parte.includes('+')) {
                texto = '/ 100 * (100 + ' + numero + ')';
            } else if (parte.includes('*')) {
                texto = '** 2 / 100 * ' + numero.replace('*', '');
            } else if (parte.includes('/')) {
                texto = '* 0 + 100 / ' + numero.replace('/', '');
            } else {
                texto = '/ 100 * ' + numero;
            }
        } else if (parte.includes('^')) {
            if (parte == '^'){
                texto = ' ** ';
            } else {
                numero = parseFloat(parte.replace('^', ''));
                texto = " ** " + numero;
            }
        } else if (parte.includes('!')){
            texto = calculoFatorial(parte.replace("!", ""));
        } else if (parte.includes(":")){
            calculoEmHora = true;
            texto = tempoParaSegundo(parte);
        } else if (contadorBarras == 2){
            if (calculoEmDataHora) {
                texto = DataHoraParaSegudos(`${parte}-00:00:00`);
                calculoEmDataHoraQtd ++;
            } else {
                texto = dataParaDia(parte);
                contaData ++;
                calculoEmData = true;
            }
        } else {
            texto = parte;
        }
        partes[index] = texto;
    });

    resultado = eval(partes.join(' '));
    if (calculoEmDataHora){
        return SegundosParaDataHora(resultado.toString());
    } else if (calculoEmData) {
        if (contaData == 1){ return diasParaData(resultado);}
        else {
            resultado = parseFloat(resultado).toFixed(numeroCasasDecimais);
            return formatarResultado(resultado, 2);
        }
    } else if (calculoEmHora) {
        return segundosParaTempo(resultado.toString());
    } else {
        resultado = parseFloat(resultado).toFixed(numeroCasasDecimais);
        return formatarResultado(resultado, 2);
    }
}

function calculoFatorial(numero=0){
    let total = 1;
    try{
        let fator = parseInt(numero);
        for (n = 0; n < fator; n++){
            total = total * (fator - n);
        }
    } catch (e){
        total = 0
    }
    return total.toString();
}

function dataParaDia(data) {
    var referencia = new Date(1900, 0, 1);
    var partes = data.split("/");
    var dataCompleta = new Date(parseInt(partes[2]), (parseInt(partes[1] - 1)), parseInt(partes[0]));
    var resultado = dataCompleta.getTime() - referencia.getTime();
    resultado = Math.round(resultado / (1000 * 60 * 60 * 24));
    return resultado;
}

function diasParaData(dias) {
    var referencia = new Date(1900, 0, 1);
    referencia.setDate(referencia.getDate() + parseInt(dias));
    var resultado = `${referencia.getDate().toString().padStart(2, '0')}/${(referencia.getMonth()+1).toString().padStart(2, '0')}/${referencia.getFullYear().toString().padStart(4, '0')}`;
    return resultado;
}


function pontoParaVirgula(texto){
    var resultado = '';
    for (t = 0; t < texto.length; t++){
        if (texto[t] != '.'){
            if (texto[t] == ','){
                resultado += '.';
            } else{
                resultado += texto[t];
            }
        }
    }
    return resultado;
}

function formatarResultado(texto, numeroCasasDecimais) {
    // garante número
    let numero = Number(texto);

    // fixa casas decimais
    let base = numero.toFixed(numeroCasasDecimais);

    let partes = base.split(".");
    let resultado = "";

    let antes = partes[0].replace("-", "").split("").reverse().join("");

    // adiciona separador de milhar
    for (let t = 0; t < antes.length; t++) {
        if (t > 0 && t % 3 === 0) {
            resultado += ".";
        }
        resultado += antes[t];
    }

    resultado = resultado.split("").reverse().join("");

    // recoloca sinal negativo se existir
    if (numero < 0) {
        resultado = "-" + resultado;
    }

    // parte decimal sempre com tamanho correto
    if (numeroCasasDecimais > 0) {
        resultado += "," + partes[1];
    }

    return resultado;
}


function DataHoraParaSegudos (base){
    let partes = base.split("-");

    // data
    var referencia = new Date(1900, 0, 1);
    var partesData = partes[0].split("/");
    var dataCompleta = new Date(parseInt(partesData[2]), (parseInt(partesData[1] - 1)), parseInt(partesData[0]));
    var resultado = dataCompleta.getTime() - referencia.getTime();
    var dias = Math.round(resultado / (1000 * 60 * 60 * 24));

    // hora
    var segundos = parseInt(tempoParaSegundo(partes[1]), 10);

    // total
    var horasDias = (dias * 24).toString();
    horasDias = horasDias + ":00:00";
    horasDias = tempoParaSegundo((horasDias));
    var resultado = parseInt(segundos, 10) + parseInt(horasDias, 10);
    return resultado.toString();
}

function SegundosParaDataHora (tempo){
    let segundos = 0;
    if (tempo.includes(".")){
        var partes = tempo.split(".");
        segundos = parseInt(partes[0]);
    } else {
        segundos = parseInt(tempo);
    }
    let resultado = '';

    // valores
    let hora = Math.floor(segundos / 3600);
    let minuto = Math.floor((segundos - 3600 * hora) / 60);
    let segundo = segundos - 3600 * hora - 60 * minuto;
    let dias = Math.floor(hora / 24);

    // resultado
    if (calculoEmDataHoraQtd == 1) { // retorna data com hora
        hora = hora - dias * 24;
        var referencia = new Date(1900, 0, 1);
        referencia.setDate(referencia.getDate() + dias);
        resultado += `${referencia.getDate().toString().padStart(2, '0')}/${(referencia.getMonth()+1).toString().padStart(2, '0')}/${referencia.getFullYear().toString().padStart(4, '0')}`;
        resultado += `-${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`;
    } else if (calculoEmDataHoraQtd > 1) { // retorna hora com dias
        resultado += `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`;
        let textoDias = '';
        if (dias > 0){
            if (dias == 1){ textoDias = "Dia";} else { textoDias = "Dias"}
            hora_ = hora - 24 * dias;
            resultado += ` || ${dias} ${textoDias} e ${hora_.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`;
        }
    }
    return resultado;
}

function tempoParaSegundo(tempo=''){
    var horaCompleta = "00:00:00" + tempo;
    let segundos = 0;
    let partes = horaCompleta.split(":").reverse();
    for (p = 0; p < partes.length; p++){
        if (p == 0){
            segundos += parseInt(partes[p]);
        } else {
            segundos += parseInt(partes[p]) * 60 ** p;
        }
    }
    return segundos.toString();
}

function segundosParaTempo(tempo=''){
    let segundos = 0;
    if (tempo.includes(".")){
        var partes = tempo.split(".");
        segundos = parseInt(partes[0]);
    } else {
        segundos = parseInt(tempo);
    }
    let resultado = '';

    if (segundos < 0){
        segundos = segundos *-1;
        resultado += '-';
    }

    let hora = Math.floor(segundos / 3600);
    let minuto = Math.floor((segundos - 3600 * hora) / 60);
    let segundo = segundos - 3600 * hora - 60 * minuto;
    resultado += `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`;
    if (hora > 24){
        let dia = Math.floor(hora / 24);
        let horaFomatada = hora - 24 * dia;
        resultado += ` || ${dia.toString()} dias e ${horaFomatada.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:${segundo.toString().padStart(2, '0')}`;
    }
    return String(resultado);
}

function calcular() {
    var campoExpressao = document.getElementById('expressao');
    var texto = campoExpressao.value;
    var posicaoCursor = campoExpressao.selectionStart;

    var inicioLinha = texto.lastIndexOf('\n', posicaoCursor - 1) + 1; 
    var expressaoCompleta = texto.substring(inicioLinha, posicaoCursor - 2);
    var resultado;

    var expressaoValida = [];
    var _;
    var expressaoEmPartes = expressaoCompleta.split("").reverse();
    
    for (nParte = 0; nParte < expressaoEmPartes.length; nParte++){
        _ = expressaoEmPartes[nParte];
        if (_ == "="){
            break;
        }
        expressaoValida.push(_);
    }

    try {
        expressaoValida = expressaoValida.reverse().join("");
        resultado = formatarCalculo(expressaoValida);

        if (resultado !== undefined) {
            resultado = String(resultado);
            var textoAtualizado = texto.substring(0, posicaoCursor) + resultado + texto.substring(posicaoCursor);
            campoExpressao.value = textoAtualizado;
            var novaPosicaoCursor = posicaoCursor + resultado.toString().length;
            campoExpressao.setSelectionRange(novaPosicaoCursor, novaPosicaoCursor);
        }
    } catch (e) {
    }
    
}
let anoAtual = new Date().getFullYear();
document.getElementById("anoAltenativo1").value = anoAtual;
document.getElementById("anoAltenativo2").value = anoAtual;
 document.getElementById(`anoInicial`).value = anoAtual;
 document.getElementById(`anoFinal`).value = anoAtual;
document.querySelector('#mesAltenativo2').selectedIndex = 1;

function limparFiltroBoletimAltenativo(){
  var descricao = document.querySelector('.filtroBoletinsDescricaoAltenativo');
  descricao.value = '';
  var tipo = document.querySelector('.filtroBoletinsTipoAltenativo');
  tipo.selectedIndex = 0;
  removerLinhaTotalBoletimFiltro();
}


function funcaoBoletimAltenativo(){
  boletimFuncaoAltenativoSelecao('Altenativo1', '#boletim1-altenativo', 1);
  boletimFuncaoAltenativoSelecao('Altenativo2', '#boletim2-altenativo', 2);
  boletimFuncaoAltenativoSelecaoGeral();
  barraFiltroBoletinsAltenativo.forcarAtualizacao();
  mostrarIconer('Icone10');
  iniciarOrdenacaoPlanilhas();
}

function boletimFuncaoAltenativoSelecaoGeral(idMesAno, idBoletim) {
  let mes = document.getElementById(`mesInicial`).value;
  let anoInput = document.getElementById(`anoInicial`).value;
  let ano = anoInput ? anoInput : anoAtual;
  
  let mesfinal = document.getElementById(`mesFinal`).value;
  let anoInputFinal = document.getElementById(`anoFinal`).value;
  let anoFinal = anoInputFinal ? anoInputFinal : anoAtual;

  let data = new Date(ano, mes, 1);
  let dataFinal = new Date(anoFinal, mesfinal, 1);
  if (dataFinal < data) {return}
  else {
    let diferencia = (dataFinal.getFullYear() * 12 + dataFinal.getMonth()) - (data.getFullYear() * 12 + data.getMonth())+1;
    boletimFuncaoAltenativo(data, '#boletim3-altenativo', 3, true, diferencia)
  }
  barraFiltroBoletinsAltenativo.forcarAtualizacao();
  iniciarOrdenacaoPlanilhas();
}

function boletimFuncaoAltenativoSelecao(idMesAno, idBoletim, cBoletim) {
  let mes = document.getElementById(`mes${idMesAno}`).value;
  let anoInput = document.getElementById(`ano${idMesAno}`).value;
  let ano = anoInput ? anoInput : anoAtual;

  let data = new Date(ano, mes, 1);
  boletimFuncaoAltenativo(data, idBoletim, cBoletim)
  barraFiltroBoletinsAltenativo.forcarAtualizacao();
}

function boletimFuncaoAltenativo(data, idBoletim, cBoletim, boletinsGeral=false, qtdeMes=12) {
    dicionarioReceitas = atualizarDadosReceitas();
    dicionarioCartoes = atualizarDadosCartoes();
    dicionarioDiversos = atualizarDadosDiversos();
    dicionarioCofrinho = criarDicionarioCofrinho();
    dicionarioAcoes = criarDicionarioAcao();
    dicionarioProventosAcoes = criarDicionarioProventosAcoes();
    dicionarioMoedas = criarDicionarioMoedas();
    let dataHoje = data;
    if (isNaN(dataHoje.getTime())) {
        dataHoje = new Date(); // Se a data for inválida, assume a data atual
    }
    
    dicionarioValoresMensaisCartoes_ = calcularValoresMensais(dicionarioReceitas, dicionarioCartoes, dicionarioDiversos, dicionarioCofrinho, dicionarioAcoes, dicionarioProventosAcoes, dicionarioMoedas, dataHoje, qtdeMes);
    let contadorBoletim = cBoletim;
    let mesDataAtual = dataHoje.getMonth();
    let anoDataAtual = dataHoje.getFullYear();
    let dataFinal = new Date(dataHoje);
    dataFinal.setMonth(dataFinal.getMonth() + qtdeMes-1);
    const boletim = document.querySelector(idBoletim);
    
  
    // Limpar o conteúdo da div .boletim
    while (boletim.firstChild) {
        boletim.removeChild(boletim.firstChild);
    }
    let nomeDoMes = '';
    if (!boletinsGeral) {nomeDoMes = nomeMes(mesDataAtual, anoDataAtual);}
    else {nomeDoMes = `${nomeMes(mesDataAtual, anoDataAtual)} até ${nomeMes(dataFinal.getMonth(), dataFinal.getFullYear())}`}
    

    // Criação do elemento <h1> com o nome do mês
    let h1 = document.createElement("h1");
    h1.style.margin = "0";
    h1.style.padding = "0";
    h1.textContent = nomeDoMes;

    let h3Eentradas = document.createElement("h3");
    h3Eentradas.textContent = 'Entradas: '
    h3Eentradas.className = 'boletim-mensal-totais'
    let labelEntradas = document.createElement('label');
    labelEntradas.id = `boletim-Entradas-${contadorBoletim}-altenativo`

    let h3Saidas = document.createElement("h3");
    h3Saidas.textContent = 'Saidas: '
    h3Saidas.className = 'boletim-mensal-totais'
    let labelSaidas = document.createElement('label');
    labelSaidas.id = `boletim-Saidas-${contadorBoletim}-altenativo`

    let h3Saldo = document.createElement("h3");
    h3Saldo.textContent = 'Saldo: '
    h3Saldo.className = 'boletim-mensal-totais'
    let labelSaldo = document.createElement('label');
    labelSaldo.id = `boletim-Saldo-${contadorBoletim}-altenativo`

    // Adicionar o <h1> dentro da div .boletim
    boletim.appendChild(h1);
    boletim.appendChild(h3Eentradas);
    h3Eentradas.appendChild(labelEntradas);
    boletim.appendChild(h3Saidas);
    h3Saidas.appendChild(labelSaidas);
    boletim.appendChild(h3Saldo);
    h3Saldo.appendChild(labelSaldo);

    // Criação da tabela
    let table = document.createElement("table");

    // Criação do thead
    let thead = document.createElement("thead");
    let trHead = document.createElement("tr");

    // Colunas do cabeçalho
    ["Descrição", "Valor", "Dia", "Saldo"].forEach(text => {
        let th = document.createElement("th");
        th.textContent = text;
        if (text === 'Saldo'){
            th.className = 'boletim-mensal-saldo';
          }
        trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Criação do tbody
    let tbody = document.createElement("tbody");
    tbody.id = `boletim-${contadorBoletim}-Altenativo`;
    table.appendChild(tbody);

    // Adicionar a tabela dentro da div .boletim
    boletim.appendChild(table);

    // Adicionar as linhas nas tabelas
    saldoAnterior = 0
    if (!boletinsGeral){
      adicionarLinhasTabelaBoletim(dicionarioValoresMensaisCartoes_[1], `boletim-${contadorBoletim}-Altenativo`, contadorBoletim, false)
    } else {
      adicionarLinhasTabelaBoletimAlternativo(dicionarioValoresMensaisCartoes_, `boletim-${contadorBoletim}-Altenativo`, contadorBoletim, false); 
    }
}

function adicionarLinhasTabelaBoletimAlternativo(dadosMeses, idTbody, id, saldoStatus=true) {
  // Encontrar o elemento tbody usando o ID fornecido
  const tbody = document.getElementById(idTbody);

  // Verifique se o tbody foi encontrado
  if (!tbody) {
      console.error(`tbody com ID '${idTbody}' não encontrado.`);
      return; // Se o tbody não for encontrado, saia da função
  }

  let saldo = 0;
  let entradas = 0;
  let saidas = 0;
  let saldo_doMes = 0;

  

  for (const [rendKey, dados] of Object.entries(dadosMeses)) {
    let totalCofrinho = calcularTotalAplicadoCofrinho(new Date(dados.data));
    // Itera de 1 a 31
    for (let dia = 1; dia <= 31; dia++) {
        // Verifica se o dia está presente nos dados
        for (const chave in dados) {
          if (dados[chave].dia === dia) {
            const descricao = dados[chave].descricao;
            const valor = dados[chave].valor;

            if (valor > 0) {entradas += valor}
            else {saidas += valor}

            // Formata o valor
            let _valor = parseFloat(valor).toFixed(2);
            _valor = formatarResultado(_valor.toString(), 2);

            // Atualiza o saldo
            saldo += valor;
            let saldoFormatado = parseFloat(saldo).toFixed(2);
            saldoFormatado = formatarResultado(saldoFormatado, 2)

            // Cria uma nova linha
            const novaLinha = document.createElement('tr');
            if (dados[chave].tipo === 'boletim-mensal-cofrinho'){
              totalCofrinho += valor*-1;
              novaLinha.title = `Total Aplicado: ${formatarMoeda_resultado(totalCofrinho)}`;
              dados[chave].explicacao = `Total Aplicado: ${formatarMoeda_resultado(totalCofrinho)}`;
            } else {
              novaLinha.title = dados[chave].explicacao;
            }
            novaLinha.style.backgroundColor = dados[chave].movimentacao === 'entrada' 
                ? 'rgba(211, 249, 216, 0.5)' // verde claro, 50% transparente
                : 'rgba(249, 211, 211, 0.5)'; // vermelho claro, 50% transparente    
            novaLinha.style.color = 'black';  // Cor do texto 
            if (saldoStatus){
              novaLinha.setAttribute('numeroBoletim', id);
              novaLinha.className = `${dados[chave].tipo} boletim-mensal-Descricao-Item`;
            } else {
              novaLinha.setAttribute('numeroBoletim', id + 12);
              novaLinha.className = `${dados[chave].tipo}-altenativo boletim-mensal-Descricao-Item-altenativo`;
              novaLinha.setAttribute('movimentacao', `movimentacao-${dados[chave].movimentacao}-altenativo`);
            }

            novaLinha.setAttribute('valorLinha', valor);
            novaLinha.innerHTML = `
                <td><label style="width: 200px;" data-valor="${descricao}">${descricao}</label></td>
                <td><label data-valor="${valor}" style="width: 85px;">R$ ${_valor}</label></td>
                <td><label style="width: 200px;" data-valor="${dados[chave].data}">${dados[chave].data}</label></td>
                <td class='boletim-mensal-saldo' data-valor="${saldoFormatado}"><label>R$ ${saldoFormatado}</label></td>
            `;

            novaLinha.addEventListener('click', () => {
              notificacaoExplicacaoLinha(dados[chave].explicacao);
            });

            // Adiciona a nova linha ao tbody
            tbody.appendChild(novaLinha);
        }
      }        
    }
  }
  saldo_doMes = entradas + saidas;
  if (saldoStatus) {
    atualizarValorTotalBoletim(`#boletim-Entradas-${id}`, entradas);
    atualizarValorTotalBoletim(`#boletim-Saidas-${id}`, saidas*-1);
    atualizarValorTotalBoletim(`#boletim-Saldo-${id}`, saldo_doMes);
  } else {
    atualizarValorTotalBoletim(`#boletim-Entradas-${id}-altenativo`, entradas);
    atualizarValorTotalBoletim(`#boletim-Saidas-${id}-altenativo`, saidas*-1);
    atualizarValorTotalBoletim(`#boletim-Saldo-${id}-altenativo`, saldo_doMes);
  }
}

function ordenarMovimentacoesCofrinho() {
  dicionarioCofrinho = criarDicionarioCofrinho();
  let dicionario = {};
  
  let chave = ''; let chave_ = '';
  let dataAtual = new Date();
  for (const [rendKey, dados] of Object.entries(dicionarioCofrinho)) {
    if (rendKey === '0') continue;
    
    if (dados.movimentacao != 'rendimento') {
      
      chave = `Movimentacao${dados.movimentacao};Codigo${dados.codigo}`;
      let qtde = parseInt(dados.qde);

      let [anoData, mesData, diaData] = dados.data.split('-').map(Number);
      let data = new Date(anoData, mesData, 5);

      let movimentacao = {};
      for (let c = 1; c < qtde+1; c++){
        chave_ = nomeMes(data.getMonth()-1, data.getFullYear());
        let valor = dados.movimentacao === 'depositar' ? dados.valor*1 : dados.valor*-1;
        movimentacao[c] = {
          cahve: chave_,
          data: `${data.getFullYear()}-${data.getMonth()}-08`,
          valor: valor,
        }
        data.setMonth(data.getMonth() +1);
      }
      dicionario[chave] = movimentacao;
    }
  }
  return dicionario;
}

function calcularTotalAplicadoCofrinho(data){
  const hoje = data;
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  let dadosCofrinhoOrdenado = ordenarMovimentacoesCofrinho();
  
  let totalCofrinho = 0;
  let dataParaCalculo = new Date(anoAtual, mesAtual, 15);
  for (const [rendKey, dados] of Object.entries(dadosCofrinhoOrdenado)) {
    for (const [rendKey, movimentacao] of Object.entries(dados)) {
      if (dataParaCalculo > new Date(movimentacao.data)){
        totalCofrinho += movimentacao.valor;
      } else {
        break
      }
    }
  }
  return totalCofrinho;
}
