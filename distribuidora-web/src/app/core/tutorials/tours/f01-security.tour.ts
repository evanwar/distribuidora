import { TutorialDefinition } from '../models/tutorial.models';
import { TOUR_SELECTORS as S } from '../registry/tutorial-selectors';
import { copy, step } from './tour-builder';

export const F01_TOURS: readonly TutorialDefinition[] = [
  {
    id: 'f01-users', moduleId: 'F01', version: 1, route: '/operations/security', estimatedMinutes: 4,
    requiredPermissions: ['security.view', 'security.create_user', 'security.edit_user'],
    title: copy('Administrar usuarios', 'Manage users'),
    description: copy('Consulta cuentas, crea usuarios y asigna responsabilidades con seguridad.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Tareas de seguridad', 'Security tasks'), copy('Elige una tarea: consultar, crear, editar o asignar roles. Solo aparecen acciones disponibles para tu cuenta.')),
      step('panel', S.moduleTaskPanel, copy('Detalle de la tarea', 'Task details'), copy('Lee el propósito y el tipo de operación antes de capturar información.')),
      step('form', S.moduleForm, copy('Datos requeridos', 'Required data'), copy('Completa los campos solicitados. Los errores se muestran junto al dato que debes corregir.'), { optional: true }),
      step('action', S.moduleAction, copy('Completar con seguridad', 'Complete safely'), copy('La acción permanece bloqueada mientras falten datos. El servidor valida permisos y confirma el resultado.'), { optional: true }),
      step('results', S.moduleResults, copy('Resultado real', 'Server result'), copy('Después de consultar o guardar, revisa aquí el resultado confirmado y cualquier referencia de soporte.'), { optional: true }),
    ],
  },
  {
    id: 'f01-roles', moduleId: 'F01', version: 1, route: '/operations/security', estimatedMinutes: 3,
    requiredPermissions: ['security.manage_roles'],
    title: copy('Roles y permisos', 'Roles and permissions'),
    description: copy('Comprende cómo se agrupan permisos y se asignan a cada usuario.'),
    steps: [
      step('tasks', S.moduleTaskNav, copy('Selecciona roles', 'Choose roles'), copy('Las tareas de roles permiten consultar responsabilidades y mantener su matriz de permisos.')),
      step('panel', S.moduleTaskPanel, copy('Alcance del rol', 'Role scope'), copy('Revisa cuidadosamente qué responsabilidad estás modificando antes de continuar.')),
      step('form', S.moduleForm, copy('Matriz autorizada', 'Authorized matrix'), copy('Selecciona únicamente los permisos necesarios. Ocultar acciones en pantalla no reemplaza la autorización del servidor.'), { optional: true }),
      step('action', S.moduleAction, copy('Guardar cambios', 'Save changes'), copy('El tutorial no guardará nada. Al trabajar realmente, confirma el cambio y espera la respuesta del sistema.'), { optional: true }),
      step('results', S.moduleResults, copy('Verifica el resultado', 'Verify the result'), copy('Comprueba que la asignación confirmada coincide con lo solicitado.'), { optional: true }),
    ],
  },
];
