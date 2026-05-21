import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { hasClerkPublishableKey } from "@/lib/auth-flags";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  "/api/conversations/create",
]);

const proxyHandler = hasClerkPublishableKey
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect();
      }
    })
  : () => {
      return;
    };

export default proxyHandler;

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)"],
};