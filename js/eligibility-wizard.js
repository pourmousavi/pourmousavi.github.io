/**
 * Eligibility Wizard for Opportunities Page
 * Interactive decision tree for prospective HDR candidates
 */

(function() {
    'use strict';

    // Step flow mapping
    const stepFlow = {
        '1': { total: 3, current: 1 },
        '2-scholarship': { total: 3, current: 2 },
        '3-merit': { total: 3, current: 3 },
        'outcome-announced': { total: 2, current: 2, isOutcome: true },
        'outcome-contact': { total: 3, current: 3, isOutcome: true },
        'outcome-watch': { total: 3, current: 3, isOutcome: true },
        'outcome-below-threshold': { total: 3, current: 3, isOutcome: true },
        'outcome-other': { total: 2, current: 2, isOutcome: true }
    };

    // Navigation mapping for next steps
    const nextStepMap = {
        'announced': 'outcome-announced',
        'scholarship': '2-scholarship',
        'other': 'outcome-other'
    };

    // History stack for back navigation
    let history = ['1'];

    // Initialize wizard
    function initWizard() {
        const wizardContent = document.getElementById('wizardContent');
        if (!wizardContent) return;

        // Add click handlers to all wizard options
        const options = wizardContent.querySelectorAll('.wizard-option');
        options.forEach(option => {
            option.addEventListener('click', handleOptionClick);
        });

        // Update initial progress
        updateProgress('1');
    }

    // Handle option click
    function handleOptionClick(e) {
        const button = e.currentTarget;
        const nextKey = button.getAttribute('data-next');

        if (!nextKey) return;

        // Determine the actual next step
        let nextStep = nextStepMap[nextKey] || nextKey;

        // Navigate to next step
        navigateToStep(nextStep);
    }

    // Navigate to a specific step
    function navigateToStep(stepId) {
        const currentStep = document.querySelector('.wizard-step.active');
        const nextStep = document.querySelector(`.wizard-step[data-step="${stepId}"]`);

        if (!nextStep) {
            console.error('Step not found:', stepId);
            return;
        }

        // Add current step to history
        if (currentStep) {
            const currentStepId = currentStep.getAttribute('data-step');
            if (history[history.length - 1] !== currentStepId) {
                history.push(currentStepId);
            }
        }

        // Animate transition
        if (currentStep) {
            currentStep.classList.add('exiting');
            setTimeout(() => {
                currentStep.classList.remove('active', 'exiting');
            }, 300);
        }

        setTimeout(() => {
            nextStep.classList.add('active');
        }, currentStep ? 150 : 0);

        // Update progress
        updateProgress(stepId);

        // Add to history
        history.push(stepId);
    }

    // Go back to previous step
    window.wizardBack = function() {
        if (history.length <= 1) return;

        // Remove current step from history
        history.pop();

        // Get previous step
        const previousStepId = history[history.length - 1];

        const currentStep = document.querySelector('.wizard-step.active');
        const previousStep = document.querySelector(`.wizard-step[data-step="${previousStepId}"]`);

        if (!previousStep) return;

        // Animate transition
        if (currentStep) {
            currentStep.classList.add('exiting-back');
            setTimeout(() => {
                currentStep.classList.remove('active', 'exiting-back');
            }, 300);
        }

        setTimeout(() => {
            previousStep.classList.add('active');
        }, 150);

        // Update progress
        updateProgress(previousStepId);
    };

    // Restart wizard
    window.wizardRestart = function() {
        history = ['1'];

        const currentStep = document.querySelector('.wizard-step.active');
        const firstStep = document.querySelector('.wizard-step[data-step="1"]');

        if (currentStep) {
            currentStep.classList.remove('active');
        }

        if (firstStep) {
            firstStep.classList.add('active');
        }

        updateProgress('1');

        // Scroll to wizard
        const wizard = document.querySelector('.wizard-container');
        if (wizard) {
            wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Update progress bar
    function updateProgress(stepId) {
        const progressBar = document.getElementById('wizardProgressBar');
        const progressText = document.getElementById('wizardProgressText');

        if (!progressBar || !progressText) return;

        const stepInfo = stepFlow[stepId] || { total: 3, current: 1 };
        const percentage = (stepInfo.current / stepInfo.total) * 100;

        progressBar.style.width = percentage + '%';

        if (stepInfo.isOutcome) {
            progressText.textContent = 'Complete';
            progressBar.classList.add('complete');
        } else {
            progressText.textContent = `Step ${stepInfo.current} of ${stepInfo.total}`;
            progressBar.classList.remove('complete');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWizard);
    } else {
        initWizard();
    }
})();
