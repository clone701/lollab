import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        // Supabaseのapp_usersテーブルにユーザー情報を保存
        // emailをキーとしてupsert（既存ユーザーは更新、新規ユーザーは作成）
        const { data, error } = await supabase
          .from('app_users')
          .upsert({
            email: user.email,
            name: user.name,
            image: user.image,
            provider: 'google',
            provider_id: user.id,
          }, {
            onConflict: 'email',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to save user to Supabase:', error);
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
