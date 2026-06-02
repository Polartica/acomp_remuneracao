// ⚠️ SUBSTITUA COM A URL DO SEU WEB APP DEPOIS DE PUBLICAR
const API_URL = "https://script.google.com/macros/s/AKfycbyW1AlUlyGCY6kSL6ESZqiPXbtk73Hnb2hzQhzn3Ijl8XPcVlBvXgQoqwayfxaSY7z9/exec"

// Elementos do DOM
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const nomeFuncionario = document.getElementById('nome-funcionario');
const codigoFuncionario = document.getElementById('codigo-funcionario');
const dadosContainer = document.getElementById('dados-funcionario');
const totalValue = document.getElementById('total-value');
const logoutBtn = document.getElementById('logout-btn');

// Função auxiliar: calcular hash SHA-256 (retorna string hexadecimal)
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    // Calcular o hash da senha (SHA-256)
    const passwordHash = await sha256(password);

    // Construir a URL com os parâmetros (GET)
    const url = `${API_URL}?username=${encodeURIComponent(username)}&hash=${encodeURIComponent(passwordHash)}`;

    // Requisição simples (sem preflight)
    const response = await fetch(url, {
      method: 'GET'
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
  nomeFuncionario.textContent = data['Nome'] || '';
  codigoFuncionario.textContent = data['Código'] || '';

  dadosContainer.innerHTML = '';

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
        }
        const linha = document.createElement('div');
        linha.className = 'linha';
        linha.innerHTML = `<span class="rotulo">${chave}</span><span class="valor">${valor}</span>`;
        divGrupo.appendChild(linha);
      }
    });

    dadosContainer.appendChild(divGrupo);
  });

  totalValue.textContent = data['TOTAL'] ? data['TOTAL'] : '—';
}