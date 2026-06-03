// URL do Web App Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbyW1AlUlyGCY6kSL6ESZqiPXbtk73Hnb2hzQhzn3Ijl8XPcVlBvXgQoqwayfxaSY7z9/exec"

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
const password = document.getElementById('password').value.trim();

const logoutBtn = document.getElementById('logout-btn');

const listaChamados = document.getElementById('lista-chamados');
const totalChamados = document.getElementById('total-chamados');

let usuarioLogado = {
  codigo: '',
  nome: ''
};

// =====================
// LOGIN
// =====================
loginForm.addEventListener('submit', async (e) => {

  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showError('Preencha todos os campos.');
    return;
  }

  errorMessage.textContent = '';

  const callbackName = 'loginCallback_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
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
      usuarioLogado = {
      codigo: '',
      nome: ''
    };

    if (listaChamados) {
      listaChamados.innerHTML = '';
    }

    if (totalChamados) {
      totalChamados.textContent = '0 aberto(s)';
    }
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
  nomeFuncionario.textContent = data['Nome'] || '';
  codigoFuncionario.textContent = data['Código'] || '';
    usuarioLogado.codigo = data['Código'] || '';
  usuarioLogado.nome = data['Nome'] || '';
  dadosContainer.innerHTML = '';

  // Lista de campos que devem ser formatados como moeda (R$)
  const camposMonetarios = [
    'Base',
    'Quebra de Caixa',
    'Comissão',
    'Vales e Atend.',
    'Quinquenio',
    'DSR',
    'DSR HE',
    'HE',
    'Prêmio',
    'TOTAL'
  ];

  // Mapeamento de nomes amigáveis (opcional)
  const nomesAmigaveis = {
    'Base': 'Salário Base',
    'Quebra de Caixa': 'Quebra de Caixa',
    'Vales e Atend.': 'Vales e Adiantamentos',
    'Quinquenio': 'Quinquênio',
    'Prêmio tempo de empresa sem falta': '🏆Tempo de Empresa',
    'HE Ajustadas': '⏰ Horas Extras Ajustadas',
    'DSR': '📅 DSR',
    'DSR HE': '📅 DSR sobre Hora extra',
    'Prêmio': '🎁 Prêmio',
    'HE': '⏰ Horas Extras',
    'TOTAL': '💵 TOTAL LÍQUIDO'
  };

  // Função para converter string brasileira para número
  function converterParaNumero(valor) {
    if (valor === undefined || valor === null || valor === '') return null;
    if (typeof valor === 'number') return valor;
    
    // Remove espaços, troca vírgula por ponto
    let str = String(valor).trim().replace(/\./g, '').replace(',', '.');
    let num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  function formatarMoeda(valor) {
    if (valor === undefined || valor === null || valor === '') return '—';
    
    const num = converterParaNumero(valor);
    if (num === null) return String(valor);
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }

  const grupos = [
    {
      titulo: '📋 Informações Básicas',
      campos: ['Tempo de empresa', 'Base', 'Dias trabalhados']
    },
    {
      titulo: '📆 Frequência',
      campos: ['Folgas', 'Atestado', 'Faltas', 'Total faltas atestado']
    },
    {
      titulo: '📊 Produtividade',
      campos: ['TML', 'PRODUTIVIDADE', 'Tempo médio de liberação / Checklist', 'Tempo em rota (escala) (Experiência)']
    },
    {
      titulo: '💳 Vales e Ocorrências',
      campos: ['Vales e Atend.', 'Quebra de Caixa', 'Não Haver vales não autorizados', '85% de Entrega no Cliente e Não Haver vales não autorizados', 'Não Haver Falta Injustificada/ Relatos']
    },
    {
      titulo: '📦 Devoluções',
      campos: ['DEVOLUÇÕES', 'Não haver devolução por responsábilidade própria']
    },
    {
      titulo: '💰 Vencimentos e Proventos',
      campos: ['HE Ajustadas', '85%', 'Prêmio tempo de empresa sem falta', 'Comissão Caixa', 'DSR', 'DSR HE', 'Quinquenio', 'Prêmio', 'HE']
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
        
        if (valor === undefined || valor === null || valor === '') {
          valor = '—';
        } else {
          // Verifica se o campo deve ser formatado como moeda
          if (camposMonetarios.includes(chave)) {
            valor = formatarMoeda(valor);
          }
        }

        const linha = document.createElement('div');
        linha.className = 'linha';
        
        // Usa nome amigável se disponível
        const rotulo = nomesAmigaveis[chave] || chave;
        
        linha.innerHTML = `
          <span class="rotulo">${rotulo}</span>
          <span class="valor">${valor}</span>
        `;
        
        divGrupo.appendChild(linha);
      }
    });

    dadosContainer.appendChild(divGrupo);
  });

  // Total com formatação especial
  const total = data['TOTAL'];
  totalValue.textContent = total ? formatarMoeda(total) : '—';
}



