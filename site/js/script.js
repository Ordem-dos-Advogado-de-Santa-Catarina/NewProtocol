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

    // Executa a animação sequencial dos botões E a animação do H1 na carga da página
    animateButtonsSequentially();
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
    // Usamos once: true aqui porque este listener é APENHAS para a transição de ABERTURA.
    element.addEventListener('transitionend', function handler(e) {
        // Verifica se a transição que terminou foi a de max-height
        if (e.propertyName === 'max-height') {
            // Só remove o maxHeight inline se ele ainda for o valor calculado,
            // evitando problemas se o usuário fechar antes de terminar.
            // E verifica se o elemento ainda está ativo (significa que a abertura foi bem sucedida e não foi interrompida).
             // Verifica se o elemento é um colapsável normal (não o container de pesquisa)
             // O container de pesquisa tem seu maxHeight ajustado dinamicamente
             if (element.classList.contains('active') && (!element.id || element.id !== 'search-results-container')) {
                  // Verifica se o max-height calculado é o valor atual no elemento antes de setar para none
                 // (pequena tolerância para floating point issues)
                 if (Math.abs(parseFloat(element.style.maxHeight) - scrollHeight) < 2) {
                      element.style.maxHeight = 'none';
                 }
             }
            // O listener é removido automaticamente por { once: true }
        }
    }, { once: true }); // Roda este listener apenas uma vez após a primeira transição de abertura
}

