import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {

      const requestBody = {
        email: user.email,
        name: user.name,
        image: user.image,
        provider: "google",
        provider_id: user.id,
      };

      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await res.json();

      if (result.ok && result.user_id) {
        // localStorageにuser_idを保存
        if (typeof window !== "undefined") {
          localStorage.setItem("user_id", result.user_id);
        }
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };