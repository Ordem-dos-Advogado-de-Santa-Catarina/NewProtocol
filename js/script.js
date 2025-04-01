// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    // Configura os botões colapsáveis em outras páginas (se houver)
    // setupCollapsible(); // Descomente se precisar em outras páginas

    // Configura a funcionalidade de pesquisa
    setupSearch();

    // Ajusta o padding do content-wrap inicialmente e no resize para o sticky search
    adjustContentPadding();
    window.addEventListener('resize', debounce(adjustContentPadding, 150));

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

// Função para ajustar o padding-top do conteúdo principal
function adjustContentPadding() {
    const stickyContainer = document.querySelector('.sticky-search-container');
    const contentWrap = document.querySelector('.content-wrap');
    if (stickyContainer && contentWrap) {
        const stickyHeight = stickyContainer.offsetHeight;
        // Define o padding-top do .content-wrap para ser um pouco maior que a altura do container sticky
        // Isso evita que o conteúdo inicial fique escondido atrás da barra de pesquisa fixa
        contentWrap.style.paddingTop = `${stickyHeight + 15}px`; // Adiciona uma margem extra de 15px
    } else if (contentWrap) {
        // Fallback se o container sticky não for encontrado, remove o padding extra
        contentWrap.style.paddingTop = '20px'; // Ou um valor padrão
    }
}


// Função para configurar o acordeão (se necessário em outras páginas)
function setupCollapsible() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;

        // Verifica se o próximo elemento existe e é o conteúdo colapsável esperado
        if (!content || !content.classList.contains('collapsible-content')) {
            console.warn('Botão toggle sem conteúdo colapsável correspondente:', button);
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;

            // Verificação dupla (redundante mas segura)
            if (!currentContent || !currentContent.classList.contains('collapsible-content')) {
                return;
            }

            const isOpening = !currentButton.classList.contains('active');

            // Fecha todos os OUTROS painéis abertos ANTES de abrir o atual
            document.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                const otherButton = otherGroup.querySelector('.toggle-btn');
                const otherContent = otherGroup.querySelector('.collapsible-content');

                // Garante que estamos olhando para um grupo diferente e que ele está ativo
                if (otherButton && otherButton !== currentButton && otherButton.classList.contains('active')) {
                    otherButton.classList.remove('active');
                    if (otherContent) {
                        otherContent.classList.remove('active');
                        otherContent.style.maxHeight = null; // Fecha o outro painel
                        otherContent.style.paddingTop = null;
                        otherContent.style.paddingBottom = null;
                    }
                }
            });

            // Alterna o estado (classe 'active') do botão e do conteúdo atual
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            // Anima a abertura ou fechamento
            if (isOpening) {
                // Abre: calcula a altura necessária ANTES de aplicar max-height
                currentContent.style.maxHeight = 'none'; // Permite cálculo da altura total
                const scrollHeight = currentContent.scrollHeight;
                currentContent.style.maxHeight = '0px'; // Volta para 0 antes da transição

                // Força reflow e inicia a animação para abrir
                requestAnimationFrame(() => {
                    currentContent.style.paddingTop = '15px';
                    currentContent.style.paddingBottom = '15px';
                    // Define maxHeight com padding incluído
                    currentContent.style.maxHeight = scrollHeight + 30 + "px";
                });
            } else {
                // Fecha: simplesmente remove max-height e padding para a transição ocorrer
                currentContent.style.maxHeight = null;
                currentContent.style.paddingTop = null;
                currentContent.style.paddingBottom = null;
            }
        });
    });

    // Recalcula max-height ao redimensionar a janela para acordeões abertos
    window.addEventListener('resize', debounce(() => {
        document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
             // Recalcula a altura quando ativo e a janela redimensiona
            activeContent.style.transition = 'none'; // Desabilita transição temporariamente
            activeContent.style.maxHeight = 'none'; // Remove limite para recalcular
            const scrollHeight = activeContent.scrollHeight;
            // Reaplicar padding para cálculo correto, se necessário (geralmente scrollHeight já considera)
            // Adiciona o padding vertical de volta à altura calculada
            activeContent.style.maxHeight = scrollHeight + 30 + 'px';
            requestAnimationFrame(() => { // Reabilita transição após o ajuste
                activeContent.style.transition = '';
            });
        });
    }, 150));
}


