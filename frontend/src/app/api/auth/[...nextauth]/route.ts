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
      // FastAPIのエンドポイントにユーザー情報を送信
      await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + "/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          image: user.image,
          provider: "google",
          provider_id: user.id, // Googleのsubなど
        }),
      });
      return true;
    },
  },
});

export { handler as GET, handler as POST };