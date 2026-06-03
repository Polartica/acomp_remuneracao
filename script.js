// script.js - Versão refatorada com melhorias de performance, cache e modularização

// ==============================
// CONFIGURAÇÃO GLOBAL
// ==============================
const API_URL = "https://script.google.com/macros/s/AKfycbyW1AlUlyGCY6kSL6ESZqiPXbtk73Hnb2hzQhzn3Ijl8XPcVlBvXgQoqwayfxaSY7z9/exec";

// ==============================
// GERENCIADOR DE REQUISIÇÕES JSONP
// ==============================
const jsonp = (() => {
  let requestId = 0;
  const pendingRequests = new Map();

  /**
   * Faz uma requisição JSONP
   * @param {Object} params - Parâmetros da URL
   * @param {string} [callbackParam='callback'] - Nome do parâmetro callback
   * @param {number} timeout - Timeout em ms
   * @returns {Promise<any>}
   */
  function request(params, callbackParam = 'callback', timeout = 15000) {
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      const callbackName = `jsonp_${Date.now()}_${id}_${Math.floor(Math.random() * 99999)}`;
      const script = document.createElement('script');
      let timer;

      // Limpeza
      const cleanup = () => {
        if (window[callbackName]) delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (timer) clearTimeout(timer);
        pendingRequests.delete(callbackName);
      };

      // Timeout
      timer = setTimeout(() => {
        cleanup();
        reject(new Error('Tempo limite da requisição excedido.'));
      }, timeout);

      // Callback global
      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Falha na conexão com o servidor.'));
      };

      // Monta URL
      const urlParams = new URLSearchParams(params);
      urlParams.set(callbackParam, callbackName);
      script.src = `${API_URL}?${urlParams.toString()}`;

      document.body.appendChild(script);
      pendingRequests.set(callbackName, { cleanup, script });
    });
  }

  return { request };
})();

// ==============================
// CACHE DE CHAMADOS (memória)
// ==============================
const ChamadosCache = {
  dados: null,
  timestamp: null,
  ttl: 30000, // 30 segundos

  isValid() {
    return this.dados !== null && this.timestamp !== null && (Date.now() - this.timestamp) < this.ttl;
  },

  get() {
    return this.isValid() ? this.dados : null;
  },

  set(dados) {
    this.dados = dados;
    this.timestamp = Date.now();
  },

  clear() {
    this.dados = null;
    this.timestamp = null;
  }
};

