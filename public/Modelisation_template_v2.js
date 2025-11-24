/**
 * Modelisation_template_v2.js
 * Version améliorée : Génère un document séparé pour chaque table Flowise
 */

(function () {
    'use strict';

    const CONFIG = {
        selectors: {
            baseTables: 'table'
        },
        keywords: {
            flowise: ['Flowise', 'FLOWISE', 'flowise'],
            partie1: ['PARTIE 1', 'partie 1', 'Partie 1'],
            partie2: ['PARTIE 2', 'partie 2', 'Partie 2'],
            partie3: ['PARTIE 3', 'partie 3', 'Partie 3'],
            partie4: ['PARTIE 4', 'partie 4', 'Partie 4'],
            partie5: ['PARTIE 5', 'partie 5', 'Partie 5']
        },
        n8nEndpoint: 'https://0ngdph0y.rpcld.co/webhook/template',
        debug: true
    };

    // ============================================
    // TEMPLATES
    // ============================================

    const TEMPLATES = {
        alpha: function (data) {
            return `
                <div class="pdf-viewer-container" style="margin: 40px auto; max-width: 900px; background: #e5e7eb; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <style>
                        .pdf-viewer-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-height: 800px; overflow-y: auto; }
                        .pdf-page { background: white; padding: 60px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); min-height: 600px; }
                        .pdf-page-cover { background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%); color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
                        .pdf-title-main { font-size: 56px; font-weight: 700; margin-bottom: 20px; }
                        .pdf-subtitle-main { font-size: 32px; font-weight: 600; margin-bottom: 40px; }
                    </style>
                    <div class="pdf-page pdf-page-cover">
                        <div class="pdf-title-main">E-AUDIT PRO 2.0</div>
                        <div class="pdf-subtitle-main">GUIDE PRATIQUE</div>
                        <div style="font-size: 18px;">Norme 9.4 Plan d'audit interne</div>
                    </div>
                </div>
            `;
        },

        beta: function (sections, coverTitle = '', coverSubtitle = '') {
            let accordionHTML = '';

            // Ajouter la page de couverture si un titre est fourni
            if (coverTitle) {
                accordionHTML += `
                    <button class="accordion-header active">📖 Page de Couverture</button>
                    <div class="accordion-panel" style="max-height: fit-content;">
                        <div class="cover-page" style="
                            background: linear-gradient(135deg, rgba(255, 140, 0, 0.85) 0%, rgba(255, 69, 0, 0.85) 100%), 
                                        url('/src/assets/B10.jpg');
                            background-size: cover;
                            background-position: center;
                            color: white;
                            padding: 80px 40px;
                            text-align: center;
                            min-height: 400px;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            border-radius: 0 0 8px 8px;
                        ">
                            <h1 style="
                                font-size: 48px;
                                font-weight: 700;
                                margin-bottom: 20px;
                                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                            ">${coverTitle}</h1>
                            ${coverSubtitle ? `<h2 style="
                                font-size: 28px;
                                font-weight: 600;
                                margin-bottom: 30px;
                                text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
                            ">${coverSubtitle}</h2>` : ''}
                            <div style="
                                font-size: 18px;
                                opacity: 0.95;
                                max-width: 600px;
                                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                            ">E-AUDIT PRO 2.0 - Guide Pratique</div>
                        </div>
                    </div>
                `;
            }

            sections.forEach((section, index) => {
                const isActive = (index === 0 && !coverTitle) ? 'active' : '';
                const maxHeight = (index === 0 && !coverTitle) ? 'fit-content' : '0';

                accordionHTML += `
                    <button class="accordion-header ${isActive}">${section.title || 'Section ' + (index + 1)}</button>
                    <div class="accordion-panel" style="max-height: ${maxHeight};">
                        <div class="pdf-page pdf-page-content">
                            ${section.content || ''}
                        </div>
                    </div>
                `;
            });

            return `
                <div class="accordion-container" style="margin: 20px auto; max-width: 900px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <style>
                        .accordion-header { background-color: #f1f5f9; color: #1e3a8a; cursor: pointer; padding: 18px 25px; width: 100%; text-align: left; border: none; outline: none; font-size: 18px; font-weight: 600; transition: 0.3s; position: relative; }
                        .accordion-header.active { background-color: #667eea; color: white; }
                        .accordion-header::after { content: '＋'; font-size: 20px; position: absolute; right: 25px; }
                        .accordion-header.active::after { content: '－'; }
                        .accordion-panel { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; background-color: white; }
                        .pdf-page { padding: 40px; }
                    </style>
                    ${accordionHTML}
                </div>
            `;
        }
    };

    // ============================================
    // UTILITAIRES
    // ============================================

    function tableContainsKeywords(table, keywords) {
        const tableText = table.textContent || '';
        return keywords.some(keyword => tableText.includes(keyword));
    }

    async function fetchN8nData(command, processus) {
        try {
            const response = await fetch(CONFIG.n8nEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: `[Command] = ${command} - [Processus] = ${processus}`
                })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Erreur fetch n8n:', error);
            return null;
        }
    }

    function transformJsonToSections(jsonData) {
        const sections = [];
        if (jsonData['Sub-items']) {
            jsonData['Sub-items'].forEach(subItem => {
                const subItemKey = Object.keys(subItem).find(k => k.startsWith('Sub-item'));
                const title = subItem[subItemKey];
                let content = `<h3 style="font-size: 24px; color: #1e40af; margin-bottom: 20px;">${title}</h3>`;
                if (subItem.Items) {
                    subItem.Items.forEach(item => {
                        const itemKey = Object.keys(item).find(k => k.startsWith('Item'));
                        content += `
                            <div style="background: #f8fafc; border-left: 4px solid #667eea; padding: 15px 20px; margin: 15px 0;">
                                <strong>${item[itemKey]}</strong>
                                <p>${item.Contenu || ''}</p>
                            </div>
                        `;
                    });
                }
                sections.push({ title, content });
            });
        }
        return sections;
    }

    // ============================================
    // FONCTION HELPER - PAGE DE COUVERTURE
    // ============================================

    function generateCoverPage(title, subtitle = '') {
        return `
            <button class="accordion-header active">📖 Page de Couverture</button>
            <div class="accordion-panel" style="max-height: fit-content;">
                <div class="cover-page" style="
                    background: linear-gradient(135deg, rgba(255, 140, 0, 0.85) 0%, rgba(255, 69, 0, 0.85) 100%), 
                                url('/src/assets/B10.jpg');
                    background-size: cover;
                    background-position: center;
                    color: white;
                    padding: 80px 40px;
                    text-align: center;
                    min-height: 400px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                ">
                    <h1 style="
                        font-size: 48px;
                        font-weight: 700;
                        margin-bottom: 20px;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                    ">${title}</h1>
                    ${subtitle ? `<h2 style="
                        font-size: 28px;
                        font-weight: 600;
                        margin-bottom: 30px;
                        text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
                    ">${subtitle}</h2>` : ''}
                    <div style="
                        font-size: 18px;
                        opacity: 0.95;
                        max-width: 600px;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                    ">E-AUDIT PRO 2.0 - Guide Pratique</div>
                </div>
            </div>
        `;
    }

    // ============================================
    // GESTIONNAIRES DE CAS
    // ============================================

    async function handleCase1(table) {
        if (CONFIG.debug) console.log('📄 Case 1: PARTIE 1 (Document Word avec Mammoth.js)');

        // Charger et convertir le fichier .docx en HTML avec Mammoth.js
        const docxUrl = '/ressource/PARTIE1.docx';

        try {
            // Utiliser la fonction sécurisée de mammoth-loader-fix.js
            const result = await window.convertWordToHtml(docxUrl);
            const htmlContent = result.html;

            // Générer un ID unique pour cet accordéon
            const accordionId = 'accordion-word-' + Date.now();

            return `
                <div class="accordion-container" id="${accordionId}" style="margin: 40px auto; max-width: 1200px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <style>
                        #${accordionId} .cover-page {
                            border-radius: 0 0 8px 8px;
                        }
                        #${accordionId} .accordion-header {
                            background-color: #f1f5f9;
                            color: #1e3a8a;
                            cursor: pointer;
                            padding: 18px 25px;
                            width: 100%;
                            text-align: left;
                            border: none;
                            outline: none;
                            font-size: 18px;
                            font-weight: 600;
                            transition: 0.3s;
                            position: relative;
                            border-radius: 8px 8px 0 0;
                        }
                        #${accordionId} .accordion-header:hover,
                        #${accordionId} .accordion-header.active {
                            background-color: #667eea;
                            color: white;
                        }
                        #${accordionId} .accordion-header::after {
                            content: '＋';
                            font-size: 20px;
                            position: absolute;
                            right: 25px;
                        }
                        #${accordionId} .accordion-header.active::after {
                            content: '－';
                        }
                        #${accordionId} .accordion-panel {
                            max-height: 0;
                            overflow: hidden;
                            transition: max-height 0.4s ease-out;
                            background-color: white;
                            border-radius: 0 0 8px 8px;
                        }
                        #${accordionId} .word-content {
                            padding: 40px;
                            max-height: 800px;
                            overflow-y: auto;
                            border: 1px solid #e5e7eb;
                        }
                        #${accordionId} .word-controls {
                            background: #f9fafb;
                            padding: 15px;
                            text-align: center;
                            border-bottom: 1px solid #e5e7eb;
                        }
                    </style>
                    
                    ${generateCoverPage('Document Word', 'PARTIE 1 - Plan d\'Audit Basé sur les Risques')}
                    
                    <button class="accordion-header active">📄 Contenu du Document</button>
                    <div class="accordion-panel" style="max-height: fit-content;">
                        <div class="word-controls">
                            <a href="${docxUrl}" download style="color: #667eea; text-decoration: none; font-weight: 600; padding: 10px 20px; background: white; border-radius: 5px; display: inline-block;">
                                ⬇️ Télécharger le fichier Word
                            </a>
                        </div>
                        <div class="word-content">
                            ${htmlContent}
                        </div>
                        <p style="text-align: center; padding: 15px; color: #666; font-size: 12px; background: #f9fafb; margin: 0;">
                            📄 Document converti automatiquement avec Mammoth.js
                        </p>
                    </div>
                </div>
                
                <script>
                    (function() {
                        const header = document.querySelector('#${accordionId} .accordion-header');
                        const panel = document.querySelector('#${accordionId} .accordion-panel');
                        
                        header.addEventListener('click', function() {
                            this.classList.toggle('active');
                            if (panel.style.maxHeight && panel.style.maxHeight !== '0px') {
                                panel.style.maxHeight = '0';
                            } else {
                                panel.style.maxHeight = panel.scrollHeight + 'px';
                            }
                        });
                    })();
                </script>
            `;
        } catch (error) {
            console.error('Erreur chargement Word:', error);
            return `
                <div style="margin: 40px auto; max-width: 1200px; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                    <h2 style="color: #ef4444; margin-bottom: 20px; text-align: center;">❌ Erreur de chargement</h2>
                    <p style="text-align: center; color: #666;">
                        Impossible de charger le fichier Word. Vérifiez que <code>PARTIE1.docx</code> existe dans <code>public/ressource/</code>
                    </p>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="${docxUrl}" download style="color: #667eea; text-decoration: none; font-weight: 600;">
                            ⬇️ Télécharger le fichier
                        </a>
                    </p>
                </div>
            `;
        }
    }

    // Note: La fonction loadMammothJS() n'est plus nécessaire
    // On utilise maintenant window.convertWordToHtml() de mammoth-loader-fix.js
    // qui gère automatiquement le chargement sécurisé de Mammoth.js sans conflit AMD

    async function handleCase2(table) {
        if (CONFIG.debug) console.log('📊 Case 2: PARTIE 2 (JSON statique - DATA_COLLECTION)');
        const jsonData = {
            "Sous-section A": "Définition du Plan d'Audit Basé sur les Risques",
            "Sub-items": [
                {
                    "Sub-item A1": "Principes Fondamentaux",
                    "Items": [
                        {
                            "Item A1.1": "Définition Essentielle",
                            "Rubrique": "quoi",
                            "Contenu": "Le plan d'audit basé sur les risques est un processus systématique qui aligne les missions d'audit interne sur les risques les plus significatifs de l'organisation. Il permet de déterminer les priorités de l'audit interne en cohérence avec les objectifs stratégiques de l'entreprise. C'est la pierre angulaire de la fonction d'audit moderne."
                        },
                        {
                            "Item A1.2": "Approfondissement et Distinction",
                            "Rubrique": "synthèse détaillé",
                            "Contenu": "Contrairement à une approche cyclique où toutes les entités sont auditées à tour de rôle, le plan basé sur les risques concentre les ressources limitées de l'audit sur les zones où les menaces pour l'atteinte des objectifs sont les plus élevées. Il s'appuie sur une évaluation et une hiérarchisation formelles de l'univers des risques de l'organisation.\n\nCette approche assure que l'audit interne ne se contente pas de vérifier la conformité, mais contribue activement à la protection et à la création de valeur en fournissant une assurance sur la gestion des risques majeurs."
                        }
                    ]
                },
                {
                    "Sub-item A2": "L'Univers d'Audit comme Prérequis",
                    "Items": [
                        {
                            "Item A2.1": "Définition de l'Univers d'Audit",
                            "Rubrique": "définition",
                            "Contenu": "L'univers d'audit est la liste exhaustive et structurée de tous les objets auditables potentiels au sein de l'organisation. Il inclut les processus, les départements, les projets, les systèmes d'information, et les entités juridiques. C'est la base sur laquelle l'évaluation des risques sera appliquée."
                        },
                        {
                            "Item A2.2": "Rôle dans la Planification",
                            "Rubrique": "rôle",
                            "Contenu": "La définition de l'univers d'audit est la première étape cruciale de la planification basée sur les risques. Sans un univers d'audit complet et à jour, il existe un risque de ne pas identifier des domaines critiques et, par conséquent, de laisser des risques significatifs non couverts par le plan d'audit."
                        }
                    ]
                },
                {
                    "Sub-item A3": "Alignement Stratégique et Parties Prenantes",
                    "Items": [
                        {
                            "Item A3.1": "Lien avec les Objectifs Stratégiques",
                            "Rubrique": "alignement",
                            "Contenu": "Le plan d'audit doit être directement lié aux objectifs stratégiques de l'organisation. L'évaluation des risques doit considérer les menaces et opportunités qui pourraient impacter l'atteinte de ces objectifs. Un plan d'audit efficace démontre une compréhension claire de la stratégie de l'entreprise."
                        },
                        {
                            "Item A3.2": "Consultation des Parties Prenantes",
                            "Rubrique": "acteurs clés",
                            "Contenu": "L'élaboration du plan est un processus consultatif. Le responsable de l'audit interne doit impérativement solliciter l'avis de la Direction Générale et du Conseil (ou de son Comité d'Audit) pour s'assurer que leurs préoccupations sont prises en compte et que le plan est pertinent par rapport à leurs attentes."
                        }
                    ]
                }
            ]
        };
        const sections = transformJsonToSections(jsonData);
        return TEMPLATES.beta(sections, 'Données JSON Statiques', 'PARTIE 2 - Plan d\'Audit Basé sur les Risques');
    }

    async function handleCase3(table) {
        if (CONFIG.debug) console.log('🌐 Case 3: PARTIE 3 (JSON dynamique)');
        const data = await fetchN8nData('/Programme de travail', 'facturation');

        if (data) {
            const sections = transformJsonToSections(data);
            return TEMPLATES.beta(sections, 'Données JSON Dynamiques', 'PARTIE 3 - Programme de Travail');
        } else {
            // Fallback
            const fallbackData = {
                "Sous-section A": "Plan d'Audit (Fallback)",
                "Sub-items": [{
                    "Sub-item A1": "Données de fallback",
                    "Items": [{
                        "Item A1.1": "Info",
                        "Contenu": "Endpoint n8n non accessible"
                    }]
                }]
            };
            const sections = transformJsonToSections(fallbackData);
            return TEMPLATES.beta(sections, 'Données JSON Dynamiques', 'PARTIE 3 - Fallback');
        }
    }

    async function handleCase4(table) {
        if (CONFIG.debug) console.log('📝 Case 4: PARTIE 4 (Word via n8n)');
        return await handleCase3(table); // Même logique pour l'instant
    }

    async function handleCase5(table) {
        if (CONFIG.debug) console.log('📑 Case 5: PARTIE 5 (PDF - Viewer optimisé)');

        // Générer un ID unique pour ce viewer
        const viewerId = 'pdf-viewer-' + Date.now();
        const pdfUrl = '/ressource/PARTIE5.pdf';

        return `
            <div class="accordion-container pdf-viewer-optimized" id="${viewerId}" style="margin: 40px auto; max-width: 1400px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <style>
                    /* Styles accordéon pour PDF */
                    #${viewerId} .accordion-header-pdf {
                        background-color: #f1f5f9;
                        color: #1e3a8a;
                        cursor: pointer;
                        padding: 18px 25px;
                        width: 100%;
                        text-align: left;
                        border: none;
                        outline: none;
                        font-size: 18px;
                        font-weight: 600;
                        transition: 0.3s;
                        position: relative;
                        border-radius: 8px 8px 0 0;
                    }
                    #${viewerId} .accordion-header-pdf:hover,
                    #${viewerId} .accordion-header-pdf.active {
                        background-color: #667eea;
                        color: white;
                    }
                    #${viewerId} .accordion-header-pdf::after {
                        content: '＋';
                        font-size: 20px;
                        position: absolute;
                        right: 25px;
                    }
                    #${viewerId} .accordion-header-pdf.active::after {
                        content: '－';
                    }
                    #${viewerId} .accordion-panel-pdf {
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.4s ease-out;
                        background-color: white;
                        border-radius: 0 0 8px 8px;
                    }
                    
                    /* Styles PDF existants */
                    <style>
                    .pdf-viewer-optimized h2 {
                        color: #667eea;
                        margin-bottom: 20px;
                        text-align: center;
                        font-size: 28px;
                        font-weight: 700;
                    }
                    .pdf-viewer-optimized .pdf-controls {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        text-align: center;
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        flex-wrap: wrap;
                    }
                    .pdf-viewer-optimized .pdf-controls a,
                    .pdf-viewer-optimized .pdf-controls button {
                        color: white;
                        text-decoration: none;
                        font-weight: 600;
                        padding: 10px 20px;
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        border-radius: 5px;
                        transition: all 0.3s;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    .pdf-viewer-optimized .pdf-controls a:hover,
                    .pdf-viewer-optimized .pdf-controls button:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: translateY(-2px);
                    }
                    .pdf-viewer-optimized .pdf-controls button.active {
                        background: rgba(255, 255, 255, 0.4);
                        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
                    }
                    .pdf-viewer-optimized .bookmark-controls {
                        background: #f3f4f6;
                        padding: 12px;
                        border-radius: 8px;
                        margin-bottom: 15px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 15px;
                        flex-wrap: wrap;
                    }
                    .pdf-viewer-optimized .bookmark-controls span {
                        color: #4b5563;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    .pdf-viewer-optimized .bookmark-controls button {
                        padding: 8px 16px;
                        border: 2px solid #667eea;
                        background: white;
                        color: #667eea;
                        font-weight: 600;
                        border-radius: 5px;
                        cursor: pointer;
                        transition: all 0.3s;
                        font-size: 13px;
                    }
                    .pdf-viewer-optimized .bookmark-controls button:hover {
                        background: #667eea;
                        color: white;
                        transform: translateY(-1px);
                    }
                    .pdf-viewer-optimized .bookmark-controls button.active {
                        background: #667eea;
                        color: white;
                        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                    }
                    .pdf-viewer-optimized .pdf-container {
                        position: relative;
                        width: 100%;
                        height: 900px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        overflow: hidden;
                        background: #f3f4f6;
                    }
                    .pdf-viewer-optimized embed {
                        width: 100%;
                        height: 100%;
                        display: block;
                    }
                    .pdf-viewer-optimized .pdf-info {
                        text-align: center;
                        margin-top: 15px;
                        padding: 10px;
                        background: #f9fafb;
                        border-radius: 5px;
                        color: #666;
                        font-size: 13px;
                    }
                    .pdf-viewer-optimized .pdf-tips {
                        margin-top: 10px;
                        padding: 12px;
                        background: #eff6ff;
                        border-left: 4px solid #3b82f6;
                        border-radius: 4px;
                        font-size: 13px;
                        color: #1e40af;
                    }
                    /* Scrollbar personnalisée pour le conteneur */
                    .pdf-viewer-optimized .pdf-container::-webkit-scrollbar {
                        width: 14px;
                        height: 14px;
                    }
                    .pdf-viewer-optimized .pdf-container::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 10px;
                    }
                    .pdf-viewer-optimized .pdf-container::-webkit-scrollbar-thumb {
                        background: #667eea;
                        border-radius: 10px;
                        border: 2px solid #f1f1f1;
                    }
                    .pdf-viewer-optimized .pdf-container::-webkit-scrollbar-thumb:hover {
                        background: #5568d3;
                    }
                </style>
                
                ${generateCoverPage('Document PDF', 'PARTIE 5 - Guide Complet')}
                
                <button class="accordion-header-pdf active">📑 Viewer PDF</button>
                <div class="accordion-panel-pdf" style="max-height: fit-content;">
                
                <div class="pdf-controls">
                    <a href="${pdfUrl}" target="_blank">
                        🔗 Ouvrir dans un nouvel onglet
                    </a>
                    <a href="${pdfUrl}" download>
                        ⬇️ Télécharger le PDF
                    </a>
                    <button onclick="document.querySelector('#${viewerId} embed').requestFullscreen()">
                        ⛶ Plein écran
                    </button>
                </div>
                
                <div class="bookmark-controls">
                    <span>📑 Panneau des signets :</span>
                    <button id="${viewerId}-bookmark-off" class="active" onclick="toggleBookmarks('${viewerId}', false)">
                        ✖️ Masqué (par défaut)
                    </button>
                    <button id="${viewerId}-bookmark-on" onclick="toggleBookmarks('${viewerId}', true)">
                        ✔️ Affiché
                    </button>
                </div>
                
                <div class="pdf-container">
                    <embed 
                        id="${viewerId}-embed"
                        src="${pdfUrl}#navpanes=0&toolbar=1&view=FitH&zoom=125"
                        type="application/pdf">
                </div>
                
                <script>
                    // Fonction pour basculer l'affichage des signets
                    window.toggleBookmarks = function(viewerId, show) {
                        const embed = document.querySelector('#' + viewerId + '-embed');
                        const btnOff = document.querySelector('#' + viewerId + '-bookmark-off');
                        const btnOn = document.querySelector('#' + viewerId + '-bookmark-on');
                        
                        if (!embed) return;
                        
                        // Construire la nouvelle URL
                        const baseUrl = '${pdfUrl}';
                        const navpanes = show ? 1 : 0;
                        const newUrl = baseUrl + '#navpanes=' + navpanes + '&toolbar=1&view=FitH&zoom=125';
                        
                        // Mettre à jour l'embed
                        embed.src = newUrl;
                        
                        // Mettre à jour les boutons
                        if (show) {
                            btnOn.classList.add('active');
                            btnOff.classList.remove('active');
                        } else {
                            btnOff.classList.add('active');
                            btnOn.classList.remove('active');
                        }
                        
                        console.log('📑 Signets ' + (show ? 'affichés' : 'masqués'));
                    };
                </script>
                
                <div class="pdf-info">
                    📄 Viewer PDF optimisé - Zoom 125% - Signets masqués par défaut
                </div>
                
                <div class="pdf-tips">
                    💡 <strong>Astuces :</strong> Utilisez Ctrl + Molette pour zoomer | Cliquez sur "Plein écran" pour une meilleure lecture | La barre de défilement horizontale est plus large pour faciliter la navigation
                </div>
                
                </div><!-- Fin accordion-panel-pdf -->
            </div><!-- Fin accordion-container -->
            
            <script>
                (function() {
                    const header = document.querySelector('#${viewerId} .accordion-header-pdf');
                    const panel = document.querySelector('#${viewerId} .accordion-panel-pdf');
                    
                    header.addEventListener('click', function() {
                        this.classList.toggle('active');
                        if (panel.style.maxHeight && panel.style.maxHeight !== '0px') {
                            panel.style.maxHeight = '0';
                        } else {
                            panel.style.maxHeight = panel.scrollHeight + 'px';
                        }
                    });
                })();
            </script>
        `;
    }

    // ============================================
    // DÉTECTION ET INJECTION
    // ============================================

    function detectAllFlowiseTables() {
        const allTables = document.querySelectorAll(CONFIG.selectors.baseTables);
        const detections = [];

        allTables.forEach((table, index) => {
            // Vérifier si la table contient "Flowise"
            if (!tableContainsKeywords(table, CONFIG.keywords.flowise)) {
                return;
            }

            if (CONFIG.debug) {
                console.log(`   Table ${index + 1} (Flowise): ${table.textContent.substring(0, 50)}...`);
            }

            // Déterminer le type PARTIE
            let type = null;
            if (tableContainsKeywords(table, CONFIG.keywords.partie1)) type = 'PARTIE1';
            else if (tableContainsKeywords(table, CONFIG.keywords.partie2)) type = 'PARTIE2';
            else if (tableContainsKeywords(table, CONFIG.keywords.partie3)) type = 'PARTIE3';
            else if (tableContainsKeywords(table, CONFIG.keywords.partie4)) type = 'PARTIE4';
            else if (tableContainsKeywords(table, CONFIG.keywords.partie5)) type = 'PARTIE5';

            if (type) {
                if (CONFIG.debug) console.log(`   ✅ ${type} détectée`);
                detections.push({ type, table, index });
            }
        });

        return detections;
    }

    async function injectTemplate(table, templateHTML, index) {
        // Créer un conteneur unique pour ce template
        const container = document.createElement('div');
        container.className = 'modelisation-template-container';
        container.setAttribute('data-template-index', index);
        container.innerHTML = templateHTML;

        // Injecter juste après la table
        table.parentNode.insertBefore(container, table.nextSibling);

        // Initialiser l'accordéon si présent
        const headers = container.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', function () {
                this.classList.toggle('active');
                const panel = this.nextElementSibling;
                if (panel.style.maxHeight && panel.style.maxHeight !== '0px') {
                    panel.style.maxHeight = '0';
                } else {
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });

        if (CONFIG.debug) console.log(`✅ Template ${index + 1} injecté`);
    }

    // ============================================
    // FONCTION PRINCIPALE
    // ============================================

    async function executeModelisation() {
        if (CONFIG.debug) console.log('🚀 Modelisation_template_v2.js - Génération séparée');

        const detections = detectAllFlowiseTables();

        if (detections.length === 0) {
            if (CONFIG.debug) console.log('⚠️ Aucune table Flowise avec PARTIE détectée');
            return;
        }

        if (CONFIG.debug) console.log(`📊 ${detections.length} document(s) à générer`);

        // Générer un document pour chaque détection
        for (let i = 0; i < detections.length; i++) {
            const detection = detections[i];

            // Vérifier si déjà injecté
            const existingContainer = detection.table.nextElementSibling;
            if (existingContainer && existingContainer.classList.contains('modelisation-template-container')) {
                if (CONFIG.debug) console.log(`⚠️ Template ${i + 1} déjà injecté, skip`);
                continue;
            }

            let templateHTML = '';

            switch (detection.type) {
                case 'PARTIE1':
                    templateHTML = await handleCase1(detection.table);
                    break;
                case 'PARTIE2':
                    templateHTML = await handleCase2(detection.table);
                    break;
                case 'PARTIE3':
                    templateHTML = await handleCase3(detection.table);
                    break;
                case 'PARTIE4':
                    templateHTML = await handleCase4(detection.table);
                    break;
                case 'PARTIE5':
                    templateHTML = await handleCase5(detection.table);
                    break;
            }

            if (templateHTML) {
                await injectTemplate(detection.table, templateHTML, i);
            }
        }

        if (CONFIG.debug) console.log('✅ Génération terminée');
    }

    // ============================================
    // OBSERVATEUR
    // ============================================

    function initializeMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldExecute = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && (node.tagName === 'TABLE' || node.querySelector('table'))) {
                            shouldExecute = true;
                        }
                    });
                }
            });
            if (shouldExecute) {
                if (CONFIG.debug) console.log('🔄 Nouvelles tables détectées');
                setTimeout(executeModelisation, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ============================================
    // INITIALISATION
    // ============================================

    setTimeout(() => {
        executeModelisation();
    }, 2000);

    initializeMutationObserver();

    window.ModelisationTemplateV2 = {
        execute: executeModelisation,
        config: CONFIG
    };

    console.log('✅ Modelisation_template_v2.js chargé');
    console.log('💡 Test: window.ModelisationTemplateV2.execute()');

})();
