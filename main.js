const form = document.getElementById('form-gasto')
const gastos = []
let idEditando = null
const dadosSalvos = localStorage.getItem('gastos');

if (dadosSalvos) {
    try {
    const listaSalva = JSON.parse(dadosSalvos);
    listaSalva.forEach(g => gastos.push(g));
    } catch (e) {
    console.error('Erro ao carregar dados', e);
    }
}


function atualizarTotal() {
    const total = gastos.reduce(function(soma, gasto) {
    return soma + gasto.valor
    }, 0)

    document.getElementById('total').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
}

function excluir(id) {
    const index = gastos.findIndex(function(gasto) {
    return gasto.id === id
    })

    if (index !== -1) {
    gastos.splice(index, 1)
    }

    renderizar()
}

function editar(id) {
    const gasto = gastos.find(function(g) {
    return g.id === id
    })

    if (!gasto) return

    document.getElementById('descricao').value = gasto.descricao
    document.getElementById('valor').value = gasto.valor
    document.getElementById('categoria').value = gasto.categoria

    const botao = document.querySelector('#form-gasto button[type="submit"]')
    botao.textContent = 'Salvar alteração'

    idEditando = id
    form.classList.add('editando')
}


function renderizar() {
    const lista = document.getElementById('lista-gastos')
    const msgVazia = document.getElementById('msg-vazia')
    lista.innerHTML = ''

    if (gastos.length === 0) {
    msgVazia.style.display = 'block'
    } else {
    msgVazia.style.display = 'none'
    }

    gastos.forEach(function(gasto) {
    const linha = document.createElement('tr')

    if (gasto.valor > 100) {
      linha.classList.add('gasto-alto')
    }

    linha.innerHTML = `
        <td>${gasto.descricao}</td>
        <td>${gasto.categoria}</td>
        <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gasto.valor)}</td>
        <td>
        <button class="btn-editar" data-id="${gasto.id}">Editar</button>
        <button class="btn-excluir" data-id="${gasto.id}">Excluir</button>
        </td>
    `

    lista.appendChild(linha)
    })

    atualizarTotal()
    try {
    localStorage.setItem('gastos', JSON.stringify(gastos));
    } catch (e) {
    console.error('Erro ao salvar no localStorage', e);
    }

}

document.getElementById('lista-gastos').addEventListener('click', function(evento) {
    const id = Number(evento.target.dataset.id)
    if (!id) return
    if (evento.target.classList.contains('btn-excluir')) {
    excluir(id)
    }

    if (evento.target.classList.contains('btn-editar')) {
    editar(id)
    }
})

form.addEventListener('submit', function(evento) {
    evento.preventDefault()

    const descricao = document.getElementById('descricao').value.trim()
    const valor = parseFloat(document.getElementById('valor').value)
    const categoria = document.getElementById('categoria').value

    if (!descricao || isNaN(valor) || valor <= 0) return

    if (idEditando !== null) {
    const index = gastos.findIndex(function(g) {
      return g.id === idEditando
    })

    if (index !== -1) {
        gastos[index].descricao = descricao
        gastos[index].valor = valor
        gastos[index].categoria = categoria
    }

    idEditando = null
    form.classList.remove('editando')

    const botao = document.querySelector('#form-gasto button[type="submit"]')
    botao.textContent = 'Registrar Gasto'

    } else {
    const gasto = {
        id: Date.now(),
        descricao,
        valor,
        categoria
    }

    gastos.push(gasto)
    }

    renderizar();
    form.reset();
})
renderizar(); 

// ========== MELHORIAS ADICIONADAS ==========

// 1. VALIDAÇÃO DE VALOR MÁXIMO (evita valores absurdos)
const inputValor = document.getElementById('valor');
inputValor.addEventListener('change', function() {
    if (this.value > 1000000) {
        alert('Valor muito alto! Considere dividir em múltiplos gastos.');
        this.value = '';
    }
});

// 2. PREVENÇÃO DE GASTOS DUPLICADOS RÁPIDOS (último minuto)
let ultimoRegistro = 0;
const formGasto = document.getElementById('form-gasto');
formGasto.addEventListener('submit', function(e) {
    const agora = Date.now();
    if (agora - ultimoRegistro < 500) {
        e.preventDefault();
        alert('Aguarde um momento antes de registrar outro gasto.');
        return;
    }
    ultimoRegistro = agora;
}, true); // Captura antes do evento principal

