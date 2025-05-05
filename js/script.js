// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis
    setupCollapsible();

    // Configura a funcionalidade de pesquisa
    setupSearch();

    // Adiciona listener para fechar resultados ao clicar fora
    document.addEventListener('click', handleClickOutside);

    // Atualiza o ano no rodapé
    updateFooterYear();

    // Ajustar altura dos colapsáveis ativos e resultados de pesquisa no resize
    window.addEventListener('resize', debounce(adjustActiveCollapsibleHeightsAndSearchResults, 150));
});

// --- FUNÇÃO PARA ATUALIZAR O ANO DO RODAPÉ ---
function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.textContent = currentYear;
    } else {
        console.warn("Elemento com ID 'current-year' não encontrado no rodapé.");
    }
}
// --- FIM DA FUNÇÃO DO RODAPÉ ---


// Função de Debounce genérica
function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		const context = this, args = arguments;
		const later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

// --- FUNÇÃO setElementMaxHeightToScrollHeight - REVISADA PARA MAIOR SUAVIDADE ---
// Função para definir o max-height de um elemento colapsável para sua altura total
function setElementMaxHeightToScrollHeight(element) {
    // Esta função é específica para colapsáveis que ABREM
    // e precisam de um reset e reflow para animar corretamente do 0.
    // Não é ideal para o container de resultados da pesquisa que precisa
    // calcular a altura máxima baseada no espaço disponível.

    // Garante que o elemento esteja pronto para medição (já deve ter a classe .active se estiver abrindo)
    // e que as transições CSS estejam temporariamente desabilitadas para a medição.
    element.style.transition = 'none';
    // Remove limite para medir altura real (incluindo padding do .active se aplicável)
    // temporariamente definindo para 'none' ou um valor grande
    element.style.maxHeight = '10000px'; // Use um valor grande em vez de 'none' para garantir medição precisa mesmo com padding
    const scrollHeight = element.scrollHeight; // Mede a altura total do conteúdo

    // Reseta para 0px ANTES de reabilitar a transição e aplicar o valor final.
    // Isso define o ponto inicial da animação de abertura de forma mais explícita.
    element.style.maxHeight = '0px';

    // Força um reflow/repaint para garantir que o navegador processe o '0px'
    // antes de iniciar a transição CSS.
    element.offsetHeight; // Leitura de offsetHeight força o reflow

    // Reabilita a transição (usará a definida no CSS) e aplica a altura final
    // Envolvemos em requestAnimationFrame para dar ao navegador a chance de processar
    // as mudanças anteriores antes de iniciar a animação.
    requestAnimationFrame(() => {
        element.style.transition = ''; // Reabilita transição CSS
        element.style.maxHeight = scrollHeight + "px"; // Aplica altura para animar
    });

    // Opcional: Limpar o style.maxHeight após a transição para permitir que o conteúdo flua
    // se ele mudar dinamicamente enquanto estiver aberto.
    element.addEventListener('transitionend', function handler(e) {
        // Verifica se a transição que terminou foi a de max-height
        if (e.propertyName === 'max-height') {
            // Só remove o maxHeight inline se ele ainda for o valor calculado,
            // evitando problemas se o usuário fechar antes de terminar.
            // E verifica se o elemento ainda está ativo.
             // Verifica se o max-height calculado é o valor atual no elemento antes de setar para none
            if (element.classList.contains('active') && parseFloat(element.style.maxHeight) > 0) {
                 // Verifica se o elemento é um colapsável normal (não o container de pesquisa)
                 // O container de pesquisa tem seu maxHeight ajustado dinamicamente
                 if (!element.id || element.id !== 'search-results-container') {
                     element.style.maxHeight = 'none';
                 }
            }
            // Remove o listener para não executar múltiplas vezes na mesma transição de abertura
            element.removeEventListener('transitionend', handler);
        }
    }, { once: false }); // Usamos false e removemos manualmente para garantir robustez
}