// ==============================
// MÓDULO DE UTILITÁRIOS
// ==============================
const Utils = {
  showError(msg) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) errorDiv.textContent = msg;
  },

  formatarMoeda(valor) {
    if (valor === undefined || valor === null || valor === '') return '—';
    const num = this.converterParaNumero(valor);
    if (num === null) return String(valor);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  },

  converterParaNumero(valor) {
    if (valor === undefined || valor === null || valor === '') return null;
    if (typeof valor === 'number') return valor;
    const str = String(valor).trim().replace(/\./g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  },

  escapeHtml(str) {
    if (str === undefined || str === null) return '';
    const s = String(str);
    return s.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
};

// ==============================
// MÓDULO DE LOGIN
// ==============================
const LoginModule = {
  init() {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', this.handleLogin.bind(this));
  },

  async handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      Utils.showError('Preencha todos os campos.');
      return;
    }

    Utils.showError('');

    try {
      const result = await jsonp.request({
        username: username,
        password: password
      });

      if (result && result.success) {
        DashboardModule.exibirDados(result.data);
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'block';
        Utils.showError('');
      } else {
        Utils.showError(result?.message || 'Usuário ou senha inválidos.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Utils.showError('Não foi possível conectar ao servidor.');
    }
  }
};

// ==============================
// MÓDULO DE DASHBOARD (dados do funcionário)
// ==============================
const DashboardModule = {
  usuarioLogado: {
    codigo: '',
    nome: ''
  },

  exibirDados(data) {
    const nomeEl = document.getElementById('nome-funcionario');
    const codigoEl = document.getElementById('codigo-funcionario');
    const dadosContainer = document.getElementById('dados-funcionario');
    const totalEl = document.getElementById('total-value');

    if (nomeEl) nomeEl.textContent = data['Nome'] || '';
    if (codigoEl) codigoEl.textContent = data['Código'] || '';
    this.usuarioLogado.codigo = data['Código'] || '';
    this.usuarioLogado.nome = data['Nome'] || '';
    if (!dadosContainer) return;

    dadosContainer.innerHTML = '';

    const camposMonetarios = [
      'Base', 'Quebra de Caixa', 'Comissão', 'Vales e Atend.',
      'Quinquenio', 'DSR', 'DSR HE', 'HE', 'Prêmio', 'TOTAL'
    ];

    const nomesAmigaveis = {
      'Base': 'Salário Base',
      'Quebra de Caixa': 'Quebra de Caixa',
      'Vales e Atend.': 'Vales e Adiantamentos',
      'Quinquenio': 'Quinquênio',
      'Prêmio tempo de empresa sem falta': '🏆 Tempo de Empresa',
      'HE Ajustadas': '⏰ Horas Extras Ajustadas',
      'DSR': '📅 DSR',
      'DSR HE': '📅 DSR sobre Hora extra',
      'Prêmio': '🎁 Prêmio',
      'HE': '⏰ Horas Extras',
      'TOTAL': '💵 TOTAL LÍQUIDO'
    };

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
          } else if (camposMonetarios.includes(chave)) {
            valor = Utils.formatarMoeda(valor);
          }
          const linha = document.createElement('div');
          linha.className = 'linha';
          const rotulo = nomesAmigaveis[chave] || chave;
          linha.innerHTML = `<span class="rotulo">${Utils.escapeHtml(rotulo)}</span><span class="valor">${Utils.escapeHtml(valor)}</span>`;
          divGrupo.appendChild(linha);
        }
      });
      dadosContainer.appendChild(divGrupo);
    });

    if (totalEl) {
      const total = data['TOTAL'];
      totalEl.textContent = total ? Utils.formatarMoeda(total) : '—';
    }
  }
};

