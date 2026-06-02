// ⚠️ SUBSTITUA COM A URL DO SEU WEB APP DEPOIS DE PUBLICAR
const API_URL = "https://script.google.com/macros/s/AKfycbyW1AlUlyGCY6kSL6ESZqiPXbtk73Hnb2hzQhzn3Ijl8XPcVlBvXgQoqwayfxaSY7z9/exec"

// Elementos
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const nomeFuncionario = document.getElementById('nome-funcionario');
const codigoFuncionario = document.getElementById('codigo-funcionario');
const dadosContainer = document.getElementById('dados-funcionario');
const totalValue = document.getElementById('total-value');
const logoutBtn = document.getElementById('logout-btn');

// Evento de login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showError('Preencha todos os campos.');
    return;
  }

  try {
    // Usando application/x-www-form-urlencoded para evitar CORS preflight
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const result = await response.json();
    if (result.success) {
      exibirDados(result.data);
      loginContainer.style.display = 'none';
      dashboardContainer.style.display = 'block';
      errorMessage.textContent = '';
    } else {
      showError(result.message || 'Usuário ou senha inválidos.');
    }
  } catch (err) {
    showError('Erro ao conectar com o servidor.');
    console.error(err);
  }
});
// Logout
logoutBtn.addEventListener('click', () => {
  dashboardContainer.style.display = 'none';
  loginContainer.style.display = 'block';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  errorMessage.textContent = '';
});

function showError(msg) {
  errorMessage.textContent = msg;
}

function exibirDados(data) {
  // Cabeçalho
  nomeFuncionario.textContent = data.Nome || '';
  codigoFuncionario.textContent = data.Codigo || '';

  // Limpar dados anteriores
  dadosContainer.innerHTML = '';

  // Agrupamento lógico das informações
  const grupos = [
    {
      titulo: 'Informações Básicas',
      campos: ['Tempo de empresa', 'Base', 'Dias trabalhados', 'dias trab']
    },
    {
      titulo: 'Frequência',
      campos: ['Folgas', 'Atestado', 'Faltas', 'Total faltas atestado']
    },
    {
      titulo: 'Produtividade',
      campos: ['TML', 'PRODUTIVIDADE', 'Tempo médio de liberação / Checklist', 'Tempo em rota (escala) (Experiência)']
    },
    {
      titulo: 'Vales e Ocorrências',
      campos: ['Vales e Atend.', 'Quebra de Caixa', 'Não Haver vales não autorizados', '85% de Entrega no Cliente e Não Haver vales não autorizados', 'Não Haver Falta Injustificada/ Relatos']
    },
    {
      titulo: 'Devoluções',
      campos: ['DEVOLUÇÕES', 'Não haver devolução por responsábilidade própria']
    },
    {
      titulo: 'Vencimentos / Comissões',
      campos: ['HE Ajustadas', '85%', 'Prêmio tempo de empresa sem falta', 'Comissão Caixa', 'DSR', 'DSR HE', 'Quinquenio', 'Prêmio', 'HE']
    }
  ];

  // Construir os grupos dinamicamente
  grupos.forEach(grupo => {
    const divGrupo = document.createElement('div');
    divGrupo.className = 'grupo';
    const h3 = document.createElement('h3');
    h3.textContent = grupo.titulo;
    divGrupo.appendChild(h3);

    grupo.campos.forEach(chave => {
      if (data.hasOwnProperty(chave)) {
        let valor = data[chave];
        if (valor === undefined || valor === null || valor === '') {
          valor = '—';
        } else if (typeof valor === 'string' && valor.includes(',')) {
          // Formato brasileiro: substitui vírgula por ponto para exibição, mas mantém original
          valor = valor; // Já está com vírgula, podemos apenas exibir
        }
        const linha = document.createElement('div');
        linha.className = 'linha';
        linha.innerHTML = `<span class="rotulo">${chave}</span><span class="valor">${valor}</span>`;
        divGrupo.appendChild(linha);
      }
    });

    dadosContainer.appendChild(divGrupo);
  });

  // Total
  totalValue.textContent = data['TOTAL'] ? data['TOTAL'] : '—';
}