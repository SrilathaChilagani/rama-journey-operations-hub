import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { reportError } from "./lib/sentry";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    await reportError(error, { side: "server", path: new URL(request.url).pathname });
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// requestMiddleware runs on every request; functionMiddleware only on server functions, where
// client sendContext is unvalidated input. Append to these arrays, never replace them.
// Enabling Lovable Cloud adds functionMiddleware: [attachSupabaseAuth], the bearer token that
// requireSupabaseAuth server functions need. Add it by hand only if Lovable Cloud or a
// user-managed Supabase project is connected, no middleware here sets Authorization, and the
// project did not intentionally replace it.
// Server-function faults (database down, provider errors) go to Sentry, then on to the caller
// unchanged. Expected refusals (not signed in, SOP rules) are filtered out in reportError.
const reportFunctionErrors = createMiddleware({ type: "function" }).server(async ({ next, serverFnMeta }) => {
  try {
    return await next();
  } catch (error) {
    await reportError(error, { side: "server", path: `server-function:${serverFnMeta?.name ?? "?"}`, tags: { file: serverFnMeta?.filename ?? "?" } });
    throw error;
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
  functionMiddleware: [reportFunctionErrors],
}));
