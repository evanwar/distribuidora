export const TOUR_SELECTORS = {
  helpLauncher: 'help-launcher',
  shellNavigation: 'shell-navigation',
  shellLanguage: 'shell-language',
  shellUser: 'shell-user',
  shellLogout: 'shell-logout',
  pageContent: 'page-content',
  pageHeader: 'page-header',
  dashboardSummary: 'dashboard-summary',
  dashboardKpis: 'dashboard-kpis',
  dashboardQuickActions: 'dashboard-quick-actions',
  customersPrimaryAction: 'customers-primary-action',
  customersEditor: 'customers-editor',
  customersSearch: 'customers-search',
  customersList: 'customers-list',
  entityPrimaryAction: 'entity-primary-action',
  entityEditor: 'entity-editor',
  entityList: 'entity-list',
  entityPagination: 'entity-pagination',
  mastersCards: 'masters-cards',
  moduleTaskNav: 'module-task-nav',
  moduleTaskPanel: 'module-task-panel',
  moduleForm: 'module-form',
  moduleAction: 'module-action',
  moduleResults: 'module-results',
  reportVisualization: 'report-visualization',
  posHeader: 'pos-header',
  posCustomer: 'pos-customer',
  posProductSearch: 'pos-product-search',
  posProductResults: 'pos-product-results',
  posCart: 'pos-cart',
  posTotals: 'pos-totals',
  posPaymentMethod: 'pos-payment-method',
  posCashTendered: 'pos-cash-tendered',
  posChange: 'pos-change',
  posChargeAction: 'pos-charge-action',
  posHistory: 'pos-history',
  paymentTerminalsList: 'payment-terminals-list',
  paymentTerminalsAction: 'payment-terminals-action',
} as const;

export type TutorialSelectorName = (typeof TOUR_SELECTORS)[keyof typeof TOUR_SELECTORS];

export function tutorialSelector(name: TutorialSelectorName): string {
  return `[data-tour="${name}"]`;
}