// --- NOVA FUNÇÃO para ajustar a altura SOMENTE do container de resultados da pesquisa ---
function adjustSearchResultsContainerHeight() {
    const resultsContainer = document.getElementById('search-results-container');
    const searchBar = document.querySelector('.sticky-search-container .search-bar');
    const footer = document.getElementById('Footer_footer'); // Adicionado ID ao footer no HTML

    // Só ajusta se o container de resultados estiver ativo e os elementos necessários existirem
    if (!resultsContainer || !resultsContainer.classList.contains('active') || !searchBar || !footer) {
        // Se não estiver ativo, garante que max-height é 0 para o CSS cuidar da transição de fechamento
        if(resultsContainer && !resultsContainer.classList.contains('active')){
             requestAnimationFrame(() => {
                 // Garante que a transição está habilitada para o fechamento
                 resultsContainer.style.transition = ''; // Reseta para a transição CSS
                 resultsContainer.style.maxHeight = '0px';
            });
        }
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
    // Usamos 'none' ou um valor grande para medir a altura natural do conteúdo
    resultsContainer.style.transition = 'none';
    resultsContainer.style.maxHeight = '10000px'; // Permite que o conteúdo ocupe a altura real para medição

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
    // O listener transitionend para limpar maxHeight='none' da abertura não se aplica aqui.
}


// Função para ajustar a altura de TODOS os colapsáveis ativos E resultados de pesquisa (no resize)
function adjustActiveCollapsibleHeightsAndSearchResults() {
    // Ajusta colapsáveis normais (define max-height para scrollHeight)
    document.querySelectorAll('.collapsible-content.active').forEach(activeElement => {
        // Exclui o container de resultados da pesquisa, que é tratado separadamente
        if (activeElement.id === 'search-results-container') {
            return;
        }

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
             // Verifica se o elemento AINDA está ativo.
            if (activeElement.classList.contains('active')) {
                 activeElement.style.maxHeight = 'none'; // Permite fluxo natural
            } else {
                 // Se não estiver mais ativo (fechou durante o resize), garante que maxHeight seja 0.
                 activeElement.style.maxHeight = '0px';
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
            // Verifica o estado ANTES de mudar as classes
            const isAlreadyActive = currentButton.classList.contains('active');
            const parentContainer = currentButton.closest('.buttons-container');

            // Fecha outros acordeões no mesmo container (se houver)
            if (parentContainer) {
                parentContainer.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                    const otherButton = otherGroup.querySelector('.toggle-btn');
                    const otherContent = otherGroup.querySelector('.collapsible-content');
                    // Fecha apenas se for OUTRO botão e se ele ESTIVER ativo
                    if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                        // Lógica de fechamento suave para o outro botão/conteúdo
                        const otherScrollHeight = otherContent.scrollHeight;

                         // Se a altura for 0 ou quase 0, apenas remove as classes sem animar.
                        if (otherScrollHeight < 5) { // Use um pequeno limiar
                             otherButton.classList.remove('active');
                             otherContent.classList.remove('active');
                             otherContent.style.maxHeight = ''; // Limpa o estilo inline
                             return;
                        }

                        // Define o maxHeight para a altura medida antes de iniciar a transição para 0.
                        otherContent.style.transition = 'none'; // Desabilita temporariamente a transição
                        otherContent.style.maxHeight = otherScrollHeight + 'px'; // Define a altura inicial

                        otherContent.offsetHeight; // Força reflow

                        requestAnimationFrame(() => {
                            otherContent.style.transition = ''; // Reabilita a transição CSS
                            otherButton.classList.remove('active'); // Remove a classe aqui
                            otherContent.classList.remove('active'); // Remove a classe aqui
                            otherContent.style.maxHeight = '0px'; // Anima para 0px
                        });

                         // Listener para limpar maxHeight='0px' após a transição de fechamento do outro elemento
                        otherContent.addEventListener('transitionend', function handler(e) {
                             if (e.propertyName === 'max-height' && !otherContent.classList.contains('active')) {
                                 otherContent.style.maxHeight = ''; // Limpa a propriedade inline 'maxHeight' (agora '0px')
                             }
                        }, { once: true }); // Roda apenas uma vez
                    }
                });
            }

            // Lógica para o botão clicado
            if (!isAlreadyActive) { // Se NÃO estava ativo antes, significa que está ABRINDO
                // Adiciona as classes primeiro para que os estilos de .active (como padding) sejam aplicados
                currentButton.classList.add('active');
                currentContent.classList.add('active');

                // Chama a função revisada para definir o max-height e animar a abertura
                setElementMaxHeightToScrollHeight(currentContent);

            } else { // Se estava ativo antes, significa que está FECHANDO
                const currentContent = currentButton.nextElementSibling; // Garante acesso ao elemento correto

                // 1. Mede a altura atual enquanto a classe 'active' ainda está presente.
                const startHeight = currentContent.scrollHeight;

                 // Se a altura inicial for 0 ou quase 0, apenas remove as classes sem animar.
                if (startHeight < 5) { // Use um pequeno limiar
                    currentButton.classList.remove('active');
                    currentContent.classList.remove('active');
                    currentContent.style.maxHeight = ''; // Limpa o estilo inline
                    // Não precisa de transitionend se não animou
                    return;
                }


                // 2. Define o maxHeight explicitamente para a altura medida para garantir o ponto de partida da animação.
                // Temporariamente desabilita a transição para aplicar o valor inicial sem animação
                currentContent.style.transition = 'none';
                currentContent.style.maxHeight = startHeight + 'px';

                // 3. Força um reflow para garantir que a nova altura seja aplicada antes de iniciar a transição para 0.
                currentContent.offsetHeight;

                // 4. Remove as classes e define maxHeight para 0px dentro de requestAnimationFrame para iniciar a animação suave.
                requestAnimationFrame(() => {
                    // Reabilita a transição (usará a definida no CSS)
                    currentContent.style.transition = '';

                    // Remove as classes 'active' para desativar estilos dependentes e resetar maxHeight no CSS para 0.
                    currentButton.classList.remove('active');
                    currentContent.classList.remove('active');

                    // Explicitamente define maxHeight para 0px para garantir a animação a partir da altura inicial.
                    currentContent.style.maxHeight = '0px';
                });

                // 5. Adiciona listener para limpar o style.maxHeight='0px' após a transição de fechamento terminar.
                // Usa once: true para garantir que rode apenas uma vez para este fechamento.
                currentContent.addEventListener('transitionend', function handler(e) {
                    // Verifica se a transição foi de max-height e se o elemento não está mais ativo (terminou de fechar)
                    if (e.propertyName === 'max-height' && !currentContent.classList.contains('active')) {
                        // Limpa a propriedade maxHeight inline
                        currentContent.style.maxHeight = '';
                         // Remove o listener (já garantido por once: true)
                    }
                }, { once: true }); // Roda apenas uma vez

            }
        });

        // Pré-calcula altura se já estiver ativo no carregamento (se aplicável no futuro)
        // Esta lógica precisaria ser revista para usar o setElementMaxHeightToScrollHeight se quiséssemos animar na carga
        // if (button.classList.contains('active') && content.classList.contains('active')) {
        //    content.style.maxHeight = 'none'; // Permite fluxo natural inicial
        //    adjustActiveCollapsibleHeight(); // Ajusta para a altura correta
        // }
    });
}


