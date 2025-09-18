import { el, fmtDate, debounce } from './domUtils.js';
import slugifyLib from '@sindresorhus/slugify';

// Complete navigation module with all features
export function initNavigation() {
    /* ---------- State Variables ---------- */
    let allProofs = [];
    let filteredProofs = [];
    let currentView = 'grid'; // 'grid' or 'timeline'
    let activeFilters = {
        search: '',
        category: 'All Categories',
        type: 'All Types'
    };
    let proofsPerLoad = 12; // For lazy loading
    let currentlyLoaded = 0;
    let observer; // For Intersection Observer
    
    /* ---------- UI Elements ---------- */
    const grid = document.getElementById('case-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const viewToggle = document.getElementById('view-toggle');
    const filterBadges = document.getElementById('filter-badges');
    const resetButton = document.getElementById('reset-filters');
    const countEl = document.getElementById('results-count');
    const loadMoreBtn = document.createElement('button');
    const nav = document.querySelector('.nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.getElementById('primary-nav');

    // Setup Load More button
    loadMoreBtn.className = 'btn btn-outline-blue';
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.style.display = 'none';
    loadMoreBtn.style.margin = '32px auto';

    if (nav && navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!expanded));
            nav.classList.toggle('nav--open', !expanded);
            if (!expanded) {
                navLinks.querySelector('a')?.focus();
            } else {
                navToggle.focus();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
                navToggle.setAttribute('aria-expanded', 'false');
                nav.classList.remove('nav--open');
                navToggle.focus();
            }
        });
    }

    /* ---------- Utility Functions ---------- */
   

    // Determine proof type based on category
    const getProofType = (proof) => {
        if (proof.category?.includes('Finance') || proof.category?.includes('Campaign')) {
            return 'Financial Violation';
        } else if (proof.category?.includes('MOU') || proof.category?.includes('DNC')) {
            return 'Procedural Violation';
        } else if (proof.category?.includes('Bylaw') || proof.category?.includes('Charter')) {
            return 'Governance Failure';
        }
        return 'Other';
    };

    const slugify = (str) => slugifyLib(String(str ?? ''), {
        decamelize: false,
    });

    const buildProofSlug = (proof = {}) => {
        if (proof.slug) {
            return proof.slug;
        }
        if (proof.case_id) {
            return slugify(proof.case_id);
        }
        return '';
    };

    const buildProofUrl = (proof = {}) => {
        const overproofSlug = proof?.overproof?.slug;
        const proofSlug = buildProofSlug(proof);
        if (!overproofSlug || !proofSlug) {
            console.warn('Missing slug data for proof URL', {
                caseId: proof?.case_id,
                proofSlug,
                overproofSlug
            });
            return '#';
        }
        return `/proofs/${overproofSlug}/${proofSlug}/`;
    };

    const extractArrayData = (data) => {
        if (Array.isArray(data)) return data;
        const keys = ['proofs', 'items', 'data', 'results', 'entries', 'records', 'default'];
        for (const key of keys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }
        return [];
    };

    const parseCaseIdSegments = (caseId) => {
        if (!caseId) return [];
        return String(caseId)
            .split(/[^0-9]+/)
            .filter(Boolean)
            .map((segment) => Number.parseInt(segment, 10));
    };

    const compareCaseIds = (a, b) => {
        const segmentsA = parseCaseIdSegments(a);
        const segmentsB = parseCaseIdSegments(b);
        const length = Math.max(segmentsA.length, segmentsB.length);

        for (let index = 0; index < length; index += 1) {
            const diff = (segmentsA[index] ?? 0) - (segmentsB[index] ?? 0);
            if (diff !== 0) {
                return diff;
            }
        }

        return String(a ?? '').localeCompare(String(b ?? ''));
    };

    const compareProofsByCaseId = (a = {}, b = {}) => {
        const caseDiff = compareCaseIds(a?.case_id, b?.case_id);
        if (caseDiff !== 0) {
            return caseDiff;
        }

        const dateA = a?.date ? new Date(a.date).getTime() : 0;
        const dateB = b?.date ? new Date(b.date).getTime() : 0;

        if (dateA !== dateB) {
            return dateA - dateB;
        }

        return String(a?.title ?? '').localeCompare(String(b?.title ?? ''));
    };
    
    /* ---------- Lazy Loading Setup ---------- */
    const lazyLoadProofs = () => {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const card = entry.target;
                if (card.dataset.proofData) {
                    let proofData = null;

                    try {
                        proofData = JSON.parse(card.dataset.proofData);
                    } catch (error) {
                        console.error('Failed to parse proof data for lazy-loaded card:', error, {
                            proofId: card.dataset.proofId
                        });
                    }

                    card.dataset.proofData = ''; // Clear after loading or failure

                    if (proofData) {
                        renderFullCard(card, proofData);
                    }
                }

                observer.unobserve(card);
            });
        }, { rootMargin: '50px' });

        return imageObserver;
    };

    /* ---------- Focus Trap for Modals ---------- */
    class FocusTrap {
        constructor(element) {
            this.element = element;
            this.focusableElements = null;
            this.firstFocusable = null;
            this.lastFocusable = null;
            this.active = false;
        }
        
        activate() {
            if (this.active) return;
            
            this.focusableElements = this.element.querySelectorAll(
                'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
            );
            
            this.firstFocusable = this.focusableElements[0];
            this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
            
            this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.firstFocusable?.focus();
            this.active = true;
            
            // Store last focused element
            this.lastFocus = document.activeElement;
        }
        
        deactivate() {
            if (!this.active) return;
            this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
            this.lastFocus?.focus();
            this.active = false;
        }
        
        handleKeyDown(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === this.firstFocusable) {
                        e.preventDefault();
                        this.lastFocusable?.focus();
                    }
                } else {
                    if (document.activeElement === this.lastFocusable) {
                        e.preventDefault();
                        this.firstFocusable?.focus();
                    }
                }
            }
            
            if (e.key === 'Escape') {
                this.deactivate();
                const modal = this.element.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                    modal.setAttribute('hidden', '');
                    document.body.classList.remove('body--modal-open');
                }
            }
        }
    }

    /* ---------- Rendering Functions ---------- */
    
    // Render filter badges
    const renderFilterBadges = () => {
        if (!filterBadges) return;
        
        const badges = [];
        
        if (activeFilters.search) {
            badges.push(`
                <span class="filter-badge" data-filter="search">
                    Search: "${activeFilters.search}"
                    <button class="badge-remove" aria-label="Remove search filter">×</button>
                </span>
            `);
        }
        
        if (activeFilters.category !== 'All Categories') {
            badges.push(`
                <span class="filter-badge" data-filter="category">
                    ${activeFilters.category}
                    <button class="badge-remove" aria-label="Remove category filter">×</button>
                </span>
            `);
        }
        
        if (activeFilters.type !== 'All Types') {
            badges.push(`
                <span class="filter-badge" data-filter="type">
                    ${activeFilters.type}
                    <button class="badge-remove" aria-label="Remove type filter">×</button>
                </span>
            `);
        }
        
        filterBadges.innerHTML = badges.join('');
        
        // Add click handlers to remove badges
        filterBadges.querySelectorAll('.badge-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterType = e.target.parentElement.dataset.filter;
                if (filterType === 'search') {
                    activeFilters.search = '';
                    if (searchInput) searchInput.value = '';
                } else if (filterType === 'category') {
                    activeFilters.category = 'All Categories';
                    if (categoryFilter) categoryFilter.value = 'All Categories';
                } else if (filterType === 'type') {
                    activeFilters.type = 'All Types';
                    if (typeFilter) typeFilter.value = 'All Types';
                }
                filterAndRender();
            });
        });
    };

    // Render a single proof card with optional lazy loading
    const renderProofCard = (proof, lazy = false) => {
        const url = buildProofUrl(proof);
        const proofType = getProofType(proof);
        
        if (lazy) {
            return `
                <article class="case-card case-card-lazy"
                         data-proof-id="${proof.case_id || proof.slug}">
                    <div class="card-skeleton">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-meta"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text"></div>
                    </div>
                </article>`;
        }
        
        return `
            <article class="case-card" data-type="${proofType}"
                     data-proof-id="${proof.case_id || proof.slug}">
                <div class="case-card-header">
                    <span class="proof-type-badge ${proofType.toLowerCase().replace(/\s+/g, '-')}">${proofType}</span>
                </div>
                <h3><a href="${url}">${proof.title}</a></h3>
                <p class="case-meta">
                    ${proof.case_id} • ${fmtDate(proof.date)}
                    ${proof.category ? ` • <span style="font-weight: 700;">${proof.category}</span>` : ''}
                </p>
                <p>${proof.thesis}</p>
                <a href="${url}" class="case-link">Examine Proof →</a>
            </article>`;
    };

    // Render full card content (called by lazy loader)
    const renderFullCard = (cardElement, proofData) => {
        const url = buildProofUrl(proofData);
        const proofType = getProofType(proofData);

        cardElement.dataset.proofId = proofData.case_id || proofData.slug;
        
        cardElement.innerHTML = `
            <div class="case-card-header">
                <span class="proof-type-badge ${proofType.toLowerCase().replace(/\s+/g, '-')}">${proofType}</span>
            </div>
            <h3><a href="${url}">${proofData.title}</a></h3>
            <p class="case-meta">
                ${proofData.case_id} • ${fmtDate(proofData.date)}
                ${proofData.category ? ` • <span style="font-weight: 700;">${proofData.category}</span>` : ''}
            </p>
            <p>${proofData.thesis}</p>
            <a href="${url}" class="case-link">Examine Proof →</a>`;
        cardElement.classList.remove('case-card-lazy');
    };

    // Timeline view renderer
    const renderTimeline = (proofs) => {
        if (!grid) return;
        grid.className = 'timeline-view';
        grid.innerHTML = '';

        if (!proofs || proofs.length === 0) {
            grid.innerHTML = '<p style="text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>';
            return;
        }

        // Group proofs by month/year
        const grouped = {};
        proofs.forEach(proof => {
            const date = new Date(proof.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(proof);
        });

        // Sort months in reverse chronological order
        const sortedMonths = Object.keys(grouped).sort().reverse();

        sortedMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
            
            const monthSection = `
                <div class="timeline-month">
                    <h3 class="timeline-month-header">${monthName}</h3>
                    <div class="timeline-entries">
                        ${grouped[month].map(proof => `
                            <div class="timeline-entry">
                                <div class="timeline-date">${new Date(proof.date).getDate()}</div>
                                <div class="timeline-content">
                                    <span class="timeline-category">${proof.category}</span>
                                    <h4><a href="${buildProofUrl(proof)}">${proof.title}</a></h4>
                                    <p>${proof.thesis}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            grid.appendChild(el(monthSection));
        });
    };

    // Grid view renderer with lazy loading support
    const renderGrid = (proofs, append = false) => {
        if (!grid) return;
        
        if (!append) {
            grid.className = 'case-grid';
            grid.innerHTML = '';
            currentlyLoaded = 0;
        }

        if (!proofs || proofs.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">No matching proofs found.</p>';
            loadMoreBtn.style.display = 'none';
            return;
        }

        const start = currentlyLoaded;
        const end = Math.min(start + proofsPerLoad, proofs.length);
        const proofsToRender = proofs.slice(start, end);
        
        proofsToRender.forEach((proof, index) => {
            const isLazy = index > 6; // Lazy load after first 6
            const cardHTML = renderProofCard(proof, isLazy);
            const cardElement = el(cardHTML);

            if (isLazy && cardElement) {
                try {
                    cardElement.dataset.proofData = JSON.stringify(proof);
                } catch (error) {
                    console.error('Failed to serialize proof for lazy loading:', error, {
                        proofId: proof.case_id || proof.slug
                    });
                }
            }

            grid.appendChild(cardElement);
            
            if (isLazy && observer) {
                observer.observe(cardElement);
            }
        });
        
        currentlyLoaded = end;
        
        // Show/hide Load More button
        if (currentlyLoaded < proofs.length) {
            loadMoreBtn.style.display = 'block';
            if (!grid.parentElement.contains(loadMoreBtn)) {
                grid.parentElement.appendChild(loadMoreBtn);
            }
        } else {
            loadMoreBtn.style.display = 'none';
        }
    };

    // Main render function that chooses view
    const renderProofs = (proofs, append = false) => {
        if (currentView === 'timeline') {
            renderTimeline(proofs);
        } else {
            renderGrid(proofs, append);
        }
    };

    const updateResultsCount = () => {
        if (!countEl) return;
        const total = allProofs.length;
        const count = filteredProofs.length;
        countEl.textContent = (count === total) ? `Showing all ${total} proofs` : `Showing ${count} of ${total} proofs`;
    };

    // Enhanced filter function
    const filterAndRender = () => {
        activeFilters.search = searchInput ? searchInput.value : '';
        activeFilters.category = categoryFilter ? categoryFilter.value : 'All Categories';
        activeFilters.type = typeFilter ? typeFilter.value : 'All Types';

        filteredProofs = allProofs.filter(p => {
            // Category filter
            if (activeFilters.category !== 'All Categories' && p.category !== activeFilters.category) {
                return false;
            }

            // Type filter
            if (activeFilters.type !== 'All Types' && getProofType(p) !== activeFilters.type) {
                return false;
            }

            // Search filter
            if (activeFilters.search) {
                const searchTerm = activeFilters.search.toLowerCase();
                const searchableText = [
                    p.title,
                    p.thesis,
                    p.stakes,
                    p.violation,
                    p.rule_summary,
                    p.case_id,
                    p.category
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });

        renderProofs(filteredProofs);
        updateResultsCount();
        renderFilterBadges();
    };

    // Debounced search handler
    const handleSearch = debounce(() => {
        filterAndRender();
    }, 300);

    // Populate filters
    const populateFilters = () => {
        if (categoryFilter) {
            const categories = ["All Categories", ...new Set(allProofs.map(p => p.category).filter(Boolean))];
            categoryFilter.innerHTML = '';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });
        }

        if (typeFilter) {
            const types = ["All Types", ...new Set(allProofs.map(p => getProofType(p)))];
            typeFilter.innerHTML = '';
            types.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                typeFilter.appendChild(option);
            });
        }
    };

    /* ---------- Modal Management ---------- */
    const initModals = () => {
        const modals = document.querySelectorAll('.modal');
        const modalTriggers = document.querySelectorAll('[data-modal-target]');
        
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.dataset.modalTarget;
                const modal = document.getElementById(modalId);
                if (modal) {
                    openModal(modal);
                }
            });
        });
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            const focusTrap = new FocusTrap(modal);
            
            closeBtn?.addEventListener('click', () => {
                closeModal(modal, focusTrap);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal, focusTrap);
                }
            });
            
            // Store focus trap on modal element
            modal._focusTrap = focusTrap;
        });
    };
    
    const openModal = (modal) => {
        modal.removeAttribute('hidden');
        modal.classList.add('active');
        document.body.classList.add('body--modal-open');
        
        // Activate focus trap
        if (modal._focusTrap) {
            modal._focusTrap.activate();
        }
        
        // Announce to screen readers
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('role', 'dialog');
    };
    
    const closeModal = (modal, focusTrap) => {
        modal.classList.remove('active');
        modal.setAttribute('hidden', '');
        document.body.classList.remove('body--modal-open');
        
        if (focusTrap) {
            focusTrap.deactivate();
        }
    };

    /* ---------- Initialize ---------- */
    const initialize = async () => {
        try {
            // Setup lazy loading observer
            observer = lazyLoadProofs();

            const [proofsResponse, overproofsResponse] = await Promise.all([
                fetch('/data/proofs.json', { cache: 'no-store' }),
                fetch('/data/overproofs.json', { cache: 'no-store' })
            ]);

            if (!proofsResponse.ok) throw new Error('Failed to load proofs.json');
            if (!overproofsResponse.ok) throw new Error('Failed to load overproofs.json');

            const [proofsRaw, overproofsRaw] = await Promise.all([
                proofsResponse.json(),
                overproofsResponse.json()
            ]);

            const proofsData = extractArrayData(proofsRaw);
            if (!Array.isArray(proofsData) || proofsData.length === 0) {
                if (!Array.isArray(proofsRaw) && !Array.isArray(proofsRaw?.proofs) && !Array.isArray(proofsRaw?.items)) {
                    throw new Error('Unrecognized proofs data format.');
                }
            }

            const overproofsData = extractArrayData(overproofsRaw);
            const overproofById = new Map();
            const overproofByUmbrella = new Map();

            overproofsData.filter(Boolean).forEach((overproof) => {
                const normalized = { ...overproof };
                if (!normalized.slug && normalized.umbrella_category) {
                    normalized.slug = slugify(normalized.umbrella_category);
                }
                if (normalized.slug) {
                    normalized.url = normalized.url || `/proofs/${normalized.slug}/`;
                }
                if (normalized.id) {
                    overproofById.set(normalized.id, normalized);
                }
                if (normalized.umbrella_category) {
                    overproofByUmbrella.set(normalized.umbrella_category, normalized);
                }
            });

            allProofs = proofsData
                .filter(p => p && p.title)
                .map((proof) => {
                    const overproofMeta =
                        (proof.overproof_id && overproofById.get(proof.overproof_id)) ||
                        (proof.umbrella_category && overproofByUmbrella.get(proof.umbrella_category)) ||
                        null;

                    if (!overproofMeta && proof.umbrella_category) {
                        console.warn('Missing overproof metadata for proof', {
                            caseId: proof.case_id,
                            umbrella: proof.umbrella_category
                        });
                    }

                    return {
                        ...proof,
                        overproof_id: overproofMeta?.id ?? proof.overproof_id ?? null,
                        overproof: overproofMeta ? { ...overproofMeta } : null
                    };
                })
                .sort(compareProofsByCaseId);

            const proofCounts = new Map();
            allProofs.forEach((proof) => {
                const id = proof.overproof?.id;
                if (id) {
                    proofCounts.set(id, (proofCounts.get(id) ?? 0) + 1);
                }
            });

            allProofs = allProofs.map((proof) => {
                if (!proof.overproof?.id) {
                    return proof;
                }
                return {
                    ...proof,
                    overproof: {
                        ...proof.overproof,
                        proofCount: proofCounts.get(proof.overproof.id) ?? 0
                    }
                };
            });

            filteredProofs = [...allProofs];

            populateFilters();
            renderProofs(filteredProofs);
            updateResultsCount();

            // Event listeners
            if (searchInput) {
                searchInput.addEventListener('input', handleSearch);
            }
            
            if (categoryFilter) categoryFilter.addEventListener('change', filterAndRender);
            if (typeFilter) typeFilter.addEventListener('change', filterAndRender);
            
            if (viewToggle) {
                viewToggle.addEventListener('click', () => {
                    currentView = currentView === 'grid' ? 'timeline' : 'grid';
                    viewToggle.textContent = currentView === 'grid' ? 'Timeline View' : 'Grid View';
                    renderProofs(filteredProofs);
                });
            }

            loadMoreBtn.addEventListener('click', () => {
                renderProofs(filteredProofs, true);
            });

            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    activeFilters = { search: '', category: 'All Categories', type: 'All Types' };
                    if (searchInput) searchInput.value = '';
                    if (categoryFilter) categoryFilter.value = 'All Categories';
                    if (typeFilter) typeFilter.value = 'All Types';
                    filterAndRender();
                });
            }

            // Initialize modals
            initModals();

        } catch (error) {
            console.error("Error initializing archive:", error);
            if (grid) grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Could not load proofs. Please try again later.</p>';
        }
    };

    initialize();
}
