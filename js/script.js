// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis
    setupCollapsible();

    // Configura a funcionalidade de pesquisa
    setupSearch();

    // Posiciona a barra de pesquisa fixa e ajusta o padding/margem do conteúdo
    // Essa função agora lida com ambos os ajustes
    adjustLayoutForFixedElements();

    // Adiciona listeners para reajustar em resize e scroll (scroll pode afetar header se ele mudar)
    window.addEventListener('resize', debounce(adjustLayoutForFixedElements, 150));
    // Removido listener de scroll, pois header é fixo e não muda com scroll
    // window.addEventListener('scroll', debounce(adjustLayoutForFixedElements, 150));

    // Adiciona listener para fechar resultados ao clicar fora
    document.addEventListener('click', handleClickOutside);
});

// Função de Debounce genérica (sem alterações)
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

// Função para posicionar a barra de pesquisa e ajustar o layout do conteúdo
function adjustLayoutForFixedElements() {
    const header = document.querySelector('.page-header');
    const fixedSearchContainer = document.querySelector('.fixed-search-container');
    const contentWrap = document.querySelector('.content-wrap');

    // Garante que todos os elementos existam
    if (!header || !fixedSearchContainer || !contentWrap) {
        console.warn("Elementos essenciais (header, fixed-search-container, content-wrap) não encontrados para ajuste de layout.");
        return;
    }

    // 1. Calcula a altura do header
    const headerHeight = header.offsetHeight;

    // 2. Define a posição 'top' do container da barra de pesquisa fixa
    //    Posiciona 15px abaixo do header
    fixedSearchContainer.style.top = `${headerHeight + 15}px`;

    // 3. Calcula a altura total ocupada pelos elementos fixos (header + search container + gap)
    //    É importante obter a altura do search container *depois* de definir seu 'top'
    //    Usamos requestAnimationFrame para garantir que o navegador recalcule o layout
    requestAnimationFrame(() => {
        const searchContainerHeight = fixedSearchContainer.offsetHeight;
        // O espaço total necessário no topo da página é a altura do header + 15px de espaço + altura da search bar + um espaço extra abaixo dela
        const totalFixedHeight = headerHeight + 15 + searchContainerHeight + 20; // Adiciona 20px de margem extra

        // 4. Ajusta o margin-top do content-wrap para que ele comece abaixo dos elementos fixos
        contentWrap.style.marginTop = `${totalFixedHeight}px`;

        // 5. Remove o padding-top do body se existir (ou ajusta conforme necessário)
        //    Neste caso, o content-wrap controla o espaço
        document.body.style.paddingTop = '0'; // Remove padding do body, já que o content-wrap tem margem

    });
}


// Função para configurar o acordeão (collapsible) - SEM ALTERAÇÕES NECESSÁRIAS
function setupCollapsible() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    if (toggleButtons.length === 0) return;

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;
        if (!content || !content.classList.contains('collapsible-content')) return;

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;
            if (!currentContent || !currentContent.classList.contains('collapsible-content')) return;

            const isOpening = !currentButton.classList.contains('active');
            const parentContainer = currentButton.closest('.buttons-container');
            if (parentContainer) {
                parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                        otherButton.classList.remove('active');
                        otherButton.nextElementSibling.style.maxHeight = null;
                        otherButton.nextElementSibling.style.paddingTop = null;
                        otherButton.nextElementSibling.style.paddingBottom = null;
                        otherButton.nextElementSibling.classList.remove('active');
                    }
                });
            }

            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            if (isOpening) {
                currentContent.style.maxHeight = 'none';
                const scrollHeight = currentContent.scrollHeight;
                currentContent.style.maxHeight = '0px';
                requestAnimationFrame(() => {
                    currentContent.style.maxHeight = scrollHeight + 30 + "px"; // Altura + padding (15+15)
                });
            } else {
                currentContent.style.maxHeight = null;
            }
        });
    });

    window.addEventListener('resize', debounce(() => {
        document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
            activeContent.style.transition = 'none';
            activeContent.style.maxHeight = 'none';
            const scrollHeight = activeContent.scrollHeight;
            activeContent.style.maxHeight = scrollHeight + 30 + 'px';
            requestAnimationFrame(() => {
                activeContent.style.transition = '';
            });
        });
    }, 150));
}


