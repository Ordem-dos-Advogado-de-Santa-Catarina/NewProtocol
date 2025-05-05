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

    // Ajustar altura dos colapsáveis ativos no resize
    window.addEventListener('resize', debounce(adjustActiveCollapsibleHeight, 150)); // REATIVADO
});

// --- FUNÇÃO PARA ATUALIZAR O ANO DO RODAPÉ ---
function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.textContent = currentYear;
        // console.log("Ano do rodapé atualizado para:", currentYear); // Comentado para reduzir logs
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

// Função para definir o max-height de um elemento colapsável para sua altura total
function setElementMaxHeightToScrollHeight(element) {
    // Garante que o elemento esteja pronto para medição
    element.style.transition = 'none'; // Desabilita transição temporariamente
    element.style.maxHeight = 'none'; // Remove limite para medir altura real
    const scrollHeight = element.scrollHeight; // Mede a altura total do conteúdo

    // Reseta para 0 antes de aplicar o valor final (necessário para animação de abertura)
    element.style.maxHeight = '0px';

    // Força um reflow/repaint para garantir que o navegador processe o '0px'
    // antes de aplicar o valor final e iniciar a transição CSS
    element.offsetHeight; // Leitura de offsetHeight força o reflow

    // Reabilita a transição e aplica a altura final
    element.style.transition = ''; // Reabilita transição (usará a definida no CSS)
    element.style.maxHeight = scrollHeight + "px"; // Aplica altura para animar

    // console.log(`Max-height definido para ${scrollHeight}px para o elemento:`, element); // Log de depuração
}

// Função para ajustar a altura de TODOS os colapsáveis ativos (no resize)
function adjustActiveCollapsibleHeight() {
    // console.log("Ajustando altura dos colapsáveis ativos no resize..."); // Log
    document.querySelectorAll('.collapsible-content.active, #search-results-container.active').forEach(activeElement => {
        // Apenas re-calcula a altura sem a parte de resetar para 0px,
        // pois o elemento já está aberto. Queremos apenas ajustar se o conteúdo mudou.
        activeElement.style.transition = 'none'; // Desabilita para evitar saltos
        activeElement.style.maxHeight = 'none'; // Mede
        const scrollHeight = activeElement.scrollHeight;
        activeElement.style.maxHeight = scrollHeight + "px"; // Define novo valor
        // console.log(`Altura ajustada para ${scrollHeight}px no elemento:`, activeElement); // Log

        // Reabilita transição após um pequeno delay ou no próximo frame
        requestAnimationFrame(() => {
            activeElement.style.transition = '';
        });
    });
}


// Função para configurar o acordeão (collapsible) - REVISADA
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
            const isOpening = !currentButton.classList.contains('active');
            const parentContainer = currentButton.closest('.buttons-container');

            // Fecha outros acordeões no mesmo container
            if (parentContainer) {
                parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    const otherContent = otherGroup.querySelector('.collapsible-content');
                    if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                        otherButton.classList.remove('active');
                        otherContent.classList.remove('active');
                        otherContent.style.maxHeight = null; // CSS fará a animação para 0
                    }
                });
            }

            // Alterna o estado do acordeão clicado
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            // Ajusta max-height para animar abertura/fechamento
            if (isOpening) {
                // Define o max-height para a altura do conteúdo para animar a abertura
                setElementMaxHeightToScrollHeight(currentContent);
            } else {
                // Anima o fechamento (CSS cuida disso ao remover .active e resetar max-height)
                currentContent.style.maxHeight = null;
            }
        });
    });
}


