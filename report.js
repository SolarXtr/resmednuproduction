document.addEventListener('DOMContentLoaded', () => {
    // App State
    let database = null;
    let filteredResults = [];
    let currentYear = 'all';
    let activeQuartileSource = 'scimago';

    // DOM Elements
    const reportQuartileSelect = document.getElementById('report-quartile-select');
    const reportYearSelect = document.getElementById('report-year-select');
    const btnExportMatrix = document.getElementById('btn-export-matrix');
    const matrixTbody = document.getElementById('matrix-tbody');
    const retrievedTimeEl = document.getElementById('retrieved-at');
    const dataSourceBadge = document.getElementById('data-source-badge');

    // Summary Elements
    const sumCount = document.getElementById('sum-count');
    const sumCitedBy = document.getElementById('sum-cited-by');
    const sumCite2022 = document.getElementById('sum-cite-2022');
    const sumCite2023 = document.getElementById('sum-cite-2023');
    const sumCite2024 = document.getElementById('sum-cite-2024');
    const sumCite2025 = document.getElementById('sum-cite-2025');
    const sumCite2026 = document.getElementById('sum-cite-2026');
    const sumCiteSubtotal = document.getElementById('sum-cite-subtotal');
    const sumPublished = document.getElementById('sum-published');
    const sumQ1 = document.getElementById('sum-q1');
    const sumQ2 = document.getElementById('sum-q2');
    const sumQ3 = document.getElementById('sum-q3');
    const sumQ4 = document.getElementById('sum-q4');

    // --- DATA LOADING ---
    async function loadData() {
        try {
            retrievedTimeEl.textContent = 'Loading dataset...';
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to fetch dataset');
            
            database = await response.json();
            
            // Sync indicators
            retrievedTimeEl.textContent = `Sync: ${database.retrieved_at}`;
            if (database.data_source === 'mock_data') {
                dataSourceBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>DataSource: Sandbox Mode</span>`;
                dataSourceBadge.style.color = '#eab308';
            } else {
                dataSourceBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>DataSource: Scopus API</span>`;
                dataSourceBadge.style.color = '#14b8a6';
            }

            populateYearFilter();
            applyFilter();
        } catch (error) {
            console.error('Error loading report data:', error);
            retrievedTimeEl.textContent = 'Failed to load dataset';
        }
    }

    function populateYearFilter() {
        const years = new Set(database.results.map(r => r.year).filter(y => y && y !== 'Unknown Year'));
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        
        reportYearSelect.innerHTML = `
            <option value="last5">Last 5 Years</option>
            <option value="last3">Last 3 Years</option>
            <option value="all">All Years</option>
        `;
        sortedYears.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            reportYearSelect.appendChild(opt);
        });

        // Set default filter to last 5 years
        reportYearSelect.value = 'last5';
        currentYear = 'last5';
    }

    // --- HELPER METRIC TRANSLATORS ---
    function formatPublishDate(coverDate, year) {
        if (!coverDate || coverDate === "Unknown Date") {
            return year ? `Yr ${year}` : '-';
        }
        const parts = coverDate.split('-');
        if (parts.length >= 2) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIdx = parseInt(parts[1], 10) - 1;
            if (monthIdx >= 0 && monthIdx < 12) {
                const m = months[monthIdx];
                const y = parts[0].substring(2);
                return `${m}-${y}`;
            }
        }
        return coverDate;
    }

    function distributeCitations(totalCitations, pubYear) {
        const timeline = { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
        const targetYears = [2022, 2023, 2024, 2025, 2026];
        
        let yr = parseInt(pubYear, 10);
        if (isNaN(yr) || totalCitations <= 0) return { timeline, subtotal: 0 };
        
        const activeYears = targetYears.filter(y => y >= yr);
        if (activeYears.length === 0) return { timeline, subtotal: 0 };
        
        let remaining = totalCitations;
        activeYears.forEach((y, idx) => {
            if (idx === activeYears.length - 1) {
                timeline[y] = remaining;
            } else {
                const share = Math.floor(totalCitations / activeYears.length);
                const val = Math.min(remaining, Math.max(0, share));
                timeline[y] = val;
                remaining -= val;
            }
        });
        
        const subtotal = activeYears.reduce((sum, y) => sum + timeline[y], 0);
        return { timeline, subtotal };
    }

    // --- DATA FILTER & RENDER ---
    function applyFilter() {
        currentYear = reportYearSelect.value;
        activeQuartileSource = reportQuartileSelect.value;

        // Find maximum year in the dataset to calculate relative ranges dynamically
        const years = database.results.map(r => parseInt(r.year, 10)).filter(y => !isNaN(y));
        const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();

        // Apply Year Filter
        filteredResults = database.results.filter(pub => {
            const pubYr = parseInt(pub.year, 10);
            if (currentYear === 'all') {
                return true;
            } else if (currentYear === 'last3') {
                return !isNaN(pubYr) && pubYr >= (maxYear - 2);
            } else if (currentYear === 'last5') {
                return !isNaN(pubYr) && pubYr >= (maxYear - 4);
            } else {
                return pub.year === currentYear;
            }
        });

        // Sort by Year (desc) then Citations (desc)
        filteredResults.sort((a, b) => {
            const yrA = parseInt(a.year, 10) || 0;
            const yrB = parseInt(b.year, 10) || 0;
            if (yrB !== yrA) return yrB - yrA;
            return (b.citations || 0) - (a.citations || 0);
        });

        renderMatrix();
    }

    function renderMatrix() {
        matrixTbody.innerHTML = '';
        
        // Accumulators for Summary Row
        let totalCited = 0;
        let total2022 = 0;
        let total2023 = 0;
        let total2024 = 0;
        let total2025 = 0;
        let total2026 = 0;
        let totalSubtotal = 0;
        let countQ1 = 0;
        let countQ2 = 0;
        let countQ3 = 0;
        let countQ4 = 0;

        if (filteredResults.length === 0) {
            matrixTbody.innerHTML = `
                <tr>
                    <td colspan="22" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                        No publication records found for the selected filter.
                    </td>
                </tr>`;
            updateSummaryRow(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            return;
        }

        filteredResults.forEach((pub, idx) => {
            const tr = document.createElement('tr');
            
            // Format Author List
            const authorList = pub.authors ? pub.authors.join(', ') : '-';
            
            // Format Publish Date
            const publishStr = formatPublishDate(pub.coverDate, pub.year);
            
            // Distribute Citations
            const dist = distributeCitations(pub.citations, pub.year);
            
            // Determine Quartile Tick
            const qVal = activeQuartileSource === 'scopus' ? pub.quartile_scopus : pub.quartile_scimago;
            const isQ1 = qVal === 'Q1' ? '1' : '';
            const isQ2 = qVal === 'Q2' ? '1' : '';
            const isQ3 = qVal === 'Q3' ? '1' : '';
            const isQ4 = qVal === 'Q4' ? '1' : '';

            // Update Accumulators
            totalCited += pub.citations || 0;
            total2022 += dist.timeline[2022];
            total2023 += dist.timeline[2023];
            total2024 += dist.timeline[2024];
            total2025 += dist.timeline[2025];
            total2026 += dist.timeline[2026];
            totalSubtotal += dist.subtotal;
            if (isQ1) countQ1++;
            if (isQ2) countQ2++;
            if (isQ3) countQ3++;
            if (isQ4) countQ4++;

            tr.innerHTML = `
                <td class="center">${idx + 1}</td>
                <td class="text-wrap-authors">${authorList}</td>
                <td class="text-wrap-title">${pub.title}</td>
                <td class="center">${pub.year || '-'}</td>
                <td style="font-style: italic; white-space: normal; min-width: 150px;">${pub.journal || '-'}</td>
                <td class="center">${pub.volume || '-'}</td>
                <td class="center">${pub.issue || '-'}</td>
                <td class="center">${pub.art_no || '-'}</td>
                <td class="center">${pub.page_start || '-'}</td>
                <td class="center">${pub.page_end || '-'}</td>
                <td class="number" style="font-weight:600; color:var(--accent-purple);">${pub.citations}</td>
                <td class="number">${dist.timeline[2022] || '-'}</td>
                <td class="number">${dist.timeline[2023] || '-'}</td>
                <td class="number">${dist.timeline[2024] || '-'}</td>
                <td class="number">${dist.timeline[2025] || '-'}</td>
                <td class="number">${dist.timeline[2026] || '-'}</td>
                <td class="number" style="font-weight:600;">${dist.subtotal || '-'}</td>
                <td class="center" style="font-weight:600; color:var(--accent-blue);">${publishStr}</td>
                <td class="center tick">${isQ1}</td>
                <td class="center tick-q2">${isQ2}</td>
                <td class="center tick-q3">${isQ3}</td>
                <td class="center tick-q4">${isQ4}</td>
            `;
            matrixTbody.appendChild(tr);
        });

        updateSummaryRow(
            filteredResults.length,
            totalCited,
            total2022,
            total2023,
            total2024,
            total2025,
            total2026,
            totalSubtotal,
            filteredResults.length,
            countQ1,
            countQ2,
            countQ3,
            countQ4
        );
    }

    function updateSummaryRow(count, cited, c22, c23, c24, c25, c26, sub, pubCount, q1, q2, q3, q4) {
        sumCount.textContent = count.toLocaleString();
        sumCitedBy.textContent = cited.toLocaleString();
        sumCite2022.textContent = c22 > 0 ? c22.toLocaleString() : '-';
        sumCite2023.textContent = c23 > 0 ? c23.toLocaleString() : '-';
        sumCite2024.textContent = c24 > 0 ? c24.toLocaleString() : '-';
        sumCite2025.textContent = c25 > 0 ? c25.toLocaleString() : '-';
        sumCite2026.textContent = c26 > 0 ? c26.toLocaleString() : '-';
        sumCiteSubtotal.textContent = sub > 0 ? sub.toLocaleString() : '-';
        sumPublished.textContent = pubCount.toLocaleString();
        sumQ1.textContent = q1 > 0 ? q1.toLocaleString() : '-';
        sumQ2.textContent = q2 > 0 ? q2.toLocaleString() : '-';
        sumQ3.textContent = q3 > 0 ? q3.toLocaleString() : '-';
        sumQ4.textContent = q4 > 0 ? q4.toLocaleString() : '-';
    }

    // --- CSV EXPORTER ---
    function exportMatrixToCSV() {
        const csvRows = [];
        
        // Define spreadsheet header row 1
        const headers1 = [
            "no", "Authors", "Title", "Year", "Source title", "Volume", "Issue", "Art. No.", "Page start", "Page end", "Cited by",
            "Citations 2022", "Citations 2023", "Citations 2024", "Citations 2025", "Citations 2026", "subtotal", "Publish",
            "Q1", "Q2", "Q3", "Q4"
        ];
        csvRows.push(headers1.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

        // summary totals row
        const summaryRow = [
            "-", `Total Results: ${filteredResults.length}`, "-", "-", "-", "-", "-", "-", "-", "-",
            sumCitedBy.textContent, sumCite2022.textContent, sumCite2023.textContent, sumCite2024.textContent, sumCite2025.textContent, sumCite2026.textContent,
            sumCiteSubtotal.textContent, sumPublished.textContent, sumQ1.textContent, sumQ2.textContent, sumQ3.textContent, sumQ4.textContent
        ];
        csvRows.push(summaryRow.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","));

        // data rows
        filteredResults.forEach((pub, idx) => {
            const authorList = pub.authors ? pub.authors.join('; ') : '-';
            const publishStr = formatPublishDate(pub.coverDate, pub.year);
            const dist = distributeCitations(pub.citations, pub.year);
            const qVal = activeQuartileSource === 'scopus' ? pub.quartile_scopus : pub.quartile_scimago;
            
            const isQ1 = qVal === 'Q1' ? '1' : '';
            const isQ2 = qVal === 'Q2' ? '1' : '';
            const isQ3 = qVal === 'Q3' ? '1' : '';
            const isQ4 = qVal === 'Q4' ? '1' : '';

            const row = [
                idx + 1,
                authorList,
                pub.title,
                pub.year || "",
                pub.journal || "",
                pub.volume || "",
                pub.issue || "",
                pub.art_no || "",
                pub.page_start || "",
                pub.page_end || "",
                pub.citations || 0,
                dist.timeline[2022] || "",
                dist.timeline[2023] || "",
                dist.timeline[2024] || "",
                dist.timeline[2025] || "",
                dist.timeline[2026] || "",
                dist.subtotal || 0,
                publishStr,
                isQ1,
                isQ2,
                isQ3,
                isQ4
            ];
            csvRows.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","));
        });

        // Download trigger
        const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `mednu_matrix_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- EVENT LISTENERS ---
    reportQuartileSelect.addEventListener('change', applyFilter);
    reportYearSelect.addEventListener('change', applyFilter);
    btnExportMatrix.addEventListener('click', exportMatrixToCSV);

    // Initial Load
    loadData();
});
