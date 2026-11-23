# 🎤 Mockify — Mock Interview (Interviewer + Candidate)

> **Stack**: Java 21 · Spring Boot 3.2 · React + Vite · MySQL · JPA/Hibernate · Lombok · Jackson

---

## 🟦 SECTION 1 — Project Overview & Motivation

---

**Q1. Tell me about your Mockify project. What problem does it solve?**

> **A:** Mockify is a full-stack API mocking platform. The core problem it solves is *frontend-backend decoupling* during development. When a frontend team is building UI features but the backend APIs aren't ready yet, they traditionally either block or write throwaway local JSON files. Mockify gives them a proper hosted mock server — you register a project, define endpoints with custom HTTP methods, paths, JSON response payloads, and status codes. After that, you hit a live URL with your real API key and get back real mock responses. It's essentially your own personal WireMock-as-a-service.

---

**Q2. Why did you build this instead of using an existing tool like WireMock, Postman Mock Server, or Mockoon?**

> **A:** Great question. Existing tools either require local setup (Mockoon, WireMock standalone), or are paid/SaaS (Postman). I wanted to build something I fully own and understand end-to-end, and more importantly, I wanted to add something that most of those tools don't expose easily — a **Chaos Engineering layer**. The ability to define probabilistic latency injection and error injection per endpoint is something most lightweight mock tools don't have natively. Building it from scratch also gave me full control over the data model and API design.

---

**Q3. Walk me through the overall architecture.**

> **A:** The architecture is a classic three-tier design:
> - **Frontend**: React + Vite SPA with TailwindCSS. It lets you create projects, manage endpoints, and configure chaos profiles through a UI.
> - **Backend**: Spring Boot 3.2 REST API running on Java 21. It exposes two categories of APIs — a *Management API* (CRUD for projects, endpoints, chaos profiles) and a *Mock Engine* (`/mock/{apiKey}/**`) that dynamically routes incoming requests to the right mock response.
> - **Database**: MySQL with JPA/Hibernate managing the ORM. Three main tables: `projects`, `endpoints`, and `chaos_profiles`.
>
> The key design decision is the separation between the **management plane** and the **data plane** — one for configuring mocks, one for serving them.

---

## 🟦 SECTION 2 — Backend Deep Dive

---

**Q4. How does the dynamic mock routing work? How does the system know which response to return?**

> **A:** The `MockController` maps all HTTP methods (GET, POST, PUT, DELETE) to the wildcard path `/mock/{apiKey}/**`. When a request comes in, I extract the `apiKey` from the path variable and then strip the `/mock/{apiKey}/` prefix from the full URI to get the `routePath`. Then I pass `apiKey`, `httpMethod`, and `routePath` to `MockService`, which queries the `EndpointRepository` using a custom JPQL query:
> ```sql
> SELECT e FROM Endpoint e JOIN e.project p
> WHERE p.apiKey = :apiKey AND e.httpMethod = :method AND e.routePath = :path
> ```
> If a match is found, the response payload and status code stored for that endpoint are returned. If not, a `ResourceNotFoundException` is thrown, which the global exception handler catches and returns as a 404.

---

**Q5. Why did you use a JPQL JOIN query instead of a derived query method in Spring Data JPA?**

> **A:** Derived query methods like `findByProject_ApiKeyAndHttpMethodAndRoutePath` technically work, but they get verbose and JPA generates multiple queries or joins implicitly. With a custom `@Query`, I have explicit control over the JPQL join, it's readable, and I can see exactly what SQL is being generated. It also avoids potential N+1 issues since I'm joining the `Project` relationship directly in the query rather than fetching it lazily afterward.

---

**Q6. How is the JSON response payload stored in the database?**

> **A:** The `responsePayload` field on `Endpoint` is of type `Map<String, Object>`, which can hold any arbitrary JSON structure. I annotated it with `@Convert(converter = JsonMapConverter.class)` — a custom JPA `AttributeConverter` that uses Jackson's `ObjectMapper` to serialize the map to a JSON string before writing to the DB, and deserializes it back on read. On the MySQL side the column is defined as `columnDefinition = "JSON"`, so MySQL validates that it's well-formed JSON.

---

**Q7. Explain the Chaos Engine. How does it work?**

