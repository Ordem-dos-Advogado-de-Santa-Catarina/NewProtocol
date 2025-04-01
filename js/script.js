// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;

        if (!content || !content.classList.contains('collapsible-content')) {
            console.warn("Collapsible content not found for button:", button);
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;

            if (!currentContent || !currentContent.classList.contains('collapsible-content')) {
                return;
            }

            const isOpening = !currentButton.classList.contains('active');

            // Close all OTHER open panels first
            document.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                const otherButton = otherGroup.querySelector('.toggle-btn');
                const otherContent = otherGroup.querySelector('.collapsible-content');

                if (otherButton !== currentButton && otherButton.classList.contains('active')) {
                    otherButton.classList.remove('active');
                    if(otherContent) {
                        otherContent.classList.remove('active');
                        otherContent.style.maxHeight = null;
                        otherContent.style.paddingTop = null;
                        otherContent.style.paddingBottom = null;
                    }
                }
            });

            // Toggle the current panel
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');

            if (isOpening) {
                requestAnimationFrame(() => {
                    currentContent.style.paddingTop = '15px';
                    currentContent.style.paddingBottom = '15px';
                    currentContent.style.maxHeight = 'none';
                    const scrollHeight = currentContent.scrollHeight;
                    currentContent.style.maxHeight = scrollHeight + 30 + "px";
                });
            } else {
                currentContent.style.maxHeight = null;
                currentContent.style.paddingTop = null;
                currentContent.style.paddingBottom = null;
            }
        });
    });

    // Recalculate max-height on window resize for open accordions
    window.addEventListener('resize', () => {
        // Debounce resize event slightly
        setTimeout(() => {
            document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
                requestAnimationFrame(() => {
                    // Temporarily remove max-height to get accurate scrollHeight
                    activeContent.style.maxHeight = 'none';
                    const scrollHeight = activeContent.scrollHeight;
                    // Reapply max-height - Ensure padding is already set correctly
                    activeContent.style.maxHeight = scrollHeight + 1 + 'px'; // Add buffer
                });
            });
        }, 150); // Adjust delay if needed (150ms)
    });

});