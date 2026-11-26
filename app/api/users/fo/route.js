import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.users_FO.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      select: {
        id: true,
        email: true,
        created_at: true,
        updated_at: true,
        account_duration: true,
        access_code_expiration: true,
        user_type_id: true,
      },
    });
    const now = Date.now();

    return Response.json(
      users.map((user) => {
        const expiresAt = new Date(
          new Date(user.created_at).getTime() + user.account_duration * 1000
        );
        const expired = now >= expiresAt.getTime();

        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
          expires_at: expiresAt,
          expired: Boolean(expired),
          user_type_id: user.user_type_id,
        };
      })
    );
  } catch (error) {
    console.error("FO USER LIST ERROR:", error);
    return Response.json(
      { error: "Não foi possível carregar os utilizadores FO." },
      { status: 500 }
    );
  }
}