> **A:** `ChaosEngine` is a Spring `@Component` that takes a `ChaosProfile` and applies two kinds of chaos:
> 1. **Latency injection**: If `latencyMaxMs > 0`, it computes a random delay between `latencyMinMs` and `latencyMaxMs` using `Random.nextInt()` and calls `Thread.sleep(delayMs)`.
> 2. **Error injection**: If `errorProbability > 0`, it generates a `random.nextDouble()` (between 0.0 and 1.0) and if it falls below the configured probability, it throws a `ChaosException` with the configured `errorStatusCode` and a message.
>
> `ChaosException` bubbles up to `GlobalExceptionHandler`, which catches it and returns a response with the exact status code the chaos profile specified. The whole thing is called synchronously inside the mock request pipeline — so the caller really does experience the delay and error.

---

**Q8. Why does `MockService.handle()` declare `throws InterruptedException`? Isn't that a checked exception leak?**

> **A:** That's a fair observation. `Thread.sleep()` throws `InterruptedException`, which is checked. I declared it on the method signature and let it propagate up to `MockController`, which also declares it. Spring MVC's `DispatcherServlet` will catch unhandled exceptions from controllers. In an ideal production setup, I should probably catch `InterruptedException` inside `ChaosEngine.applyChaos()`, re-interrupt the thread with `Thread.currentThread().interrupt()`, and throw a custom runtime exception instead, to avoid leaking the checked exception and to properly restore the interrupt flag. This is something I'd refactor if I were hardening this for production.

---

**Q9. How is error handling structured across the application?**

> **A:** I used `@RestControllerAdvice` with a `GlobalExceptionHandler` class. It has two handlers:
> - `ResourceNotFoundException` → HTTP 404 with a JSON body `{"detail": "message"}`
> - `ChaosException` → HTTP with whatever status code the chaos profile specified
>
> This centralizes all error handling in one place. No controller has any try-catch logic — they just let exceptions propagate naturally. The mapper pattern also ensures service layer never leaks JPA entities to the HTTP layer.

---

**Q10. What is the Mapper pattern you used, and why?**

> **A:** Each domain module (project, endpoint, chaos) has its own `Mapper` class annotated with `@Component`. The mapper converts between JPA entities and DTOs — `Request` objects (input) and `Response` objects (output). For example, `ProjectMapper.toResponse(Project)` converts a `Project` entity to a `ProjectResponse` DTO. This keeps the entity layer decoupled from the API contract. If I change an internal field name, I only update the mapper, not the controller or service.

---

**Q11. How does API key generation work? Is it secure?**

> **A:** In `ProjectService.create()`, I generate an API key using `UUID.randomUUID().toString().replace("-", "").substring(0, 16)`. It produces a 16-character alphanumeric string. For a personal/demo project this is fine, but I'd acknowledge it has weaknesses in production — `UUID.randomUUID()` uses `SecureRandom` internally, so the entropy is good, but truncating to 16 characters reduces the key space. For production I'd use the full 32-character UUID or use `SecureRandom` directly to generate a Base64-encoded key.

---

**Q12. What does `@Transactional(readOnly = true)` do and why did you use it on GET methods?**

> **A:** `readOnly = true` is a performance hint to the JPA provider and underlying datasource. It tells Hibernate it doesn't need to track dirty state changes on the entities fetched in this session, which reduces memory overhead. On some datasources/connection pools, read-only transactions can be routed to read replicas. In practice for this project the benefit is modest, but it's a good habit that communicates intent clearly — this operation should not modify data.

---

**Q13. How did you handle CORS?**

> **A:** I have a `CorsConfig` class that registers a `WebMvcConfigurer` bean and configures allowed origins, methods, and headers. Since the frontend and backend run on different ports locally (Vite dev server vs Spring Boot), CORS must be explicitly allowed, otherwise the browser blocks the requests. I allow the frontend origin and the standard HTTP methods.

---

## 🟦 SECTION 3 — Database & JPA

---

**Q14. Describe the database schema and entity relationships.**

> **A:** There are three main entities:
> - **Project**: Has an `id`, `name`, and a 16-char `apiKey`. One-to-Many with Endpoint.
> - **Endpoint**: Belongs to a Project (Many-to-One). Stores `httpMethod`, `routePath`, `responsePayload` (JSON), and `defaultStatusCode`. One-to-One with ChaosProfile.
> - **ChaosProfile**: Optional, One-to-One with Endpoint. Stores `latencyMinMs`, `latencyMaxMs`, `errorProbability`, and `errorStatusCode`.
>
> The relationship is: **Project → Endpoints → ChaosProfile** (a tree that gets wider at the leaves).

---

**Q15. Why did you use `CascadeType.ALL` and `orphanRemoval = true` on the ChaosProfile relationship?**

