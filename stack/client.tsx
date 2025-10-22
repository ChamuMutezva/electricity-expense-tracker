import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
    tokenStore: "nextjs-cookie",
    urls: {
        signIn: "/handler/sign-in",
        afterSignIn: "/",
        afterSignUp: "/",
        signOut: "/handler/sign-out",
        afterSignOut: "/",
    },
});