// 3. EXPORTAR DADOS PARA CSV (botão será criado dinamicamente)
function exportarParaCSV() {
    if (gastos.length === 0) {
        alert('Nenhum gasto para exportar!');
        return;
    }
    
    let csv = "Descrição,Categoria,Valor (R$)\n";
    gastos.forEach(g => {
        csv += `"${g.descricao}","${g.categoria}",${g.valor.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `gastos_${new Date().toISOString().slice(0,19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Arquivo CSV exportado com sucesso!');
}

// 4. LIMPAR TODOS OS GASTOS (com confirmação)
function limparTodosGastos() {
    if (gastos.length === 0) {
        alert('Não há gastos para limpar.');
        return;
    }
    
    if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os gastos registrados. Continuar?')) {
        gastos.length = 0; // Limpa o array mantendo a referência
        idEditando = null;
        form.classList.remove('editando');
        const botao = document.querySelector('#form-gasto button[type="submit"]');
        botao.textContent = 'Registrar Gasto';
        renderizar();
        alert('Todos os gastos foram removidos!');
    }
}

// 5. RESUMO POR CATEGORIA (estatísticas)
function exibirResumoPorCategoria() {
    const resumo = {};
    gastos.forEach(g => {
        resumo[g.categoria] = (resumo[g.categoria] || 0) + g.valor;
    });
    
    if (Object.keys(resumo).length === 0) {
        alert('Nenhum gasto registrado para gerar resumo.');
        return;
    }
    
    let mensagem = '📊 RESUMO POR CATEGORIA:\n\n';
    for (const [categoria, total] of Object.entries(resumo)) {
        mensagem += `${categoria}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}\n`;
    }
    
    // Ordenar por maior valor
    const categoriasOrdenadas = Object.entries(resumo).sort((a,b) => b[1] - a[1]);
    mensagem += '\n🏆 MAIOR GASTO: ' + categoriasOrdenadas[0][0] + 
                ' (' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(categoriasOrdenadas[0][1]) + ')';
    
    alert(mensagem);
}

// 6. FILTRO POR CATEGORIA (adiciona seletor na interface)
function adicionarFiltroCategoria() {
    const painel = document.querySelector('.painel');
    const totalBox = document.querySelector('.total-box');
    
    const filtroDiv = document.createElement('div');
    filtroDiv.className = 'filtro-container';
    filtroDiv.style.cssText = 'margin-bottom: 15px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;';
    filtroDiv.innerHTML = `
        <label style="font-weight: bold;">Filtrar por categoria:</label>
        <select id="filtro-categoria" style="padding: 6px 10px; border-radius: 4px; border: 1px solid #ddd;">
            <option value="todas">Todas as categorias</option>
            <option value="Habitacao">Habitação</option>
            <option value="Alimentacao">Alimentação</option>
            <option value="Utilidades">Utilidades Domésticas</option>
            <option value="Transporte">Transporte</option>
            <option value="Lazer">Lazer</option>
            <option value="Saude">Saúde</option>
            <option value="Educação">Educação</option>
        </select>
        <button id="btn-filtrar" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Filtrar</button>
        <button id="btn-limpar-filtro" style="padding: 6px 12px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">Limpar Filtro</button>
    `;
    
    totalBox.parentNode.insertBefore(filtroDiv, totalBox.nextSibling);
    
    let gastosFiltrados = [...gastos];
    
    function aplicarFiltro() {
        const categoriaSelecionada = document.getElementById('filtro-categoria').value;
        if (categoriaSelecionada === 'todas') {
            gastosFiltrados = [...gastos];
        } else {
            gastosFiltrados = gastos.filter(g => g.categoria === categoriaSelecionada);
        }
        
        // Re-renderizar com filtro
        const lista = document.getElementById('lista-gastos');
        const msgVazia = document.getElementById('msg-vazia');
        lista.innerHTML = '';
        
        if (gastosFiltrados.length === 0) {
            msgVazia.style.display = 'block';
            msgVazia.textContent = categoriaSelecionada === 'todas' ? 'Nenhum gasto registrado ainda.' : `Nenhum gasto na categoria ${categoriaSelecionada}.`;
        } else {
            msgVazia.style.display = 'none';
            msgVazia.textContent = 'Nenhum gasto registrado ainda.'; // Reset
        }
        
        gastosFiltrados.forEach(function(gasto) {
            const linha = document.createElement('tr');
            if (gasto.valor > 100) {
                linha.classList.add('gasto-alto');
            }
            linha.innerHTML = `
                <td>${gasto.descricao}</td>
                <td>${gasto.categoria}</td>
                <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gasto.valor)}</td>
                <td>
                    <button class="btn-editar" data-id="${gasto.id}">Editar</button>
                    <button class="btn-excluir" data-id="${gasto.id}">Excluir</button>
                </td>
            `;
            lista.appendChild(linha);
        });
        
        // Atualizar total apenas dos itens filtrados
        const totalFiltrado = gastosFiltrados.reduce((soma, g) => soma + g.valor, 0);
        document.getElementById('total').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFiltrado);
    }
    
    document.getElementById('btn-filtrar').addEventListener('click', aplicarFiltro);
    document.getElementById('btn-limpar-filtro').addEventListener('click', () => {
        document.getElementById('filtro-categoria').value = 'todas';
        aplicarFiltro();
    });
    
    // Sobrescrever o renderizar original para manter compatibilidade
    const renderizarOriginal = window.renderizar || renderizar;
    window.renderizarSobrescrito = function() {
        renderizarOriginal();
        const filtroAtual = document.getElementById('filtro-categoria');
        if (filtroAtual && filtroAtual.value !== 'todas') {
            document.getElementById('btn-filtrar').click();
        }
    };
}

// 7. ADICIONAR BOTÕES DE AÇÕES RÁPIDAS
function adicionarBotoesAcoes() {
    const painel = document.querySelector('.painel h2');
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;';
    container.innerHTML = `
        <div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%; justify-content: center; align-items: center; margin-top: 10px;">
        <button id="btn-exportar" style="padding: 8px 15px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">📥 Exportar CSV</button>
        <button id="btn-resumo" style="padding: 8px 15px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer;">📊 Resumo por Categoria</button>
        <button id="btn-limpar-tudo" style="padding: 8px 15px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">🗑️ Limpar Todos</button>
        </div>
    `;
    
    painel.parentNode.appendChild(container);
    
    document.getElementById('btn-exportar').addEventListener('click', exportarParaCSV);
    document.getElementById('btn-resumo').addEventListener('click', exibirResumoPorCategoria);
    document.getElementById('btn-limpar-tudo').addEventListener('click', limparTodosGastos);
}

// 8. VALIDAÇÃO DE INPUT AO VIVO (feedback visual)
inputValor.addEventListener('input', function() {
    if (this.value < 0) this.value = 0;
    if (this.value > 999999) {
        this.style.borderColor = '#f44336';
        setTimeout(() => this.style.borderColor = '#ddd', 2000);
    } else {
        this.style.borderColor = '#ddd';
    }
});

// 9. SHORTCUTS (atalhos de teclado)
document.addEventListener('keydown', function(e) {
    // Ctrl + L = Limpar formulário
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        form.reset();
        if (idEditando !== null) {
            idEditando = null;
            form.classList.remove('editando');
            const botao = document.querySelector('#form-gasto button[type="submit"]');
            botao.textContent = 'Registrar Gasto';
        }
        alert('Formulário limpo!');
    }
    
    // Ctrl + R = Resetar todos os dados (perigoso, com confirmação)
    if (e.ctrlKey && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        if (confirm('ATALHO PERIGOSO: Resetar TODOS os dados? Isso não pode ser desfeito.')) {
            localStorage.removeItem('gastos');
            gastos.length = 0;
            renderizar();
            alert('Todos os dados foram resetados!');
        }
    }
});

// 10. MENSAGEM DE BOAS-VINDAS PERSONALIZADA
function mostrarBoasVindas() {
    const ultimaVisita = localStorage.getItem('ultimaVisita');
    const agora = new Date().toLocaleDateString('pt-BR');
    
    if (!ultimaVisita) {
        setTimeout(() => {
            alert('👋 Bem-vindo ao Personal Finance! Comece registrando seus gastos acima.');
        }, 500);
    } else if (ultimaVisita !== agora) {
        setTimeout(() => {
            console.log(`Sua última visita foi em ${ultimaVisita}`);
        }, 500);
    }
    
    localStorage.setItem('ultimaVisita', agora);
}

// 11. ATUALIZAR TÍTULO DA PÁGINA COM TOTAL GASTO
function atualizarTituloComTotal() {
    const total = gastos.reduce((soma, g) => soma + g.valor, 0);
    const totalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    document.title = `💰 ${totalFormatado} - Personal Finance`;
}

// Sobrescrever o atualizarTotal original para incluir título
const atualizarTotalOriginal = atualizarTotal;
window.atualizarTotalModificado = function() {
    atualizarTotalOriginal();
    atualizarTituloComTotal();
};

// Aplicar as modificações
atualizarTituloComTotal();
mostrarBoasVindas();
adicionarBotoesAcoes();

// Verificar se já existe filtro, se não, adicionar
if (!document.getElementById('filtro-categoria')) {
    adicionarFiltroCategoria();
}

// Substituir a função de renderizar para manter título atualizado
// (preservando a original)
const renderizarBackup = renderizar;
window.renderizar = function() {
    renderizarBackup();
    atualizarTituloComTotal();
};
renderizar(); // Re-renderizar para aplicar

console.log('✅ Melhorias aplicadas com sucesso! Recursos adicionados:');
console.log('- Validação de valores máximos');
console.log('- Prevenção de registros duplicados rápidos');
console.log('- Exportação para CSV');
console.log('- Resumo por categoria');
console.log('- Filtro interativo');
console.log('- Botões de ações rápidas');
console.log('- Atalhos de teclado (Ctrl+L limpa form, Ctrl+Shift+R reset total)');
console.log('- Título dinâmico com total');