> **A:** `CascadeType.ALL` means any persistence operation on `Endpoint` (save, delete) automatically cascades to its `ChaosProfile`. `orphanRemoval = true` means if you detach the `ChaosProfile` from the `Endpoint` (set it to null), JPA will automatically delete the orphaned row from the database. Together they ensure the lifecycle of a `ChaosProfile` is fully managed by its owning `Endpoint` — you never have orphan chaos profile rows in the DB.

---

**Q16. Why is `ChaosProfile` fetched EAGERLY from Endpoint but Project is fetched LAZILY?**

> **A:** Because the mock serving path always needs the `ChaosProfile` — every time `MockService.handle()` is called, it immediately calls `endpoint.getChaosProfile()`. If it were lazy, that would trigger an additional DB query on every mock request. By making it `EAGER`, it's always fetched in the same query. `Project`, on the other hand, is mostly needed only in management operations, and I have explicit JOIN queries where needed, so lazy loading avoids unnecessary joins in the mock hot path.

---

## 🟦 SECTION 4 — Frontend

---

**Q17. Walk me through the frontend architecture.**

> **A:** The frontend is a React SPA built with Vite. The routing is handled by React Router with two main pages:
> - **Dashboard**: Lists all projects, lets you create new ones.
> - **ProjectDetails**: Shows all endpoints for a project, lets you add endpoints and configure chaos profiles per endpoint.
>
> The `api/` folder contains the Axios-based API client functions that abstract all backend calls. Components are kept small and focused — they receive data via props or call API functions directly. TailwindCSS handles styling.

---

**Q18. How does the frontend communicate with the backend?**

> **A:** Through a centralized `api/` module using Axios. Each function wraps a specific backend endpoint. For example, `createProject(name)` calls `POST /api/projects`. The Vite dev server is configured with a proxy so that requests to `/api` are forwarded to `http://localhost:8080` — this avoids CORS issues in development since from the browser's perspective, both the frontend and the API are on the same origin.

---

## 🟦 SECTION 5 — Design Decisions & Trade-offs

---

**Q19. What would you improve if you had more time?**

> **A:** Several things:
> 1. **Authentication**: Right now any client can call the management API. I'd add Spring Security with JWT-based auth so users only manage their own projects.
> 2. **Response templating**: Currently response payloads are static JSON. I'd add Faker/template support so you can define `{{name}}` or `{{uuid}}` placeholders that get resolved dynamically on each request.
> 3. **Request matching**: Right now matching is exact path + method. I'd add query param matching and header-based matching for more realistic mocking.
> 4. **Metrics**: I'd add a request log per endpoint showing how many times it was hit, last accessed time, etc.
> 5. **`InterruptedException` handling**: Fix the checked exception leak in `ChaosEngine` as mentioned earlier.

---

**Q20. How would you scale this system if it needed to handle high traffic?**

> **A:** The mock-serving path (`/mock/**`) is stateless — every request just does a DB lookup and returns. So horizontal scaling is straightforward: add more instances behind a load balancer. For DB scaling, I'd add a read replica and route all `@Transactional(readOnly = true)` queries to it. For extreme traffic, I'd add a Redis cache in front of the `EndpointRepository` lookup — since mock responses are static, they're a perfect caching candidate. The cache key would be `apiKey:method:path` and TTL would reset on any update.

---

**Q21. Why Spring Boot and not something like Quarkus or Micronaut for this project?**

> **A:** Spring Boot was the right choice here for a few reasons — mature ecosystem, excellent Spring Data JPA integration, and I'm most productive with it. For a mock server that's more IO-bound than CPU-bound, Quarkus native compilation would have given faster startup times but at the cost of more complex build tooling. If I were targeting serverless or containerized environments with strict cold-start requirements, Quarkus would be worth the trade-off. For this project, Spring Boot's convention-over-configuration made the development cycle faster.

---

**Q22. What is the `@RestControllerAdvice` annotation and how is it different from `@ControllerAdvice`?**

> **A:** `@ControllerAdvice` is a specialization of `@Component` that allows you to apply cross-cutting concerns like exception handling across all controllers. `@RestControllerAdvice` is a combination of `@ControllerAdvice` and `@ResponseBody`, meaning every method in the advice class automatically serializes its return value to JSON. Since this is a pure REST API with no server-side HTML rendering, `@RestControllerAdvice` is the right choice — I don't need to return `ModelAndView` objects.

---

