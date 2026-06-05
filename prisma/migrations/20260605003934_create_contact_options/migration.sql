/*
  Warnings:

  - A unique constraint covering the columns `[type,value]` on the table `ContactOption` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ContactOption_type_value_key` ON `ContactOption`(`type`, `value`);
