# ChaosMock — Java Spring Boot Edition

Enterprise API Mocking Platform converted from FastAPI (Python) to **Java 21 + Spring Boot 3 + MySQL**.

---

## Project Structure

```
java version/
+-- backend/                   # Spring Boot Maven project
¦   +-- pom.xml
¦   +-- src/main/java/com/chaosmock/
¦       +-- ChaosMockApplication.java    # @SpringBootApplication entry point
¦       +-- HealthController.java        # GET /health
¦       +-- config/
¦       ¦   +-- CorsConfig.java          # CORS (allows http://localhost:5173)
¦       ¦   +-- GlobalExceptionHandler.java
¦       ¦   +-- ResourceNotFoundException.java
¦       ¦   +-- ChaosException.java
¦       +-- project/                     # /api/v1/projects CRUD
¦       +-- endpoint/                    # /api/v1/endpoints CRUD
¦       +-- chaos/                       # /api/v1/chaos-profiles + ChaosEngine
¦       +-- mock/                        # /mock/{apiKey}/{**path} dynamic router
+-- frontend/                  # React + Vite (unchanged from original)
```

---

## Requirements

| Tool | Version |
|------|---------|
| Java | 21+ |
| Maven | 3.9+ |
| MySQL | 8.0+ |
| Node | 18+ |

---

## Setup

### 1. MySQL Database

```sql
CREATE DATABASE chaosmock;
```

Update credentials in `backend/src/main/resources/application.properties`:
```
spring.datasource.username=root
spring.datasource.password=your_password
```

Spring Boot will auto-create all tables on first run (`spring.jpa.hibernate.ddl-auto=update`).

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

The backend runs on **http://localhost:8080**.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:5173**.

---

## API Mapping (FastAPI ? Spring Boot)

| FastAPI Route | Spring Boot Route | Notes |
|---|---|---|
| `POST /api/v1/projects` | Same | Creates project + auto-generates 16-char API key |
| `GET /api/v1/projects` | Same | Supports `skip` & `limit` query params |
| `GET /api/v1/projects/{id}` | Same | Returns project with all endpoints + chaos profiles |
| `DELETE /api/v1/projects/{id}` | Same | Cascades to endpoints & chaos profiles |
| `POST /api/v1/endpoints` | Same | `http_method` auto-uppercased, leading `/` stripped |
| `GET /api/v1/endpoints` | Same | |
| `DELETE /api/v1/endpoints/{id}` | Same | |
| `POST /api/v1/chaos-profiles` | Same | |
| `DELETE /api/v1/chaos-profiles/{id}` | Same | |
| `GET/POST/PUT/DELETE /mock/{apiKey}/{path}` | Same | Dynamic mock engine |
| `GET /health` | Same | Returns `{"status":"ok"}` |

---

## Key Design Decisions

- **`JsonMapConverter`** — JPA `AttributeConverter` that serializes `Map<String, Object>` to/from a MySQL `JSON` column, replacing SQLAlchemy's native JSON type.
- **`ChaosEngine`** — Translates the Python `asyncio.sleep` ? `Thread.sleep`, and `HTTPException` ? custom `ChaosException` caught by `GlobalExceptionHandler`.
- **Eager loading** — Endpoints + ChaosProfiles are fetched eagerly to avoid lazy-loading issues during JSON serialization (mirrors SQLAlchemy `selectinload` behaviour).
- **`@Transactional`** — Service layer handles all transaction boundaries.
