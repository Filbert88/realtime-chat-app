DO $$ BEGIN
 ALTER TABLE "rtc_friends" ADD CONSTRAINT "rtc_friends_friend_app_id_rtc_user_app_id_fk" FOREIGN KEY ("friend_app_id") REFERENCES "public"."rtc_user"("app_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