// ==============================
// MÓDULO DE CHAMADOS
// ==============================
const ChamadosModule = {
  modal: null,
  listaEl: null,
  totalEl: null,
  form: null,
  msgEl: null,

  init() {
    this.modal = document.getElementById('modal-chamado');
    this.listaEl = document.getElementById('lista-chamados');
    this.totalEl = document.getElementById('total-chamados');
    this.form = document.getElementById('form-chamado');
    this.msgEl = document.getElementById('msg-chamado');

    const abrirBtn = document.getElementById('abrir-chamado-btn');
    const closeBtn = document.querySelector('.close-modal');

    if (abrirBtn) abrirBtn.addEventListener('click', () => this.abrirModal());
    if (closeBtn) closeBtn.addEventListener('click', () => this.fecharModal());
    if (this.form) this.form.addEventListener('submit', (e) => this.enviarChamado(e));

    window.addEventListener('click', (e) => {
      if (e.target === this.modal) this.fecharModal();
    });
  },

  abrirModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      const assuntoInput = document.getElementById('assunto');
      const descricaoInput = document.getElementById('descricao');
      if (assuntoInput) assuntoInput.value = '';
      if (descricaoInput) descricaoInput.value = '';
      if (this.msgEl) this.msgEl.innerHTML = '';
      this.carregarChamados(true); // força recarga ao abrir modal
    }
  },

  fecharModal() {
    if (this.modal) this.modal.style.display = 'none';
  },

  async carregarChamados(forcarRecarga = false) {
    if (!forcarRecarga && ChamadosCache.isValid()) {
      this.renderizarChamados(ChamadosCache.get());
      return;
    }

    const codigo = DashboardModule.usuarioLogado.codigo;
    if (!codigo) return;

    try {
      const result = await jsonp.request({
        action: 'chamados',
        codigo: codigo
      });

      if (!result || !result.success) {
        this.renderizarErro('Erro ao carregar chamados.');
        return;
      }

      const chamados = result.chamados || [];
      ChamadosCache.set(chamados);
      this.renderizarChamados(chamados);
    } catch (error) {
      console.error('Erro carregar chamados:', error);
      this.renderizarErro('Falha de conexão ao carregar chamados.');
    }
  },

  renderizarChamados(chamados) {
    if (!this.listaEl || !this.totalEl) return;
    this.totalEl.textContent = `${chamados.length} aberto(s)`;

    if (!chamados.length) {
      this.listaEl.innerHTML = `<div class="empty-state">Nenhum chamado aberto.</div>`;
      return;
    }

    this.listaEl.innerHTML = chamados.map(chamado => {
      const statusClasse = Utils.escapeHtml(chamado.status).toLowerCase().replace(/\s/g, '');
      return `
        <div class="chamado-card">
          <div class="chamado-topo">
            <div>
              <div class="chamado-assunto">${Utils.escapeHtml(chamado.assunto)} - ${Utils.escapeHtml(chamado.dataHora)}</div>
              <div class="chamado-descricao">${Utils.escapeHtml(chamado.descricao)}<br>${Utils.escapeHtml(chamado.retorno)}</div>
            </div>
            <span class="chamado-status status-${statusClasse}">${Utils.escapeHtml(chamado.status)}</span>
          </div>
          ${chamado.tempoResposta ? `<div class="chamado-tempo">⏱ Tempo resposta: ${Utils.escapeHtml(chamado.tempoResposta)}</div>` : ''}
        </div>
      `;
    }).join('');
  },

  renderizarErro(mensagem) {
    if (this.listaEl) this.listaEl.innerHTML = `<div class="empty-state">${Utils.escapeHtml(mensagem)}</div>`;
  },

  async enviarChamado(e) {
    e.preventDefault();
    const assuntoInput = document.getElementById('assunto');
    const descricaoInput = document.getElementById('descricao');
    const assunto = assuntoInput ? assuntoInput.value.trim() : '';
    const descricao = descricaoInput ? descricaoInput.value.trim() : '';

    if (!assunto || !descricao) {
      if (this.msgEl) this.msgEl.innerHTML = '<span style="color:red;">Preencha todos os campos.</span>';
      return;
    }

    const { codigo, nome } = DashboardModule.usuarioLogado;

    try {
      const result = await jsonp.request({
        action: 'abrir_chamado',
        codigo: codigo,
        nome: nome,
        assunto: assunto,
        descricao: descricao
      });

      if (result && result.success) {
        if (this.msgEl) this.msgEl.innerHTML = '<span style="color:green;">✅ Chamado enviado com sucesso.</span>';
        if (assuntoInput) assuntoInput.value = '';
        if (descricaoInput) descricaoInput.value = '';
        ChamadosCache.clear(); // limpa cache para forçar recarga
        await this.carregarChamados(true);
      } else {
        if (this.msgEl) this.msgEl.innerHTML = `<span style="color:red;">❌ ${Utils.escapeHtml(result?.message || 'Erro desconhecido')}</span>`;
      }
    } catch (error) {
      console.error('Erro ao enviar chamado:', error);
      if (this.msgEl) this.msgEl.innerHTML = '<span style="color:red;">Erro de conexão ao enviar chamado.</span>';
    }
  }
};

// ==============================
// MÓDULO DE LOGOUT
// ==============================
const LogoutModule = {
  init() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
  },

  logout() {
    DashboardModule.usuarioLogado = { codigo: '', nome: '' };
    ChamadosCache.clear();

    const listaEl = document.getElementById('lista-chamados');
    const totalEl = document.getElementById('total-chamados');
    if (listaEl) listaEl.innerHTML = '';
    if (totalEl) totalEl.textContent = '0 aberto(s)';

    const dashboard = document.getElementById('dashboard-container');
    const login = document.getElementById('login-container');
    if (dashboard) dashboard.style.display = 'none';
    if (login) login.style.display = 'block';

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';

    Utils.showError('');

    const nomeEl = document.getElementById('nome-funcionario');
    const codigoEl = document.getElementById('codigo-funcionario');
    const totalValEl = document.getElementById('total-value');
    const dadosContainer = document.getElementById('dados-funcionario');
    if (nomeEl) nomeEl.textContent = '';
    if (codigoEl) codigoEl.textContent = '';
    if (totalValEl) totalValEl.textContent = '—';
    if (dadosContainer) dadosContainer.innerHTML = '';
  }
};

// ==============================
// INICIALIZAÇÃO
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  LoginModule.init();
  LogoutModule.init();
  ChamadosModule.init();
});