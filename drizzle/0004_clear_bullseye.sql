ALTER TABLE "chat_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_threads" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "chat_messages" CASCADE;--> statement-breakpoint
DROP TABLE "chat_threads" CASCADE;--> statement-breakpoint
ALTER TABLE "user_files" DROP CONSTRAINT "user_files_thread_id_chat_threads_id_fk";
