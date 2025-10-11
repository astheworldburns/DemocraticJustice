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
  const STORAGE_KEY = 'reviewFormState';
  const sessionStorageRef = (() => {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    try {
      const { sessionStorage } = window;
      const testKey = `${STORAGE_KEY}__test`;
      sessionStorage.setItem(testKey, '1');
      sessionStorage.removeItem(testKey);
      return sessionStorage;
    } catch (error) {
      console.warn('Session storage is unavailable; form progress will not persist.', error);
      return null;
    }
  })();
  let saveTimeoutId = null;

  const isRadioGroup = (value) => typeof RadioNodeList !== 'undefined' && value instanceof RadioNodeList;

  const saveFormState = () => {
    if (!sessionStorageRef) return;
    try {
      const formData = new FormData(form);
      const stored = {};
      formData.forEach((value, key) => {
        if (!key) return;
        if (Object.prototype.hasOwnProperty.call(stored, key)) {
          const existing = stored[key];
          stored[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        } else {
          stored[key] = value;
        }
      });

      const payload = {
        currentStep,
        data: stored
      };
      sessionStorageRef.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to save form state:', error);
    }
  };

  const scheduleSaveFormState = () => {
    if (!sessionStorageRef) return;
    if (typeof window !== 'undefined') {
      window.clearTimeout(saveTimeoutId);
      saveTimeoutId = window.setTimeout(() => {
        saveFormState();
        saveTimeoutId = null;
      }, 200);
    } else {
      saveFormState();
    }
  };

  const clearFormState = () => {
    if (!sessionStorageRef) return;
    try {
      sessionStorageRef.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear saved form state:', error);
    }
    if (typeof window !== 'undefined' && saveTimeoutId !== null) {
      window.clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
  };

  const restoreFormState = () => {
    if (!sessionStorageRef) return false;
    let savedRaw = '';
    try {
      savedRaw = sessionStorageRef.getItem(STORAGE_KEY) || '';
    } catch (error) {
      console.warn('Failed to read saved form state:', error);
      return false;
    }

    if (!savedRaw) {
      return false;
    }

    let parsed;
    try {
      parsed = JSON.parse(savedRaw);
    } catch (error) {
      console.warn('Corrupt saved form state detected; clearing.', error);
      clearFormState();
      return false;
    }

    if (!parsed || typeof parsed !== 'object') {
      return false;
    }

    const { currentStep: savedStep = 0, data = {} } = parsed;
    Object.entries(data).forEach(([name, value]) => {
      if (!name) return;
      const controls = form.elements[name];
      if (!controls) return;

      const values = Array.isArray(value) ? value : [value];

      if (isRadioGroup(controls)) {
        Array.from(controls).forEach((control) => {
          control.checked = values.includes(control.value);
        });
        return;
      }

      const applyValue = (control) => {
        if (!control) return;
        if (control.type === 'checkbox') {
          control.checked = values.includes(control.value) || (!control.value && values.includes('on'));
          return;
        }
        if (control.type === 'radio') {
          control.checked = values.includes(control.value);
          return;
        }
        if (control.type === 'select-multiple') {
          Array.from(control.options).forEach((option) => {
            option.selected = values.includes(option.value);
          });
          return;
        }
        if (typeof control.value === 'string') {
          control.value = values[values.length - 1] ?? '';
        }
      };

      if (typeof controls.length === 'number' && !controls.tagName) {
        Array.from(controls).forEach(applyValue);
      } else {
        applyValue(controls);
      }
    });

    const boundedStep = Number.isInteger(savedStep)
      ? Math.min(Math.max(savedStep, 0), steps.length - 1)
      : 0;
    goToStep(boundedStep, { focusField: false });
    return true;
  };

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
      message = `This date is ${daysAhead} day${daysAhead === 1 ? '' : 's'} in the future. Share upcoming deadlines or hearing dates so we can plan accordingly.`;
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

  const getLiveRegion = () => {
    let region = form.querySelector('#form-error-live');
    if (!region) {
      region = document.createElement('div');
      region.id = 'form-error-live';
      region.setAttribute('role', 'alert');
      region.setAttribute('aria-live', 'assertive');
      region.className = 'visually-hidden';
      form.appendChild(region);
    }
    return region;
  };

  nextBtn?.addEventListener('click', () => {
    updateRegistrationState();
    updatePriorRemedyState();
    updateDeadlineState();
    if (!form.reportValidity()) return;
    goToStep(currentStep + 1);
    saveFormState();
  });

  prevBtn?.addEventListener('click', () => {
    goToStep(currentStep - 1);
    saveFormState();
  });

  registrationRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      updateRegistrationState();
      scheduleSaveFormState();
    });
  });

  priorRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      updatePriorRemedyState();
      scheduleSaveFormState();
    });
  });

  dateInput?.addEventListener('input', () => {
    updateDeadlineState();
    scheduleSaveFormState();
  });
  dateInput?.addEventListener('change', () => {
    updateDeadlineState();
    scheduleSaveFormState();
  });

  form.addEventListener(
    'submit',
    (event) => {
      scheduleSaveFormState();
      updateRegistrationState();
      updatePriorRemedyState();
      updateDeadlineState();
      restoreAllRequired();

      if (!form.checkValidity()) {
        event.preventDefault();
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
          const errorMessage = firstInvalid.validationMessage;
          const liveRegion = getLiveRegion();
          liveRegion.textContent = errorMessage ? `Error: ${errorMessage}` : 'There is an error in the form.';
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
    clearFormState();
    window.requestAnimationFrame(() => {
      goToStep(0, { focusField: false });
      updateRegistrationState();
      updatePriorRemedyState();
      updateDeadlineState();
    });
  });

  form.addEventListener('enhanced:success', () => {
    clearFormState();
    form.reset();
    goToStep(0, { focusField: false });
    updateRegistrationState();
    updatePriorRemedyState();
    updateDeadlineState();
  });

  form.addEventListener('input', scheduleSaveFormState);
  form.addEventListener('change', scheduleSaveFormState);

  const refreshDynamicState = () => {
    updateRegistrationState();
    updatePriorRemedyState();
    updateDeadlineState();
  };

  refreshDynamicState();
  const restored = restoreFormState();
  if (restored) {
    refreshDynamicState();
  } else {
    goToStep(0, { focusField: false });
  }
}