## 🟦 SECTION 6 — Behavioral / Wrap-up

---

**Q23. What was the hardest part of building Mockify?**

> **A:** The trickiest part was the dynamic path routing in `MockController`. Using Spring MVC's `/**` wildcard on a `@RequestMapping` means the raw `HttpServletRequest` gives you the full URI including the prefix, so I had to manually strip `/mock/{apiKey}/` from the front to extract just the `routePath`. Getting this right for edge cases — paths with no trailing slash, paths starting with `/`, etc. — took a few iterations of string manipulation. I normalize the path in both the registration side (in `EndpointService`) and the lookup side to ensure consistent matching.

---

**Q24. What did you learn from building this project?**

> **A:** A few things stood out:
> - **Chaos engineering as a concept**: I hadn't implemented probabilistic fault injection before. Designing the `ChaosEngine` made me think deeply about how services like Netflix's Chaos Monkey work.
> - **JPA relationship design**: The decision between EAGER vs LAZY fetching and cascade settings has real performance implications. I learned to think about it in terms of which access patterns are most frequent.
> - **Separation of planes**: The management plane vs data plane separation is a pattern used in infrastructure systems (like Kubernetes API server vs kubelet). Applying it to a mock server gave me a much cleaner architecture.

---

**Q25. How would you test this application?**

> **A:** Three layers:
> 1. **Unit tests**: Test `ChaosEngine.applyChaos()` with mocked `ChaosProfile` objects — verify latency is within range, verify error injection fires at the right probability over N trials.
> 2. **Integration tests**: Use `@SpringBootTest` with an embedded H2 database and `MockMvc` to test the full request lifecycle — create a project, add an endpoint, hit `/mock/{apiKey}/path`, verify the response payload and status code come back correctly.
> 3. **Contract tests**: Use something like Spring Cloud Contract or Pact to verify the frontend's API expectations match what the backend actually returns.

---

## 🟦 SECTION 7 — Chaos Engineering Concepts

---

**Q26. What exactly is "Chaos" in the context of this project? Why is it useful?**

> **A:** In software, Chaos Engineering means intentionally breaking things on purpose to test how a system behaves under failure conditions. Think of it like a fire drill — you don't wait for a real fire to find out if your escape plan works, you simulate it first. In Mockify, chaos means two things: latency injection, where the mock response is artificially delayed to simulate a slow server, and error injection, where the mock randomly returns an error response based on a configured probability. This is useful because it lets developers test their frontend's resilience — does it show a loading spinner when the API is slow? Does it handle errors gracefully? — without needing a real broken server. The idea was inspired by Netflix's Chaos Monkey, which randomly kills production servers to ensure the system can survive real outages.

---

**Q27. What is `ChaosProfile` and explain in detail how latency is applied and how errors are thrown?**

> **A:** `ChaosProfile` is a JPA entity stored in the `chaos_profiles` table. It acts as a configuration object attached to a specific endpoint, defining how chaotic that endpoint should behave. It has four fields: `latencyMinMs` and `latencyMaxMs` to control the delay range, `errorProbability` (a double between 0.0 and 1.0) to control how often errors are thrown, and `errorStatusCode` to define which HTTP error code gets returned when an error fires.
>
> For latency, the `ChaosEngine` first checks if `latencyMaxMs > 0`. If yes, it picks a random integer between `latencyMinMs` and `latencyMaxMs` using `random.nextInt(max - min + 1)` and then calls `Thread.sleep(delayMs)`. This actually blocks the request thread for that duration — the client genuinely waits. It's not a simulated delay, it's a real one.
>
> For error injection, the engine calls `random.nextDouble()`, which returns a value between 0.0 and 1.0. If that value is less than the configured `errorProbability`, it throws a `ChaosException` carrying the configured `errorStatusCode`. This exception bubbles up to the `GlobalExceptionHandler`, which catches it and returns an HTTP response with that exact status code. So if `errorProbability = 0.3`, roughly 30% of all requests to that endpoint will fail with the configured error code.
>
> If no `ChaosProfile` is attached to an endpoint, the engine immediately returns — chaos is completely optional.

---

**Q28. Walk me through how a user creates a mock API and then actually interacts with it.**