// Função para configurar a pesquisa - ADAPTADA PARA NOVA ESTRUTURA
function setupSearch() {
    // Seleciona elementos dentro da nova estrutura
    const searchInput = document.querySelector('.fixed-search-container .search-bar input');
    const searchButton = document.querySelector('.fixed-search-container .search-bar button');
    const resultsContainer = document.getElementById('search-results-container');
    // O container principal agora é o wrapper ou o container fixo, dependendo do contexto necessário
    const searchWrapper = document.querySelector('.fixed-search-container .search-bar-wrapper');

    // Verifica se os elementos essenciais existem
    if (!searchInput || !searchButton || !resultsContainer || !searchWrapper) {
        console.log("Estrutura de pesquisa fixa não encontrada completamente. Pesquisa desativada.");
        return;
    }

    // Lista de arquivos para pesquisar (sem alterações)
    const filesToSearch = [
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Index.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Secretaria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Tesouraria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Conselho.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/examedeordem.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/inssdigital.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Tecnologia.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/ESA.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/ted.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/fiscalizacao.html',
    ];

    // Função fetchAndSearchFile (sem alterações na lógica interna de busca)
    async function fetchAndSearchFile(rootRelativePath, searchTerm) {
        try {
            const response = await fetch(rootRelativePath);
            if (!response.ok) {
                console.error(`Erro ao buscar ${rootRelativePath}: ${response.statusText}`);
                return [];
            }
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const elementsToSearch = doc.querySelectorAll('a.btn, button.toggle-btn, a.sub-link, h2.page-title');
            const matches = [];
            const lowerSearchTerm = searchTerm.toLowerCase();

            elementsToSearch.forEach(element => {
                const elementText = element.textContent.trim().replace(/^>\s*/, '');
                const lowerElementText = elementText.toLowerCase();
                if (lowerElementText.includes(lowerSearchTerm)) {
                    let targetHref = rootRelativePath;
                    if (element.tagName === 'A' && element.getAttribute('href')) {
                        const originalHref = element.getAttribute('href');
                        const baseUrl = new URL(rootRelativePath, window.location.origin);
                        try {
                            const resolvedUrl = new URL(originalHref, baseUrl);
                            targetHref = resolvedUrl.href;
                        } catch (e) {
                             console.warn(`Não foi possível resolver o href: ${originalHref} na base ${baseUrl}. Usando fallback: ${rootRelativePath}`);
                             targetHref = rootRelativePath;
                        }
                    }
                    const linkResult = document.createElement('a');
                    linkResult.href = targetHref;
                    linkResult.textContent = elementText;
                    linkResult.classList.add('search-result-item');
                    linkResult.title = `Encontrado em: ${rootRelativePath}`;
                    matches.push({ file: rootRelativePath, element: linkResult });
                }
            });
            const uniqueMatches = Array.from(new Map(matches.map(item => [`${item.element.href}-${item.element.textContent}`, item])).values());
            return uniqueMatches;
        } catch (error) {
            console.error(`Erro ao processar o arquivo ${rootRelativePath}:`, error);
            return [];
        }
    }

    // Função displayResults (sem alterações na lógica interna de exibição)
    function displayResults(results) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        resultsContainer.style.maxHeight = null;
        resultsContainer.style.paddingTop = null;
        resultsContainer.style.paddingBottom = null;
        resultsContainer.style.overflowY = 'hidden';

        if (results.length > 0) {
            results.forEach(result => {
                resultsContainer.appendChild(result.element);
            });
            resultsContainer.classList.add('active');
            requestAnimationFrame(() => {
                resultsContainer.style.maxHeight = 'none';
                const scrollHeight = resultsContainer.scrollHeight;
                resultsContainer.style.maxHeight = '0px';
                requestAnimationFrame(() => {
                    resultsContainer.style.paddingTop = '10px';
                    resultsContainer.style.paddingBottom = '10px';
                    const maxHeight = Math.min(scrollHeight + 20, 300); // Limita altura máxima (ex: 300px)
                    resultsContainer.style.maxHeight = maxHeight + "px";
                    resultsContainer.style.overflowY = (scrollHeight + 20 > maxHeight) ? 'auto' : 'hidden';
                });
            });
        } else if (searchInput.value.trim().length >= 2) {
            const noResultsMsg = document.createElement('p');
            noResultsMsg.classList.add('no-results-message');
            noResultsMsg.textContent = 'Nenhum resultado encontrado.';
            resultsContainer.appendChild(noResultsMsg);
            resultsContainer.classList.add('active');
            requestAnimationFrame(() => {
                resultsContainer.style.maxHeight = 'none';
                const scrollHeight = resultsContainer.scrollHeight;
                resultsContainer.style.maxHeight = '0px';
                requestAnimationFrame(() => {
                    resultsContainer.style.paddingTop = '10px';
                    resultsContainer.style.paddingBottom = '10px';
                    resultsContainer.style.maxHeight = scrollHeight + 20 + "px";
                    resultsContainer.style.overflowY = 'hidden';
                });
            });
        }
    }

    // Função performSearch (sem alterações na lógica interna)
    async function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length < 2) {
            displayResults([]);
            return;
        }
        let allResults = [];
        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));
        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat();
            allResults = Array.from(new Map(combinedResults.map(item => [`${item.element.href}-${item.element.textContent}`, item])).values());
            displayResults(allResults);
        } catch (error) {
            console.error("Erro geral durante a pesquisa:", error);
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';
            resultsContainer.classList.add('active');
             requestAnimationFrame(() => {
                 resultsContainer.style.maxHeight = 'none';
                 const scrollHeight = resultsContainer.scrollHeight;
                 resultsContainer.style.maxHeight = '0px';
                 requestAnimationFrame(() => {
                    resultsContainer.style.paddingTop = '10px';
                    resultsContainer.style.paddingBottom = '10px';
                    resultsContainer.style.maxHeight = scrollHeight + 20 + "px";
                    resultsContainer.style.overflowY = 'hidden';
                 });
            });
        }
    }

    // Adiciona listeners (sem alterações)
    const debouncedSearch = debounce(performSearch, 350);
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });
     searchInput.addEventListener('input', function() {
        if (searchInput.value.trim() === '') {
           displayResults([]);
        }
    });
}

// Função para fechar o container de resultados se clicar fora - ADAPTADA
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    // Verifica se o clique foi fora do WRAPPER da barra de pesquisa (que contém a barra e os resultados)
    const searchWrapper = document.querySelector('.fixed-search-container .search-bar-wrapper');

    // Só executa se o wrapper existir e os resultados estiverem ativos
    if (searchWrapper && resultsContainer && resultsContainer.classList.contains('active')) {
        // Verifica se o clique foi FORA do searchWrapper
        if (!searchWrapper.contains(event.target)) {
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null; // Anima fechamento
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            resultsContainer.style.overflowY = 'hidden'; // Garante que scrollbar suma ao fechar
        }
    }
}