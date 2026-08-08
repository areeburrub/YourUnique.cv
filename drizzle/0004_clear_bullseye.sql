DROP TABLE IF EXISTS "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "chat_threads" CASCADE;--> statement-breakpoint
ALTER TABLE "user_files" DROP CONSTRAINT IF EXISTS "user_files_thread_id_chat_threads_id_fk";
