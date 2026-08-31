/**
 * Trend Charts Renderer for 6 Secondary Dashboards
 * Renders historical trend line charts with Lower Limit, Upper Limit, Measured Values,
 * Data Labels, KPI metrics, and complete chronological log tables.
 */

class TrendChartsRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentChart = null;
  }

  render(paramKey) {
    if (!this.container) return;

    const histData = dataService.getParameterHistoricalData(paramKey, stateManager.filters);
    const { config, records, timePoints, equipmentSeries, kpis } = histData;

    let html = `
      <div class="trend-dashboard-header">
        <div class="trend-title-block">
          <div class="trend-param-badge">${config.shortLabel}</div>
          <h2 class="trend-title">Dashboard Histórico: ${config.label}</h2>
          <p class="trend-desc">${config.description}</p>
        </div>

        <div class="trend-actions">
          <div class="equipment-view-selector">
            <label for="equipment-select">Equipo a visualizar:</label>
            <select id="equipment-select" class="form-select" onchange="trendChartsRenderer.onEquipmentChange(this.value)">
              <option value="all" ${stateManager.chartEquipmentView === 'all' ? 'selected' : ''}>Todos los Equipos Combinados</option>
    `;

    equipmentSeries.forEach(eq => {
      const isSelected = stateManager.chartEquipmentView === eq.equipmentKey ? 'selected' : '';
      html += `<option value="${eq.equipmentKey}" ${isSelected}>${eq.equipmentKey}</option>`;
    });

    html += `
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="trendChartsRenderer.exportParameterData('${paramKey}')">
            📥 Exportar CSV (${config.shortLabel})
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="kpi-grid kpi-grid-param">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Última Medición</span>
            <span class="kpi-icon">⏱️</span>
          </div>
          <div class="kpi-value">${kpis.latestValue} <small class="kpi-unit">${config.unit}</small></div>
          <div class="kpi-subtitle">Fecha: ${kpis.latestDate}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Promedio</span>
            <span class="kpi-icon">📊</span>
          </div>
          <div class="kpi-value">${kpis.avg} <small class="kpi-unit">${config.unit}</small></div>
          <div class="kpi-subtitle">Muestras: ${kpis.totalSamples}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-title">Rango Min / Max</span>
            <span class="kpi-icon">📏</span>
          </div>
          <div class="kpi-value kpi-range">${kpis.min} - ${kpis.max} <small class="kpi-unit">${config.unit}</small></div>
          <div class="kpi-subtitle">Extremos históricos</div>
        </div>

        <div class="kpi-card ${parseFloat(kpis.compliancePercent) >= 90 ? 'kpi-green' : 'kpi-red'}">
          <div class="kpi-header">
            <span class="kpi-title">Tasa de Cumplimiento</span>
            <span class="kpi-icon">🛡️</span>
          </div>
          <div class="kpi-value">${kpis.compliancePercent}%</div>
          <div class="kpi-subtitle">${kpis.outOfSpecCount} lecturas fuera de límites</div>
        </div>
      </div>

      <!-- Chart Container Card (Image 2 style) -->
      <div class="chart-main-card">
        <div class="chart-card-header">
          <div class="chart-title-wrap">
            <h3 class="chart-title">Trend by equipment - ${config.label}</h3>
            <span class="chart-limits-badge">
              ${config.hasLowerLimit ? `Límite Inf: <strong>${config.lowerLimit} ${config.unit}</strong> | ` : ''}
              ${config.hasUpperLimit ? `Límite Sup: <strong>${config.upperLimit} ${config.unit}</strong>` : ''}
            </span>
          </div>
          <div class="chart-legend-custom">
            <span class="legend-line line-measured"></span> <span>Medición Obtenida</span>
            ${config.hasUpperLimit ? `<span class="legend-line line-upper"></span> <span>Límite Superior (${config.upperLimit})</span>` : ''}
            ${config.hasLowerLimit ? `<span class="legend-line line-lower"></span> <span>Límite Inferior (${config.lowerLimit})</span>` : ''}
          </div>
        </div>

        <div class="chart-canvas-wrapper">
          <canvas id="trendChartCanvas"></canvas>
        </div>
      </div>

      <!-- Detailed Historical Records Table -->
      <div class="history-table-card">
        <div class="history-card-header">
          <h3 class="history-title">Registro Cronológico de Muestras (${records.length} lecturas)</h3>
          <span class="history-subtitle">Ordenado por fecha y semana</span>
        </div>

        <div class="table-responsive">
          <table class="history-table">
            <thead>
              <tr>
                <th>POD</th>
                <th>CDU</th>
                <th>Semana</th>
                <th>Fecha</th>
                <th>Valor Medido</th>
                <th>Límites</th>
                <th>Estado</th>
                <th>Observaciones / Acciones</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (records.length === 0) {
      html += `
        <tr>
          <td colspan="8" class="text-center py-4">No hay datos disponibles para los filtros seleccionados.</td>
        </tr>
      `;
    } else {
      // Show most recent first in table
      const sortedDesc = [...records].reverse();
      sortedDesc.forEach(rec => {
        const statusEval = dataService.evaluateStatus(paramKey, rec.value, records);
        const hasComment = rec.comment && rec.comment.trim().length > 0;
        
        let limitsText = '';
        if (config.hasLowerLimit && config.hasUpperLimit) {
          limitsText = `${config.lowerLimit} - ${config.upperLimit} ${config.unit}`;
        } else if (config.hasUpperLimit) {
          limitsText = `≤ ${config.upperLimit} ${config.unit}`;
        } else if (config.hasLowerLimit) {
          limitsText = `≥ ${config.lowerLimit} ${config.unit}`;
        }

        html += `
          <tr>
            <td><strong>${rec.pod}</strong></td>
            <td>${rec.cdu}</td>
            <td><span class="badge-week">${rec.week}</span></td>
            <td>${rec.date}</td>
            <td><strong class="history-value ${statusEval.status === 'green' ? 'val-green' : 'val-red'}">${rec.value} ${config.unit}</strong></td>
            <td><span class="history-limits">${limitsText}</span></td>
            <td><span class="history-status-badge badge-${statusEval.status}">${statusEval.badgeText || statusEval.status}</span></td>
            <td class="history-comment-cell">
              ${hasComment ? `<span class="comment-bubble">📝 ${rec.comment}</span>` : '<span class="text-muted">-</span>'}
            </td>
          </tr>
        `;
      });
    }

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Render Chart.js
    setTimeout(() => {
      this.initChart(paramKey, records, config, timePoints);
    }, 50);
  }

  onEquipmentChange(eqKey) {
    stateManager.setChartEquipmentView(eqKey);
    this.render(stateManager.activeTab);
  }

  initChart(paramKey, records, config, timePoints) {
    const canvas = document.getElementById('trendChartCanvas');
    if (!canvas) return;

    if (this.currentChart) {
      this.currentChart.destroy();
      this.currentChart = null;
    }

    // Filter by specific equipment if selected
    let activeRecords = records;
    if (stateManager.chartEquipmentView && stateManager.chartEquipmentView !== 'all') {
      activeRecords = records.filter(r => r.equipmentKey === stateManager.chartEquipmentView);
    }

    if (activeRecords.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('No hay datos para graficar con los filtros actuales.', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Prepare labels and data points
    // Build chronological points
    const labels = activeRecords.map(r => `${r.pod} ${r.cdu} | ${r.week} (${r.date})`);
    const shortLabels = activeRecords.map(r => `${r.cdu.replace('CDU-', '#')}\n${r.week.replace(' 2026', '')}`);
    const dataValues = activeRecords.map(r => r.value);
    const comments = activeRecords.map(r => r.comment || '');

    // Upper limit line dataset
    const upperLimitData = config.hasUpperLimit ? Array(activeRecords.length).fill(config.upperLimit) : null;
    // Lower limit line dataset
    const lowerLimitData = config.hasLowerLimit ? Array(activeRecords.length).fill(config.lowerLimit) : null;

    // Point colors based on status
    const pointBackgroundColors = activeRecords.map(r => {
      const evalRes = dataService.evaluateStatus(paramKey, r.value, activeRecords);
      return evalRes.hex;
    });

    const datasets = [
      {
        label: 'Medición Semanal',
        data: dataValues,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5.5,
        pointHoverRadius: 8,
        tension: 0.25,
        fill: false,
        order: 1
      }
    ];

    if (upperLimitData) {
      datasets.push({
        label: `Límite Superior (${config.upperLimit} ${config.unit})`,
        data: upperLimitData,
        borderColor: '#10b981', // Green reference line like in Image 2
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        order: 2
      });
    }

    if (lowerLimitData) {
      datasets.push({
        label: `Límite Inferior (${config.lowerLimit} ${config.unit})`,
        data: lowerLimitData,
        borderColor: '#ef4444', // Red lower limit line like in Image 2
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        order: 3
      });
    }

    // Determine Y axis bounds
    const allVals = [...dataValues];
    if (config.hasUpperLimit) allVals.push(config.upperLimit);
    if (config.hasLowerLimit) allVals.push(config.lowerLimit);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const padding = (maxVal - minVal) * 0.15 || 1;

    const yMin = Math.max(0, Math.floor(minVal - padding));
    const yMax = Math.ceil(maxVal + padding);

    const ctx = canvas.getContext('2d');
    this.currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false // Using custom sleek HTML legend
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            titleFont: { size: 13, weight: 'bold', family: 'Inter' },
            bodyColor: '#e2e8f0',
            bodyFont: { size: 12, family: 'Inter' },
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              title: function(context) {
                const idx = context[0].dataIndex;
                const rec = activeRecords[idx];
                return `${rec.pod} - ${rec.cdu} (${rec.week})`;
              },
              label: function(context) {
                if (context.datasetIndex === 0) {
                  return `Medición: ${context.parsed.y} ${config.unit}`;
                }
                return context.dataset.label;
              },
              afterBody: function(context) {
                const idx = context[0].dataIndex;
                const rec = activeRecords[idx];
                const lines = [`Fecha: ${rec.date}`];
                if (rec.comment) {
                  lines.push(`Nota: ${rec.comment}`);
                }
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(226, 232, 240, 0.6)',
              drawBorder: false
            },
            ticks: {
              font: { size: 10.5, family: 'Inter' },
              color: '#64748b',
              maxRotation: 45,
              minRotation: 30,
              callback: function(val, index) {
                const rec = activeRecords[index];
                if (!rec) return '';
                return `${rec.pod} ${rec.cdu} (${rec.week.split(' ')[0]} ${rec.week.split(' ')[1] || ''})`;
              }
            }
          },
          y: {
            min: config.key === 'PH' ? Math.max(6.5, yMin) : yMin,
            max: yMax,
            grid: {
              color: 'rgba(226, 232, 240, 0.8)',
              drawBorder: false
            },
            ticks: {
              font: { size: 11, family: 'Inter' },
              color: '#64748b',
              callback: function(val) {
                return `${val} ${config.unit}`;
              }
            }
          }
        }
      }
    });
  }

  exportParameterData(paramKey) {
    const histData = dataService.getParameterHistoricalData(paramKey, stateManager.filters);
    const { records, config } = histData;

    let csvContent = 'POD,CDU,Week,Date,Parameter,Measured Data,Comment\n';
    records.forEach(r => {
      const commentClean = (r.comment || '').replace(/"/g, '""');
      csvContent += `"${r.pod}","${r.cdu}","${r.week}","${r.date}","${r.paramRaw || config.shortLabel}","${r.value}","${commentClean}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${config.shortLabel.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

const trendChartsRenderer = new TrendChartsRenderer('secondary-dashboard-container');
