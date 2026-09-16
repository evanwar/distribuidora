import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F08_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f08-dashboard', moduleId: 'F08', version: 1, route: '/dashboard', estimatedMinutes: 3,
    requiredPermissions: ['reports.view'], title: copy('Entender el dashboard', 'Understand the dashboard'),
    description: copy('Lee indicadores, tendencias y accesos rápidos del día.'),
    steps: [
      step('summary', S.dashboardSummary, copy('Pulso operativo', 'Operational pulse'), copy('El encabezado resume la situación actual y permite actualizar los indicadores.')),
      step('kpis', S.dashboardKpis, copy('Indicadores principales', 'Key indicators'), copy('Ventas, operaciones, inventario y cobranza provienen de agregados del servidor.')),
      step('actions', S.dashboardQuickActions, copy('Explora el detalle', 'Explore details'), copy('Abre reportes o módulos operativos desde los accesos disponibles.'), { optional: true }),
      step('content', S.pageContent, copy('Carga, vacío y error', 'Loading, empty, and error'), copy('Cero datos no significa error. La pantalla diferencia cada estado y ofrece una siguiente acción.')),
    ],
  },
  {
    id: 'f08-reports', moduleId: 'F08', version: 1, route: '/operations/reports', estimatedMinutes: 4,
    requiredPermissions: ['reports.view', 'reports.financial', 'reports.inventory'], title: copy('Consultar reportes', 'Review reports'),
    description: copy('Aplica filtros y lee métricas, gráficas y tablas accesibles.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Elige un reporte', 'Choose a report'), copy('Selecciona ventas, utilidad, inventario, compras o antigüedad de saldos.')),
      step('panel', S.moduleTaskPanel, copy('Alcance del reporte', 'Report scope'), copy('Lee qué mide el reporte antes de indicar el periodo o filtros.')),
      step('form', S.moduleForm, copy('Periodo y filtros', 'Dates and filters'), copy('Aplica solo los filtros necesarios; puedes limpiar y repetir la consulta.'), { optional: true }),
      step('visual', S.reportVisualization, copy('Lectura visual', 'Visual summary'), copy('La gráfica resume agregados del servidor y siempre debe contar con una alternativa textual o tabular.'), { optional: true }),
      step('results', S.moduleResults, copy('Resultado detallado', 'Detailed result'), copy('Distingue una consulta sin datos de un error. No existe exportación si el servidor no la ofrece.'), { optional: true }),
    ],
  },
];
