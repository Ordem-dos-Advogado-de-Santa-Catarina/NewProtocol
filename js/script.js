// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis (deve rodar em todas as páginas que os usam)
    setupCollapsible();

    // Configura a funcionalidade de pesquisa
    setupSearch();

    // Adiciona listener para fechar resultados ao clicar fora
    document.addEventListener('click', handleClickOutside);

    // Atualiza o ano no rodapé
    updateFooterYear(); // <<< NOVA CHAMADA DE FUNÇÃO

    // Opcional: Chamar adjustActiveCollapsible no resize se houver problemas
    // window.addEventListener('resize', debounce(adjustActiveCollapsible, 150));
});

// --- FUNÇÃO PARA ATUALIZAR O ANO DO RODAPÉ ---
function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) { // Verifica se o elemento existe
        const currentYear = new Date().getFullYear(); // Obtém o ano atual
        yearSpan.textContent = currentYear; // Insere o ano no span
        console.log("Ano do rodapé atualizado para:", currentYear);
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
                // Normaliza o texto (remove espaços extras, '>' inicial e converte para minúsculas)
                const elementText = element.textContent.trim().replace(/^>\s*/, '');
                const lowerElementText = elementText.toLowerCase();

                if (lowerElementText.includes(lowerSearchTerm)) {
                    let targetHref = rootRelativePath; // Link padrão é a própria página onde foi encontrado
                    if (element.tagName === 'A' && element.getAttribute('href')) {
                        const originalHref = element.getAttribute('href');
                        // Tenta resolver o href relativo à página onde foi encontrado
                        try {
                            // Usamos a URL completa do arquivo buscado como base
                            const resolvedUrl = new URL(originalHref, rootRelativePath);
                            targetHref = resolvedUrl.href;
                        } catch (e) {
                             console.warn(`Não foi possível resolver o href: ${originalHref} na base ${rootRelativePath}. Usando fallback: ${rootRelativePath}`);
                             targetHref = rootRelativePath; // Fallback se a resolução falhar
                        }
                    }
                    const linkResult = document.createElement('a');
                    linkResult.href = targetHref;
                    linkResult.textContent = elementText; // Usa o texto original (sem ser minúsculo) para exibição
                    linkResult.classList.add('search-result-item');
                    linkResult.title = `Encontrado em: ${rootRelativePath.substring(rootRelativePath.lastIndexOf('/') + 1)}`; // Mostra apenas nome do arquivo no title
                    matches.push({ file: rootRelativePath, element: linkResult, textKey: lowerElementText }); // Adiciona a chave de texto normalizado
                }
            });

            return matches; // Retorna todas as correspondências encontradas no arquivo
        } catch (error) {
            console.error(`Erro ao processar o arquivo ${rootRelativePath}:`, error);
            return [];
        }
    }

    // --- FUNÇÃO displayResults (SEM ALTERAÇÕES) ---
    function displayResults(results) {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('active');
        searchBar.classList.remove('results-visible');
        resultsContainer.style.maxHeight = null;
        resultsContainer.style.paddingTop = null;
        resultsContainer.style.paddingBottom = null;

        if (results.length > 0) {
            console.log(`Exibindo ${results.length} resultados únicos.`); // Log
            results.forEach(result => {
                resultsContainer.appendChild(result.element);
            });
            resultsContainer.classList.add('active');
            searchBar.classList.add('results-visible');
        }
        else if (searchInput.value.trim().length >= 2) {
            console.log("Nenhum resultado encontrado para exibir."); // Log
            const noResultsMsg = document.createElement('p');
            noResultsMsg.classList.add('no-results-message');
            noResultsMsg.textContent = 'Nenhum resultado encontrado.';
            resultsContainer.appendChild(noResultsMsg);
            resultsContainer.classList.add('active');
            searchBar.classList.add('results-visible');
        }
    }
    // --- FIM DA FUNÇÃO displayResults ---

    // Função principal que coordena a busca
    async function performSearch() {
        const searchTerm = searchInput.value.trim();
        console.log(`Iniciando busca por: "${searchTerm}"`); // Log

        if (searchTerm.length < 2) {
            console.log("Termo de busca muito curto, limpando resultados."); // Log
            displayResults([]); // Limpa os resultados
            return;
        }

        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat(); // Junta todos os resultados de todos os arquivos

            // Desduplica baseado APENAS no texto normalizado (textKey)
            const uniqueResultsMap = new Map(
                combinedResults.map(item => [item.textKey, item]) // Usa textKey como chave
            );
            const allUniqueResults = Array.from(uniqueResultsMap.values());

            console.log(`Busca concluída. Resultados totais encontrados: ${combinedResults.length}. Resultados únicos (por texto): ${allUniqueResults.length}`); // Log
            displayResults(allUniqueResults); // Exibe os resultados únicos

        } catch (error) {
            console.error("Erro geral durante a execução da pesquisa:", error);
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';
            resultsContainer.classList.add('active');
            searchBar.classList.add('results-visible');
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

    if (stickyContainer && resultsContainer && !stickyContainer.contains(event.target) && resultsContainer.classList.contains('active')) {
        console.log("Clique fora detectado, fechando resultados."); // Log
        resultsContainer.classList.remove('active');
        if (searchBar) {
            searchBar.classList.remove('results-visible');
        }
    }
}