// Função para configurar a pesquisa - MODIFICADA PARA TRATAR ESTADO SEM RESULTADOS E ADICIONAR ANIMAÇÃO
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
        'http://gaspar.oab-sc.org.br/newprotocol/index.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/secretaria.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/tesouraria.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/conselho.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/comissoes.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/consultas.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/prerrogativas.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/protocolos.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/examedeordem.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/inssdigital.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/tecnologia.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/esa.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/ted.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/cursoseventos.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/controladoria.html',
        'http://gaspar.oab-sc.org.br/newprotocol/setores/fiscalizacao.html',
        'http://gaspar.oab-sc.org.br/newprotocol/manuais/manuais.html',
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

    // --- FUNÇÃO displayResults (REVISADA PARA ABERTURA CORRETA, ESTADO DE ERRO E ANIMAÇÃO) ---
    function displayResults(results) {
        // Remove todas as classes de estado antes de aplicar as novas
        resultsContainer.classList.remove('active', 'no-results-found');
        searchBar.classList.remove('results-visible', 'no-results-found');
        stickyContainer.classList.remove('search-no-results'); // Remove a classe do container pai

        const hasInput = searchInput.value.trim().length >= 2;

        if (hasInput) {
             resultsContainer.innerHTML = ''; // Limpa o conteúdo anterior (incluindo "Buscando...")

             // Desduplica resultados
             const uniqueResultsMap = new Map(
                results.map(item => [item.dedupKey, item])
            );
            const uniqueResults = Array.from(uniqueResultsMap.values());

            if (uniqueResults.length > 0) {
                uniqueResults.forEach(result => {
                    resultsContainer.appendChild(result.element);
                });
                // Adiciona a classe active para iniciar a animação de abertura CSS (padding)
                resultsContainer.classList.add('active');
                searchBar.classList.add('results-visible');
                 // Garante que a classe de erro é removida se houver resultados
                 stickyContainer.classList.remove('search-no-results');

                // Ajusta o max-height dinamicamente para a altura do conteúdo, limitada pelo espaço disponível
                // Isso também inicia a animação de abertura (max-height de 0 para o calculado)
                adjustSearchResultsContainerHeight();

                 // --- ADICIONA LÓGICA DE ANIMAÇÃO SEQUENCIAL PARA RESULTADOS ---
                 // Seleciona os itens de resultado APÓS serem adicionados ao DOM
                 const resultItemsToAnimate = resultsContainer.querySelectorAll('.search-result-item');

                 if (resultItemsToAnimate.length > 0) {
                     // Aplica imediatamente a classe de estado inicial (.button-initial-state) a todos os itens de resultado
                     // Isso os torna invisíveis e posicionados para a animação de entrada (definido no CSS)
                     resultItemsToAnimate.forEach(item => {
                         item.classList.add('button-initial-state');
                     });

                     // Define o atraso base entre o início da animação de cada elemento (em ms)
                     const baseDelayResults = 80; // <-- Valor alterado para 80ms, controla a velocidade sequencial dos ITENS

                     // Itera sobre os elementos e remove a classe de estado inicial com um atraso crescente
                     // A remoção da classe dispara a transição definida no CSS (.search-result-item)
                     resultItemsToAnimate.forEach((item, index) => {
                         const delay = index * baseDelayResults; // Usa o baseDelay específico para resultados
                         setTimeout(() => {
                             item.classList.remove('button-initial-state');
                         }, delay);
                     });
                 }
                 // --- FIM DA LÓGICA DE ANIMAÇÃO ---

            } else {
                // Nenhum resultado encontrado
                const noResultsMsg = document.createElement('p');
                noResultsMsg.classList.add('no-results-message');
                noResultsMsg.textContent = 'Nenhum resultado encontrado.';
                resultsContainer.appendChild(noResultsMsg);

                // Adiciona as classes para estado "sem resultados"
                resultsContainer.classList.add('active', 'no-results-found');
                searchBar.classList.add('results-visible'); // Barra visível
                 stickyContainer.classList.add('search-no-results'); // Adiciona classe no container pai para borda vermelha

                // Ajusta o max-height para a mensagem "Nenhum resultado", limitada pelo espaço
                 // Isso também inicia a animação de abertura
                adjustSearchResultsContainerHeight();
            }

        } else {
             // Input vazio ou menos de 2 caracteres
             // Remove todas as classes de estado
             resultsContainer.classList.remove('active', 'no-results-found');
             searchBar.classList.remove('results-visible', 'no-results-found');
             stickyContainer.classList.remove('search-no-results'); // Garante que a classe de erro seja removida

             // Anima o fechamento definindo para 0px
             requestAnimationFrame(() => {
                 // Garante que a transição está habilitada para o fechamento
                 resultsContainer.style.transition = ''; // Reseta para a transição CSS
                 resultsContainer.style.maxHeight = '0px'; // Anima para 0
             });
             // Limpa o conteúdo após a animação de fechamento (opcional, mas bom para performance)
             resultsContainer.addEventListener('transitionend', function handler(e) {
                  // Verifica se a transição que terminou foi a de max-height
                  if (e.propertyName === 'max-height' && resultsContainer.style.maxHeight === '0px') {
                       resultsContainer.innerHTML = ''; // Limpa o conteúdo
                       resultsContainer.removeEventListener('transitionend', handler);
                  }
             }, { once: true }); // Roda apenas uma vez
        }
    }
    // --- FIM DA FUNÇÃO displayResults ---

    // Função principal que coordena a busca
    async function performSearch() {
        const searchTerm = searchInput.value.trim();

        // Remove estado de erro anterior ao iniciar nova busca
         stickyContainer.classList.remove('search-no-results');
         resultsContainer.classList.remove('no-results-found');
         searchBar.classList.remove('no-results-found');

        if (searchTerm.length < 2) {
            displayResults([]); // Limpa e fecha (isso já remove a classe de erro)
            return;
        }

        // Mostra indicador de loading ANTES de buscar
        // Remove qualquer conteúdo anterior (incluindo itens de busca anterior)
        resultsContainer.innerHTML = '';
        const loadingMsg = document.createElement('p');
        loadingMsg.classList.add('no-results-message'); // Reutiliza a classe de estilo
        loadingMsg.textContent = 'Buscando...';
        resultsContainer.appendChild(loadingMsg);


        resultsContainer.classList.add('active'); // Ativa para mostrar "Buscando"
        searchBar.classList.add('results-visible');

        // Define uma altura MÍNIMA enquanto busca para a msg "Buscando..." ser visível
        // Isso ajuda a evitar que o container feche e reabra se uma busca for feita rapidamente após outra
        // Mede a altura da mensagem de loading APÓS adicioná-la
        resultsContainer.style.transition = 'none'; // Desabilita transição para medir
        resultsContainer.style.maxHeight = '10000px'; // Temporariamente grande para medir
        resultsContainer.offsetHeight; // Força reflow
        const loadingHeight = resultsContainer.scrollHeight; // Pega a altura real da mensagem de loading (com padding etc.)
        resultsContainer.style.maxHeight = '0px'; // Reseta para 0 antes de animar (para a transição de abertura do container)

        requestAnimationFrame(() => {
             resultsContainer.style.transition = ''; // Reabilita transição (usará a do CSS)
             // Define max-height para a altura medida da mensagem de loading, limitada pelo espaço disponível
             // Usa adjustSearchResultsContainerHeight para calcular a altura máxima baseada no espaço,
             // mas garante que seja pelo menos a altura da mensagem de loading.
             // Passa a altura mínima (da mensagem "Buscando...") para o ajustador se necessário
             // NOTA: adjustSearchResultsContainerHeight já calcula a altura baseada no conteúdo ATUAL.
             // Apenas chamá-la já fará o container abrir para a altura da mensagem "Buscando...".
             adjustSearchResultsContainerHeight();
        });


        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            const resultsArrays = await Promise.all(searchPromises);
            const combinedResults = resultsArrays.flat();
            displayResults(combinedResults); // Exibe resultados e ajusta altura final, chamando a animação interna

        } catch (error) {
            console.error("Erro geral durante a pesquisa:", error);
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';

            // Adiciona as classes para estado "sem resultados" / erro
            resultsContainer.classList.add('active', 'no-results-found');
            searchBar.classList.add('results-visible'); // Barra visível
             stickyContainer.classList.add('search-no-results'); // Adiciona classe no container pai para borda vermelha

             // Ajusta altura para a mensagem de erro usando a função auxiliar
             adjustSearchResultsContainerHeight();
        }
    }

    // Debounced search function
    const debouncedSearch = debounce(performSearch, 350);
    // Adiciona uma propriedade __timeout ao debounce para que o keypress possa cancelar
     debouncedSearch.__timeout = null; // Inicializa a propriedade

    // Listeners
    searchInput.addEventListener('input', debouncedSearch);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            // Cancela o debounce se existir e executa imediatamente
             if (debouncedSearch.__timeout !== null) {
                clearTimeout(debouncedSearch.__timeout);
                debouncedSearch.__timeout = null; // Limpa após cancelar
             }
            performSearch();
        }
    });

     searchInput.addEventListener('input', function() {
        // Se o campo estiver vazio após o input, cancela o debounce e fecha os resultados
        // A pesquisa só acontece com >= 2 caracteres. Se o input cair abaixo disso, fecha.
        if (searchInput.value.trim().length < 2 && resultsContainer.classList.contains('active')) {
            if (debouncedSearch.__timeout !== null) {
                 clearTimeout(debouncedSearch.__timeout);
                 debouncedSearch.__timeout = null;
            }
           displayResults([]); // Limpa e fecha (isso já remove a classe de erro)
        } else if (searchInput.value.trim().length >= 2 && !resultsContainer.classList.contains('active')) {
             // O input agora tem >= 2 caracteres, mas o container está fechado (ex: fechado pelo clique fora)
             // Dispara uma nova busca imediata para reabrir os resultados
             performSearch();
        }
        // Se o input >= 2 E o container já está aberto, o debounce cuidará das atualizações.
    });
}

