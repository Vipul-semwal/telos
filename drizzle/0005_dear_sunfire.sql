CREATE TABLE "recall_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_yard_id" uuid NOT NULL,
	"card_type" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"prompt" text,
	"answer" text,
	"content" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recall_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"card_id" uuid NOT NULL,
	"occurrence_id" uuid,
	"result" varchar(20) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_yard_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_yard_id" uuid NOT NULL,
	"title" varchar(255),
	"content_html" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_yards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid NOT NULL,
	"tldr" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"destination" varchar(30) DEFAULT 'cockpit' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"source_id" uuid NOT NULL,
	"event_type" varchar(40) NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_occurrences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"schedule_id" uuid NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"source_id" uuid NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"snoozed_until" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"source_id" uuid NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"recurrence" jsonb NOT NULL,
	"end_at" timestamp with time zone,
	"occurrence_limit" integer,
	"occurrence_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"next_run_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"task_id" uuid,
	"project_id" uuid,
	"discipline_id" uuid,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recall_cards" ADD CONSTRAINT "recall_cards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_cards" ADD CONSTRAINT "recall_cards_task_yard_id_task_yards_id_fk" FOREIGN KEY ("task_yard_id") REFERENCES "public"."task_yards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_reviews" ADD CONSTRAINT "recall_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recall_reviews" ADD CONSTRAINT "recall_reviews_card_id_recall_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."recall_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_yard_notes" ADD CONSTRAINT "task_yard_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_yard_notes" ADD CONSTRAINT "task_yard_notes_task_yard_id_task_yards_id_fk" FOREIGN KEY ("task_yard_id") REFERENCES "public"."task_yards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_yards" ADD CONSTRAINT "task_yards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_yards" ADD CONSTRAINT "task_yards_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_occurrence_id_notification_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."notification_occurrences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_occurrences" ADD CONSTRAINT "notification_occurrences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_occurrences" ADD CONSTRAINT "notification_occurrences_schedule_id_notification_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."notification_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_schedules" ADD CONSTRAINT "notification_schedules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recall_cards_yard_status_idx" ON "recall_cards" USING btree ("task_yard_id","status");--> statement-breakpoint
CREATE INDEX "recall_cards_user_idx" ON "recall_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recall_reviews_card_idx" ON "recall_reviews" USING btree ("card_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "recall_reviews_user_idx" ON "recall_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_yard_notes_yard_idx" ON "task_yard_notes" USING btree ("task_yard_id","updated_at");--> statement-breakpoint
CREATE INDEX "task_yard_notes_user_idx" ON "task_yard_notes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_yards_user_task_unique" ON "task_yards" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE INDEX "task_yards_user_idx" ON "task_yards" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_deliveries_occurrence_destination_unique" ON "notification_deliveries" USING btree ("occurrence_id","destination");--> statement-breakpoint
CREATE INDEX "notification_deliveries_user_status_idx" ON "notification_deliveries" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "notification_history_source_idx" ON "notification_history" USING btree ("source_type","source_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_history_user_idx" ON "notification_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_occurrences_schedule_time_unique" ON "notification_occurrences" USING btree ("schedule_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "notification_occurrences_user_due_idx" ON "notification_occurrences" USING btree ("user_id","status","scheduled_for");--> statement-breakpoint
CREATE INDEX "notification_occurrences_source_idx" ON "notification_occurrences" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "notification_schedules_user_status_idx" ON "notification_schedules" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "notification_schedules_due_idx" ON "notification_schedules" USING btree ("status","next_run_at");--> statement-breakpoint
CREATE INDEX "notification_schedules_source_idx" ON "notification_schedules" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "notifications_user_status_idx" ON "notifications" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");