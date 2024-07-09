CREATE TABLE IF NOT EXISTS "rtc_cvs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rtc_msg" (
	"id" integer PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rtc_ptp" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "rtc_ptp_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rtc_ssion" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rtc_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"app_id" varchar(255) NOT NULL,
	"image_url" varchar(255),
	"email_verified" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "rtc_user_email_unique" UNIQUE("email"),
	CONSTRAINT "rtc_user_app_id_unique" UNIQUE("app_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rtc_vrf_t" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "rtc_vrf_t_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rtc_msg" ADD CONSTRAINT "rtc_msg_sender_id_rtc_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."rtc_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rtc_msg" ADD CONSTRAINT "rtc_msg_receiver_id_rtc_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."rtc_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rtc_ptp" ADD CONSTRAINT "rtc_ptp_conversation_id_rtc_cvs_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."rtc_cvs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rtc_ptp" ADD CONSTRAINT "rtc_ptp_user_id_rtc_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."rtc_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rtc_ssion" ADD CONSTRAINT "rtc_ssion_user_id_rtc_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."rtc_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
