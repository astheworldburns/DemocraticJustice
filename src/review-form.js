export function initReviewForm() {
    const form = document.querySelector('[data-form-id="challenge-review"]');
    if (!form) return;

    const steps = Array.from(form.querySelectorAll('[data-form-step]'));
    if (!steps.length) return;

    const progressItems = Array.from(form.querySelectorAll('[data-progress-step]'));
    const statusEl = form.querySelector('[data-progress-status]');
    const nextBtn = form.querySelector('[data-form-next]');
    const prevBtn = form.querySelector('[data-form-prev]');
    const submitBtn = form.querySelector('[data-form-submit]');

    const registrationExplain = form.querySelector('[data-registration-explanation]');
    const registrationExplainField = registrationExplain?.querySelector('textarea');
    const registrationRadios = form.querySelectorAll('input[name="wv-registered"]');

    const priorRadios = form.querySelectorAll('input[name="prior-remedy"]');
    const priorGroups = form.querySelectorAll('[data-prior-remedy]');

    const dateInput = form.querySelector('#decision-date');
    const dateWarning = form.querySelector('[data-date-warning]');
    const deadlineGroup = form.querySelector('[data-deadline-notes]');
    const deadlineField = deadlineGroup?.querySelector('textarea');

    const allFields = Array.from(form.querySelectorAll('input, select, textarea'));
    allFields.forEach((field) => {
        if (field.hasAttribute('required')) {
            field.dataset.originalRequired = 'true';
        }
    });

    let currentStep = 0;

    const updateStepState = () => {
        steps.forEach((step, index) => {
            const isActive = index === currentStep;
            step.hidden = !isActive;
            step.classList.toggle('is-active', isActive);
            step.setAttribute('aria-hidden', isActive ? 'false' : 'true');

            const stepFields = step.querySelectorAll('input, select, textarea');
            stepFields.forEach((field) => {
                if (field.dataset.originalRequired === 'true') {
                    field.required = isActive;
                }
            });
        });

        progressItems.forEach((item, index) => {
            const isActive = index === currentStep;
            item.classList.toggle('is-active', isActive);
            item.classList.toggle('is-complete', index < currentStep);
            item.setAttribute('aria-current', isActive ? 'step' : 'false');
        });

        if (statusEl) {
            statusEl.textContent = `Step ${currentStep + 1} of ${steps.length}`;
        }

        if (prevBtn) {
            prevBtn.disabled = currentStep === 0;
        }

        if (nextBtn) {
            nextBtn.hidden = currentStep === steps.length - 1;
        }

        if (submitBtn) {
            submitBtn.hidden = currentStep !== steps.length - 1;
        }
    };

    const focusCurrentStep = () => {
        const activeStep = steps[currentStep];
        if (!activeStep) return;
        const focusable = activeStep.querySelector(
            'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
        );
        if (focusable) {
            focusable.focus({ preventScroll: false });
        }
    };

    const goToStep = (index, { focusField = true } = {}) => {
        const boundedIndex = Math.min(Math.max(index, 0), steps.length - 1);
        if (boundedIndex === currentStep) {
            updateStepState();
            if (focusField) {
                window.requestAnimationFrame(focusCurrentStep);
            }
            return;
        }

        currentStep = boundedIndex;
        updateStepState();
        if (focusField) {
            window.requestAnimationFrame(focusCurrentStep);
        }
    };

    const updateRegistrationState = () => {
        if (!registrationExplain) return;
        const selected = form.querySelector('input[name="wv-registered"]:checked');
        const shouldShow = selected?.value === 'no';
        registrationExplain.hidden = !shouldShow;
        if (registrationExplainField) {
            registrationExplainField.required = !!shouldShow;
        }
    };

    const updatePriorRemedyState = () => {
        const selected = form.querySelector('input[name="prior-remedy"]:checked')?.value;
        priorGroups.forEach((group) => {
            const matches = selected && group.dataset.priorRemedy === selected;
            group.hidden = !matches;
            const field = group.querySelector('textarea');
            if (field) {
                field.required = matches && selected === 'yes';
            }
        });
    };

    const updateDeadlineState = () => {
        if (!dateInput) return;
        const value = dateInput.value;

        if (!value) {
            if (dateWarning) {
                dateWarning.hidden = true;
                dateWarning.textContent = '';
            }
            if (deadlineGroup) {
                deadlineGroup.hidden = true;
            }
            if (deadlineField) {
                deadlineField.required = false;
            }
            return;
        }

        const selectedDate = new Date(`${value}T00:00:00`);
        if (Number.isNaN(selectedDate.getTime())) {
            return;
        }

        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffMs = todayMidnight.getTime() - selectedDate.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        let message = '';
        let showNotes = false;
        let requireNotes = false;

        if (diffDays > 30) {
            message = `This date is ${diffDays} days old. WVSDEC filings must arrive within 30 days, so explain why the deadline still applies.`;
            showNotes = true;
            requireNotes = true;
        } else if (diffDays < 0) {
            const daysAhead = Math.abs(diffDays);
            message = `This date is ${daysAhead} day${
                daysAhead === 1 ? '' : 's'
            } in the future. Share upcoming deadlines or hearing dates so we can plan accordingly.`;
            showNotes = true;
        }

        if (dateWarning) {
            if (message) {
                dateWarning.textContent = message;
                dateWarning.hidden = false;
            } else {
                dateWarning.hidden = true;
                dateWarning.textContent = '';
            }
        }

        if (deadlineGroup) {
            deadlineGroup.hidden = !showNotes;
        }

        if (deadlineField) {
            deadlineField.required = requireNotes;
        }
    };

    const restoreAllRequired = () => {
        allFields.forEach((field) => {
            if (field.dataset.originalRequired === 'true') {
                field.required = true;
            }
        });
    };

    nextBtn?.addEventListener('click', () => {
        updateRegistrationState();
        updatePriorRemedyState();
        updateDeadlineState();
        if (!form.reportValidity()) return;
        goToStep(currentStep + 1);
    });

    prevBtn?.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });

    registrationRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            updateRegistrationState();
        });
    });

    priorRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            updatePriorRemedyState();
        });
    });

    dateInput?.addEventListener('input', updateDeadlineState);
    dateInput?.addEventListener('change', updateDeadlineState);

    form.addEventListener(
        'submit',
        (event) => {
            updateRegistrationState();
            updatePriorRemedyState();
            updateDeadlineState();
            restoreAllRequired();

            if (!form.checkValidity()) {
                event.preventDefault();
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    const stepIndex = steps.findIndex((step) => step.contains(firstInvalid));
                    if (stepIndex !== -1) {
                        goToStep(stepIndex, { focusField: false });
                    }
                    window.requestAnimationFrame(() => {
                        firstInvalid.reportValidity();
                        firstInvalid.focus({ preventScroll: false });
                    });
                }
            }
        },
        true
    );

    form.addEventListener('reset', () => {
        window.requestAnimationFrame(() => {
            goToStep(0, { focusField: false });
            updateRegistrationState();
            updatePriorRemedyState();
            updateDeadlineState();
        });
    });

    form.addEventListener('enhanced:success', () => {
        form.reset();
        goToStep(0, { focusField: false });
        updateRegistrationState();
        updatePriorRemedyState();
        updateDeadlineState();
    });

    updateRegistrationState();
    updatePriorRemedyState();
    updateDeadlineState();
    goToStep(0, { focusField: false });
}