// =====================
// CHAMADO (MODAL)
// =====================
const modal = document.getElementById('modal-chamado');
const abrirChamadoBtn = document.getElementById('abrir-chamado-btn');
const closeModal = document.querySelector('.close-modal');
const formChamado = document.getElementById('form-chamado');
const msgChamado = document.getElementById('msg-chamado');

// ---------------------
// ABRIR MODAL
// ---------------------

abrirChamadoBtn.addEventListener('click', () => {

  modal.style.display = 'flex';

  document.getElementById('assunto').value = '';
  document.getElementById('descricao').value = '';

  msgChamado.innerHTML = '';

  carregarChamados();

});

// ---------------------
// FECHAR MODAL
// ---------------------

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// ---------------------
// CARREGAR CHAMADOS
// ---------------------

function carregarChamados() {

  const callbackName = 'listarChamados_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
  const script = document.createElement('script');

  window[callbackName] = function(result) {
    try {
      if (!result || !result.success) {
        listaChamados.innerHTML =
          `<div class="empty-state">
            Erro ao carregar chamados.
          </div>`;
        return;
      }

      const chamados = result.chamados || [];

      totalChamados.textContent = `${chamados.length} aberto(s)`;

      if (!chamados.length) {
        listaChamados.innerHTML =
          `<div class="empty-state">
            Nenhum chamado aberto.
          </div>`;

        return;
      }
      console.log(chamados)
      listaChamados.innerHTML = chamados.map(chamado => {

        const statusClasse =
          chamado.status
            .toLowerCase()
            .replace(/\s/g,'');

        return `
          <div class="chamado-card">
            <div class="chamado-topo">
              <div>

                <div class="chamado-assunto">
                  ${chamado.assunto} - ${chamado.dataHora}
                </div>

                <div class="chamado-descricao">
                  ${chamado.descricao || ''}<br>
                  ${chamado.retorno || ''}
                </div>
              </div>

              <span class="chamado-status status-${statusClasse}">
                ${chamado.status}
              </span>

            </div>



            ${
              chamado.tempoResposta
              ? `
                <div class="chamado-tempo">
                  ⏱ Tempo resposta: ${chamado.tempoResposta}
                </div>
              `
              : ''
            }

          </div>
        `;

      }).join('');

    } finally {

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

    }

  };

  script.onerror = () => {

    listaChamados.innerHTML =
      `<div class="empty-state">
        Falha de conexão.
      </div>`;

    delete window[callbackName];

    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }

  };

  script.src =
    `${API_URL}` +
    `?action=chamados` +
    `&codigo=${encodeURIComponent(usuarioLogado.codigo)}` +
    `&callback=${callbackName}`;

  document.body.appendChild(script);

}

// ---------------------
// ABRIR CHAMADO
// ---------------------

formChamado.addEventListener('submit', (e) => {

  e.preventDefault();

  const assunto =
    document.getElementById('assunto').value.trim();

  const descricao =
    document.getElementById('descricao').value.trim();

  if (!assunto || !descricao) {

    msgChamado.innerHTML =
      '<span style="color:red;">Preencha todos os campos.</span>';

    return;
  }

  const callbackName =
    'chamado_' +
    Date.now() +
    '_' +
    Math.floor(Math.random() * 99999);

  const script = document.createElement('script');

  window[callbackName] = function(result) {

    try {

      if (result.success) {

        msgChamado.innerHTML =
          '<span style="color:green;">✅ Chamado enviado com sucesso.</span>';

        formChamado.reset();

        carregarChamados();

      } else {

        msgChamado.innerHTML =
          `<span style="color:red;">❌ ${result.message}</span>`;

      }

    } finally {

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

    }

  };

  script.onerror = () => {

    msgChamado.innerHTML =
      '<span style="color:red;">Erro de conexão.</span>';

    delete window[callbackName];

    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }

  };

  script.src =
    `${API_URL}` +
    `?action=abrir_chamado` +
    `&codigo=${encodeURIComponent(usuarioLogado.codigo)}` +
    `&nome=${encodeURIComponent(usuarioLogado.nome)}` +
    `&assunto=${encodeURIComponent(assunto)}` +
    `&descricao=${encodeURIComponent(descricao)}` +
    `&callback=${callbackName}`;

  document.body.appendChild(script);

});



