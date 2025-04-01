// Arquivo: js/script.js // nem sei pra que isso aqui, mas ta ai

document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;

        if (!content || !content.classList.contains('collapsible-content')) {
            console.warn("Collapsible content not found for button:", button); // Conteúdo colapsável não encontrado no botão: // acho que deu ruim aqui, hein
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;

            if (!currentContent || !currentContent.classList.contains('collapsible-content')) {
                return; // Sai daqui, content ta errado // sei la o que aconteceu
            }

            const isOpening = !currentButton.classList.contains('active');

            // Fecha todos os OUTROS painéis abertos primeiro, senao vira bagunça
            document.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                const otherButton = otherGroup.querySelector('.toggle-btn');
                const otherContent = otherGroup.querySelector('.collapsible-content');

                if (otherButton !== currentButton && otherButton.classList.contains('active')) {
                    otherButton.classList.remove('active');
                    if(otherContent) {
                        otherContent.classList.remove('active');
                        otherContent.style.maxHeight = null; // Limpa a altura máxima // zera isso aqui
                        otherContent.style.paddingTop = null; // Limpa o padding de cima // tira isso tb
                        otherContent.style.paddingBottom = null; // Limpa o padding de baixo // e isso aqui tb
                    }
                }
            });

            // Alterna o painel atual, tipo liga e desliga, sabe?
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            if (isOpening) {
                requestAnimationFrame(() => {
                    currentContent.style.paddingTop = '15px'; // Define o padding de cima // bota um padding aqui
                    currentContent.style.paddingBottom = '15px'; // Define o padding de baixo // e aqui tb
                    currentContent.style.maxHeight = 'none'; // Remove a altura máxima pra recalcular // tira a altura pra calcular de novo
                    const scrollHeight = currentContent.scrollHeight;
                    currentContent.style.maxHeight = scrollHeight + 30 + "px"; // Define a altura máxima com base no conteúdo // agora bota a altura certa
                });
            } else {
                currentContent.style.maxHeight = null; // Limpa a altura máxima // zera de novo
                currentContent.style.paddingTop = null; // Limpa o padding de cima // zera de novo
                currentContent.style.paddingBottom = null; // Limpa o padding de baixo // zera de novo
            }
        });
    });

    // Recalcula a altura máxima quando a janela muda de tamanho pros accordions que tão abertos
    window.addEventListener('resize', () => {
        // Da uma segurada no evento de resize pra não virar zona
        setTimeout(() => {
            document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
                requestAnimationFrame(() => {
                    // Remove a altura máxima rapidinho pra pegar a altura certa do scroll
                    activeContent.style.maxHeight = 'none';
                    const scrollHeight = activeContent.scrollHeight;
                    // Coloca a altura máxima de volta - e vê se o padding já tá certo, hein!
                    activeContent.style.maxHeight = scrollHeight + 1 + 'px'; // Adiciona um bufferzinho, só pra garantir
                });
            });
        }, 150); // Ajusta o delay se precisar (150ms), sei lá, vê aí
    });

});