// Função para fechar o container de resultados ao clicar fora - MODIFICADA PARA REMOVER CLASSE DE ERRO
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container');
    const searchBar = stickyContainer?.querySelector('.search-bar');

    // Verifica se o clique foi FORA do container sticky (que inclui barra e resultados)
    if (stickyContainer && resultsContainer && resultsContainer.classList.contains('active') && !stickyContainer.contains(event.target)) {
        // Remove classes de estado (isso faz o CSS aplicar a transição de fechamento)
        resultsContainer.classList.remove('active', 'no-results-found');
        searchBar.classList.remove('results-visible', 'no-results-found');
        stickyContainer.classList.remove('search-no-results'); // Remove a classe de erro do container pai

        // Anima o fechamento definindo para 0px.
        // Como a classe 'active' foi removida, o max-height padrão no CSS é 0,
        // mas definir explicitamente '0px' aqui garante que a transição ocorra
        // a partir do valor atual calculado por adjustSearchResultsContainerHeight().
         requestAnimationFrame(() => {
             // Garante que a transição esteja habilitada para animar o fechamento
             resultsContainer.style.transition = ''; // Reseta para a transição CSS
             resultsContainer.style.maxHeight = '0px'; // Define para 0px para animar
         });

         // Limpa o conteúdo após a animação de fechamento
        resultsContainer.addEventListener('transitionend', function handler(e) {
             // Verifica se a transição que terminou foi a de max-height
             if (e.propertyName === 'max-height' && resultsContainer.style.maxHeight === '0px') {
                  resultsContainer.innerHTML = ''; // Limpa o conteúdo após fechar
                  resultsContainer.removeEventListener('transitionend', handler);
             }
        }, { once: true }); // Roda apenas uma vez
    }
}

