/*
  Warnings:
  - A unique constraint covering the columns `[workspaceId,name]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `User` table without a default value. This is not possible if the table is not empty.
*/

-- CreateTable
CREATE TABLE "Workspace" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_code_key" ON "Workspace"("code");

-- 既存データ用のデフォルトワークスペースを作成
INSERT INTO "Workspace" ("name", "code", "createdAt")
VALUES ('デフォルトワークスペース', 'DEFAULT01', CURRENT_TIMESTAMP);

-- AlterTable（まずNULL許容で列を追加）
ALTER TABLE "Room" ADD COLUMN "workspaceId" INTEGER;
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_name_key";
ALTER TABLE "User" ADD COLUMN "workspaceId" INTEGER;

-- 既存の全レコードをデフォルトワークスペースに割り当てる
UPDATE "Room" SET "workspaceId" = (SELECT "id" FROM "Workspace" WHERE "code" = 'DEFAULT01');
UPDATE "User" SET "workspaceId" = (SELECT "id" FROM "Workspace" WHERE "code" = 'DEFAULT01');

-- ここからNOT NULL制約をかける
ALTER TABLE "Room" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "workspaceId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_workspaceId_name_key" ON "User"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;