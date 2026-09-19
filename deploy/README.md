# Paquete privado de distribución

Este paquete publica tres imágenes privadas y transporta la base local mediante
un respaldo PostgreSQL separado. El respaldo conserva usuarios, contraseñas
cifradas, catálogos y operaciones.

## Preparar en el equipo original

Inicia sesión en el repositorio y publica una versión:

```powershell
docker login
.\deploy\Publicar-Imagenes.ps1 -RegistryNamespace tuusuario -Repository distribuidora -Version 1.0.0
```

Solo necesitas un repositorio privado llamado `distribuidora`. Las imágenes se
publican dentro de él con las etiquetas `api-1.0.0`, `web-1.0.0` y
`postgres-16`.

Con la base local en ejecución, genera el respaldo:

```powershell
.\deploy\Respaldar-BaseLocal.ps1
```

Si tu stack actual fue iniciado desde la carpeta `Distribuidora`, indica ese
archivo explícitamente:

```powershell
.\deploy\Respaldar-BaseLocal.ps1 -ComposeFile .\Distribuidora\docker-compose.yml
```

El respaldo queda en `deploy/backups/distribuidora.backup`. Es información
sensible: transfiérelo por un medio seguro y no lo subas al repositorio Git ni al
registro de imágenes.

## Instalar en otro equipo

Copia la carpeta `deploy`, incluyendo el respaldo. Después:

```powershell
Copy-Item .\deploy\.env.distribution.example .\deploy\.env
# Edita deploy/.env con el repositorio y secretos correctos.
docker login
.\deploy\Instalar-Distribuidora.ps1
```

## Importar el catalogo de productos

El paquete incluye una importacion transaccional preparada desde el Excel de
catalogos. Desde la raiz del proyecto, con la aplicacion ya instalada:

```powershell
.\deploy\Importar-Catalogo.ps1
```

El script usa `deploy/.env`, levanta PostgreSQL si es necesario, crea primero un
respaldo en `deploy/backups`, importa marcas, categorias, productos, precios y
alias, y verifica los totales antes de confirmar la transaccion. Puede ejecutarse
de nuevo para actualizar el mismo catalogo sin duplicarlo.

El instalador descarga las tres imágenes, crea PostgreSQL, restaura el respaldo y
levanta API y Web. `SEED_SYNC_ADMIN_CREDENTIALS=false` evita que el primer inicio
cambie el administrador que viene en el respaldo.

La restauración está pensada para una instalación nueva. Si el equipo destino ya
tiene datos importantes, respáldalos antes de ejecutar el instalador.