// Função de resize (mantida, já foi ajustada antes)
function adjustActiveCollapsibleHeightsAndSearchResults() {
     // Ajusta colapsáveis normais (define max-height para scrollHeight)
    document.querySelectorAll('.collapsible-content.active').forEach(activeElement => {
         // Exclui o container de resultados da pesquisa
        if (activeElement.id === 'search-results-container') {
            return;
        }

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
             // Verifica se o elemento AINDA está ativo.
            if (activeElement.classList.contains('active')) {
                 activeElement.style.maxHeight = 'none'; // Permite fluxo natural
            } else {
                 // Se não estiver mais ativo (fechou durante o resize), garante que maxHeight seja 0.
                 activeElement.style.maxHeight = '0px';
            }
        });
    });

    // Ajusta o container de resultados da pesquisa separadamente
    adjustSearchResultsContainerHeight();
}

// --- NOVA FUNÇÃO PARA ANIMAR O H1 E OS BOTÕES SEQUENCIALMENTE ---
function animateButtonsSequentially() {
    // Seleciona o H1
    const h1Element = document.querySelector('.content-wrap h1');

    // Seleciona todos os botões (.btn) e grupos colapsáveis (.collapsible-group)
    // dentro do container principal de botões.
    const buttonsToAnimate = document.querySelectorAll('.buttons-container > .btn, .buttons-container > .collapsible-group');

    // Aplica imediatamente a classe de estado inicial ao H1, se ele existir
    if (h1Element) {
        h1Element.classList.add('h1-initial-state');
    }

    // Aplica imediatamente a classe de estado inicial a todos os botões/grupos, se existirem
    if (buttonsToAnimate.length > 0) {
        buttonsToAnimate.forEach(element => {
            element.classList.add('button-initial-state');
        });
    }

    // Define o atraso inicial antes de começar a remover as classes (pode ser 0 ou pequeno)
    const initialDelay = 100; // Atraso inicial em ms antes de QUALQUER animação começar

    // Animação do H1 (se existir): Remove a classe de estado inicial após um pequeno atraso inicial
    if (h1Element) {
        setTimeout(() => {
            h1Element.classList.remove('h1-initial-state');
        }, initialDelay);
    }

    // Animação sequencial dos botões/grupos (se existirem):
    // Começa APÓS o H1 ter um tempo para começar a animar (ou simultaneamente com um atraso maior)
    const buttonsStartDelay = initialDelay + 100; // Atraso adicional antes dos botões começarem
    const baseDelay = 55; // Atraso base entre cada botão na sequência (em ms)

    if (buttonsToAnimate.length > 0) {
        buttonsToAnimate.forEach((element, index) => {
            // Calcula o atraso total para cada botão: atraso inicial + atraso de início dos botões + atraso sequencial
            const delay = buttonsStartDelay + (index * baseDelay);

            // Usa setTimeout para remover a classe após o atraso calculado
            setTimeout(() => {
                element.classList.remove('button-initial-state');
                // A remoção da classe 'button-initial-state' fará com que o elemento
                // transicione de volta para seu estado padrão (opacity: 1, transform: translateY(0)),
                // usando a transição definida no CSS.
            }, delay);
        });
    }
}
// --- FIM DA NOVA FUNÇÃO DE ANIMAÇÃO ---