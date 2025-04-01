// Arquivo: js/script.js

document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        const content = button.nextElementSibling;
        const group = button.closest('.collapsible-group'); // Find the parent group

        if (!content || !content.classList.contains('collapsible-content')) {
            console.warn("Collapsible content not found for button:", button);
            return;
        }
        if (!group) {
            console.warn("Collapsible group not found for button:", button);
            return;
        }

        button.addEventListener('click', function() {
            const currentButton = this;
            const currentContent = currentButton.nextElementSibling;
            const currentGroup = currentButton.closest('.collapsible-group');

            if (!currentContent || !currentContent.classList.contains('collapsible-content') || !currentGroup) {
                return;
            }

            const isOpening = !currentButton.classList.contains('active');

            // Close all OTHER open panels first
            document.querySelectorAll('.collapsible-group').forEach(otherGroup => {
                const otherButton = otherGroup.querySelector('.toggle-btn');
                const otherContent = otherGroup.querySelector('.collapsible-content');

                if (otherButton !== currentButton && otherButton.classList.contains('active')) {
                    otherButton.classList.remove('active');
                    otherGroup.classList.remove('group-expanded'); // Remove expanded class from others
                    if(otherContent) {
                        otherContent.classList.remove('active');
                        otherContent.style.maxHeight = null;
                         otherContent.style.paddingTop = null; // Reset padding
                         otherContent.style.paddingBottom = null;
                    }
                }
            });

            // Toggle the current panel
            currentButton.classList.toggle('active');
            currentContent.classList.toggle('active');
            currentGroup.classList.toggle('group-expanded', isOpening); // Toggle expanded class on parent

            if (isOpening) {
                // Use rAF for smoother animation start after potential layout changes
                requestAnimationFrame(() => {
                     // Set padding before calculating scrollHeight for accuracy
                     currentContent.style.paddingTop = '15px';
                     currentContent.style.paddingBottom = '15px';
                     // Add a small buffer (e.g., 1px) to scrollHeight just in case
                    currentContent.style.maxHeight = currentContent.scrollHeight + 1 + "px";
                });
            } else {
                currentContent.style.maxHeight = null;
                 // Reset padding during collapse animation
                 currentContent.style.paddingTop = null;
                 currentContent.style.paddingBottom = null;
            }
        });
    });

    // Recalculate max-height on window resize for open accordions
    window.addEventListener('resize', () => {
        // Use a timeout to wait for layout adjustments after resize
        setTimeout(() => {
            document.querySelectorAll('.collapsible-content.active').forEach(activeContent => {
                 // Temporarily remove max-height to get accurate scrollHeight
                 activeContent.style.maxHeight = 'none';
                 const scrollHeight = activeContent.scrollHeight;
                 // Reapply max-height - Ensure padding is already set correctly by CSS/JS
                 activeContent.style.maxHeight = scrollHeight + 1 + 'px'; // Add buffer
            });
        }, 100); // Adjust delay if needed
    });

});