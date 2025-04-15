// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis (deve rodar em todas as páginas que os usam)
    setupCollapsible();

    // Configura a funcionalidade de pesquisa
    setupSearch();

    // Adiciona listener para fechar resultados ao clicar fora
    document.addEventListener('click', handleClickOutside);

    // Opcional: Chamar adjustActiveCollapsible no resize se houver problemas
    // window.addEventListener('resize', debounce(adjustActiveCollapsible, 150));
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

// Função para ajustar a altura de conteúdo colapsável ativo (se necessário no resize)
function adjustActiveCollapsible() {
    document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
        activeContent.style.transition = 'none';
        activeContent.style.maxHeight = 'none';
        const scrollHeight = activeContent.scrollHeight;
        activeContent.style.maxHeight = scrollHeight + 30 + 'px'; // 30 = padding-top + padding-bottom (15+15)
        requestAnimationFrame(() => {
            activeContent.style.transition = '';
        });
    });
}

// Função para configurar o acordeão (collapsible)
function setupCollapsible() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    if (toggleButtons.length === 0) {
        // console.log("Nenhum botão colapsável encontrado.");
        return;
    }

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;
        if (!content || !content.classList.contains('collapsible-content')) {
            console.warn("Botão toggle sem conteúdo colapsável adjacente:", button);
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;
            const isOpening = !currentButton.classList.contains('active');
            const parentContainer = currentButton.closest('.buttons-container');

            if (parentContainer) {
                parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    const otherContent = otherGroup.querySelector('.collapsible-content');
                    if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                        otherButton.classList.remove('active');
                        if (otherContent) {
                            otherContent.style.maxHeight = null;
                            otherContent.style.paddingTop = null;
                            otherContent.style.paddingBottom = null;
                            otherContent.classList.remove('active');
                        }
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
                    currentContent.style.paddingTop = '15px';
                    currentContent.style.paddingBottom = '15px';
                    currentContent.style.maxHeight = scrollHeight + 30 + "px";
                });
            } else {
                currentContent.style.maxHeight = null;
                currentContent.style.paddingTop = null;
                currentContent.style.paddingBottom = null;
            }
        });
    });

    // window.addEventListener('resize', debounce(adjustActiveCollapsible, 150));
}


