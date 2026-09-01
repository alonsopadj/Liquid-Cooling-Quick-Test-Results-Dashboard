/**
 * Main Application Controller & UI Event Handlers
 */

let painterChartRendererInstance;

document.addEventListener('DOMContentLoaded', async () => {
  painterChartRendererInstance = new PainterChartRenderer('painter-matrix-container');

  // Initialize data service
  await dataService.initialize();

  // Setup UI components
  initFiltersUI();
  setupEventListeners();

  // Subscribe to state changes
  stateManager.subscribe(onStateChange);
  dataService.subscribe(() => {
    initFiltersUI();
    renderCurrentView();
  });

  // Initial render
  renderCurrentView();
});

/**
 * Populates global filter dropdowns with available options from dataset
 */
function initFiltersUI() {
  const options = dataService.getFilterOptions();

  populateSelect('filter-pod', options.pods, stateManager.filters.pod, 'Todos los PODs');
  populateSelect('filter-cdu', options.cdus, stateManager.filters.cdu, 'Todas las CDUs');
  populateSelect('filter-week', options.weeks, stateManager.filters.week, 'Todas las Semanas');
  populateSelect('filter-date', options.dates, stateManager.filters.date, 'Todas las Fechas');
}

function populateSelect(elementId, items, selectedValue, defaultLabel) {
  const select = document.getElementById(elementId);
  if (!select) return;

  let html = `<option value="ALL">${defaultLabel}</option>`;
  items.forEach(item => {
    const isSel = item === selectedValue ? 'selected' : '';
    html += `<option value="${item}" ${isSel}>${item}</option>`;
  });
  select.innerHTML = html;
}

/**
 * Attaches DOM event handlers for filters, navigation tabs, file drag-and-drop, and exports
 */
function setupEventListeners() {
  // Filter change listeners
  document.getElementById('filter-pod')?.addEventListener('change', (e) => {
    stateManager.setFilter('pod', e.target.value);
  });

  document.getElementById('filter-cdu')?.addEventListener('change', (e) => {
    stateManager.setFilter('cdu', e.target.value);
  });

  document.getElementById('filter-week')?.addEventListener('change', (e) => {
    stateManager.setFilter('week', e.target.value);
  });

  document.getElementById('filter-date')?.addEventListener('change', (e) => {
    stateManager.setFilter('date', e.target.value);
  });

  // Reset Filters Button
  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    stateManager.resetFilters();
    initFiltersUI();
  });

  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetView = tab.getAttribute('data-tab');
      stateManager.setActiveTab(targetView);
    });
  });

  // CSV File Upload Input & Drag-and-Drop
  const fileInput = document.getElementById('csv-file-input');
  const uploadBtn = document.getElementById('btn-upload-csv');
  
  uploadBtn?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleCSVFile(file);
  });

  // Drag and drop support on header or drop area
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type.includes('csv')) {
        handleCSVFile(file);
      }
    }
  });

  // Summary Modal Listeners
  document.getElementById('btn-summary')?.addEventListener('click', () => {
    ExecutiveSummaryManager.open();
  });

  document.getElementById('btn-close-summary')?.addEventListener('click', () => {
    ExecutiveSummaryManager.close();
  });

  document.getElementById('summary-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'summary-modal') {
      ExecutiveSummaryManager.close();
    }
  });

  document.getElementById('btn-download-summary-pdf')?.addEventListener('click', () => {
    ExecutiveSummaryManager.downloadPDF();
  });

  document.getElementById('btn-print-summary')?.addEventListener('click', () => {
    ExecutiveSummaryManager.printSummary();
  });

  document.getElementById('btn-copy-summary-img')?.addEventListener('click', () => {
    ExecutiveSummaryManager.copyImage();
  });

  document.getElementById('btn-download-summary-img')?.addEventListener('click', () => {
    ExecutiveSummaryManager.downloadImage();
  });

  // Export Matrix Button
  document.getElementById('btn-export-matrix')?.addEventListener('click', () => {
    exportCurrentMatrix();
  });

  // Print Report Button
  document.getElementById('btn-print-report')?.addEventListener('click', () => {
    window.print();
  });
}

