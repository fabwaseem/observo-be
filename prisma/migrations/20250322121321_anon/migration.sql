-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isTempUser" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "walletAddress" DROP NOT NULL;
