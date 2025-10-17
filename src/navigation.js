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
    let modalTriggerIdCounter = 0;
    let pagefindReadyPromise = null;
    let lastLoggedSearch = { query: '', results: null };
    let lastLoggedSearchAt = 0;
    let filterRequestId = 0;
    
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

    if (countEl) {
        countEl.setAttribute('role', 'status');
        countEl.setAttribute('aria-live', 'polite');
    }

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
                const activeLink = navLinks.querySelector('[aria-current="page"], .is-active') || navLinks.querySelector('a');
                activeLink?.focus();
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

    if (searchInput) {
        const focusSearchInput = () => {
            requestAnimationFrame(() => {
                if (!searchInput) {
                    return;
                }
                try {
                    searchInput.focus({ preventScroll: true });
                } catch (error) {
                    searchInput.focus();
                }
            });
        };

        const shouldFocusSearch = () => {
            if (window.location.hash === '#search-input') {
                return true;
            }
            try {
                return new URLSearchParams(window.location.search).get('focus') === 'search';
            } catch (error) {
                return false;
            }
        };

        if (shouldFocusSearch()) {
            focusSearchInput();
        }

        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#search-input') {
                focusSearchInput();
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

    const getProofCategoryKey = (proof) => {
        const type = getProofType(proof).toLowerCase();
        if (type.includes('financial')) return 'financial';
        if (type.includes('procedural')) return 'procedural';
        if (type.includes('governance')) return 'governance';
        return 'other';
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

    const normalizeUrl = (url = '') => {
        if (!url) {
            return '';
        }

        try {
            const base = typeof window !== 'undefined' && window.location
                ? window.location.origin
                : 'https://democraticjustice.org';
            const parsed = new URL(url, base);
            let pathname = parsed.pathname || '';
            pathname = pathname.replace(/index\.html$/i, '');

            if (!pathname.endsWith('/')) {
                pathname = `${pathname}/`;
            }

            return pathname.replace(/\/+$/, '/');
        } catch (error) {
            console.warn('Failed to normalize URL for search matching', {
                url,
                error
            });
            return url;
        }
    };

    const getProofUrlKey = (proof = {}) => normalizeUrl(buildProofUrl(proof));

    const ensurePagefind = () => {
        if (pagefindReadyPromise) {
            return pagefindReadyPromise;
        }

        if (typeof window.pagefindInit !== 'function') {
            pagefindReadyPromise = Promise.resolve(null);
            return pagefindReadyPromise;
        }

        pagefindReadyPromise = window.pagefindInit({ baseUrl: '/pagefind/' })
            .catch(error => {
                console.error('Failed to initialize Pagefind search index:', error);
                return null;
            });

        return pagefindReadyPromise;
    };

    const runPagefindSearch = async (query) => {
        if (!query) {
            return null;
        }

        const instance = await ensurePagefind();
        if (!instance || typeof instance.search !== 'function') {
            return null;
        }

        try {
            const response = await instance.search(query);
            const results = Array.isArray(response?.results) ? response.results : [];
            const urls = new Set();

            if (results.length) {
                const hydrated = await Promise.allSettled(results.map(result => {
                    if (typeof result?.data === 'function') {
                        return result.data();
                    }
                    return Promise.resolve(null);
                }));

                hydrated.forEach(entry => {
                    if (entry.status === 'fulfilled' && entry.value && entry.value.url) {
                        urls.add(normalizeUrl(entry.value.url));
                    }
                });
            }

            return {
                urls,
                count: results.length
            };
        } catch (error) {
            console.error('Pagefind search failed:', error);
            return null;
        }
    };

    /* ---------- Lazy Loading Setup ---------- */
    const lazyLoadProofs = () => {
        if (typeof IntersectionObserver !== 'function') {
            return null;
        }

        return new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const target = entry.target;
                const dataSrcset = target.getAttribute('data-srcset');
                const dataSrc = target.getAttribute('data-src');

                if (dataSrcset) {
                    target.setAttribute('srcset', dataSrcset);
                    target.removeAttribute('data-srcset');
                }

                if (dataSrc) {
                    target.setAttribute('src', dataSrc);
                    target.removeAttribute('data-src');
                }

                observerInstance.unobserve(target);
            });
        }, { rootMargin: '50px' });
    };

    /* ---------- Focus Trap for Modals ---------- */
    class FocusTrap {
        constructor(element) {
            this.element = element;
            this.focusableElements = null;
            this.firstFocusable = null;
            this.lastFocusable = null;
            this.active = false;
            this.boundKeyHandler = null;
            this.previouslyFocusedElement = null;
        }

        activate() {
            if (this.active) return;

            const activeElement = document.activeElement;
            if (activeElement && typeof activeElement.focus === 'function') {
                this.previouslyFocusedElement = activeElement;
            } else {
                this.previouslyFocusedElement = null;
            }

            this.focusableElements = this.element.querySelectorAll(
                'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
            );

            this.firstFocusable = this.focusableElements[0];
            this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];

            if (!this.boundKeyHandler) {
                this.boundKeyHandler = this.handleKeyDown.bind(this);
            }

            this.element.addEventListener('keydown', this.boundKeyHandler);
            this.firstFocusable?.focus();
            this.active = true;
        }

        deactivate() {
            if (!this.active) return;
            if (this.boundKeyHandler) {
                this.element.removeEventListener('keydown', this.boundKeyHandler);
            }
            const modalElement = this.element;
            const focusFallback = () => {
                const primaryNavLink = document.querySelector('.nav-links a');
                if (primaryNavLink && typeof primaryNavLink.focus === 'function') {
                    primaryNavLink.focus();
                    return;
                }

                const fallback = document.querySelector('a[href], button:not([disabled])');
                if (fallback && typeof fallback.focus === 'function') {
                    fallback.focus();
                }
            };

            const canFocusElement = (element) => {
                if (!element || typeof element.focus !== 'function') {
                    return false;
                }

                const isConnected = typeof element.isConnected === 'boolean'
                    ? element.isConnected
                    : document.body.contains(element);

                if (!isConnected) {
                    return false;
                }

                const isHidden = element.hasAttribute('aria-hidden') || element.getAttribute('hidden') !== null;
                const isDisabled = 'disabled' in element && element.disabled;
                const isVisible = typeof element.getClientRects === 'function'
                    ? element.getClientRects().length > 0
                    : element.offsetParent !== null;

                return !isHidden && !isDisabled && isVisible;
            };

            const openerId = modalElement?.dataset?.openerId;
            if (openerId) {
                const storedTrigger = document.getElementById(openerId);
                if (canFocusElement(storedTrigger)) {
                    storedTrigger.focus();
                } else if (canFocusElement(this.previouslyFocusedElement)) {
                    this.previouslyFocusedElement.focus();
                } else {
                    focusFallback();
                }
            } else if (canFocusElement(this.previouslyFocusedElement)) {
                this.previouslyFocusedElement.focus();
            } else {
                focusFallback();
            }

            if (modalElement?.dataset) {
                delete modalElement.dataset.openerId;
            }
            this.previouslyFocusedElement = null;
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

    // Render a single proof card
    const renderProofCard = (proof) => {
        const url = buildProofUrl(proof);
        const proofType = getProofType(proof);
        const categoryKey = getProofCategoryKey(proof);
        const categoryLabel = proof.category || proofType;
        const caseUrlRaw = proof?.overproof?.url || (proof?.overproof?.slug ? `/briefs/${proof.overproof.slug}/` : '');
        const caseUrl = normalizeUrl(caseUrlRaw);
        const hasCaseFile = Boolean(caseUrl);

        const metaParts = [];
        if (categoryLabel) metaParts.push(categoryLabel);
        if (proof.date) metaParts.push(fmtDate(proof.date));
        if (hasCaseFile) metaParts.push('Case file available');
        const metaText = metaParts.join(' • ');
        return `
            <a class="proof-row"
               href="${url}"
               data-category="${categoryKey}"
               data-proof-id="${proof.case_id || proof.slug}"
               ${hasCaseFile ? `data-case-url="${caseUrl}"` : ''}>
                <div class="proof-row__id">${proof.case_id ?? ''}</div>
                <div class="proof-row__content">
                    <h3 class="proof-row__title">${proof.title}</h3>
                    <p class="proof-row__meta">${metaText}</p>
                </div>
                <span class="proof-row__badge ${categoryKey ? `${categoryKey}-violation` : ''}">${categoryLabel || 'Other'}</span>
                <svg class="proof-row__action" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <path d="M7 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </a>`;
    };

    // Timeline view renderer
    const renderTimeline = (proofs) => {
        if (!grid) return;
        grid.className = 'proof-list__body timeline-view';
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

    // Grid view renderer with image lazy loading support
    const renderGrid = (proofs, append = false) => {
        if (!grid) return;
        
        if (!append) {
            grid.className = 'proof-list__body';
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
        
        proofsToRender.forEach((proof) => {
            const cardHTML = renderProofCard(proof);
            const cardElement = el(cardHTML);

            if (!cardElement) {
                return;
            }

            grid.appendChild(cardElement);

            const lazyImages = cardElement.querySelectorAll('img[data-src], source[data-srcset]');
            if (lazyImages.length === 0) {
                return;
            }

            if (observer) {
                lazyImages.forEach(image => observer.observe(image));
            } else {
                lazyImages.forEach(image => {
                    const dataSrcset = image.getAttribute('data-srcset');
                    const dataSrc = image.getAttribute('data-src');

                    if (dataSrcset) {
                        image.setAttribute('srcset', dataSrcset);
                        image.removeAttribute('data-srcset');
                    }

                    if (dataSrc) {
                        image.setAttribute('src', dataSrc);
                        image.removeAttribute('data-src');
                    }
                });
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

    const dispatchSearchLog = debounce((payload) => {
        if (!payload || !payload.query) {
            return;
        }

        if (typeof fetch !== 'function') {
            return;
        }

        fetch('/.netlify/functions/log-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('Failed to send search analytics payload', error);
        });
    }, 500);

    const queueSearchLog = (query, resultsCount, extras = {}) => {
        if (!query) {
            return;
        }

        const sanitizedQuery = String(query).trim();
        const numericCount = Number.isFinite(Number(resultsCount)) ? Number(resultsCount) : 0;

        const now = Date.now();
        if (
            lastLoggedSearch.query === sanitizedQuery &&
            lastLoggedSearch.results === numericCount &&
            now - lastLoggedSearchAt < 60000
        ) {
            return;
        }

        lastLoggedSearch = {
            query: sanitizedQuery,
            results: numericCount
        };
        lastLoggedSearchAt = now;

        dispatchSearchLog({
            query: sanitizedQuery,
            results: numericCount,
            ...extras
        });
    };

    // Enhanced filter function
    const filterAndRender = async (fromSearchInput = false) => {
        const requestId = ++filterRequestId;
        activeFilters.search = searchInput ? searchInput.value : '';
        activeFilters.category = categoryFilter ? categoryFilter.value : 'All Categories';
        activeFilters.type = typeFilter ? typeFilter.value : 'All Types';

        const searchTerm = activeFilters.search ? activeFilters.search.trim() : '';

        let pagefindResult = null;

        if (searchTerm) {
            pagefindResult = await runPagefindSearch(searchTerm);
        }

        if (requestId !== filterRequestId) {
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();

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
            if (searchTerm) {
                if (pagefindResult) {
                    const proofUrlKey = getProofUrlKey(p);
                    if (!proofUrlKey || !pagefindResult.urls?.has(proofUrlKey)) {
                        return false;
                    }
                } else {
                    const searchableText = [
                        p.title,
                        p.thesis,
                        p.stakes,
                        p.violation,
                        p.rule_summary,
                        p.case_id,
                        p.category
                    ].join(' ').toLowerCase();

                    if (!searchableText.includes(searchTermLower)) {
                        return false;
                    }
                }
            }
            return true;
        });

        renderProofs(filteredProofs);
        updateResultsCount();
        renderFilterBadges();

        if (fromSearchInput && searchTerm) {
            queueSearchLog(searchTerm, filteredProofs.length, {
                filters: {
                    category: activeFilters.category,
                    type: activeFilters.type
                },
                pagefindResults: pagefindResult?.count ?? null,
                strategy: pagefindResult ? 'pagefind' : 'local',
                triggeredAt: new Date().toISOString()
            });
        }
    };

    // Debounced search handler
    const handleSearch = debounce(async () => {
        if (countEl && searchInput) {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                countEl.innerHTML = '<span class="loading-indicator"><span class="loading-indicator__label">Searching</span><span class="loading-dots" aria-hidden="true"><span></span><span></span><span></span></span></span>';
            }
        }

        await filterAndRender(true);
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
            if (!trigger.id) {
                modalTriggerIdCounter += 1;
                trigger.id = `modal-trigger-${modalTriggerIdCounter}`;
            }

            trigger.addEventListener('click', () => {
                const modalId = trigger.dataset.modalTarget;
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.dataset.openerId = trigger.id;
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
    const initialize = () => {
        try {
            observer = lazyLoadProofs();

            const proofDataElement = document.getElementById('proof-data');
            if (!grid || !proofDataElement) {
                return;
            }

            const rawJson = (proofDataElement.textContent || '').trim();
            if (!rawJson) {
                throw new Error('Proof data element is empty.');
            }

            let parsedPayload;
            try {
                parsedPayload = JSON.parse(rawJson);
            } catch (parseError) {
                throw new Error('Proof data JSON is invalid.');
            }

            let proofsData;
            if (Array.isArray(parsedPayload?.proofs)) {
                proofsData = parsedPayload.proofs;
            } else if (Array.isArray(parsedPayload)) {
                proofsData = parsedPayload;
            } else {
                throw new Error('Unrecognized proof data format.');
            }

            allProofs = proofsData.filter((proof) => proof && proof.title);
            filteredProofs = [...allProofs];

            populateFilters();
            renderProofs(filteredProofs);
            updateResultsCount();
            renderFilterBadges();
            ensurePagefind();

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

            initModals();
        } catch (error) {
            console.error('Error initializing archive:', error);
            if (grid) {
                grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:40px; color:red;">Could not load proofs. Please try again later.</p>';
            }
        }
    };

    initialize();
}