> **A:** The flow has three phases. First, the user creates a **Project** by submitting a name. The system auto-generates a unique 16-character API key using `UUID.randomUUID()` and saves the project to the `projects` table. This API key becomes the user's identity for all their mocks.
>
> Second, the user defines **Mock Endpoints** under that project — specifying the HTTP method, route path, the JSON response payload they want returned, and the default status code. The `EndpointService` normalizes the route path by stripping any leading slashes and saves it to the `endpoints` table linked to the project.
>
> Third, when the user or their application wants to actually use the mock, they make a real HTTP call to `/mock/{apiKey}/{routePath}` — for example, `GET /mock/a3f9c1b2e4d78e01/users`. The `MockController` receives this, extracts the `apiKey` from the path variable, strips the prefix to isolate the `routePath`, and passes both along with the HTTP method to `MockService`. The service queries the database for an endpoint matching all three — API key, method, and path. If found, the `ChaosEngine` runs first applying any configured delay or error injection. If chaos doesn't fire, the stored JSON payload and status code are returned as the response — exactly like a real API would respond.
>
> The API key is also what isolates different users' mocks from each other. Two users can register the same path `users` under different projects and they will never interfere, because their API keys are different.

---

**Q29. Why did you use Java 21 instead of Java 17?**

> **A:** Both Java 17 and Java 21 are LTS (Long-Term Support) releases, but I chose Java 21 for a few reasons. First, Java 21 ships with **Virtual Threads** (Project Loom) as a stable, production-ready feature. In a mock server like Mockify, the `ChaosEngine` calls `Thread.sleep()` to inject latency — with traditional platform threads this blocks the OS thread for the full duration. With Virtual Threads, `Thread.sleep()` suspends only the lightweight virtual thread and frees the OS thread to do other work, making the server far more efficient under concurrent load without changing any application code. Second, Java 21 includes **Record Patterns** and **Pattern Matching for switch** as finalized features, which make the code more expressive. Third, Spring Boot 3.2 — which I'm using — has first-class support for Java 21 and virtual threads via `spring.threads.virtual.enabled=true`, so the integration is seamless. Java 17 would have worked, but Java 21 gives meaningful performance and language improvements for essentially no extra cost.

---

**Q30. What is probabilistic fault injection and how is it implemented in Mockify?**

> **A:** Probabilistic fault injection means deliberately introducing failures not always, but based on a configured probability — simulating the way real-world failures happen intermittently rather than constantly. It is far more realistic than always failing because in production, errors are random and unpredictable. If something always failed, it would be trivial to detect. The hard-to-catch bugs are the ones that only happen sometimes.
>
> In Mockify, it is implemented inside `ChaosEngine.applyChaos()`. `random.nextDouble()` generates a random decimal between `0.0` and `1.0` on every single request. This value is then compared against the `errorProbability` stored in the `ChaosProfile`. If the random value falls below that threshold, a `ChaosException` is thrown — otherwise the request proceeds normally. So if `errorProbability = 0.3`, there is a 30% chance every request fails. The randomness means that on one run request 1 succeeds, request 2 succeeds, request 3 fails, request 4 succeeds — exactly mimicking intermittent real-world failures. The same logic applies to latency — instead of always delaying by a fixed amount, `random.nextInt(max - min + 1)` picks a random delay within the configured range on each request, so response times feel naturally variable rather than artificially uniform.

---

**Q31. How is Dependency Injection implemented in this project? Give an example from the chaos pipeline.**

> **A:** Mockify uses Spring's built-in Dependency Injection throughout. Every service, repository, and component is managed by the Spring IoC container. Instead of manually creating objects with `new`, I declare dependencies as constructor parameters and let Spring inject them automatically.
>
> I used Lombok's `@RequiredArgsConstructor` on every class that has dependencies. This annotation auto-generates a constructor for all `final` fields at compile time. Spring sees this constructor and uses it to inject the required beans — this is called **constructor injection**, which is the recommended approach because it makes dependencies explicit and the class impossible to instantiate without them.
>
> The chaos pipeline is a perfect example of how this chains together:
> - `ChaosEngine` is annotated with `@Component`, so Spring registers it as a bean.
> - `MockService` is annotated with `@Service` and declares `ChaosEngine` as a `final` field. `@RequiredArgsConstructor` generates the constructor, and Spring injects the `ChaosEngine` bean into it automatically.
> - `MockController` is annotated with `@RestController` and declares `MockService` as a `final` field. Again, Spring injects it via the generated constructor.
>
> So the full dependency chain — `MockController → MockService → ChaosEngine` — is wired entirely by Spring with zero manual object creation. When a request arrives, `MockController` already has a fully initialized `MockService`, which already has a fully initialized `ChaosEngine`, ready to apply chaos.

---

*End of Mock Interview*
