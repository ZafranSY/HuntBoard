Viewed PRD.md:299-332
Viewed page.tsx:1-23
Viewed page.tsx:1-13
Viewed applications.ts:1-216
Viewed resumes.ts:1-69

We are using a combination of **Dynamic Server-Side Rendering (SSR)** and **Static Site Generation (SSG)** in the Next.js app.

### 1. What are we using? (SSR vs. SSG)
*   **Dynamic SSR (Server-Side Rendering):** 
    *   **Routes:** `/dashboard`, `/resumes`, and `/`
    *   **Why:** These routes are user-session dependent. They read encrypted cookies (`iron-session`) at request time to retrieve the `namespaceId`, querying the Neon PostgreSQL database dynamically for that specific namespace. Next.js automatically marks these routes as dynamic (`ƒ`).
*   **SSG (Static Site Generation):**
    *   **Routes:** Page fallbacks (like `/_not-found`) and other static asset roots.
    *   **Why:** They don't rely on dynamic request-time headers or database state and are built once at compile time.

---

### 2. Plan to Make It Faster

To keep the application fast, we can optimize several layers:

#### A. Data Fetching Optimization (Already partially implemented)
*   **Parallel Queries:** We fetch database collections in parallel using `Promise.all([getApplications(), getResumes()])` on Server Components to avoid blocking waterfalls.
*   **Query Projection:** Optimize Drizzle queries to select only the necessary columns (e.g. only ID and status for pipeline counts) instead of pulling complete records (`select()`), reducing database transfer payload.

#### B. UI & User Experience Optimization
*   **React Streaming & Suspense:** Add a `loading.tsx` file for `/dashboard` and `/resumes`. Next.js will instantly stream the shell of the page (including the sidebar layout), while database queries resolve, displaying visual skeleton states rather than showing a blank page.
*   **Optimistic UI Updates:** Implement React’s `useOptimistic` or `useTransition` hooks in client actions (e.g., when dragging a card between statuses in the pipeline board) so changes reflect instantly in the UI before the backend confirmation round-trip finishes.

#### C. Network & DB Latency
*   **Colocation:** Ensure the Vercel hosting region (e.g., `us-east-1` for default hobby deployments) matches the Neon database region (`us-east-1`). This reduces regional network round-trips to <5ms.
*   **Prefetching:** Next.js `<Link>` elements automatically prefetch destination pages in the background when they appear in the user's viewport, making page navigation feel instant.