/**
 * Handle new uploaded CSV file
 */
function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const csvText = event.target.result;
      dataService.parseAndSetData(csvText);
      showNotification(`¡Archivo "${file.name}" cargado exitosamente! (${dataService.rawRecords.length} registros)`, 'success');
    } catch (err) {
      showNotification('Error al procesar el archivo CSV. Revisa el formato.', 'error');
      console.error(err);
    }
  };
  reader.readAsText(file);
}

/**
 * Global state update handler
 */
function onStateChange(state) {
  // Update Tab Active UI
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-tab') === state.activeTab) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update Filter select elements if altered externally
  syncSelect('filter-pod', state.filters.pod);
  syncSelect('filter-cdu', state.filters.cdu);
  syncSelect('filter-week', state.filters.week);
  syncSelect('filter-date', state.filters.date);

  renderCurrentView();
}

function syncSelect(elementId, value) {
  const el = document.getElementById(elementId);
  if (el && el.value !== value) {
    el.value = value;
  }
}

/**
 * Switches and renders the active dashboard
 */
function renderCurrentView() {
  const mainView = document.getElementById('view-main-dashboard');
  const secondaryView = document.getElementById('view-secondary-dashboard');

  if (stateManager.activeTab === 'main') {
    if (mainView) mainView.style.display = 'block';
    if (secondaryView) secondaryView.style.display = 'none';
    painterChartRendererInstance.render();
  } else {
    if (mainView) mainView.style.display = 'none';
    if (secondaryView) secondaryView.style.display = 'block';
    trendChartsRenderer.render(stateManager.activeTab);
  }
}

/**
 * Export current matrix view to CSV
 */
function exportCurrentMatrix() {
  const matrixData = dataService.getPainterMatrixData(stateManager.filters);
  let csv = 'POD,CDU,Bacteria < 1500 RLU,PH 8-9.5,Conductividad 600-850 uS,TDS < 1000 ppm,TSS < 5 ppm,Turbidez < 10 NTU\n';

  matrixData.podGroups.forEach(group => {
    group.rows.forEach(row => {
      csv += `"${row.pod}","${row.cduDisplay}",`;
      csv += `"${row.cells.Bacteria.formattedValue}",`;
      csv += `"${row.cells.PH.formattedValue}",`;
      csv += `"${row.cells.Conductivity.formattedValue}",`;
      csv += `"${row.cells.TDS.formattedValue}",`;
      csv += `"${row.cells.TSS.formattedValue}",`;
      csv += `"${row.cells.Turbidity.formattedValue}"\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `matriz_calidad_agua_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Simple sleek toast notification
 */
function showNotification(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
document.getElementById("btnAddRow").addEventListener("click", addRow);

function addRow(){

    const tbody = document.getElementById("tableBody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="date"></td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="number"></td>
        <td><input type="text"></td>
    `;

    tbody.appendChild(row);
}
document.getElementById("btnAddRow").addEventListener("click", addRow);

function addRow() {

    const tbody = document.getElementById("tableBody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="date"></td>

        <td>
            <select>
                <option>POD #1</option>
                <option>POD #2</option>
                <option>POD #3</option>
                <option>POD #4</option>
            </select>
        </td>

        <td>
            <select>
                <option>CDU-01</option>
                <option>CDU-02</option>
                <option>CDU-03</option>
                <option>CDU-04</option>
                <option>CDU-05</option>
                <option>CDU-06</option>
            </select>
        </td>

        <td>
            <select>
                <option>PH</option>
                <option>Conductivity</option>
                <option>Turbidity</option>
                <option>TDS</option>
                <option>ATP Bacteria</option>
                <option>Total Suspended Solids</option>
            </select>
        </td>

        <td>
            <input type="number" step="0.01">
        </td>

        <td>
            <input type="text">
        </td>
    `;

    tbody.appendChild(row);
}
