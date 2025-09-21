const encodeFormData = (formData) => {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            params.append(key, value);
        }
    }
    return params.toString();
};

const setStatusMessage = (statusEl, message, state) => {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('is-success', 'is-error', 'is-pending');
    if (state) {
        statusEl.classList.add(state);
    }
};

const setElementDisabled = (element, disabled) => {
    if (!element) return;
    element.disabled = disabled;
    if (disabled) {
        element.setAttribute('aria-disabled', 'true');
    } else {
        element.removeAttribute('aria-disabled');
    }
};

const toggleButtonsDisabled = (buttons, disabled) => {
    buttons.forEach((button) => setElementDisabled(button, disabled));
};

export function initFeedback() {
    const forms = document.querySelectorAll('[data-feedback-form]');
    if (!forms.length) return;

    forms.forEach((form) => {
        const ratingField = form.querySelector('[data-feedback-value]');
        const buttons = Array.from(form.querySelectorAll('[data-feedback-answer]'));
        if (!ratingField || !buttons.length) return;

        const followup = form.querySelector('[data-feedback-followup]');
        const followupTextarea = form.querySelector('[data-feedback-textarea]');
        const submitButton = form.querySelector('[data-feedback-submit]');
        const statusEl = form.querySelector('[data-feedback-status]');

        let isSubmitting = false;

        const clearStatus = () => setStatusMessage(statusEl, '', null);

        const updateButtonState = (selectedButton) => {
            buttons.forEach((button) => {
                const isActive = button === selectedButton;
                button.classList.toggle('is-selected', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        };

        const showFollowup = () => {
            if (followup) {
                followup.hidden = false;
            }
            setElementDisabled(submitButton, false);
            followupTextarea?.focus({ preventScroll: false });
        };

        const hideFollowup = ({ clear = true } = {}) => {
            if (followup) {
                followup.hidden = true;
            }
            if (clear && followupTextarea) {
                followupTextarea.value = '';
            }
        };

        const sendFeedback = async () => {
            if (isSubmitting) return;
            const rating = ratingField.value;
            if (!rating) {
                setStatusMessage(statusEl, 'Choose Yes or No to send feedback.', 'is-error');
                return;
            }

            const formData = new FormData(form);
            formData.set('feedback_rating', rating);
            if (followupTextarea) {
                formData.set('feedback_details', followupTextarea.value.trim());
            }

            formData.set('page_title', document.title);
            formData.set('page_url', window.location.href);
            const pathParts = [
                window.location.pathname,
                window.location.search,
                window.location.hash
            ].filter(Boolean);
            formData.set('page_path', pathParts.join(''));
            formData.set('page_language', document.documentElement?.lang || '');
            formData.set('referrer', document.referrer || '');
            formData.set('user_agent', navigator.userAgent);
            formData.set('submitted_at', new Date().toISOString());

            const body = encodeFormData(formData);
            const endpointAttr = form.getAttribute('action');
            const endpoint =
                endpointAttr && endpointAttr.trim()
                    ? endpointAttr
                    : form.action || window.location.pathname;

            try {
                isSubmitting = true;
                toggleButtonsDisabled(buttons, true);
                setElementDisabled(submitButton, true);
                setStatusMessage(statusEl, 'Sending feedback…', 'is-pending');

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                setStatusMessage(
                    statusEl,
                    'Thanks for helping us improve this page.',
                    'is-success'
                );
                form.dataset.feedbackState = 'submitted';
                hideFollowup();
            } catch (error) {
                console.error('Feedback submission failed:', error);
                setStatusMessage(
                    statusEl,
                    'Sorry—your feedback could not be sent. Please try again.',
                    'is-error'
                );
                toggleButtonsDisabled(buttons, false);
                setElementDisabled(submitButton, false);
            } finally {
                isSubmitting = false;
            }
        };

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                if (isSubmitting) return;
                const answer = button.dataset.feedbackAnswer;
                if (!answer) return;

                ratingField.value = answer;
                updateButtonState(button);
                clearStatus();

                if (answer === 'no') {
                    showFollowup();
                } else {
                    hideFollowup();
                    sendFeedback();
                }
            });
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (isSubmitting) return;
            clearStatus();
            sendFeedback();
        });
    });
}
