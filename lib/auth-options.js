
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

// =====================================================
// OBTER A DATA ATUAL EM PORTUGAL
// =====================================================

function getTodayPortugal() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

// =====================================================
// CONVERTER DATA DE EXPIRAÇÃO
// =====================================================

function getExpirationDate(value) {
  if (value instanceof Date) {
    return [
      value.getUTCFullYear(),
      String(value.getUTCMonth() + 1).padStart(2, "0"),
      String(value.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }

  return String(value).slice(0, 10);
}

// =====================================================
// VERIFICAR SE A CONTA EXPIROU
// =====================================================

async function isAccountExpired(user) {
  // NULL = conta sem validade
  if (user.expired_at == null) {
    return false;
  }

  const expirationDate = getExpirationDate(user.expired_at);
  const today = getTodayPortugal();

  console.log("VERIFICAÇÃO DA CONTA:", {
    user_id: user.user_id,
    expired_at: expirationDate,
    today,
    active: user.active,
    expired: expirationDate < today,
  });

  // A conta só expira quando a data é anterior a hoje
  if (expirationDate < today) {
    const updated = await prisma.users.update({
      where: {
        user_id: user.user_id,
      },
      data: {
        active: false,
      },
    });

    console.log(
      "CONTA EXPIRADA - ACTIVE ATUALIZADO:",
      updated.active
    );

    return true;
  }

  return false;
}

// =====================================================
// CONFIGURAÇÃO NEXTAUTH
// =====================================================

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
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      // =====================================================
      // AUTENTICAÇÃO
      // =====================================================

      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          const user = await prisma.users.findFirst({
            where: {
              username: credentials.username,
            },
          });

          if (!user) {
            console.log("LOGIN: utilizador não encontrado");
            return null;
          }

          // PRIMEIRO: verificar se a conta expirou
          // Esta verificação acontece antes de verificar active.
          if (await isAccountExpired(user)) {
            console.log("LOGIN BLOQUEADO: conta expirada");
            return null;
          }

          // SEGUNDO: verificar se a conta está ativa
          if (user.active !== true) {
            console.log("LOGIN BLOQUEADO: conta desativada");
            return null;
          }

          // TERCEIRO: verificar password
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log("LOGIN: password incorreta");
            return null;
          }

          // QUARTO: atualizar último login
          await prisma.users.update({
            where: {
              user_id: user.user_id,
            },
            data: {
              last_login: new Date(),
            },
          });

          console.log("LOGIN EFETUADO:", user.username);

          return {
            id: user.user_id,
            name: user.username,
            type: user.type,
            roleId: user.user_type_id,
          };

        } catch (error) {
          console.error("ERRO NA AUTENTICAÇÃO:", error);
          return null;
        }
      },
    }),
  ],

  // =====================================================
  // JWT
  // =====================================================

callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id;
      token.type = user.type;
      token.roleId = user.roleId;

      const rolePermissions = await prisma.rolePermissions.findMany({
        where: {
          role_id: Number(user.roleId),
        },
        include: {
          Permissions: {
            select: {
              permission_key: true,
            },
          },
        },
      });

      token.permissionKeys = rolePermissions
        .map((rp) => rp.Permissions?.permission_key)
        .filter(Boolean);

      // Ajusta esta condição ao campo que identifica
      // inequivocamente o Administrator na tua base de dados.
      token.isAdministrator = user.type === "Administrator";
    }

    return token;
  },

  async session({ session, token }) {
    session.user.id = token.id;
    session.user.type = token.type;
    session.user.roleId = token.roleId;
    session.user.permissionKeys = token.permissionKeys || [];
    session.user.isAdministrator = token.isAdministrator || false;

    return session;
  },
},
};
