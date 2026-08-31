/**
 * Painter Chart Renderer (Main Dashboard Matrix)
 * Builds the interactive 8-column heatmap table matching Image 1
 */

class PainterChartRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render() {
    if (!this.container) return;

    const matrixData = dataService.getPainterMatrixData(stateManager.filters);
    const { podGroups, stats } = matrixData;

    const activeStatus = stateManager.filters.statusFilter || 'ALL';
    const isGreenActive = activeStatus === 'green';
    const isYellowActive = activeStatus === 'yellow';
    const isRedActive = activeStatus === 'red';

    let totalFilteredRows = 0;
    podGroups.forEach(g => { totalFilteredRows += g.rows.length; });

    let statusLabel = '';
    if (activeStatus === 'green') statusLabel = 'Parámetros Conformes';
    else if (activeStatus === 'yellow') statusLabel = 'En Alerta (1ª Semana)';
    else if (activeStatus === 'red') statusLabel = 'Críticos / Fuera de Rango';

    let html = `
      <!-- KPI Summary Cards (Interactive Filters) -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-compliance ${activeStatus !== 'ALL' ? 'kpi-clickable' : ''}" 
             onclick="stateManager.setFilter('statusFilter', 'ALL')" 
             title="Clic para mostrar todas las mediciones">
          <div class="kpi-header">
            <span class="kpi-title">Cumplimiento Global</span>
            <span class="kpi-icon">🎯</span>
          </div>
          <div class="kpi-value">${stats.complianceRate}%</div>
          <div class="kpi-subtitle">Basado en últimas mediciones</div>
        </div>

        <div class="kpi-card kpi-green kpi-clickable ${isGreenActive ? 'kpi-card-active' : ''}" 
             onclick="stateManager.toggleStatusFilter('green')" 
             title="Clic para filtrar y mostrar solo filas con parámetros conformes">
          <div class="kpi-header">
            <span class="kpi-title">Parámetros Conformes ${isGreenActive ? '<span class="active-filter-badge">Filtro Activo</span>' : ''}</span>
            <span class="kpi-icon">🟢</span>
          </div>
          <div class="kpi-value">${stats.totalGreen}</div>
          <div class="kpi-subtitle">${isGreenActive ? 'Filtro activo (clic para quitar)' : 'Clic para filtrar solo conformes'}</div>
        </div>

        <div class="kpi-card kpi-yellow kpi-clickable ${isYellowActive ? 'kpi-card-active' : ''}" 
             onclick="stateManager.toggleStatusFilter('yellow')" 
             title="Clic para filtrar y mostrar solo filas con parámetros en alerta">
          <div class="kpi-header">
            <span class="kpi-title">En Alerta (1ª Sem) ${isYellowActive ? '<span class="active-filter-badge">Filtro Activo</span>' : ''}</span>
            <span class="kpi-icon">🟡</span>
          </div>
          <div class="kpi-value">${stats.totalYellow}</div>
          <div class="kpi-subtitle">${isYellowActive ? 'Filtro activo (clic para quitar)' : 'Clic para filtrar solo en alerta'}</div>
        </div>

        <div class="kpi-card kpi-red kpi-clickable ${isRedActive ? 'kpi-card-active' : ''}" 
             onclick="stateManager.toggleStatusFilter('red')" 
             title="Clic para filtrar y mostrar solo filas con parámetros críticos">
          <div class="kpi-header">
            <span class="kpi-title">Críticos / Fuera de Rango ${isRedActive ? '<span class="active-filter-badge">Filtro Activo</span>' : ''}</span>
            <span class="kpi-icon">🔴</span>
          </div>
          <div class="kpi-value">${stats.totalRed}</div>
          <div class="kpi-subtitle">${isRedActive ? 'Filtro activo (clic para quitar)' : 'Clic para filtrar solo críticos'}</div>
        </div>
      </div>

      ${activeStatus !== 'ALL' ? `
        <!-- Active Status Filter Banner -->
        <div class="active-status-filter-banner">
          <div class="status-filter-info">
            <span class="filter-badge badge-${activeStatus}">Filtro Activo</span>
            <span>Mostrando únicamente filas con parámetros en estado <strong>${statusLabel}</strong> (${totalFilteredRows} equipos/filas encontradas)</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="stateManager.setFilter('statusFilter', 'ALL')" title="Mostrar todas las filas nuevamente">
            ✕ Mostrar Todas las Filas
          </button>
        </div>
      ` : ''}

      <!-- Legend & Info Bar -->
      <div class="matrix-toolbar">
        <div class="matrix-title-wrapper">
          <h2 class="section-title">Matriz de Estado Actual (Painter Chart)</h2>
          <p class="section-subtitle">Semáforo de conformidad operativa por equipo según última medición registrada</p>
        </div>
        <div class="legend-container">
          <div class="legend-item">
            <span class="legend-dot dot-green"></span>
            <span class="legend-label">Normal (Dentro de Límites)</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot-yellow"></span>
            <span class="legend-label">Alerta (1ª sem fuera en Bacteria)</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot-red"></span>
            <span class="legend-label">Crítico (≥2 sem Bacteria / Fuera de Límites)</span>
          </div>
        </div>
      </div>
    `;

