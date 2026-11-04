ALTER TABLE "projects" ADD COLUMN "desired_outcome" text;--> statement-breakpoint
CREATE INDEX "projects_user_idx" ON "projects" USING btree ("user_id");