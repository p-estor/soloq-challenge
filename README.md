# Chupachotas SoloQ Challenge 🏆
Plataforma web de seguimiento y clasificación en tiempo real para el SoloQ Challenge de una comunidad de Discord competitiva.

El proyecto está actualmente desplegado y en vivo en: **[chupachotas.es](https://chupachotas.es/)**

---

## 🚀 Características
*   **Clasificación en tiempo real:** Tracking de victorias, derrotas, porcentaje de victoria (Winrate) y puntos de liga (LP) de todos los participantes.
*   **Integración con Riot Games API:** Conexión directa a los endpoints de Riot (región EUW) para la extracción de estadísticas de partidas clasificatorias.
*   **Control de Rate-limiting:** Cliente HTTP adaptado para respetar los límites estrictos de peticiones de la API de Riot (evitando errores 429).
*   **Sincronización segura:** Ruta `/api/sync` protegida mediante token secreto de producción para llamadas automáticas programadas (Cron jobs).
*   **Dashboard de Administración:** Panel administrativo (en `/admin`) para añadir, editar o eliminar invocadores de la competición.

---

## 🛠️ Stack Tecnológico
*   **Framework:** [Next.js](https://nextjs.org/) (React) con TypeScript.
*   **Bases de Datos:** MySQL en producción / SQLite en desarrollo local.
*   **ORM:** [Prisma ORM](https://www.prisma.io/) para la gestión de modelos, migraciones y consultas seguras.
*   **Despliegue & DevOps:** VPS Linux, Nginx (Proxy inverso), PM2 (Gestor de procesos de Node), y certificados SSL con Certbot (Let's Encrypt).

---

## 📦 Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone git@github.com:p-estor/soloq-challenge.git
cd soloq-challenge
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales:
```env
DATABASE_URL="file:./dev.db" # Ruta a SQLite en local
RIOT_API_KEY="RGAPI-tu-clave-de-desarrollo-aqui"
SYNC_TOKEN="tu_token_secreto_para_desencadenar_sincronizaciones"
ADMIN_PASSWORD="tu_contraseña_para_el_panel_de_administración"
```

### 4. Ejecutar migraciones de Prisma
Genera la base de datos local SQLite y los tipos de Prisma:
```bash
npx prisma migrate dev --name init
```

### 5. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

---

## 🛡️ Licencia
Este proyecto es de código abierto y está libre para su uso comunitario.
