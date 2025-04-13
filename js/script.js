// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis (deve rodar em todas as páginas que os usam)
    setupCollapsible();

    // Configura a funcionalidade de pesquisa (tentará configurar em todas as páginas)
    // A barra de pesquisa agora é sticky via CSS, o JS só lida com a busca e exibição
    setupSearch();

    // Removemos a chamada para adjustContentPadding, pois o espaçamento
    // da barra de pesquisa é controlado por CSS (margin e position: sticky)
    // window.addEventListener('resize', debounce(adjustContentPadding, 150)); // Removido

    // Adiciona listener para fechar resultados ao clicar fora (só fará algo se o container existir e estiver ativo)
    document.addEventListener('click', handleClickOutside);
});

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

// Função adjustContentPadding foi removida pois o posicionamento sticky da
// barra de pesquisa agora é puramente CSS e o espaçamento é controlado por margins.


// Função para configurar o acordeão (collapsible) - SEM ALTERAÇÕES SIGNIFICATIVAS
function setupCollapsible() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    if (toggleButtons.length === 0) {
        return;
    }

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;

        if (!content || !content.classList.contains('collapsible-content')) {
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;

            if (!currentContent || !currentContent.classList.contains('collapsible-content')) {
                return;
            }

            const isOpening = !currentButton.classList.contains('active');

             const parentContainer = currentButton.closest('.buttons-container');
             if (parentContainer) {
                 parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    const otherContent = otherGroup.querySelector('.collapsible-content');

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


// Função para configurar a pesquisa - SEM ALTERAÇÕES SIGNIFICATIVAS NA LÓGICA DE BUSCA
function setupSearch() {
    // Seleciona os elementos DENTRO do .sticky-search-container
    const searchInput = document.querySelector('.sticky-search-container .search-bar input');
    const searchButton = document.querySelector('.sticky-search-container .search-bar button');
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container'); // O container principal da pesquisa

    // Verifica se os elementos básicos da pesquisa existem
    if (!searchInput || !searchButton || !resultsContainer || !stickyContainer) {
        // console.log("Estrutura de pesquisa não encontrada. Pesquisa desativada.");
        return;
    }

    // Lista de arquivos HTML para pesquisar (caminhos RELATIVOS À RAIZ DO SITE)
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

                    matches.push({
                        file: rootRelativePath,
                        element: linkResult
                    });
                }
            });

            const uniqueMatches = Array.from(new Map(matches.map(item => [`${item.element.href}-${item.element.textContent}`, item])).values());
            return uniqueMatches;

        } catch (error) {
            console.error(`Erro ao processar o arquivo ${rootRelativePath}:`, error);
            return [];
        }
    }

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
                    const maxHeight = Math.min(scrollHeight + 20, 300);
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

// Função para fechar o container de resultados se clicar fora - SEM ALTERAÇÕES SIGNIFICATIVAS
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container'); // O container principal da pesquisa

    // Só executa se os resultados estiverem ativos
    if (stickyContainer && resultsContainer && resultsContainer.classList.contains('active')) {
        // Verifica se o clique foi FORA do container sticky (que inclui a barra E os resultados)
        if (!stickyContainer.contains(event.target)) {
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null;
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            resultsContainer.style.overflowY = 'hidden';
        }
    }
}