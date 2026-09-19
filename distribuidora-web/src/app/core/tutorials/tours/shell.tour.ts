import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const SHELL_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'shell-getting-started', moduleId: 'shell', version: 2, route: '/dashboard', estimatedMinutes: 3,
    title: copy('Conoce el sistema', 'Meet the system'),
    description: copy('Un recorrido rápido para saber dónde está cada cosa.', 'Find navigation, the daily summary, and your session options.'),
    steps: [
      step('welcome', S.pageContent, copy('¡Te damos la bienvenida!', 'Welcome'), copy('Desde aquí puedes atender ventas, revisar productos, registrar compras y mucho más. Puedes explorar con tranquilidad: este recorrido no guardará ningún cambio.'), { placement: 'bottom' }),
      step('navigation', S.shellNavigation, copy('Encuentra lo que necesitas', 'Main navigation'), copy('Usa este menú para ir a las distintas áreas. Si estás en un celular, ábrelo con el botón de menú.'), { placement: 'right' }),
      step('summary', S.dashboardSummary, copy('Lo más importante del día', 'Daily summary'), copy('Aquí puedes ver rápidamente cómo va el negocio hoy.'), { placement: 'bottom' }),
      step('kpis', S.dashboardKpis, copy('Consulta más detalles', 'Indicators and shortcuts'), copy('Cada tarjeta muestra un dato importante. Selecciónala para ver la información completa.'), { placement: 'bottom' }),
      step('language', S.shellLanguage, copy('Idioma', 'Language'), copy('Cambia entre español e inglés. La aplicación recarga para aplicar el idioma de forma consistente.'), { placement: 'bottom' }),
      step('identity', S.shellUser, copy('Esta es tu cuenta', 'Your session'), copy('Antes de hacer una operación, confirma que estás usando la cuenta correcta.'), { placement: 'bottom' }),
      step('help', S.helpLauncher, copy('Ayuda cuando la necesites', 'Available tutorials'), copy('Vuelve aquí para iniciar otro recorrido, continuar uno pendiente o repetirlo.'), { placement: 'bottom' }),
      step('logout', S.shellLogout, copy('Al terminar', 'Sign out'), copy('Cierra tu sesión para proteger tu cuenta, sobre todo si compartes el equipo.'), { placement: 'bottom' }),
    ],
  },
];
