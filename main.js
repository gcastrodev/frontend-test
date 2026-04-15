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