// --- NOVA FUNÇÃO para ajustar a altura SOMENTE do container de resultados da pesquisa ---
function adjustSearchResultsContainerHeight() {
    const resultsContainer = document.getElementById('search-results-container');
    const searchBar = document.querySelector('.sticky-search-container .search-bar');
    const footer = document.getElementById('Footer_footer'); // Adicionado ID ao footer no HTML

    // Só ajusta se o container de resultados estiver ativo e os elementos necessários existirem
    if (!resultsContainer || !resultsContainer.classList.contains('active') || !searchBar || !footer) {
        return;
    }

    // Calcula o espaço disponível entre o final da barra de pesquisa e o início do rodapé
    const searchBarBottom = searchBar.getBoundingClientRect().bottom;
    const footerTop = footer.getBoundingClientRect().top;
    const marginAboveFooter = 10; // Espaço extra para não "colar" no rodapé

    const availableHeight = footerTop - searchBarBottom - marginAboveFooter;

    // Garante que haja pelo menos um espaço mínimo, mas não negativo
    const maxPossibleHeight = Math.max(0, availableHeight);

    // Temporariamente remove max-height e transição para medir a altura real do conteúdo
    resultsContainer.style.transition = 'none';
    resultsContainer.style.maxHeight = 'none'; // Permite que o conteúdo ocupe a altura real

    // Força um reflow para garantir a medição correta
    resultsContainer.offsetHeight;

    const contentScrollHeight = resultsContainer.scrollHeight;

    // Determina a altura final: o menor entre a altura total do conteúdo e o espaço disponível
    const finalHeight = Math.min(contentScrollHeight, maxPossibleHeight);

    // Reabilita a transição e aplica a altura final
    requestAnimationFrame(() => {
         resultsContainer.style.transition = ''; // Reabilita a transição CSS
         resultsContainer.style.maxHeight = finalHeight + 'px'; // Aplica a altura calculada
    });

    // Não remove maxHeight='none' aqui, pois a altura é dinâmica.
    // A transição de fechamento definirá max-height para 0.
}


// Função para ajustar a altura de TODOS os colapsáveis ativos E resultados de pesquisa (no resize)
function adjustActiveCollapsibleHeightsAndSearchResults() {
    // Ajusta colapsáveis normais (define max-height para scrollHeight)
    document.querySelectorAll('.collapsible-content.active').forEach(activeElement => {
        // Recalcula a altura e aplica diretamente, sem animação durante o resize.
        activeElement.style.transition = 'none'; // Desabilita para evitar saltos
        activeElement.style.maxHeight = 'none'; // Mede
        const scrollHeight = activeElement.scrollHeight;
        activeElement.style.maxHeight = scrollHeight + "px"; // Define novo valor

        // Reabilita transição após um pequeno delay ou no próximo frame para futuras interações
        requestAnimationFrame(() => {
            activeElement.style.transition = '';
             // Em resize, remove a style inline 'maxHeight: none' dos collapsibles normais
             // que foi adicionada no transitionend da abertura para permitir que o conteúdo flua.
             // Se o resize ocorrer DURANTE a transição de abertura, o transitionend pode não ter rodado ainda.
             // Esta linha garante que, após o ajuste de resize (sem transição), o maxHeight
             // não fique fixo se for um collapsible content normal.
            if (!activeElement.id || activeElement.id !== 'search-results-container') {
                 // Adiciona um pequeno delay para garantir que a aplicação do novo maxHeight
                 // no resize seja processada antes de potencialmente remover a propriedade inline
                 // no transitionend, caso ele ainda vá rodar.
                 setTimeout(() => {
                     // Verifica se o elemento AINDA está ativo e se a propriedade maxHeight inline
                     // não foi alterada por outra interação (ex: fechamento rápido antes do resize terminar)
                     if (activeElement.classList.contains('active') && activeElement.style.maxHeight !== '0px') {
                          activeElement.style.maxHeight = 'none';
                     }
                 }, 50); // Pequeno delay
            }
        });
    });

    // Ajusta o container de resultados da pesquisa separadamente
    adjustSearchResultsContainerHeight();
}