// Função para configurar a pesquisa
function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container'); // Container da barra e resultados

    // Verifica se todos os elementos essenciais existem
    if (!searchInput || !searchButton || !resultsContainer || !stickyContainer) {
        console.error("Elementos da barra de pesquisa, container de resultados ou container sticky não encontrados.");
        return;
    }

    // Lista de arquivos HTML na pasta Setores para pesquisar
    const filesToSearch = [
        'Setores/Secretaria.html',
        'Setores/Tesouraria.html',
        'Setores/Protocolos.html' // Adicionado Protocolos
        // Adicione mais arquivos aqui conforme necessário: 'Setores/ArquivoNovo.html'
    ];

    // Função assíncrona para buscar e processar um único arquivo HTML
    async function fetchAndSearchFile(filePath, searchTerm) {
        try {
            const response = await fetch(filePath);
            // Verifica se a requisição foi bem-sucedida
            if (!response.ok) {
                console.error(`Erro ao buscar ${filePath}: ${response.statusText}`);
                return []; // Retorna array vazio em caso de erro
            }
            const htmlText = await response.text(); // Obtém o conteúdo HTML como texto
            const parser = new DOMParser(); // Cria um parser de HTML
            const doc = parser.parseFromString(htmlText, 'text/html'); // Parseia o texto para um documento DOM

            // Seleciona APENAS os elementos que devem ser pesquisáveis (links e botões específicos)
            const elementsToSearch = doc.querySelectorAll('a.btn, button.toggle-btn, a.sub-link');
            const matches = []; // Array para guardar os elementos encontrados
            const lowerSearchTerm = searchTerm.toLowerCase(); // Termo de busca em minúsculas para comparação case-insensitive

            elementsToSearch.forEach(element => {
                const elementText = element.textContent.trim(); // Texto do elemento sem espaços extras
                const lowerElementText = elementText.toLowerCase(); // Texto do elemento em minúsculas

                // Verifica se o texto do elemento contém o termo de busca
                if (lowerElementText.includes(lowerSearchTerm)) {
                    // Clona o elemento encontrado para não modificar o original do DOM parseado
                    const elementClone = element.cloneNode(true);

                    // Determina o link de destino (href) para o resultado da pesquisa
                    let targetHref = filePath; // Link padrão para o arquivo onde o item foi encontrado

                    if (element.tagName === 'A' && element.getAttribute('href')) {
                        // Se for um link 'a' com href:
                        const originalHref = element.getAttribute('href');
                        // Verifica se o href original é relativo à pasta Setores ou um link interno/externo
                        if (!originalHref.startsWith('http') && !originalHref.startsWith('#') && !originalHref.startsWith('.')) {
                             // Se for um nome de arquivo simples (ex: "SubPagina.html"), assume que está na pasta Setores
                             targetHref = `./Setores/${originalHref}`; // Monta o caminho relativo a Main.html
                        } else if (originalHref.startsWith('./')) {
                            // Se já for relativo à pasta atual (Setores), mantém como está no contexto de Setores
                            targetHref = `./Setores/${originalHref.substring(2)}`; // Ajusta para ser relativo a Main.html
                        } else if (originalHref.startsWith('../')) {
                             // Se for relativo à pasta pai (não esperado aqui, mas trata)
                             targetHref = originalHref; // Assume que já está correto relativo a Main.html
                        } else if (originalHref.startsWith('#')) {
                            // Se for um link interno de âncora (#), aponta para o arquivo com a âncora
                            targetHref = filePath + originalHref;
                        } else {
                            // Se for um link absoluto (http) ou já relativo à raiz, usa como está
                            targetHref = originalHref;
                        }

                    } else if (element.tagName === 'BUTTON' && element.classList.contains('toggle-btn')) {
                        // Se for um botão toggle (colapsável), o link aponta para a página onde ele está
                        targetHref = filePath;
                    }

                     // Cria o elemento final que será exibido nos resultados (sempre um link 'a')
                     const linkResult = document.createElement('a');
                     linkResult.href = targetHref;
                     linkResult.textContent = elementText; // Usa o texto original do elemento encontrado
                     linkResult.classList.add('search-result-item'); // Adiciona classe para estilização
                     // linkResult.target = '_blank'; // Descomente se quiser abrir resultados em nova aba

                     // Adiciona o item encontrado e processado ao array de matches
                     matches.push({
                         file: filePath, // Guarda o arquivo de origem
                         element: linkResult // Guarda o elemento 'a' criado para o resultado
                     });
                }
            });

            // Filtra para remover duplicatas baseadas no texto E no href do elemento final
            // Útil se o mesmo link/botão aparecer múltiplas vezes dentro do mesmo arquivo
             const uniqueMatches = Array.from(new Map(matches.map(item => {
                 const key = `${item.element.href}-${item.element.textContent}`; // Chave única baseada no link e texto
                 return [key, item];
             })).values());

            return uniqueMatches; // Retorna os resultados únicos encontrados neste arquivo

        } catch (error) {
            console.error(`Erro ao processar o arquivo ${filePath}:`, error);
            return []; // Retorna array vazio em caso de erro no processamento
        }
    }

    // Função para exibir os resultados na tela
    function displayResults(results) {
        resultsContainer.innerHTML = ''; // Limpa resultados anteriores
        resultsContainer.classList.remove('active'); // Garante que esteja fechado inicialmente
        resultsContainer.style.maxHeight = null;
        resultsContainer.style.paddingTop = null;
        resultsContainer.style.paddingBottom = null;

        if (results.length > 0) {
            // Se houver resultados, adiciona cada um ao container
            results.forEach(result => {
                resultsContainer.appendChild(result.element); // Adiciona o elemento 'a' criado
            });

            // Ativa a classe para mostrar e animar a abertura do container
            resultsContainer.classList.add('active');

            // Calcula e aplica a altura máxima dinamicamente após adicionar os elementos
            requestAnimationFrame(() => {
                 // Primeiro remove o limite para calcular a altura natural
                 resultsContainer.style.maxHeight = 'none';
                 const scrollHeight = resultsContainer.scrollHeight;
                 // Volta a 0 antes da animação de abertura
                 resultsContainer.style.maxHeight = '0px';
                 // Na próxima frame, aplica a altura final e padding para a transição
                 requestAnimationFrame(() => {
                     resultsContainer.style.paddingTop = '10px'; // Padding interno superior
                     resultsContainer.style.paddingBottom = '10px'; // Padding interno inferior
                     // Define maxHeight com padding incluído (aproximado)
                     resultsContainer.style.maxHeight = scrollHeight + 20 + "px"; // 10px top + 10px bottom
                 });
            });
        } else if (searchInput.value.trim().length >= 2) {
            // Mostra mensagem "Nenhum resultado" APENAS se a busca foi realizada (termo >= 2 chars)
            const noResultsMsg = document.createElement('p');
            noResultsMsg.classList.add('no-results-message');
            noResultsMsg.textContent = 'Nenhum resultado encontrado.';
            resultsContainer.appendChild(noResultsMsg);
            resultsContainer.classList.add('active'); // Mostra o container com a mensagem

            // Anima a abertura para exibir a mensagem
             requestAnimationFrame(() => {
                 resultsContainer.style.maxHeight = 'none';
                 const scrollHeight = resultsContainer.scrollHeight;
                 resultsContainer.style.maxHeight = '0px';
                 requestAnimationFrame(() => {
                     resultsContainer.style.paddingTop = '10px';
                     resultsContainer.style.paddingBottom = '10px';
                     resultsContainer.style.maxHeight = scrollHeight + 20 + "px";
                 });
            });
        }
        // Se não houver resultados E o input tiver menos de 2 caracteres, o container permanece fechado
    }

    // Função principal de pesquisa (chamada pelo input e botão)
    async function performSearch() {
        const searchTerm = searchInput.value.trim(); // Pega o termo da busca sem espaços extras

        // Se o termo for muito curto (menos de 2 caracteres), limpa os resultados e retorna
        if (searchTerm.length < 2) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null;
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
            return;
        }

        let allResults = [];
        // Cria um array de Promises, uma para cada arquivo a ser pesquisado
        const searchPromises = filesToSearch.map(file => fetchAndSearchFile(file, searchTerm));

        try {
            // Espera todas as Promises de busca serem resolvidas
            const resultsArrays = await Promise.all(searchPromises);
            // Combina os resultados de todos os arquivos em um único array
            const combinedResults = resultsArrays.flat();

             // Filtra duplicatas GERAIS (caso o mesmo link/texto exista em múltiplos arquivos)
             allResults = Array.from(new Map(combinedResults.map(item => {
                 const key = `${item.element.href}-${item.element.textContent}`; // Chave única global
                 return [key, item];
             })).values());

            displayResults(allResults); // Exibe os resultados finais e únicos

        } catch (error) {
            // Em caso de erro geral na busca (ex: problema de rede em Promise.all)
            console.error("Erro geral durante a pesquisa:", error);
            resultsContainer.innerHTML = '<p class="no-results-message">Ocorreu um erro durante a pesquisa.</p>';
            resultsContainer.classList.add('active'); // Mostra container com erro

             // Anima a abertura para exibir a mensagem de erro
             requestAnimationFrame(() => {
                 resultsContainer.style.maxHeight = 'none';
                 const scrollHeight = resultsContainer.scrollHeight;
                 resultsContainer.style.maxHeight = '0px';
                 requestAnimationFrame(() => {
                    resultsContainer.style.paddingTop = '10px';
                    resultsContainer.style.paddingBottom = '10px';
                    resultsContainer.style.maxHeight = scrollHeight + 20 + "px";
                 });
            });
        }
    }

    // Adiciona debounce à pesquisa no input para não sobrecarregar com requisições a cada tecla
    const debouncedSearch = debounce(performSearch, 350); // Atraso de 350ms

    // Event listener para o INPUT de texto (chama a busca com debounce)
    searchInput.addEventListener('input', debouncedSearch);

    // Event listener para o CLIQUE no botão de busca (chama a busca imediatamente)
    searchButton.addEventListener('click', performSearch);

    // Event listener para a tecla ENTER no campo de busca (chama a busca imediatamente)
    searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Previne o comportamento padrão do Enter (ex: submeter formulário)
            performSearch();
        }
    });

     // Limpar resultados E fechar container quando o campo de busca é limpo manualmente
     searchInput.addEventListener('input', function() {
        if (searchInput.value.trim() === '') {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null;
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
        }
    });
}

// Função para fechar o container de resultados se clicar fora dele ou da barra de pesquisa
function handleClickOutside(event) {
    const resultsContainer = document.getElementById('search-results-container');
    const stickyContainer = document.querySelector('.sticky-search-container'); // Container pai

    // Verifica se os elementos existem e se o container de resultados está ativo
    if (stickyContainer && resultsContainer && resultsContainer.classList.contains('active')) {
        // Verifica se o clique foi FORA do container sticky (que contém a barra e os resultados)
        if (!stickyContainer.contains(event.target)) {
            // Fecha o container de resultados
            resultsContainer.classList.remove('active');
            resultsContainer.style.maxHeight = null; // Inicia animação de fechamento
            resultsContainer.style.paddingTop = null;
            resultsContainer.style.paddingBottom = null;
        }
    }
}