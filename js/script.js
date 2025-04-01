// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis (deve rodar em todas as páginas que os usam)
    setupCollapsible();

    // Configura a funcionalidade de pesquisa (tentará configurar em todas as páginas)
    setupSearch();

    // Ajusta o padding do content-wrap inicialmente e no resize
    // A função adjustContentPadding já verifica internamente se o sticky container existe
    adjustContentPadding();
    window.addEventListener('resize', debounce(adjustContentPadding, 150));

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

// Função para ajustar o padding-top do conteúdo principal
function adjustContentPadding() {
    const stickyContainer = document.querySelector('.sticky-search-container');
    const contentWrap = document.querySelector('.content-wrap');

    // Garante que contentWrap exista
    if (!contentWrap) return;

    if (stickyContainer) {
        // Se o container sticky existir, calcula a altura e adiciona padding
        const stickyHeight = stickyContainer.offsetHeight;
        contentWrap.style.paddingTop = `${stickyHeight + 15}px`; // Adiciona margem extra
    } else {
        // Se não houver container sticky, aplica um padding padrão
        // Pode ajustar este valor se necessário para páginas sem sticky search
        contentWrap.style.paddingTop = '20px'; // Padding padrão
    }
}


// Função para configurar o acordeão (collapsible)
function setupCollapsible() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    // Se não houver botões toggle na página, não faz nada
    if (toggleButtons.length === 0) {
        return;
    }

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;

        // Verifica se o próximo elemento existe e é o conteúdo colapsável esperado
        if (!content || !content.classList.contains('collapsible-content')) {
            // console.warn('Botão toggle sem conteúdo colapsável correspondente:', button); // Comentado para não poluir
            return; // Pula este botão se não encontrar o conteúdo
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;

            // Verificação dupla (redundante mas segura)
            if (!currentContent || !currentContent.classList.contains('collapsible-content')) {
                return;
            }

            const isOpening = !currentButton.classList.contains('active');

            // Fecha todos os OUTROS painéis abertos ANTES de abrir o atual NO MESMO container de botões
             const parentContainer = currentButton.closest('.buttons-container'); // Encontra o container pai dos botões
             if (parentContainer) {
                 parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    const otherContent = otherGroup.querySelector('.collapsible-content');

                    // Garante que estamos olhando para um grupo diferente do atual e que ele está ativo
                    if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                        otherButton.classList.remove('active');
                        otherButton.classList.remove('active-style'); // Garante remoção de estilo ativo do botão
                         otherButton.nextElementSibling.style.maxHeight = null; // Fecha o outro painel
                         otherButton.nextElementSibling.style.paddingTop = null;
                         otherButton.nextElementSibling.style.paddingBottom = null;
                         otherButton.nextElementSibling.classList.remove('active'); // Garante remoção de classe ativa do conteúdo
                    }
                });
            }


            // Alterna o estado (classe 'active') do botão e do conteúdo atual
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            // Anima a abertura ou fechamento
            if (isOpening) {
                // Abre
                currentContent.style.maxHeight = 'none'; // Permite cálculo da altura total
                const scrollHeight = currentContent.scrollHeight;
                currentContent.style.maxHeight = '0px'; // Volta para 0 antes da transição

                requestAnimationFrame(() => {
                    currentContent.style.paddingTop = '15px';
                    currentContent.style.paddingBottom = '15px';
                    currentContent.style.maxHeight = scrollHeight + 30 + "px"; // Altura + padding
                });
            } else {
                // Fecha
                currentContent.style.maxHeight = null; // Transição para 0 (definido no CSS ou via JS anterior)
                currentContent.style.paddingTop = null;
                currentContent.style.paddingBottom = null;
            }
        });
    });

    // Recalcula max-height ao redimensionar a janela para acordeões abertos
    window.addEventListener('resize', debounce(() => {
        document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
            activeContent.style.transition = 'none'; // Desabilita transição temporariamente
            activeContent.style.maxHeight = 'none'; // Remove limite para recalcular
            const scrollHeight = activeContent.scrollHeight;
            activeContent.style.maxHeight = scrollHeight + 30 + 'px'; // Reaplica com padding
            requestAnimationFrame(() => { // Reabilita transição
                activeContent.style.transition = '';
            });
        });
    }, 150));
}


