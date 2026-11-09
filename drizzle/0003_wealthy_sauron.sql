ALTER TABLE "tasks" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "tasks_user_project_order_idx" ON "tasks" USING btree ("user_id","discipline_project_id","order_index");