ALTER TABLE "note_folders" DROP CONSTRAINT "note_folders_sectionId_fkey";
ALTER TABLE "note_folders" DROP COLUMN "sectionId";
DROP TABLE "note_sections";
