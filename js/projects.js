/**
 * Sample Projects for the Opportunities Page
 * Renders cards from data/projects.json; full descriptions open in a native
 * <dialog> so the rest of the page never shifts. If the data is missing or
 * empty the static fallback in the grid is left in place.
 */

(function() {
    'use strict';

    const grid = document.getElementById('projectGrid');
    const dialog = document.getElementById('projectDialog');
    if (!grid || !dialog) return;

    const dialogTitle = document.getElementById('projectDialogTitle');
    const dialogAreas = document.getElementById('projectDialogAreas');
    const dialogBody = document.getElementById('projectDialogBody');
    const dialogEmail = document.getElementById('projectDialogEmail');

    fetch('data/projects.json')
        .then(response => response.ok ? response.json() : Promise.reject(response.status))
        .then(data => render(data.projects || []))
        .catch(() => { /* leave the fallback message in the grid */ });

    function render(projects) {
        if (!projects.length) return;

        grid.innerHTML = '';
        projects.forEach(project => grid.appendChild(buildCard(project)));

        // Deep link support: #project-<id> opens that project on load
        const match = location.hash.match(/^#project-(.+)$/);
        if (match) {
            const target = projects.find(p => p.id === match[1]);
            if (target) openDialog(target);
        }
    }

    function buildCard(project) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'project-card';
        card.id = 'project-' + project.id;

        const title = document.createElement('h3');
        title.textContent = project.title;
        card.appendChild(title);

        if (Array.isArray(project.areas) && project.areas.length) {
            const areas = document.createElement('p');
            areas.className = 'project-card-areas';
            areas.textContent = project.areas.join(' · ');
            card.appendChild(areas);
        }

        if (project.summary) {
            const summary = document.createElement('p');
            summary.className = 'project-card-summary';
            summary.textContent = project.summary;
            card.appendChild(summary);
        }

        const more = document.createElement('span');
        more.className = 'project-card-more';
        more.textContent = 'Read the full description';
        card.appendChild(more);

        card.addEventListener('click', () => openDialog(project));
        return card;
    }

    function openDialog(project) {
        dialogTitle.textContent = project.title;

        const areas = Array.isArray(project.areas) ? project.areas.join(' · ') : '';
        dialogAreas.textContent = areas;
        dialogAreas.hidden = !areas;

        dialogBody.innerHTML = '';
        String(project.description || project.summary || '')
            .split(/\n\s*\n/)
            .filter(paragraph => paragraph.trim())
            .forEach(paragraph => {
                const p = document.createElement('p');
                p.textContent = paragraph.trim();
                dialogBody.appendChild(p);
            });

        if (dialogEmail) {
            const mailto = buildMailto(project);
            if (mailto) dialogEmail.href = mailto;
        }

        dialog.showModal();
    }

    // Rebuild the mailto for the project on show, so the subject names the
    // project and the body arrives with the details worth having up front.
    // The address is assembled from the same split data attributes common.js
    // uses, so it is still absent from the page source.
    function buildMailto(project) {
        const user = dialogEmail.getAttribute('data-email-user');
        const domain = ['data-email-d1', 'data-email-d2', 'data-email-d3']
            .map(attr => dialogEmail.getAttribute(attr))
            .filter(Boolean)
            .join('.');
        if (!user || !domain) return '';

        const subject = 'PhD project enquiry: ' + project.title;
        const body = [
            'Dear Dr Pourmousavi,',
            '',
            'I would like to be considered for the project "' + project.title + '".',
            '',
            'Eligibility (domestic applicant, or where you completed an Australian/NZ degree):',
            'Degree and university:',
            'Year completed:',
            'GPA (out of 7):',
            'Capstone, honours or masters research project, and the mark you received:',
            'Relevant skills and experience:',
            'Why this project interests me:',
            '',
            'I have attached my CV and academic transcripts.',
            '',
            'Kind regards,'
        ].join('\n');

        return 'mailto:' + user + '@' + domain +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(body);
    }

    // Clicking the backdrop closes the dialog. The dialog element fills the
    // whole viewport as far as the event target is concerned, so compare the
    // click position against the content box.
    dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const box = dialog.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right &&
                       event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) dialog.close();
    });
})();
