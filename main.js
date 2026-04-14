const form = document.getElementById('form-gasto')

form.addEventListener('submit', function(evento) {
  evento.preventDefault()

  const descricao = document.getElementById('descricao').value
  const valor = parseFloat(document.getElementById('valor').value)
  const categoria = document.getElementById('categoria').value

  console.log('Gasto capturado:', descricao, valor, categoria)
})