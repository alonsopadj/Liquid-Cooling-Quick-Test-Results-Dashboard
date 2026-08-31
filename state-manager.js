/**
 * Global State Manager
 * Synchronizes filters, active tabs, search queries, and view transitions
 */

class StateManager {
  constructor() {
    this.filters = {
      pod: 'ALL',
      cdu: 'ALL',
      week: 'ALL',
      date: 'ALL',
      statusFilter: 'ALL', // 'ALL' | 'green' | 'yellow' | 'red'
      search: ''
    };
    this.activeTab = 'main'; // 'main' (Painter Matrix) or 'Bacteria'|'PH'|'Conductivity'|'TDS'|'TSS'|'Turbidity'
    this.chartEquipmentView = 'all'; // 'all' or specific equipmentKey
    this.listeners = [];
  }

  setFilter(key, value) {
    if (this.filters[key] !== value) {
      this.filters[key] = value;
      this.notify();
    }
  }

  toggleStatusFilter(status) {
    if (this.filters.statusFilter === status) {
      this.filters.statusFilter = 'ALL';
    } else {
      this.filters.statusFilter = status;
    }
    this.notify();
  }

  setMultipleFilters(filterUpdates) {
    let changed = false;
    for (const [key, value] of Object.entries(filterUpdates)) {
      if (this.filters[key] !== value) {
        this.filters[key] = value;
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  resetFilters() {
    this.filters = {
      pod: 'ALL',
      cdu: 'ALL',
      week: 'ALL',
      date: 'ALL',
      statusFilter: 'ALL',
      search: ''
    };
    this.chartEquipmentView = 'all';
    this.notify();
  }

  setActiveTab(tabKey) {
    if (this.activeTab !== tabKey) {
      this.activeTab = tabKey;
      this.notify();
    }
  }

  setChartEquipmentView(equipmentKey) {
    if (this.chartEquipmentView !== equipmentKey) {
      this.chartEquipmentView = equipmentKey;
      this.notify();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }
}

const stateManager = new StateManager();
