// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis (deve rodar em todas as páginas que os usam)
    setupCollapsible();

    // Configura a funcionalidade de pesquisa (tentará configurar em todas as páginas)
    setupSearch();

    // Ajusta o posicionamento da barra de pesquisa fixa e o padding do content-wrap
    // Esta função agora lida com a barra de pesquisa fixa
    adjustLayoutForFixedSearch();
    window.addEventListener('resize', debounce(adjustLayoutForFixedSearch, 150));

    // Adiciona listener para fechar resultados ao clicar fora
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

// Função para ajustar o layout considerando a barra de pesquisa fixa
function adjustLayoutForFixedSearch() {
    const header = document.querySelector('.page-header');
    const fixedSearchContainer = document.querySelector('.fixed-search-container');
    const searchBar = document.querySelector('.search-bar'); // A barra visível
    const contentWrap = document.querySelector('.content-wrap');
    const buttonsContainer = document.querySelector('.buttons-container'); // Para obter o gap

    // Garante que os elementos essenciais existam
    if (!header || !fixedSearchContainer || !searchBar || !contentWrap || !buttonsContainer) {
        console.warn("Elementos essenciais para o layout fixo da pesquisa não encontrados.");
        // Define um padding padrão caso a pesquisa fixa não exista
        if (contentWrap) {
            contentWrap.style.paddingTop = '20px';
        }
        if (fixedSearchContainer) {
            fixedSearchContainer.style.top = '0'; // Fallback
        }
        return;
    }

    // Obtém a altura do cabeçalho
    const headerHeight = header.offsetHeight;

    // Obtém a altura da barra de pesquisa visível (incluindo padding/border)
    const searchBarHeight = searchBar.offsetHeight;

    // Obtém o valor do gap definido no CSS para .buttons-container
    // Usamos getComputedStyle para pegar o valor real aplicado pelo CSS
    const buttonsContainerStyles = window.getComputedStyle(buttonsContainer);
    const gapValue = parseFloat(buttonsContainerStyles.gap) || 20; // Fallback para 20px se não conseguir ler

    // Calcula a posição 'top' para o container fixo da pesquisa
    // Deve ficar abaixo do header com o mesmo espaçamento (gap) que os botões têm entre si
    const searchContainerTop = headerHeight + gapValue;
    fixedSearchContainer.style.top = `${searchContainerTop}px`;

    // Calcula o padding-top necessário para o content-wrap
    // Deve ser a altura do header + gap + altura da barra de pesquisa + outro gap
    const contentWrapPaddingTop = headerHeight + gapValue + searchBarHeight + gapValue;
    contentWrap.style.paddingTop = `${contentWrapPaddingTop}px`;
}


// Função para configurar o acordeão (collapsible) - SEM ALTERAÇÕES
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
                        // otherButton.classList.remove('active-style'); // Garante remoção de estilo ativo do botão - CSS lida com isso agora
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
                    // Padding é definido via CSS quando .active está presente
                    currentContent.style.maxHeight = scrollHeight + 30 + "px"; // Altura + padding (padding é 15 + 15 = 30)
                });
            } else {
                // Fecha
                currentContent.style.maxHeight = null; // Transição para 0 (definido no CSS ou via JS anterior)
                // Padding é removido via CSS quando .active é removido
            }
        });
    });

    // Recalcula max-height ao redimensionar a janela para acordeões abertos
    window.addEventListener('resize', debounce(() => {
        document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
            activeContent.style.transition = 'none'; // Desabilita transição temporariamente
            activeContent.style.maxHeight = 'none'; // Remove limite para recalcular
            const scrollHeight = activeContent.scrollHeight;
            activeContent.style.maxHeight = scrollHeight + 30 + 'px'; // Reaplica com padding (15+15)
            requestAnimationFrame(() => { // Reabilita transição
                activeContent.style.transition = '';
            });
        });
    }, 150));
}


// Função para configurar a pesquisa - SEM ALTERAÇÕES NA LÓGICA INTERNA, APENAS NOS SELETORES SE NECESSÁRIO
function setupSearch() {
    // Seleciona os elementos da barra de pesquisa (agora dentro de .fixed-search-container)
    const searchInput = document.querySelector('.fixed-search-container .search-bar input');
    const searchButton = document.querySelector('.fixed-search-container .search-bar button');
    const resultsContainer = document.getElementById('search-results-container');
    const searchBarContainer = document.querySelector('.search-bar'); // O container visual da barra

    // Verifica se os elementos essenciais para a pesquisa existem
    if (!searchInput || !searchButton || !resultsContainer || !searchBarContainer) {
        // console.log("Estrutura de pesquisa não encontrada. Pesquisa desativada nesta página.");
        return; // Interrompe a configuração da pesquisa se algum elemento faltar
    }

    // Lista de arquivos HTML para pesquisar (caminhos ABSOLUTOS)
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

    // Função assíncrona para buscar e processar um único arquivo HTML - SEM ALTERAÇÕES
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
                const elementText = element.textContent.trim().replace(/^>\s*/, ''); // Limpa texto
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

    // Função para exibir os resultados na tela - SEM ALTERAÇÕES NA ANIMAÇÃO/ESTILO
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

    // Função principal de pesquisa - SEM ALTERAÇÕES NA LÓGICA
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

    // Adiciona listeners para input, botão e Enter - SEM ALTERAÇÕES
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

// Função para fechar o container de resultados se clicar fora - AJUSTADA
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    // Precisamos verificar o clique fora da BARRA DE PESQUISA VISÍVEL e dos RESULTADOS
    const searchBar = document.querySelector('.search-bar'); // Barra visível

    // Só executa se a barra e os resultados existirem e os resultados estiverem ativos
    if (searchBar && resultsContainer && resultsContainer.classList.contains('active')) {
        // Verifica se o clique foi FORA da searchBar E FORA do resultsContainer
        if (!searchBar.contains(event.target) && !resultsContainer.contains(event.target)) {
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null; // Anima fechamento
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            resultsContainer.style.overflowY = 'hidden'; // Garante que scrollbar suma ao fechar
        }
    }
}