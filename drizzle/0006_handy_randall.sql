CREATE TABLE "data_seed_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"seed_key" varchar(100) NOT NULL,
	"metadata" jsonb,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_seed_runs" ADD CONSTRAINT "data_seed_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "data_seed_runs_user_seed_unique" ON "data_seed_runs" USING btree ("user_id","seed_key");--> statement-breakpoint
CREATE INDEX "data_seed_runs_user_idx" ON "data_seed_runs" USING btree ("user_id");