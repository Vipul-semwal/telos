ALTER TABLE "brain_dump_items" ADD COLUMN "kind" varchar(20);--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD COLUMN "discipline_id" uuid;--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD COLUMN "converted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD COLUMN "dismissed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD CONSTRAINT "brain_dump_items_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_dump_items" ADD CONSTRAINT "brain_dump_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brain_dump_user_created_idx" ON "brain_dump_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "brain_dump_user_kind_idx" ON "brain_dump_items" USING btree ("user_id","kind");