// Função para configurar a pesquisa
function setupSearch() {
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');
    const searchInput = searchBar?.querySelector('input');
    const searchButton = searchBar?.querySelector('button');
    const resultsContainer = document.getElementById('search-results-container');

    // Verifica elementos essenciais
    if (!stickyContainer || !searchBar || !searchInput || !searchButton || !resultsContainer) {
        console.error("Elementos da pesquisa não encontrados. Verifique os seletores CSS e a estrutura HTML.", {
            stickyContainer, searchBar, searchInput, searchButton, resultsContainer
        });
        return; // Interrompe se algum elemento crucial faltar
    }
    console.log("Elementos da pesquisa encontrados."); // Log de sucesso na seleção

    // Lista de arquivos HTML para pesquisar
    const filesToSearch = [
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Index.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Secretaria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Tesouraria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Conselho.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Comissoes.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Consultas.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Prerrogativas.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/protocolos.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/processos.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/examedeordem.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/inssdigital.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/Tecnologia.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/ESA.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/ted.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/outros.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/cursoseventos.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/controladoria.html',
        'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/Setores/fiscalizacao.html',
    ];

    // Função assíncrona para buscar e analisar um arquivo HTML
    async function fetchAndSearchFile(rootRelativePath, searchTerm) {
        try {
            const response = await fetch(rootRelativePath);
            if (!response.ok) {
                // Log mais detalhado do erro de fetch
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
            // Log se encontrar algo no arquivo
            // if (uniqueMatches.length > 0) {
            //     console.log(`Encontrado(s) ${uniqueMatches.length} em ${rootRelativePath}`);
            // }
            return uniqueMatches;
        } catch (error) {
            console.error(`Erro ao processar o arquivo ${rootRelativePath}:`, error);
            return [];
        }
    }

    // --- FUNÇÃO displayResults MODIFICADA ---
    function displayResults(results) {
        // Limpa o container de resultados
        resultsContainer.innerHTML = '';
        // Remove as classes de estado para garantir que comece fechado
        resultsContainer.classList.remove('active');
        searchBar.classList.remove('results-visible');

        // Reseta estilos inline que poderiam interferir (opcional, mas seguro)
        resultsContainer.style.maxHeight = null;
        resultsContainer.style.paddingTop = null;
        resultsContainer.style.paddingBottom = null;
        // A opacidade e pointer-events são controlados pelo CSS via classe 'active'

        // Se há resultados para exibir
        if (results.length > 0) {
            console.log(`Exibindo ${results.length} resultados.`); // Log
            // Adiciona cada resultado ao container
            results.forEach(result => {
                resultsContainer.appendChild(result.element);
            });
            // Adiciona a classe 'active' para tornar o container visível (CSS fará a animação)
            resultsContainer.classList.add('active');
            // Adiciona a classe 'results-visible' à barra de pesquisa para o estilo conectado
            searchBar.classList.add('results-visible');
        }
        // Se não há resultados, mas o usuário pesquisou (input >= 2 caracteres)
        else if (searchInput.value.trim().length >= 2) {
            console.log("Nenhum resultado encontrado para exibir."); // Log
            // Cria e adiciona a mensagem "Nenhum resultado encontrado"
            const noResultsMsg = document.createElement('p');
            noResultsMsg.classList.add('no-results-message');
            noResultsMsg.textContent = 'Nenhum resultado encontrado.';
            resultsContainer.appendChild(noResultsMsg);
            // Adiciona a classe 'active' para mostrar a mensagem
            resultsContainer.classList.add('active');
            // Adiciona a classe 'results-visible' à barra para manter o estilo conectado
            searchBar.classList.add('results-visible');
        }
        // Se o input está vazio ou < 2 caracteres, as classes 'active' e 'results-visible'
        // permanecem removidas (como definido no início da função), escondendo o container.
    }
    // --- FIM DA FUNÇÃO displayResults MODIFICADA ---

    // Função principal que coordena a busca
    async function performSearch() {
        const searchTerm = searchInput.value.trim();
        console.log(`Iniciando busca por: "${searchTerm}"`); // Log

        if (searchTerm.length < 2) {
            console.log("Termo de busca muito curto, limpando resultados."); // Log
            displayResults([]); // Limpa os resultados
            return;
        }

        // Mostra algum feedback visual que a busca iniciou (opcional)
        // searchInput.style.cursor = 'wait';
        // searchButton.style.cursor = 'wait';

        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat();
            const allResults = Array.from(new Map(combinedResults.map(item => [`${item.element.href}-${item.element.textContent}`, item])).values());
            console.log(`Busca concluída. Resultados totais (únicos): ${allResults.length}`); // Log
            displayResults(allResults); // Exibe os resultados

        } catch (error) {
            console.error("Erro geral durante a execução da pesquisa:", error);
            // Exibe uma mensagem de erro genérica
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';
            resultsContainer.classList.add('active'); // Mostra o container de erro
            searchBar.classList.add('results-visible'); // Mantém a barra conectada
        } finally {
            // Restaura o cursor (opcional)
            // searchInput.style.cursor = '';
            // searchButton.style.cursor = '';
        }
    }

    // Cria uma versão "debounced" da função de busca
    const debouncedSearch = debounce(performSearch, 350);

    // Adiciona listeners
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });

    // Limpa resultados imediatamente se o campo for esvaziado
     searchInput.addEventListener('input', function() {
        if (searchInput.value.trim() === '') {
           console.log("Input vazio, limpando resultados."); // Log
           displayResults([]);
        }
    });
}

// Função para fechar o container de resultados se clicar fora
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');

    // Verifica se o clique foi fora do stickyContainer E se os resultados estão ativos
    if (stickyContainer && resultsContainer && !stickyContainer.contains(event.target) && resultsContainer.classList.contains('active')) {
        console.log("Clique fora detectado, fechando resultados."); // Log
        // Remove as classes para esconder/resetar estilos
        resultsContainer.classList.remove('active');
        if (searchBar) {
            searchBar.classList.remove('results-visible');
        }
        // Opcional: resetar estilos inline se necessário, mas o CSS deve cuidar disso
        // resultsContainer.style.maxHeight = null;
        // resultsContainer.style.paddingTop = null;
        // resultsContainer.style.paddingBottom = null;
    }
}