// Função para configurar a pesquisa
function setupSearch() {
    // Seleciona os elementos da barra de pesquisa, assumindo que estão dentro de .sticky-search-container
    // Se não encontrar dentro do sticky, não configura a pesquisa avançada
    const searchInput = document.querySelector('.sticky-search-container .search-bar input');
    const searchButton = document.querySelector('.sticky-search-container .search-bar button');
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container');

    // Verifica se TODOS os elementos essenciais para a pesquisa avançada existem
    if (!searchInput || !searchButton || !resultsContainer || !stickyContainer) {
        // console.log("Estrutura de pesquisa avançada (sticky + resultados) não encontrada. Pesquisa global desativada nesta página.");
        return; // Interrompe a configuração da pesquisa avançada se algum elemento faltar
    }

    // --- Continua apenas se a estrutura completa for encontrada ---

    // Lista de arquivos HTML para pesquisar (caminhos relativos à RAIZ do site)
    const filesToSearch = [
        '/Main.html', // Página inicial
        '../Setores/Secretaria.html',
        '../Setores/Tesouraria.html',
        '../Setores/Protocolos.html'
        // Adicione mais arquivos aqui, sempre começando com '/'
    ];

    // Função assíncrona para buscar e processar um único arquivo HTML
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

            // Elementos pesquisáveis: links .btn, botões .toggle-btn, links .sub-link, títulos .page-title
            const elementsToSearch = doc.querySelectorAll('a.btn, button.toggle-btn, a.sub-link, h2.page-title');
            const matches = [];
            const lowerSearchTerm = searchTerm.toLowerCase();

            elementsToSearch.forEach(element => {
                const elementText = element.textContent.trim().replace(/^>\s*/, ''); // Limpa texto
                const lowerElementText = elementText.toLowerCase();

                if (lowerElementText.includes(lowerSearchTerm)) {
                    let targetHref = rootRelativePath; // Link padrão é a página onde foi encontrado

                    if (element.tagName === 'A' && element.getAttribute('href')) {
                        const originalHref = element.getAttribute('href');
                        if (originalHref.startsWith('http')) {
                            targetHref = originalHref; // Absoluto
                        } else if (originalHref.startsWith('#')) {
                            targetHref = rootRelativePath + originalHref; // Âncora
                        } else if (originalHref.startsWith('/')) {
                            targetHref = originalHref; // Já root-relative
                        } else {
                            // Tenta resolver href relativo ao path do arquivo
                             try {
                                const fileUrl = new URL(rootRelativePath, window.location.origin);
                                const resolvedUrl = new URL(originalHref, fileUrl);
                                targetHref = resolvedUrl.pathname + resolvedUrl.search + resolvedUrl.hash;
                             } catch (e) {
                                 console.warn(`Não foi possível resolver o href relativo: ${originalHref} em ${rootRelativePath}`);
                                 targetHref = rootRelativePath; // Fallback
                             }
                        }
                    }
                    // Para H2 e BUTTON, o targetHref permanece rootRelativePath

                    const linkResult = document.createElement('a');
                    linkResult.href = targetHref;
                    linkResult.textContent = elementText;
                    linkResult.classList.add('search-result-item');
                    linkResult.title = `Encontrado em: ${rootRelativePath}`; // Tooltip útil

                    matches.push({
                        file: rootRelativePath,
                        element: linkResult
                    });
                }
            });

            // Filtra duplicatas (mesmo link e texto) vindas do MESMO arquivo
            const uniqueMatches = Array.from(new Map(matches.map(item => [`${item.element.href}-${item.element.textContent}`, item])).values());
            return uniqueMatches;

        } catch (error) {
            console.error(`Erro ao processar o arquivo ${rootRelativePath}:`, error);
            return [];
        }
    }

    // Função para exibir os resultados na tela
    function displayResults(results) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        resultsContainer.style.maxHeight = null;
        resultsContainer.style.paddingTop = null;
        resultsContainer.style.paddingBottom = null;
        resultsContainer.style.overflowY = 'hidden'; // Garante que não haja scrollbar inicialmente

        if (results.length > 0) {
            results.forEach(result => {
                resultsContainer.appendChild(result.element);
            });
            resultsContainer.classList.add('active');

            requestAnimationFrame(() => {
                resultsContainer.style.maxHeight = 'none'; // Calcula altura necessária
                const scrollHeight = resultsContainer.scrollHeight;
                resultsContainer.style.maxHeight = '0px'; // Volta a 0

                requestAnimationFrame(() => {
                    resultsContainer.style.paddingTop = '10px';
                    resultsContainer.style.paddingBottom = '10px';
                    const maxHeight = Math.min(scrollHeight + 20, 300); // Limita altura máxima (ex: 300px)
                    resultsContainer.style.maxHeight = maxHeight + "px";
                    // Adiciona scroll vertical APENAS se o conteúdo exceder a altura máxima
                    resultsContainer.style.overflowY = (scrollHeight + 20 > maxHeight) ? 'auto' : 'hidden';
                });
            });
        } else if (searchInput.value.trim().length >= 2) {
            // Mostra "Nenhum resultado"
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

    // Função principal de pesquisa
    async function performSearch() {
        const searchTerm = searchInput.value.trim();

        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null;
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            resultsContainer.style.overflowY = 'hidden';
            return;
        }

        let allResults = [];
        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat();

            // Filtra duplicatas GERAIS (mesmo link/texto de arquivos diferentes)
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

    // Adiciona listeners para input, botão e Enter
    const debouncedSearch = debounce(performSearch, 350);
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });

    // Limpa resultados se o campo for limpo
     searchInput.addEventListener('input', function() {
        if (searchInput.value.trim() === '') {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null;
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            resultsContainer.style.overflowY = 'hidden';
        }
    });
}

// Função para fechar o container de resultados se clicar fora
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container');

    // Só executa se a estrutura sticky existir e os resultados estiverem ativos
    if (stickyContainer && resultsContainer && resultsContainer.classList.contains('active')) {
        // Verifica se o clique foi FORA do container sticky
        if (!stickyContainer.contains(event.target)) {
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null; // Anima fechamento
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            // Garante que scrollbar suma ao fechar
            resultsContainer.style.overflowY = 'hidden';
        }
    }
}