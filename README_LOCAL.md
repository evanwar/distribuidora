# Ejecutar Distribuidora completamente en local

El proyecto se puede ejecutar sin contratar ni configurar un hosting. Docker
levanta la interfaz web, la API y PostgreSQL en la computadora local.

## Requisito

- Docker Desktop con Docker Compose.

No es necesario instalar Node.js, .NET ni PostgreSQL por separado.

## Iniciar

Desde esta carpeta:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps
```

Abre `http://localhost:4200` e inicia sesión con:

- Usuario: `admin`
- Contraseña: `ChangeMe123!`

Estos datos se pueden cambiar en `.env` antes de iniciar. La API queda disponible
en `http://localhost:8080` y su documentación en
`http://localhost:8080/scalar/v1`.

## Operación diaria

```powershell
# Detener sin borrar información
docker compose stop

# Volver a iniciar
docker compose start

# Ver registros
docker compose logs -f

# Reconstruir después de cambiar el código
docker compose up --build -d
```

Los datos se conservan en el volumen `distribuidora_local_postgres_data`, incluso
al ejecutar `docker compose down`. No uses `docker compose down --volumes` salvo
que quieras borrar definitivamente la base de datos local.

## Personalización

Edita `.env` para cambiar puertos y credenciales. Si el puerto 4200 está ocupado,
por ejemplo, usa `WEB_PORT=4300` y abre `http://localhost:4300`.

Las variables de Mercado Pago son opcionales. La aplicación local puede arrancar
sin ellas; solo son necesarias para operar una terminal Point real.