// --- FUNÇÃO setupCollapsible - REVISADA COM LÓGICA DE ANIMAÇÃO AJUSTADA ---
function setupCollapsible() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    if (toggleButtons.length === 0) {
        return;
    }

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;

        if (!content || !content.classList.contains('collapsible-content')) {
            console.warn("Estrutura colapsável inválida:", button);
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;
            const isAlreadyActive = currentButton.classList.contains('active'); // Verifica estado ANTES de mudar
            const parentContainer = currentButton.closest('.buttons-container');

            // Fecha outros acordeões no mesmo container (se houver)
            if (parentContainer) {
                parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    const otherContent = otherGroup.querySelector('.collapsible-content');
                    // Fecha apenas se for OUTRO botão e se ele ESTIVER ativo
                    if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                        otherButton.classList.remove('active');
                        otherContent.classList.remove('active');
                        // Anima o fechamento (CSS cuida disso ao remover .active)
                        // Definir explicitamente para 0px para garantir a animação
                        // Usamos requestAnimationFrame para suavizar o início do fechamento
                        requestAnimationFrame(() => {
                            otherContent.style.maxHeight = '0px';
                        });
                         // Remove o max-height: none inline que pode ter sido adicionado no transitionend
                        otherContent.style.maxHeight = ''; // Reseta para o valor CSS (0px quando não ativo)
                    }
                });
            }

            // Alterna o estado do acordeão clicado
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            // Ajusta max-height para animar abertura/fechamento
            if (!isAlreadyActive) { // Se NÃO estava ativo antes, significa que está ABRINDO
                // Chama a função revisada para definir o max-height e animar a abertura
                setElementMaxHeightToScrollHeight(currentContent);
            } else { // Se estava ativo antes, significa que está FECHANDO
                // Anima o fechamento definindo max-height para 0px.
                // A transição CSS fará a animação suave.
                // Precisamos definir um valor numérico para a transição de fechamento funcionar corretamente.
                // Usar requestAnimationFrame pode ajudar a suavizar o início do fechamento também.
                requestAnimationFrame(() => {
                    currentContent.style.maxHeight = '0px';
                });
                 // Remove o max-height: none inline que pode ter sido adicionado no transitionend
                currentContent.style.maxHeight = ''; // Reseta para o valor CSS (0px quando não ativo)
            }
        });

        // Pré-calcula altura se já estiver ativo no carregamento (se aplicável no futuro)
        // if (button.classList.contains('active') && content.classList.contains('active')) {
        //    content.style.maxHeight = 'none'; // Permite fluxo natural inicial
        //    adjustActiveCollapsibleHeight(); // Ajusta para a altura correta
        // }
    });
}


