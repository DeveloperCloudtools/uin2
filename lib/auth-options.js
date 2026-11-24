import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { getRequestHotelConfig } from "@/lib/requestHotelConfig";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/backend/login",
  },
  providers: [
    CredentialsProvider({
      name: "Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.users.findFirst({
          where: {
            username: credentials.username,
          },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) return null;

        await prisma.users.update({
          where: { user_id: user.user_id },
          data: { last_login: new Date() },
        });

        return {
          id: user.user_id,
          name: user.username,
          type: user.type,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const { NEXTAUTH_URL } = await getRequestHotelConfig();
      const hotelBaseUrl = NEXTAUTH_URL
        ? new URL(NEXTAUTH_URL).origin
        : baseUrl;
      const targetUrl = new URL(url, hotelBaseUrl);

      return targetUrl.origin === hotelBaseUrl
        ? targetUrl.toString()
        : hotelBaseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.type = token.type;
      return session;
    },
  },
};
