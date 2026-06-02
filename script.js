// URL do Web App Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyW1AlUlyGCY6kSL6ESZqiPXbtk73Hnb2hzQhzn3Ijl8XPcVlBvXgQoqwayfxaSY7z9/exec";

// =====================
// ELEMENTOS DOM
// =====================
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

const nomeFuncionario = document.getElementById('nome-funcionario');
const codigoFuncionario = document.getElementById('codigo-funcionario');
const dadosContainer = document.getElementById('dados-funcionario');
const totalValue = document.getElementById('total-value');

const logoutBtn = document.getElementById('logout-btn');

// =====================
// LOGIN
// =====================
loginForm.addEventListener('submit', async (e) => {

  e.preventDefault();

  const username =
    document.getElementById('username').value.trim();

  const password =
    document.getElementById('password').value.trim();

  if (!username || !password) {
    showError('Preencha todos os campos.');
    return;
  }

  errorMessage.textContent = '';

  const callbackName =
    'loginCallback_' +
    Date.now() +
    '_' +
    Math.floor(Math.random() * 100000);

  const script = document.createElement('script');

  window[callbackName] = function(result) {

    try {

      if (result && result.success) {

        exibirDados(result.data);

        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';

        errorMessage.textContent = '';

      } else {

        showError(
          result?.message ||
          'Usuário ou senha inválidos.'
        );

      }

    } finally {

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

    }

  };

  script.onerror = function() {

    delete window[callbackName];

    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }

    showError(
      'Não foi possível conectar ao servidor.'
    );

  };

  script.src =
    `${API_URL}` +
    `?username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(password)}` +
    `&callback=${callbackName}`;

  document.body.appendChild(script);

});

// =====================
// LOGOUT
// =====================
logoutBtn.addEventListener('click', () => {

  dashboardContainer.style.display = 'none';
  loginContainer.style.display = 'block';

  document.getElementById('username').value = '';
  document.getElementById('password').value = '';

  errorMessage.textContent = '';

  nomeFuncionario.textContent = '';
  codigoFuncionario.textContent = '';
  totalValue.textContent = '—';

  dadosContainer.innerHTML = '';

});

// =====================
// EXIBIR ERRO
// =====================
function showError(msg) {
  errorMessage.textContent = msg;
}

// =====================
// EXIBIR DADOS
// =====================
function exibirDados(data) {

  nomeFuncionario.textContent =
    data['Nome'] || '';

  codigoFuncionario.textContent =
    data['Código'] || '';

  dadosContainer.innerHTML = '';

  const grupos = [
    {
      titulo: 'Informações Básicas',
      campos: [
        'Tempo de empresa',
        'Base',
        'Dias trabalhados',
        'dias trab'
      ]
    },
    {
      titulo: 'Frequência',
      campos: [
        'Folgas',
        'Atestado',
        'Faltas',
        'Total faltas atestado'
      ]
    },
    {
      titulo: 'Produtividade',
      campos: [
        'TML',
        'PRODUTIVIDADE',
        'Tempo médio de liberação / Checklist',
        'Tempo em rota (escala) (Experiência)'
      ]
    },
    {
      titulo: 'Vales e Ocorrências',
      campos: [
        'Vales e Atend.',
        'Quebra de Caixa',
        'Não Haver vales não autorizados',
        '85% de Entrega no Cliente e Não Haver vales não autorizados',
        'Não Haver Falta Injustificada/ Relatos'
      ]
    },
    {
      titulo: 'Devoluções',
      campos: [
        'DEVOLUÇÕES',
        'Não haver devolução por responsábilidade própria'
      ]
    },
    {
      titulo: 'Vencimentos / Comissões',
      campos: [
        'HE Ajustadas',
        '85%',
        'Prêmio tempo de empresa sem falta',
        'Comissão Caixa',
        'DSR',
        'DSR HE',
        'Quinquenio',
        'Prêmio',
        'HE'
      ]
    }
  ];

  grupos.forEach(grupo => {

    const divGrupo = document.createElement('div');
    divGrupo.className = 'grupo';

    const titulo = document.createElement('h3');
    titulo.textContent = grupo.titulo;

    divGrupo.appendChild(titulo);

    grupo.campos.forEach(chave => {

      if (Object.prototype.hasOwnProperty.call(data, chave)) {

        let valor = data[chave];

        if (
          valor === undefined ||
          valor === null ||
          valor === ''
        ) {
          valor = '—';
        }

        const linha = document.createElement('div');
        linha.className = 'linha';

        linha.innerHTML = `
          <span class="rotulo">${chave}</span>
          <span class="valor">${valor}</span>
        `;

        divGrupo.appendChild(linha);

      }

    });

    dadosContainer.appendChild(divGrupo);

  });

  totalValue.textContent =
    data['TOTAL']
      ? data['TOTAL']
      : '—';

}