// Função para configurar a pesquisa - REVISADA
function setupSearch() {
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');
    const searchInput = searchBar?.querySelector('input');
    const searchButton = searchBar?.querySelector('button');
    const resultsContainer = document.getElementById('search-results-container');

    if (!stickyContainer || !searchBar || !searchInput || !searchButton || !resultsContainer) {
        console.error("Elementos da pesquisa não encontrados.");
        return;
    }
    // console.log("Elementos da pesquisa encontrados.");

    // Lista de arquivos HTML para pesquisar (SEM ALTERAÇÕES)
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

    // Função assíncrona para buscar e analisar um arquivo HTML (SEM ALTERAÇÕES)
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

    // --- FUNÇÃO displayResults (REVISADA PARA ABERTURA CORRETA) ---
    function displayResults(results) {
        resultsContainer.innerHTML = ''; // Limpa
        resultsContainer.classList.remove('active', 'no-results-found'); // Reseta classes
        searchBar.classList.remove('results-visible');
        resultsContainer.style.maxHeight = null; // Reseta max-height para CSS controlar fechamento

        const hasInput = searchInput.value.trim().length >= 2;

        if (hasInput) {
             // Desduplica resultados
             const uniqueResultsMap = new Map(
                results.map(item => [item.dedupKey, item])
            );
            const uniqueResults = Array.from(uniqueResultsMap.values());

            if (uniqueResults.length > 0) {
                // console.log(`Exibindo ${uniqueResults.length} resultados únicos.`);
                uniqueResults.forEach(result => {
                    resultsContainer.appendChild(result.element);
                });
            } else {
                // console.log("Nenhum resultado encontrado para exibir.");
                const noResultsMsg = document.createElement('p');
                noResultsMsg.classList.add('no-results-message');
                noResultsMsg.textContent = 'Nenhum resultado encontrado.';
                resultsContainer.appendChild(noResultsMsg);
                resultsContainer.classList.add('no-results-found');
            }

            // Adiciona a classe active para iniciar a animação de abertura CSS (padding, opacity)
            resultsContainer.classList.add('active');
            searchBar.classList.add('results-visible');

            // Define o max-height dinamicamente para a altura do conteúdo
            setElementMaxHeightToScrollHeight(resultsContainer);

        } else {
             // Se não há input suficiente, garante que esteja fechado (CSS cuida disso)
             resultsContainer.classList.remove('active', 'no-results-found');
             searchBar.classList.remove('results-visible');
             // max-height já foi resetado para null no início da função
        }
    }
    // --- FIM DA FUNÇÃO displayResults ---

    // Função principal que coordena a busca (AJUSTE MENOR NO LOADING)
    async function performSearch() {
        const searchTerm = searchInput.value.trim();
        // console.log(`Iniciando busca por: "${searchTerm}"`);

        if (searchTerm.length < 2) {
            // console.log("Termo de busca muito curto, limpando resultados.");
            displayResults([]); // Limpa e fecha
            return;
        }

        // Mostra indicador de loading
        resultsContainer.innerHTML = '<p class="no-results-message">Buscando...</p>';
        resultsContainer.classList.remove('no-results-found');
        resultsContainer.classList.add('active');
        searchBar.classList.add('results-visible');
        // Define uma altura MÍNIMA enquanto busca, mas permite expandir se necessário
        // Usaremos setElementMaxHeightToScrollHeight APÓS a busca, então aqui pode ser 0 ou um valor pequeno
        resultsContainer.style.maxHeight = '60px'; // Altura suficiente para a msg "Buscando..."

        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat();
            // console.log(`Busca concluída. Resultados brutos: ${combinedResults.length}.`);
            displayResults(combinedResults); // Exibe resultados e ajusta altura

        } catch (error) {
            console.error("Erro geral durante a pesquisa:", error);
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';
            resultsContainer.classList.add('active', 'no-results-found');
            searchBar.classList.add('results-visible');
            // Ajusta altura para a mensagem de erro
            setElementMaxHeightToScrollHeight(resultsContainer);
        }
    }

    // Debounced search function
    const debouncedSearch = debounce(performSearch, 350);

    // Listeners (SEM ALTERAÇÕES)
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (typeof debouncedSearch !== 'undefined' && debouncedSearch.__timeout) {
                 clearTimeout(debouncedSearch.__timeout);
            }
            performSearch();
        }
    });

    // Limpa resultados se input esvaziado
     searchInput.addEventListener('input', function() {
        if (searchInput.value.trim() === '') {
        //    console.log("Input vazio, limpando resultados.");
            if (typeof debouncedSearch !== 'undefined' && debouncedSearch.__timeout) {
               clearTimeout(debouncedSearch.__timeout);
            }
           displayResults([]); // Limpa e fecha
        }
    });
}

// Função para fechar o container de resultados ao clicar fora (SEM ALTERAÇÕES)
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');

    if (stickyContainer && resultsContainer && resultsContainer.classList.contains('active') && !stickyContainer.contains(event.target)) {
        // console.log("Clique fora detectado, fechando resultados.");
        resultsContainer.classList.remove('active', 'no-results-found');
        resultsContainer.style.maxHeight = null; // Deixa o CSS fechar
        if (searchBar) {
            searchBar.classList.remove('results-visible');
        }
    }
}