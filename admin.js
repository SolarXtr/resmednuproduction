document.addEventListener('DOMContentLoaded', () => {
    // State arrays
    let researchers = [];
    let publications = [];
    let dbMetadata = {}; // to keep retrieve time, affiliation etc.

    // DOM Elements
    const navResearchers = document.getElementById('nav-manage-researchers');
    const navPublications = document.getElementById('nav-manage-publications');
    const secResearchers = document.getElementById('manage-researchers-section');
    const secPublications = document.getElementById('manage-publications-section');

    const researcherTbody = document.getElementById('researcher-admin-tbody');
    const publicationTbody = document.getElementById('publication-admin-tbody');

    const searchResearcher = document.getElementById('researcher-admin-search');
    const searchPublication = document.getElementById('publication-admin-search');

    const btnGlobalSave = document.getElementById('btn-global-save');

    // Modals & Forms
    const researcherModal = document.getElementById('researcher-form-modal');
    const researcherForm = document.getElementById('researcher-form');
    const btnAddResearcher = document.getElementById('btn-add-researcher');
    const btnCancelResearcher = document.getElementById('btn-cancel-researcher');
    const researcherModalTitle = document.getElementById('researcher-modal-title');

    const publicationModal = document.getElementById('publication-form-modal');
    const publicationForm = document.getElementById('publication-form');
    const btnAddPublication = document.getElementById('btn-add-publication');
    const btnCancelPublication = document.getElementById('btn-cancel-publication');
    const publicationModalTitle = document.getElementById('publication-modal-title');

    const toastEl = document.getElementById('toast-el');
    const toastMsg = document.getElementById('toast-msg');

    // --- TAB SYSTEM NAVIGATION ---
    function switchTab(target) {
        if (target === 'researchers') {
            navResearchers.classList.add('active');
            navPublications.classList.remove('active');
            secResearchers.classList.add('active');
            secPublications.classList.remove('active');
        } else {
            navResearchers.classList.remove('active');
            navPublications.classList.add('active');
            secResearchers.classList.remove('active');
            secPublications.classList.add('active');
        }
    }

    navResearchers.addEventListener('click', (e) => { e.preventDefault(); switchTab('researchers'); });
    navPublications.addEventListener('click', (e) => { e.preventDefault(); switchTab('publications'); });

    // --- DATA FETCHING ---
    async function loadData() {
        try {
            // Load researchers from researchers.json
            const resResp = await fetch('researchers.json');
            if (resResp.ok) {
                researchers = await resResp.json();
            }

            // Load data.json for publications
            const dataResp = await fetch('data.json');
            if (dataResp.ok) {
                const db = await dataResp.json();
                publications = db.results || [];
                dbMetadata = {
                    status: db.status || "success",
                    data_source: db.data_source || "manual",
                    retrieved_at: db.retrieved_at,
                    affiliation: db.affiliation || "Faculty of Medicine, Naresuan University",
                    researchers: db.researchers || []
                };
            }
            renderResearchers();
            renderPublications();
        } catch (err) {
            console.error("Error loading data:", err);
            showToast("Failed to load databases", "error");
        }
    }

    // --- TOAST NOTIFICATIONS ---
    function showToast(message, type = "success") {
        toastMsg.textContent = message;
        if (type === "success") {
            toastEl.querySelector('i').className = "fa-solid fa-circle-check";
            toastEl.querySelector('i').style.color = "var(--accent-teal)";
        } else {
            toastEl.querySelector('i').className = "fa-solid fa-triangle-exclamation";
            toastEl.querySelector('i').style.color = "#ef4444";
        }
        toastEl.classList.add('active');
        setTimeout(() => {
            toastEl.classList.remove('active');
        }, 3000);
    }

    // --- RENDER RESEARCHERS ---
    function renderResearchers() {
        const query = searchResearcher.value.toLowerCase();
        const filtered = researchers.filter(r => 
            r.name.toLowerCase().includes(query) ||
            r.author_id.includes(query) ||
            r.department.toLowerCase().includes(query)
        );

        researcherTbody.innerHTML = '';
        if (filtered.length === 0) {
            researcherTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No researchers found.</td></tr>`;
            return;
        }

        filtered.forEach((r, idx) => {
            // Find original index in master array
            const originalIndex = researchers.indexOf(r);
            const tr = document.createElement('tr');
            
            const badgeClass = r.status === 'Active' ? 'badge-citation' : 'badge-citation';
            const badgeStyle = r.status === 'Active' 
                ? 'background: rgba(13, 148, 136, 0.15); color: var(--accent-teal); border: 1px solid rgba(13, 148, 136, 0.25);' 
                : 'background: rgba(148, 163, 184, 0.15); color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.25);';

            tr.innerHTML = `
                <td style="font-weight:600;">${r.name}</td>
                <td><code>${r.author_id}</code></td>
                <td style="font-size:0.85rem;">${r.department}</td>
                <td>
                    <span class="badge" style="padding: 0.25rem 0.5rem; border-radius: 6px; font-weight:600; font-size:0.75rem; ${badgeStyle}">
                        ${r.status}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button class="admin-action-btn btn-edit" data-idx="${originalIndex}"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="admin-action-btn btn-delete" data-idx="${originalIndex}"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            `;
            researcherTbody.appendChild(tr);
        });

        // Add event listeners to edit and delete buttons
        researcherTbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                openResearcherModal(idx);
            });
        });
        researcherTbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                if (confirm(`Are you sure you want to delete ${researchers[idx].name}?`)) {
                    researchers.splice(idx, 1);
                    renderResearchers();
                    showToast("Researcher removed locally (Remember to Save)");
                }
            });
        });
    }

    // --- RENDER PUBLICATIONS ---
    function renderPublications() {
        const query = searchPublication.value.toLowerCase();
        const filtered = publications.filter(pub => 
            pub.title.toLowerCase().includes(query) ||
            pub.journal.toLowerCase().includes(query) ||
            pub.authors.some(a => a.toLowerCase().includes(query))
        );

        publicationTbody.innerHTML = '';
        if (filtered.length === 0) {
            publicationTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No publications found.</td></tr>`;
            return;
        }

        filtered.forEach((pub, idx) => {
            const originalIndex = publications.indexOf(pub);
            const tr = document.createElement('tr');
            
            const doiSection = pub.doi ? `
                <div style="font-size:0.75rem; color: var(--text-secondary); margin-top:0.25rem;">
                    <i class="fa-solid fa-link"></i> DOI: ${pub.doi}
                </div>` : '';

            const dbList = pub.databases || ["Scopus"];
            const dbBadgesHtml = dbList.map(db => {
                const cleanDb = db.trim();
                const badgeClass = cleanDb.toLowerCase() === "scopus" ? "db-badge-scopus" : "db-badge-pubmed";
                return `<span class="db-badge ${badgeClass}" style="font-size:0.6rem; padding:0.1rem 0.3rem;">${cleanDb}</span>`;
            }).join(' ');

            tr.innerHTML = `
                <td>
                    <div style="font-weight:600; font-size:0.9rem; line-height:1.4;">${pub.title}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;">
                        ${pub.authors.join(', ')}
                    </div>
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
                        ${doiSection}
                        <div class="db-badges" style="margin-left:0;">${dbBadgesHtml}</div>
                    </div>
                </td>
                <td style="font-size:0.85rem;">${pub.journal}</td>
                <td style="text-align: center; font-weight:500;">${pub.year}</td>
                <td style="text-align: center;">
                    <span class="badge" style="background: rgba(124, 58, 237, 0.1); color: var(--accent-purple); font-weight:bold; padding:0.2rem 0.5rem; border-radius:6px;">
                        ${pub.citations}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button class="admin-action-btn btn-edit" data-idx="${originalIndex}"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="admin-action-btn btn-delete" data-idx="${originalIndex}"><i class="fa-solid fa-trash"></i> Delete</button>
                </td>
            `;
            publicationTbody.appendChild(tr);
        });

        // Add event listeners
        publicationTbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                openPublicationModal(idx);
            });
        });
        publicationTbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                if (confirm(`Are you sure you want to delete this publication: "${publications[idx].title.substring(0, 50)}..."?`)) {
                    publications.splice(idx, 1);
                    renderPublications();
                    showToast("Article removed locally (Remember to Save)");
                }
            });
        });
    }

    // --- FORM MODAL ACTIONS ---
    // Researcher Modal Helpers
    function openResearcherModal(idx = null) {
        if (idx !== null) {
            researcherModalTitle.textContent = "Edit Researcher";
            const r = researchers[idx];
            document.getElementById('researcher-idx').value = idx;
            document.getElementById('res-name').value = r.name;
            document.getElementById('res-id').value = r.author_id;
            document.getElementById('res-dept').value = r.department;
            document.getElementById('res-status').value = r.status;
        } else {
            researcherModalTitle.textContent = "Add Researcher";
            researcherForm.reset();
            document.getElementById('researcher-idx').value = "";
        }
        researcherModal.classList.add('active');
    }

    btnAddResearcher.addEventListener('click', () => openResearcherModal());
    btnCancelResearcher.addEventListener('click', () => researcherModal.classList.remove('active'));
    document.getElementById('researcher-modal-close').addEventListener('click', () => researcherModal.classList.remove('active'));

    researcherForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = document.getElementById('researcher-idx').value;
        const record = {
            name: document.getElementById('res-name').value.trim(),
            author_id: document.getElementById('res-id').value.trim(),
            department: document.getElementById('res-dept').value.trim(),
            status: document.getElementById('res-status').value
        };

        if (idx !== "") {
            researchers[parseInt(idx)] = record;
            showToast("Researcher updated locally");
        } else {
            researchers.push(record);
            showToast("Researcher added locally");
        }
        researcherModal.classList.remove('active');
        renderResearchers();
    });

    // Publication Modal Helpers
    function openPublicationModal(idx = null) {
        if (idx !== null) {
            publicationModalTitle.textContent = "Edit Article Details";
            const pub = publications[idx];
            document.getElementById('publication-idx').value = idx;
            document.getElementById('pub-title-input').value = pub.title;
            document.getElementById('pub-authors-input').value = pub.authors.join(', ');
            document.getElementById('pub-corr-input').value = pub.corresponding_author || "";
            document.getElementById('pub-journal-input').value = pub.journal;
            document.getElementById('pub-year-input').value = pub.year;
            document.getElementById('pub-citations-input').value = pub.citations;
            document.getElementById('pub-doi-input').value = pub.doi || "";

            const dbList = pub.databases || ["Scopus"];
            document.getElementById('db-scopus').checked = dbList.includes("Scopus");
            document.getElementById('db-pubmed').checked = dbList.includes("PubMed");
        } else {
            publicationModalTitle.textContent = "Add New Article";
            publicationForm.reset();
            document.getElementById('publication-idx').value = "";
            document.getElementById('db-scopus').checked = true;
            document.getElementById('db-pubmed').checked = false;
        }
        publicationModal.classList.add('active');
    }

    btnAddPublication.addEventListener('click', () => openPublicationModal());
    btnCancelPublication.addEventListener('click', () => publicationModal.classList.remove('active'));
    document.getElementById('publication-modal-close').addEventListener('click', () => publicationModal.classList.remove('active'));

    publicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = document.getElementById('publication-idx').value;
        
        // Parse authors array
        const authorsVal = document.getElementById('pub-authors-input').value;
        const authorsList = authorsVal.split(',').map(a => a.trim()).filter(a => a !== "");

        // Build database tags
        const databases = [];
        if (document.getElementById('db-scopus').checked) databases.push("Scopus");
        if (document.getElementById('db-pubmed').checked) databases.push("PubMed");
        if (databases.length === 0) databases.push("Scopus"); // Fallback

        const record = {
            title: document.getElementById('pub-title-input').value.trim(),
            creator: authorsList[0] || "Unknown",
            authors: authorsList,
            corresponding_author: document.getElementById('pub-corr-input').value.trim() || null,
            departments: [], // populated automatically on save
            journal: document.getElementById('pub-journal-input').value.trim(),
            coverDate: `${document.getElementById('pub-year-input').value}-01-01`,
            year: document.getElementById('pub-year-input').value.toString(),
            citations: parseInt(document.getElementById('pub-citations-input').value) || 0,
            doi: document.getElementById('pub-doi-input').value.trim() || null,
            databases: databases
        };

        // Inject department auto-matching for the added authors
        const registeredDepts = [];
        authorsList.forEach(author => {
            const matched = researchers.find(r => r.name.toLowerCase() === author.toLowerCase());
            if (matched && !registeredDepts.includes(matched.department)) {
                registeredDepts.push(matched.department);
            }
        });
        record.departments = registeredDepts.length > 0 ? registeredDepts : ["Faculty of Medicine"];

        if (idx !== "") {
            publications[parseInt(idx)] = record;
            showToast("Article updated locally");
        } else {
            publications.push(record);
            showToast("Article added locally");
        }
        publicationModal.classList.remove('active');
        renderPublications();
    });

    // --- SEARCH LISTENERS ---
    searchResearcher.addEventListener('input', renderResearchers);
    searchPublication.addEventListener('input', renderPublications);

    // --- GLOBAL SAVE API CALLS ---
    btnGlobalSave.addEventListener('click', async () => {
        try {
            btnGlobalSave.disabled = true;
            btnGlobalSave.querySelector('span').textContent = "Saving...";

            // 1. Save researchers.json
            const resSaveResp = await fetch('/api/researchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonStringifyWithUnicode(researchers)
            });

            // 2. Save data.json
            const pubSaveResp = await fetch('/api/publications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonStringifyWithUnicode(publications)
            });

            if (resSaveResp.ok && pubSaveResp.ok) {
                showToast("Both files saved to disk successfully!");
            } else {
                throw new Error("One or more files failed to save.");
            }
        } catch (err) {
            console.error("Save error:", err);
            showToast("Failed to write to file system", "error");
        } finally {
            btnGlobalSave.disabled = false;
            btnGlobalSave.querySelector('span').textContent = "Save to JSON Files";
        }
    });

    // --- REPORT GENERATION EXPORTS ---
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportWord = document.getElementById('btn-export-word');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    // CSV Exporter
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const csvContent = [];
            // Headers
            csvContent.push(["Title", "Authors", "Corresponding Author", "Journal", "Year", "Citations", "DOI", "Databases", "Departments"].map(h => `"${h.replace(/"/g, '""')}"`).join(","));
            // Rows
            publications.forEach(pub => {
                csvContent.push([
                    pub.title || "",
                    pub.authors ? pub.authors.join("; ") : "",
                    pub.corresponding_author || "",
                    pub.journal || "",
                    pub.year || "",
                    pub.citations || "0",
                    pub.doi || "",
                    pub.databases ? pub.databases.join("; ") : "Scopus",
                    pub.departments ? pub.departments.join("; ") : ""
                ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(","));
            });

            const blob = new Blob(["\ufeff" + csvContent.join("\n")], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `mednu_publications_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("CSV Exported successfully!");
        });
    }

    // Word Exporter (HTML .doc trick)
    if (btnExportWord) {
        btnExportWord.addEventListener('click', () => {
            const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <title>Research Publications Report</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: 'Arial', sans-serif; line-height: 1.5; color: #333333; }
                    h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; font-size: 20pt; }
                    .meta { font-size: 10pt; color: #666666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 10pt; text-align: left; }
                    th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
                    .title { font-weight: bold; }
                    .authors { font-style: italic; color: #4b5563; }
                </style>
            </head>
            <body>
                <h1>Research Publications Report</h1>
                <div class="meta">
                    <strong>Faculty of Medicine, Naresuan University</strong><br/>
                    Generated on: ${dateStr}<br/>
                    Total Publications: ${publications.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%">No.</th>
                            <th style="width: 45%">Title & Authors</th>
                            <th style="width: 30%">Journal</th>
                            <th style="width: 10%">Year</th>
                            <th style="width: 10%">Citations</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            publications.forEach((pub, idx) => {
                html += `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>
                                <div class="title">${pub.title}</div>
                                <div class="authors">${pub.authors ? pub.authors.join(', ') : ''}</div>
                            </td>
                            <td>${pub.journal}</td>
                            <td style="text-align: center;">${pub.year}</td>
                            <td style="text-align: center;">${pub.citations}</td>
                        </tr>
                `;
            });
            
            html += `
                    </tbody>
                </table>
            </body>
            </html>
            `;

            const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `mednu_publications_report_${new Date().toISOString().split('T')[0]}.doc`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Word Report Exported successfully!");
        });
    }

    // PDF / Print Layout Exporter
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            document.querySelector('.main-content').setAttribute('data-date', today);
            window.print();
        });
    }

    // Helper to stringify with nice format and preserving thai unicode if any
    function jsonStringifyWithUnicode(obj) {
        return JSON.stringify(obj, null, 2);
    }

    // --- INITIAL DATA LOAD ---
    loadData();
});
