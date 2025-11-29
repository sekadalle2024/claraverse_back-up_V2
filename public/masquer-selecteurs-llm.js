/**
 * Script pour masquer les sélecteurs LLM et les paramètres
 * Style Grok - Interface épurée
 */

(function () {
    console.log('🎨 Masquage des sélecteurs LLM - Style Grok');

    // Fonction pour masquer les éléments
    function masquerSelecteurs() {
        // Masquer tous les boutons qui contiennent "gemini", "gpt", "claude", etc.
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (
                text.includes('gemini') ||
                text.includes('gpt') ||
                text.includes('claude') ||
                text.includes('llama') ||
                text.includes('model') ||
                text.includes('provider')
            ) {
                button.style.display = 'none';
                console.log('✅ Bouton masqué:', text.substring(0, 30));
            }
        });

        // Masquer les icônes de paramètres (Settings)
        // EXCEPTION: Ne pas masquer les boutons de thème
        const settingsButtons = document.querySelectorAll('button[aria-label*="settings"], button[aria-label*="Settings"], button[title*="settings"], button[title*="Settings"]');
        settingsButtons.forEach(btn => {
            const ariaLabel = btn.getAttribute('aria-label') || '';
            const title = btn.getAttribute('title') || '';
            const isThemeButton = ariaLabel.toLowerCase().includes('theme') ||
                title.toLowerCase().includes('theme') ||
                ariaLabel.toLowerCase().includes('dark mode') ||
                title.toLowerCase().includes('dark mode');

            if (!isThemeButton) {
                btn.style.display = 'none';
                console.log('✅ Bouton paramètres masqué');
            }
        });

        // Masquer les SVG qui ressemblent à des icônes de paramètres
        const svgs = document.querySelectorAll('svg');
        svgs.forEach(svg => {
            const parent = svg.parentElement;
            if (parent && parent.tagName === 'BUTTON') {
                // Vérifier si c'est un bouton de thème (Sun, Moon, Monitor)
                const ariaLabel = parent.getAttribute('aria-label') || '';
                const title = parent.getAttribute('title') || '';
                const isThemeButton = ariaLabel.toLowerCase().includes('theme') ||
                    title.toLowerCase().includes('theme') ||
                    ariaLabel.toLowerCase().includes('dark mode') ||
                    title.toLowerCase().includes('dark mode') ||
                    title.toLowerCase().includes('changer de thème') ||
                    parent.closest('.theme-selector');

                if (isThemeButton) {
                    // Ne pas masquer les boutons de thème
                    console.log('🎨 Bouton de thème préservé:', title || ariaLabel);
                    return;
                }

                // Vérifier si c'est une icône de paramètres (gear/cog)
                const paths = svg.querySelectorAll('path');
                paths.forEach(path => {
                    const d = path.getAttribute('d');
                    // Pattern typique d'une icône de paramètres
                    if (d && (d.includes('M12') || d.includes('circle'))) {
                        // Ne pas masquer les icônes Paperclip et Send
                        const parentText = parent.textContent;
                        if (!parentText.includes('Attach') && !parentText.includes('Send')) {
                            parent.style.display = 'none';
                            console.log('✅ Icône paramètres masquée');
                        }
                    }
                });
            }
        });

        // Masquer les dropdowns de sélection
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            const name = select.getAttribute('name');
            if (name && (name.includes('model') || name.includes('provider'))) {
                select.style.display = 'none';
                console.log('✅ Select masqué:', name);
            }
        });

        // Masquer les éléments avec des classes spécifiques
        const classesToHide = [
            'model-selector',
            'provider-selector',
            'model-dropdown',
            'provider-dropdown'
        ];

        classesToHide.forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(el => {
                el.style.display = 'none';
                console.log('✅ Élément masqué par classe:', className);
            });
        });
    }

    // Exécuter au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', masquerSelecteurs);
    } else {
        masquerSelecteurs();
    }

    // Observer les changements du DOM pour masquer les éléments ajoutés dynamiquement
    const observer = new MutationObserver((mutations) => {
        let shouldRun = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                shouldRun = true;
            }
        });
        if (shouldRun) {
            masquerSelecteurs();
        }
    });

    // Démarrer l'observation
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('✅ Observateur de DOM activé pour masquer les sélecteurs LLM');
})();
