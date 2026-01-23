import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Hataları terminalde görmek için logları açtık
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;