// Função para configurar a pesquisa - SEM ALTERAÇÕES NECESSÁRIAS AQUI
function setupSearch() {
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');
    const searchInput = searchBar?.querySelector('input');
    const searchButton = searchBar?.querySelector('button');
    const resultsContainer = document.getElementById('search-results-container');
    const footer = document.getElementById('Footer_footer'); // Adicionado ID ao footer

    if (!stickyContainer || !searchBar || !searchInput || !searchButton || !resultsContainer || !footer) {
        console.error("Elementos da pesquisa ou rodapé não encontrados.");
        return;
    }

    const filesToSearch = [
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Index.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Secretaria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Tesouraria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Conselho.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Comissoes.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Consultas.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Prerrogativas.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/protocolos.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/examedeordem.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/inssdigital.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Tecnologia.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/ESA.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/ted.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/cursoseventos.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/controladoria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/fiscalizacao.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/manuais/Manuais.html',
    ];

    async function fetchAndSearchFile(rootRelativePath, searchTerm) {
        try {
            const urlWithCacheBuster = `${rootRelativePath}?v=${Date.now()}`;
            const response = await fetch(urlWithCacheBuster);
            if (!response.ok) {
                console.error(`Erro ao buscar ${rootRelativePath}: Status ${response.status} - ${response.statusText}`);
                return [];
            }
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const elementsToSearch = doc.querySelectorAll('a.btn, button.toggle-btn, a.sub-link, h2.page-title');
            const matches = [];
            const lowerSearchTerm = searchTerm.toLowerCase();

            elementsToSearch.forEach(element => {
                let elementText = element.textContent.trim().replace(/^>\s*/, '');
                 if (element.classList.contains('toggle-btn')) {
                    elementText = elementText.replace(/▼$/, '').trim();
                 }
                const lowerElementText = elementText.toLowerCase();

                if (elementText && lowerElementText.includes(lowerSearchTerm)) {
                    let targetHref = '#';
                    let resultText = elementText;

                    if (element.tagName === 'H2' && element.classList.contains('page-title')) {
                        targetHref = rootRelativePath;
                        resultText = `Página: ${elementText}`;
                    }
                    else if (element.tagName === 'A' && element.getAttribute('href')) {
                        const originalHref = element.getAttribute('href');
                        try {
                            const resolvedUrl = new URL(originalHref, rootRelativePath);
                            targetHref = resolvedUrl.href;
                        } catch (e) {
                             console.warn(`Href inválido: ${originalHref} em ${rootRelativePath}`);
                              targetHref = (originalHref.startsWith('http') || originalHref.startsWith('/')) ? originalHref : rootRelativePath;
                        }
                    }
                    else if (element.tagName === 'BUTTON' && element.classList.contains('toggle-btn')) {
                        targetHref = rootRelativePath;
                        resultText = `Grupo: ${elementText}`;
                    }

                    const linkResult = document.createElement('a');
                    linkResult.href = targetHref;
                    linkResult.textContent = resultText;
                    linkResult.classList.add('search-result-item');
                    linkResult.title = `Encontrado em: ${rootRelativePath.substring(rootRelativePath.lastIndexOf('/') + 1)}`;
                    matches.push({
                        file: rootRelativePath,
                        element: linkResult,
                        dedupKey: `${lowerElementText}|${targetHref}`
                     });
                }
            });
            return matches;
        } catch (error) {
            console.error(`Erro ao processar o arquivo ${rootRelativePath}:`, error);
            return [];
        }
    }

    // --- FUNÇÃO displayResults (REVISADA PARA ABERTURA CORRETA E ESTADO DE ERRO) ---
    function displayResults(results) {
        resultsContainer.innerHTML = ''; // Limpa
        resultsContainer.classList.remove('active', 'no-results-found'); // Reseta classes do container
        searchBar.classList.remove('results-visible', 'no-results-found'); // Reseta classes da barra
        resultsContainer.style.maxHeight = null; // Reseta max-height para CSS/JS controlar fechamento/abertura

        const hasInput = searchInput.value.trim().length >= 2;

        if (hasInput) {
             // Desduplica resultados
             const uniqueResultsMap = new Map(
                results.map(item => [item.dedupKey, item])
            );
            const uniqueResults = Array.from(uniqueResultsMap.values());

            if (uniqueResults.length > 0) {
                uniqueResults.forEach(result => {
                    resultsContainer.appendChild(result.element);
                });
                // Adiciona a classe active para iniciar a animação de abertura CSS (padding, opacity)
                resultsContainer.classList.add('active');
                searchBar.classList.add('results-visible');

                // Ajusta o max-height dinamicamente para a altura do conteúdo, limitada pelo espaço disponível
                adjustSearchResultsContainerHeight();

            } else {
                // Nenhum resultado encontrado
                const noResultsMsg = document.createElement('p');
                noResultsMsg.classList.add('no-results-message');
                noResultsMsg.textContent = 'Nenhum resultado encontrado.';
                resultsContainer.appendChild(noResultsMsg);

                // Adiciona as classes para estado "sem resultados"
                resultsContainer.classList.add('active', 'no-results-found');
                searchBar.classList.add('results-visible', 'no-results-found'); // Adiciona classe também na barra

                // Ajusta o max-height para a mensagem "Nenhum resultado", limitada pelo espaço
                adjustSearchResultsContainerHeight();
            }

        } else {
             // Input vazio
             resultsContainer.classList.remove('active', 'no-results-found');
             searchBar.classList.remove('results-visible', 'no-results-found');
             // Anima o fechamento definindo para 0px
             requestAnimationFrame(() => {
                 resultsContainer.style.maxHeight = '0px';
             });
        }
    }
    // --- FIM DA FUNÇÃO displayResults ---

    // Função principal que coordena a busca
    async function performSearch() {
        const searchTerm = searchInput.value.trim();

        if (searchTerm.length < 2) {
            displayResults([]); // Limpa e fecha
            return;
        }

        // Mostra indicador de loading
        resultsContainer.innerHTML = '<p class="no-results-message">Buscando...</p>';
        resultsContainer.classList.remove('no-results-found'); // Remove estado de erro anterior
        searchBar.classList.remove('no-results-found'); // Remove estado de erro anterior da barra
        resultsContainer.classList.add('active'); // Ativa para mostrar "Buscando"
        searchBar.classList.add('results-visible');

        // Define uma altura MÍNIMA enquanto busca para a msg "Buscando..." ser visível
        // Usaremos adjustSearchResultsContainerHeight APÓS a busca para ajustar à altura final
        // Temporariamente setamos um max-height fixo para a mensagem de loading
         requestAnimationFrame(() => {
              resultsContainer.style.transition = 'none'; // Desabilita transição para o estado loading
              resultsContainer.style.maxHeight = '60px'; // Altura suficiente para a msg "Buscando..."
              resultsContainer.offsetHeight; // Força reflow
              resultsContainer.style.transition = ''; // Reabilita transição
         });


        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat();
            displayResults(combinedResults); // Exibe resultados e ajusta altura final

        } catch (error) {
            console.error("Erro geral durante a pesquisa:", error);
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';

            // Adiciona as classes para estado "sem resultados" / erro
            resultsContainer.classList.add('active', 'no-results-found');
            searchBar.classList.add('results-visible', 'no-results-found'); // Adiciona classe também na barra

             // Ajusta altura para a mensagem de erro usando a função auxiliar
             adjustSearchResultsContainerHeight();
        }
    }

    // Debounced search function
    const debouncedSearch = debounce(performSearch, 350);

    // Listeners
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Cancela o debounce se existir e executa imediatamente
             if (typeof debouncedSearch.cancel === 'function') { // Verifica se o debounce tem cancel
                 debouncedSearch.cancel();
             } else if (typeof debouncedSearch !== 'undefined' && debouncedSearch.hasOwnProperty('__timeout')) { // Verifica propriedade interna se não houver cancel
                clearTimeout(debouncedSearch.__timeout); // Fallback se não houver .cancel
             }
            performSearch();
        }
    });

     searchInput.addEventListener('input', function() {
        if (searchInput.value.trim() === '') {
            if (typeof debouncedSearch.cancel === 'function') {
                 debouncedSearch.cancel();
            } else if (typeof debouncedSearch !== 'undefined' && debouncedSearch.hasOwnProperty('__timeout')) {
               clearTimeout(debouncedSearch.__timeout);
            }
           displayResults([]); // Limpa e fecha
        }
    });
}