    if (podGroups.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No se encontraron registros</h3>
          <p>Intenta ajustar los filtros de POD, CDU, Semana o Fecha en la barra superior.</p>
          <button class="btn btn-secondary" onclick="stateManager.resetFilters()">Restablecer Filtros</button>
        </div>
      `;
      this.container.innerHTML = html;
      return;
    }

    // Render tables grouped by POD (like Image 1)
    podGroups.forEach(group => {
      html += `
        <div class="pod-matrix-card">
          <div class="pod-card-header">
            <div class="pod-badge">${group.pod}</div>
            <span class="pod-cdu-count">${group.rows.length} CDUs Monitoreadas</span>
          </div>

          <div class="table-responsive">
            <table class="painter-table">
              <thead>
                <tr>
                  <th class="th-pod">POD</th>
                  <th class="th-cdu">CDU</th>
                  <th class="th-param" onclick="stateManager.setActiveTab('Bacteria')" title="Ver tendencia histórica de Bacteria">
                    <div class="th-content">
                      <span>Bacteria</span>
                      <small>&lt; 1500 RLU</small>
                    </div>
                  </th>
                  <th class="th-param" onclick="stateManager.setActiveTab('PH')" title="Ver tendencia histórica de PH">
                    <div class="th-content">
                      <span>PH</span>
                      <small>8 – 9.5</small>
                    </div>
                  </th>
                  <th class="th-param" onclick="stateManager.setActiveTab('Conductivity')" title="Ver tendencia histórica de Conductividad">
                    <div class="th-content">
                      <span>Conductividad</span>
                      <small>600 - 850 μS</small>
                    </div>
                  </th>
                  <th class="th-param" onclick="stateManager.setActiveTab('TDS')" title="Ver tendencia histórica de TDS">
                    <div class="th-content">
                      <span>TDS</span>
                      <small>&lt; 1000 ppm</small>
                    </div>
                  </th>
                  <th class="th-param" onclick="stateManager.setActiveTab('TSS')" title="Ver tendencia histórica de TSS">
                    <div class="th-content">
                      <span>TSS</span>
                      <small>&lt; 5 ppm</small>
                    </div>
                  </th>
                  <th class="th-param" onclick="stateManager.setActiveTab('Turbidity')" title="Ver tendencia histórica de Turbidez">
                    <div class="th-content">
                      <span>Turbidez</span>
                      <small>&lt; 10 NTU</small>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
      `;

      group.rows.forEach(row => {
        html += `
          <tr>
            <td class="td-pod">${row.pod}</td>
            <td class="td-cdu">${row.cduDisplay}</td>
        `;

        ORDERED_PARAM_KEYS.forEach(paramKey => {
          const cell = row.cells[paramKey];
          const hasComment = cell.comment && cell.comment.trim().length > 0;
          const commentIcon = hasComment ? `<span class="cell-comment-badge" title="${this.escapeHtml(cell.comment)}">💬</span>` : '';

          html += `
            <td class="matrix-cell ${cell.colorClass}" 
                data-pod="${row.pod}" 
                data-cdu="${row.cdu}" 
                data-param="${paramKey}"
                data-val="${cell.formattedValue}"
                data-date="${cell.date}"
                data-week="${cell.week}"
                data-comment="${this.escapeHtml(cell.comment)}"
                onclick="PainterChartRenderer.onCellClick('${paramKey}', '${row.pod}', '${row.cdu}')">
              <div class="cell-inner">
                <span class="cell-value">${cell.formattedValue}</span>
                ${commentIcon}
              </div>
              <div class="cell-tooltip">
                <div class="tooltip-header">
                  <strong>${row.pod} - ${row.cduDisplay}</strong>
                  <span class="tooltip-badge badge-${cell.status}">${cell.badgeText || cell.status}</span>
                </div>
                <div class="tooltip-body">
                  <div><strong>Parámetro:</strong> ${PARAMETER_CONFIGS[paramKey].label}</div>
                  <div><strong>Valor Medido:</strong> ${cell.formattedValue} ${cell.unit || ''}</div>
                  <div><strong>Fecha Muestra:</strong> ${cell.date || 'N/A'} (${cell.week || 'N/A'})</div>
                  ${hasComment ? `<div class="tooltip-comment"><strong>Nota:</strong> ${cell.comment}</div>` : ''}
                  <div class="tooltip-hint">👉 Clic para ver historial completo de ${PARAMETER_CONFIGS[paramKey].shortLabel}</div>
                </div>
              </div>
            </td>
          `;
        });

        html += `</tr>`;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    // Bottom Action CTA for Summary
    html += `
      <div class="main-bottom-actions">
        <button id="btn-summary-bottom" class="btn btn-summary-cta" onclick="ExecutiveSummaryManager.openAndDownload()" title="Generar y descargar reporte PDF compacto">
          📄 Generar & Descargar Summary (PDF)
        </button>
      </div>
    `;

    this.container.innerHTML = html;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static onCellClick(paramKey, pod, cdu) {
    stateManager.setFilter('pod', pod);
    stateManager.setFilter('cdu', cdu);
    stateManager.setActiveTab(paramKey);
  }
}

/**
 * Executive Summary Manager
 * Generates a high-density, single-table compact snapshot card with automatic PNG download
 */
class ExecutiveSummaryManager {
  static openAndDownload() {
    const modal = document.getElementById('summary-modal');
    if (!modal) return;
    this.render();
    modal.style.display = 'flex';
    
    // Automatically trigger PDF download
    setTimeout(() => {
      this.downloadPDF();
    }, 250);
  }

  static open() {
    this.openAndDownload();
  }

  static close() {
    const modal = document.getElementById('summary-modal');
    if (modal) modal.style.display = 'none';
  }

  static render() {
    const matrixData = dataService.getPainterMatrixData(stateManager.filters);
    const { podGroups, stats } = matrixData;

    // Set timestamp
    const timeEl = document.getElementById('summary-timestamp-label');
    if (timeEl) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      timeEl.innerText = `Reporte Ejecutivo de Calidad • Generado el ${formattedDate}`;
    }

    // Render compact KPIs
    const kpisEl = document.getElementById('summary-kpis-container');
    if (kpisEl) {
      kpisEl.innerHTML = `
        <div class="summary-kpi-pill">
          <span class="sk-label">Cumplimiento:</span>
          <strong class="sk-val text-primary-c">${stats.complianceRate}%</strong>
        </div>
        <div class="summary-kpi-pill pill-green">
          <span class="sk-label">🟢 Normal:</span>
          <strong class="sk-val">${stats.totalGreen}</strong>
        </div>
        <div class="summary-kpi-pill pill-yellow">
          <span class="sk-label">🟡 Alerta:</span>
          <strong class="sk-val">${stats.totalYellow}</strong>
        </div>
        <div class="summary-kpi-pill pill-red">
          <span class="sk-label">🔴 Crítico:</span>
          <strong class="sk-val">${stats.totalRed}</strong>
        </div>
      `;
    }

    // Render Single Unified Compact Table (Not separated by POD cards)
    const container = document.getElementById('summary-matrix-container');
    if (!container) return;

    if (podGroups.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-muted">No hay datos para los filtros seleccionados.</div>`;
      return;
    }

