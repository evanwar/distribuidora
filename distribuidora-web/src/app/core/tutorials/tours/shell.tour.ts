import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const SHELL_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'shell-getting-started', moduleId: 'shell', version: 1, route: '/dashboard', estimatedMinutes: 3,
    title: copy('Conoce el sistema', 'Meet the system'),
    description: copy('Ubica la navegación, el resumen diario y las opciones de tu sesión.', 'Find navigation, the daily summary, and your session options.'),
    steps: [
      step('welcome', S.pageContent, copy('Bienvenido', 'Welcome'), copy('Este espacio reúne ventas, inventario, compras, cobranza y control. El recorrido solo explica; no modifica información.'), { placement: 'bottom' }),
      step('navigation', S.shellNavigation, copy('Navegación principal', 'Main navigation'), copy('Las opciones están agrupadas por Operación, Catálogos y Control. En móvil puedes abrir este panel desde el botón de menú.'), { placement: 'right' }),
      step('summary', S.dashboardSummary, copy('Resumen del día', 'Daily summary'), copy('Aquí tienes una lectura rápida del negocio. Los datos mostrados provienen del servidor.'), { placement: 'bottom' }),
      step('kpis', S.dashboardKpis, copy('Indicadores y accesos', 'Indicators and shortcuts'), copy('Cada indicador resume una situación y también funciona como acceso al detalle correspondiente.'), { placement: 'bottom' }),
      step('language', S.shellLanguage, copy('Idioma', 'Language'), copy('Cambia entre español e inglés. La aplicación recarga para aplicar el idioma de forma consistente.'), { placement: 'bottom' }),
      step('identity', S.shellUser, copy('Tu sesión', 'Your session'), copy('Verifica aquí con qué cuenta estás trabajando antes de realizar una operación.'), { placement: 'bottom' }),
      step('help', S.helpLauncher, copy('Tutoriales disponibles', 'Available tutorials'), copy('Abre este centro cuando quieras aprender un módulo, continuar un recorrido o repetirlo.'), { placement: 'bottom' }),
      step('logout', S.shellLogout, copy('Cerrar sesión', 'Sign out'), copy('Usa esta acción al terminar. El tutorial se cerrará automáticamente y no conservará datos de negocio.'), { placement: 'bottom' }),
    ],
  },
];