// Função para fechar o container de resultados ao clicar fora - SEM ALTERAÇÕES
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');

    if (stickyContainer && resultsContainer && resultsContainer.classList.contains('active') && !stickyContainer.contains(event.target)) {
        // Remove classes de estado e anima o fechamento
        resultsContainer.classList.remove('active', 'no-results-found');
         searchBar.classList.remove('results-visible', 'no-results-found');

        // Anima o fechamento definindo para 0px
        requestAnimationFrame(() => {
            // Garante que a transição esteja habilitada para animar o fechamento
            resultsContainer.style.transition = ''; // Reseta para a transição CSS
            resultsContainer.style.maxHeight = '0px';
        });

    }
}

// Modifica a função de resize para incluir o ajuste dos resultados da pesquisa
function adjustActiveCollapsibleHeightsAndSearchResults() {
     // Ajusta colapsáveis normais (define max-height para scrollHeight)
    document.querySelectorAll('.collapsible-content.active').forEach(activeElement => {
        // Recalcula a altura e aplica diretamente, sem animação durante o resize.
        activeElement.style.transition = 'none'; // Desabilita para evitar saltos
        activeElement.style.maxHeight = 'none'; // Mede (permite fluxo natural temporariamente)
        const scrollHeight = activeElement.scrollHeight;
        activeElement.style.maxHeight = scrollHeight + "px"; // Define novo valor

        // Reabilita transição após um pequeno delay ou no próximo frame para futuras interações
        requestAnimationFrame(() => {
            activeElement.style.transition = '';
             // Em resize, remove a style inline 'maxHeight: none' dos collapsibles normais
             // que foi adicionada no transitionend da abertura para permitir que o conteúdo flua.
             // Se o resize ocorrer DURANTE a transição de abertura, o transitionend pode não ter rodado ainda.
             // Esta linha garante que, após o ajuste de resize (sem transição), o maxHeight
             // não fique fixo se for um collapsible content normal.
            if (!activeElement.id || activeElement.id !== 'search-results-container') {
                 // Adiciona um pequeno delay para garantir que a aplicação do novo maxHeight
                 // no resize seja processada antes de potencialmente remover a propriedade inline
                 // no transitionend, caso ele ainda vá rodar.
                 setTimeout(() => {
                     // Verifica se o elemento AINDA está ativo e se a propriedade maxHeight inline
                     // não foi alterada por outra interação (ex: fechamento rápido antes do resize terminar)
                     if (activeElement.classList.contains('active') && parseFloat(activeElement.style.maxHeight) > 0) {
                          activeElement.style.maxHeight = 'none';
                     }
                 }, 50); // Pequeno delay
            }
        });
    });

    // Ajusta o container de resultados da pesquisa separadamente
    adjustSearchResultsContainerHeight();
}