    let html = `
      <table class="summary-compact-unified-table">
        <thead>
          <tr>
            <th class="sth-pod">POD</th>
            <th class="sth-cdu">CDU</th>
            <th class="sth-param">Bacteria<br><small>&lt; 1500 RLU</small></th>
            <th class="sth-param">PH<br><small>8 – 9.5</small></th>
            <th class="sth-param">Conductividad<br><small>600 - 850 μS</small></th>
            <th class="sth-param">TDS<br><small>&lt; 1000 ppm</small></th>
            <th class="sth-param">TSS<br><small>&lt; 5 ppm</small></th>
            <th class="sth-param">Turbidez<br><small>&lt; 10 NTU</small></th>
          </tr>
        </thead>
        <tbody>
    `;

    podGroups.forEach((group, gIdx) => {
      group.rows.forEach((row, rIdx) => {
        const isPodFirstRow = rIdx === 0;
        const isPodLastRow = rIdx === group.rows.length - 1;
        const rowClass = isPodLastRow ? 'pod-divider-row' : '';

        html += `<tr class="${rowClass}">`;
        
        if (isPodFirstRow) {
          html += `<td class="std-pod" rowspan="${group.rows.length}"><strong>${group.pod}</strong></td>`;
        }
        
        html += `<td class="std-cdu">${row.cduDisplay}</td>`;

        ORDERED_PARAM_KEYS.forEach(paramKey => {
          const cell = row.cells[paramKey];
          html += `
            <td class="summary-cell ${cell.colorClass}">
              <span class="summary-val">${cell.formattedValue}</span>
            </td>
          `;
        });

        html += `</tr>`;
      });
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  }

  static async downloadPDF() {
    const target = document.getElementById('summary-capture-target');
    if (!target) return;

    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const dateStr = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    const filename = `Liquid_Cooling_Summary_${dateStr}.pdf`;

    showNotification('📄 Generando documento PDF completo...', 'info');

    if (typeof html2pdf !== 'undefined') {
      try {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        await html2pdf().set(opt).from(target).save();
        showNotification('✅ ¡Archivo PDF descargado exitosamente!', 'success');
      } catch (err) {
        console.error('Error al generar PDF con html2pdf:', err);
        showNotification('Abriendo diálogo de impresión para guardar PDF...', 'info');
        window.print();
      }
    } else {
      window.print();
    }
  }

  static printSummary() {
    window.print();
  }

  static async copyImage() {
    const target = document.getElementById('summary-capture-target');
    if (!target) return;

    if (typeof html2canvas === 'undefined') {
      showNotification('Librería no disponible.', 'error');
      return;
    }

    try {
      showNotification('📸 Generando imagen para el portapapeles...', 'info');
      const canvas = await html2canvas(target, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showNotification('✅ ¡Imagen copiada al portapapeles! (Ctrl+V para pegar en Teams/WhatsApp)', 'success');
          } else {
            this.downloadPDF();
          }
        } catch (clipErr) {
          console.warn('Clipboard write restricted:', clipErr);
          this.downloadPDF();
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
      showNotification('Error al capturar imagen.', 'error');
    }
  }

  static async downloadImage() {
    const target = document.getElementById('summary-capture-target');
    if (!target) return;

    if (typeof html2canvas === 'undefined') {
      showNotification('Librería de captura no disponible.', 'error');
      return;
    }

    try {
      const canvas = await html2canvas(target, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const pad = (n) => String(n).padStart(2, '0');
      const d = new Date();
      const dateStr = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
      
      const link = document.createElement('a');
      link.download = `Liquid_Cooling_Summary_${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showNotification('✅ ¡Imagen PNG descargada exitosamente!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Error al descargar imagen.', 'error');
    }
  }
}

