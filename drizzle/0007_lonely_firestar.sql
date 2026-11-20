CREATE TABLE "routine_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"routine_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"local_date" varchar(10) NOT NULL,
	"planned_duration_seconds" integer NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"failure_reason" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"routine_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"task_id" uuid NOT NULL,
	"planned_duration_seconds" integer DEFAULT 2700 NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "kind" varchar(20) DEFAULT 'one_off' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD COLUMN "source_type" varchar(20) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD COLUMN "routine_occurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "time_sessions" ADD COLUMN "routine_occurrence_id" uuid;--> statement-breakpoint
ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_variant_id_routine_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."routine_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_occurrences" ADD CONSTRAINT "routine_occurrences_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_variants" ADD CONSTRAINT "routine_variants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_variants" ADD CONSTRAINT "routine_variants_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_variants" ADD CONSTRAINT "routine_variants_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "routine_occurrences_routine_date_unique" ON "routine_occurrences" USING btree ("routine_id","local_date");--> statement-breakpoint
CREATE INDEX "routine_occurrences_user_date_idx" ON "routine_occurrences" USING btree ("user_id","local_date");--> statement-breakpoint
CREATE INDEX "routine_occurrences_status_idx" ON "routine_occurrences" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_variants_routine_weekday_unique" ON "routine_variants" USING btree ("routine_id","weekday");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_variants_task_unique" ON "routine_variants" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "routine_variants_user_idx" ON "routine_variants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "routines_user_status_idx" ON "routines" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "routines_project_idx" ON "routines" USING btree ("project_id");--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_routine_occurrence_id_routine_occurrences_id_fk" FOREIGN KEY ("routine_occurrence_id") REFERENCES "public"."routine_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_sessions" ADD CONSTRAINT "time_sessions_routine_occurrence_id_routine_occurrences_id_fk" FOREIGN KEY ("routine_occurrence_id") REFERENCES "public"."routine_occurrences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_plan_items_routine_occurrence_uniq" ON "daily_plan_items" USING btree ("routine_occurrence_id");