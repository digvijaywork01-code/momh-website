import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_editorial_split_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon', 'navy');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_icon_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_cta_arrow_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_cta_style" AS ENUM('arrow', 'filled-red', 'outlined');
  CREATE TYPE "public"."enum_pages_blocks_editorial_split_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_founder_quote_portrait_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_founder_quote_background_color" AS ENUM('cream', 'ivory');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_cards_cta_arrow_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_cards_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_card_grid_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum_pages_blocks_two_column_feature_background_color" AS ENUM('cream', 'ivory', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum_pages_blocks_two_column_feature_column_a_type" AS ENUM('promo', 'form', 'newsletter');
  CREATE TYPE "public"."enum_pages_blocks_two_column_feature_column_a_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_two_column_feature_column_b_type" AS ENUM('promo', 'form', 'newsletter');
  CREATE TYPE "public"."enum_pages_blocks_two_column_feature_column_b_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_image_banner_header_theme" AS ENUM('dark', 'light');
  CREATE TYPE "public"."enum_pages_blocks_image_banner_height" AS ENUM('screen', 'tall', 'medium', 'natural');
  CREATE TYPE "public"."enum_pages_blocks_section_intro_background_color" AS ENUM('cream', 'ivory', 'white', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum_pages_blocks_section_intro_cta_style" AS ENUM('filled-red', 'outlined', 'arrow');
  CREATE TYPE "public"."enum_pages_blocks_section_intro_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_visit_info_map_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_visit_info_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum_pages_blocks_carousel_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_carousel_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum_pages_blocks_carousel_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_faq_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum_pages_blocks_process_carousel_background_color" AS ENUM('cream', 'ivory', 'white', 'maroon', 'emerald', 'black');
  CREATE TYPE "public"."enum_pages_blocks_newsletter_feature_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_newsletter_feature_panel_background_color" AS ENUM('maroon', 'emerald', 'black', 'cream', 'ivory');
  CREATE TYPE "public"."enum_pages_blocks_consultation_form_background_color" AS ENUM('ivory', 'cream', 'white');
  CREATE TYPE "public"."enum_pages_blocks_contact_panel_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_contact_panel_panel_background_color" AS ENUM('maroon', 'emerald', 'black', 'cream', 'ivory');
  CREATE TYPE "public"."enum_pages_blocks_bullet_list_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_bullet_list_background_color" AS ENUM('ivory', 'cream', 'white');
  CREATE TYPE "public"."enum_pages_blocks_question_panel_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum_pages_blocks_question_panel_panel_background_color" AS ENUM('cream', 'ivory', 'maroon', 'emerald', 'black');
  CREATE TYPE "public"."enum_pages_blocks_question_panel_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_question_panel_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_appointment_form_background_color" AS ENUM('ivory', 'cream', 'white');
  CREATE TYPE "public"."enum_pages_blocks_appointment_form_faq_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_appointment_form_faq_link_appearance" AS ENUM('default');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon', 'navy');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_icon_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_cta_arrow_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_cta_style" AS ENUM('arrow', 'filled-red', 'outlined');
  CREATE TYPE "public"."enum__pages_v_blocks_editorial_split_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_founder_quote_portrait_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_founder_quote_background_color" AS ENUM('cream', 'ivory');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_cards_cta_arrow_position" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_cards_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_feature_background_color" AS ENUM('cream', 'ivory', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_feature_column_a_type" AS ENUM('promo', 'form', 'newsletter');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_feature_column_a_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_feature_column_b_type" AS ENUM('promo', 'form', 'newsletter');
  CREATE TYPE "public"."enum__pages_v_blocks_two_column_feature_column_b_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_image_banner_header_theme" AS ENUM('dark', 'light');
  CREATE TYPE "public"."enum__pages_v_blocks_image_banner_height" AS ENUM('screen', 'tall', 'medium', 'natural');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_background_color" AS ENUM('cream', 'ivory', 'white', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_cta_style" AS ENUM('filled-red', 'outlined', 'arrow');
  CREATE TYPE "public"."enum__pages_v_blocks_section_intro_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_visit_info_map_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_visit_info_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_cta_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_faq_background_color" AS ENUM('ivory', 'cream', 'black', 'emerald', 'maroon');
  CREATE TYPE "public"."enum__pages_v_blocks_process_carousel_background_color" AS ENUM('cream', 'ivory', 'white', 'maroon', 'emerald', 'black');
  CREATE TYPE "public"."enum__pages_v_blocks_newsletter_feature_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_newsletter_feature_panel_background_color" AS ENUM('maroon', 'emerald', 'black', 'cream', 'ivory');
  CREATE TYPE "public"."enum__pages_v_blocks_consultation_form_background_color" AS ENUM('ivory', 'cream', 'white');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_panel_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_panel_panel_background_color" AS ENUM('maroon', 'emerald', 'black', 'cream', 'ivory');
  CREATE TYPE "public"."enum__pages_v_blocks_bullet_list_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_bullet_list_background_color" AS ENUM('ivory', 'cream', 'white');
  CREATE TYPE "public"."enum__pages_v_blocks_question_panel_image_position" AS ENUM('left', 'right');
  CREATE TYPE "public"."enum__pages_v_blocks_question_panel_panel_background_color" AS ENUM('cream', 'ivory', 'maroon', 'emerald', 'black');
  CREATE TYPE "public"."enum__pages_v_blocks_question_panel_top_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_question_panel_bottom_spacing" AS ENUM('none', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_appointment_form_background_color" AS ENUM('ivory', 'cream', 'white');
  CREATE TYPE "public"."enum__pages_v_blocks_appointment_form_faq_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_appointment_form_faq_link_appearance" AS ENUM('default');
  CREATE TABLE "pages_blocks_hero_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_image_id" integer,
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"show_scroll_indicator" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_info_hero_info_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar
  );
  
  CREATE TABLE "pages_blocks_info_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_media_id" integer,
  	"overlay_darkness" numeric DEFAULT 40,
  	"headline" varchar,
  	"subline" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_editorial_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum_pages_blocks_editorial_split_image_position" DEFAULT 'right',
  	"background_color" "enum_pages_blocks_editorial_split_background_color" DEFAULT 'ivory',
  	"top_spacing" "enum_pages_blocks_editorial_split_top_spacing" DEFAULT 'none',
  	"bottom_spacing" "enum_pages_blocks_editorial_split_bottom_spacing" DEFAULT 'none',
  	"icon_position" "enum_pages_blocks_editorial_split_icon_position" DEFAULT 'left',
  	"icon_id" integer,
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"featured_line" jsonb,
  	"cta_label" varchar,
  	"cta_arrow_position" "enum_pages_blocks_editorial_split_cta_arrow_position" DEFAULT 'right',
  	"cta_style" "enum_pages_blocks_editorial_split_cta_style" DEFAULT 'arrow',
  	"cta_link_type" "enum_pages_blocks_editorial_split_cta_link_type" DEFAULT 'reference',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"contact_email" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_founder_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"portrait_id" integer,
  	"portrait_position" "enum_pages_blocks_founder_quote_portrait_position" DEFAULT 'left',
  	"icon_id" integer,
  	"eyebrow" varchar DEFAULT 'A Note By',
  	"title" varchar DEFAULT 'The Founder',
  	"quote" jsonb,
  	"signature_id" integer,
  	"attribution" varchar DEFAULT 'Sunita Shekhawat',
  	"attribution_role" varchar DEFAULT 'Museum Director & Founder',
  	"background_color" "enum_pages_blocks_founder_quote_background_color" DEFAULT 'cream',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"title" varchar,
  	"summary" varchar,
  	"cta_label" varchar,
  	"cta_arrow_position" "enum_pages_blocks_card_grid_cards_cta_arrow_position" DEFAULT 'right',
  	"cta_link_type" "enum_pages_blocks_card_grid_cards_cta_link_type" DEFAULT 'custom',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"columns" "enum_pages_blocks_card_grid_columns" DEFAULT '3',
  	"headline" jsonb,
  	"background_color" "enum_pages_blocks_card_grid_background_color" DEFAULT 'ivory',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_two_column_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "enum_pages_blocks_two_column_feature_background_color" DEFAULT 'cream',
  	"column_a_enabled" boolean DEFAULT true,
  	"column_a_type" "enum_pages_blocks_two_column_feature_column_a_type" DEFAULT 'promo',
  	"column_a_eyebrow" varchar,
  	"column_a_headline" jsonb,
  	"column_a_image_id" integer,
  	"column_a_body" jsonb,
  	"column_a_cta_label" varchar,
  	"column_a_cta_link_type" "enum_pages_blocks_two_column_feature_column_a_cta_link_type" DEFAULT 'reference',
  	"column_a_cta_link_new_tab" boolean,
  	"column_a_cta_link_url" varchar,
  	"column_a_embed_form_id" integer,
  	"column_a_newsletter_input_label" varchar DEFAULT 'Email Address:',
  	"column_a_newsletter_button_label" varchar DEFAULT 'SUBSCRIBE',
  	"column_a_newsletter_endpoint" varchar,
  	"column_b_enabled" boolean DEFAULT true,
  	"column_b_type" "enum_pages_blocks_two_column_feature_column_b_type" DEFAULT 'promo',
  	"column_b_eyebrow" varchar,
  	"column_b_headline" jsonb,
  	"column_b_image_id" integer,
  	"column_b_body" jsonb,
  	"column_b_cta_label" varchar,
  	"column_b_cta_link_type" "enum_pages_blocks_two_column_feature_column_b_cta_link_type" DEFAULT 'reference',
  	"column_b_cta_link_new_tab" boolean,
  	"column_b_cta_link_url" varchar,
  	"column_b_embed_form_id" integer,
  	"column_b_newsletter_input_label" varchar DEFAULT 'Email Address:',
  	"column_b_newsletter_button_label" varchar DEFAULT 'SUBSCRIBE',
  	"column_b_newsletter_endpoint" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"header_theme" "enum_pages_blocks_image_banner_header_theme" DEFAULT 'dark',
  	"height" "enum_pages_blocks_image_banner_height" DEFAULT 'screen',
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_section_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "enum_pages_blocks_section_intro_background_color" DEFAULT 'cream',
  	"show_top_divider" boolean DEFAULT false,
  	"tight_bottom" boolean DEFAULT false,
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_style" "enum_pages_blocks_section_intro_cta_style" DEFAULT 'filled-red',
  	"cta_link_type" "enum_pages_blocks_section_intro_cta_link_type" DEFAULT 'reference',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_visit_info_ctas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_visit_info_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" varchar,
  	"hours" varchar,
  	"is_closed" boolean DEFAULT false
  );
  
  CREATE TABLE "pages_blocks_visit_info" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"map_position" "enum_pages_blocks_visit_info_map_position" DEFAULT 'left',
  	"background_color" "enum_pages_blocks_visit_info_background_color" DEFAULT 'ivory',
  	"map_image_id" integer,
  	"map_image_link" varchar,
  	"headline" jsonb,
  	"address" jsonb,
  	"helper_text" varchar,
  	"contact_email" varchar,
  	"hours_note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_position" "enum_pages_blocks_carousel_image_position" DEFAULT 'right',
  	"background_color" "enum_pages_blocks_carousel_background_color" DEFAULT 'ivory',
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_link_type" "enum_pages_blocks_carousel_cta_link_type" DEFAULT 'reference',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"slides_per_view" numeric DEFAULT 1.15,
  	"autoplay" boolean DEFAULT true,
  	"autoplay_interval" numeric DEFAULT 4000,
  	"note_panel_enabled" boolean DEFAULT false,
  	"note_panel_eyebrow" varchar,
  	"note_panel_body" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "enum_pages_blocks_faq_background_color" DEFAULT 'ivory',
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"intro" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_process_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"step_label" varchar,
  	"body" jsonb
  );
  
  CREATE TABLE "pages_blocks_process_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "enum_pages_blocks_process_carousel_background_color" DEFAULT 'cream',
  	"autoplay" boolean DEFAULT true,
  	"autoplay_interval" numeric DEFAULT 5000,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_newsletter_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum_pages_blocks_newsletter_feature_image_position" DEFAULT 'left',
  	"panel_background_color" "enum_pages_blocks_newsletter_feature_panel_background_color" DEFAULT 'maroon',
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"input_label" varchar DEFAULT 'Email Address:',
  	"button_label" varchar DEFAULT 'SUBSCRIBE',
  	"endpoint" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_consultation_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"submit_label" varchar DEFAULT 'Submit Enquiry',
  	"endpoint" varchar,
  	"success_redirect" varchar DEFAULT '/thank-you',
  	"success_message" varchar,
  	"background_color" "enum_pages_blocks_consultation_form_background_color" DEFAULT 'ivory',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_panel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum_pages_blocks_contact_panel_image_position" DEFAULT 'left',
  	"panel_background_color" "enum_pages_blocks_contact_panel_panel_background_color" DEFAULT 'maroon',
  	"show_logo" boolean DEFAULT true,
  	"headline" jsonb,
  	"body" jsonb,
  	"address" jsonb,
  	"phone" varchar,
  	"email" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_bullet_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb
  );
  
  CREATE TABLE "pages_blocks_bullet_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_position" "enum_pages_blocks_bullet_list_image_position" DEFAULT 'right',
  	"background_color" "enum_pages_blocks_bullet_list_background_color" DEFAULT 'ivory',
  	"image_id" integer,
  	"eyebrow" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_question_panel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum_pages_blocks_question_panel_image_position" DEFAULT 'left',
  	"panel_background_color" "enum_pages_blocks_question_panel_panel_background_color" DEFAULT 'cream',
  	"top_spacing" "enum_pages_blocks_question_panel_top_spacing" DEFAULT 'none',
  	"bottom_spacing" "enum_pages_blocks_question_panel_bottom_spacing" DEFAULT 'none',
  	"icon_id" integer,
  	"headline" jsonb,
  	"body" jsonb,
  	"email" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_appointment_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"submit_label" varchar DEFAULT 'Book An Appointment',
  	"endpoint" varchar,
  	"success_redirect" varchar DEFAULT '/thank-you',
  	"success_message" varchar,
  	"background_color" "enum_pages_blocks_appointment_form_background_color" DEFAULT 'ivory',
  	"faq_link_type" "enum_pages_blocks_appointment_form_faq_link_type" DEFAULT 'custom',
  	"faq_link_url" varchar DEFAULT '/faq',
  	"faq_link_new_tab" boolean DEFAULT false,
  	"faq_link_appearance" "enum_pages_blocks_appointment_form_faq_link_appearance" DEFAULT 'default',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_image_id" integer,
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"show_scroll_indicator" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_info_hero_info_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_info_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_media_id" integer,
  	"overlay_darkness" numeric DEFAULT 40,
  	"headline" varchar,
  	"subline" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_editorial_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum__pages_v_blocks_editorial_split_image_position" DEFAULT 'right',
  	"background_color" "enum__pages_v_blocks_editorial_split_background_color" DEFAULT 'ivory',
  	"top_spacing" "enum__pages_v_blocks_editorial_split_top_spacing" DEFAULT 'none',
  	"bottom_spacing" "enum__pages_v_blocks_editorial_split_bottom_spacing" DEFAULT 'none',
  	"icon_position" "enum__pages_v_blocks_editorial_split_icon_position" DEFAULT 'left',
  	"icon_id" integer,
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"featured_line" jsonb,
  	"cta_label" varchar,
  	"cta_arrow_position" "enum__pages_v_blocks_editorial_split_cta_arrow_position" DEFAULT 'right',
  	"cta_style" "enum__pages_v_blocks_editorial_split_cta_style" DEFAULT 'arrow',
  	"cta_link_type" "enum__pages_v_blocks_editorial_split_cta_link_type" DEFAULT 'reference',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"contact_email" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_founder_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"portrait_id" integer,
  	"portrait_position" "enum__pages_v_blocks_founder_quote_portrait_position" DEFAULT 'left',
  	"icon_id" integer,
  	"eyebrow" varchar DEFAULT 'A Note By',
  	"title" varchar DEFAULT 'The Founder',
  	"quote" jsonb,
  	"signature_id" integer,
  	"attribution" varchar DEFAULT 'Sunita Shekhawat',
  	"attribution_role" varchar DEFAULT 'Museum Director & Founder',
  	"background_color" "enum__pages_v_blocks_founder_quote_background_color" DEFAULT 'cream',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_card_grid_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"title" varchar,
  	"summary" varchar,
  	"cta_label" varchar,
  	"cta_arrow_position" "enum__pages_v_blocks_card_grid_cards_cta_arrow_position" DEFAULT 'right',
  	"cta_link_type" "enum__pages_v_blocks_card_grid_cards_cta_link_type" DEFAULT 'custom',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_card_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"columns" "enum__pages_v_blocks_card_grid_columns" DEFAULT '3',
  	"headline" jsonb,
  	"background_color" "enum__pages_v_blocks_card_grid_background_color" DEFAULT 'ivory',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_two_column_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_color" "enum__pages_v_blocks_two_column_feature_background_color" DEFAULT 'cream',
  	"column_a_enabled" boolean DEFAULT true,
  	"column_a_type" "enum__pages_v_blocks_two_column_feature_column_a_type" DEFAULT 'promo',
  	"column_a_eyebrow" varchar,
  	"column_a_headline" jsonb,
  	"column_a_image_id" integer,
  	"column_a_body" jsonb,
  	"column_a_cta_label" varchar,
  	"column_a_cta_link_type" "enum__pages_v_blocks_two_column_feature_column_a_cta_link_type" DEFAULT 'reference',
  	"column_a_cta_link_new_tab" boolean,
  	"column_a_cta_link_url" varchar,
  	"column_a_embed_form_id" integer,
  	"column_a_newsletter_input_label" varchar DEFAULT 'Email Address:',
  	"column_a_newsletter_button_label" varchar DEFAULT 'SUBSCRIBE',
  	"column_a_newsletter_endpoint" varchar,
  	"column_b_enabled" boolean DEFAULT true,
  	"column_b_type" "enum__pages_v_blocks_two_column_feature_column_b_type" DEFAULT 'promo',
  	"column_b_eyebrow" varchar,
  	"column_b_headline" jsonb,
  	"column_b_image_id" integer,
  	"column_b_body" jsonb,
  	"column_b_cta_label" varchar,
  	"column_b_cta_link_type" "enum__pages_v_blocks_two_column_feature_column_b_cta_link_type" DEFAULT 'reference',
  	"column_b_cta_link_new_tab" boolean,
  	"column_b_cta_link_url" varchar,
  	"column_b_embed_form_id" integer,
  	"column_b_newsletter_input_label" varchar DEFAULT 'Email Address:',
  	"column_b_newsletter_button_label" varchar DEFAULT 'SUBSCRIBE',
  	"column_b_newsletter_endpoint" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"header_theme" "enum__pages_v_blocks_image_banner_header_theme" DEFAULT 'dark',
  	"height" "enum__pages_v_blocks_image_banner_height" DEFAULT 'screen',
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_section_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_color" "enum__pages_v_blocks_section_intro_background_color" DEFAULT 'cream',
  	"show_top_divider" boolean DEFAULT false,
  	"tight_bottom" boolean DEFAULT false,
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_style" "enum__pages_v_blocks_section_intro_cta_style" DEFAULT 'filled-red',
  	"cta_link_type" "enum__pages_v_blocks_section_intro_cta_link_type" DEFAULT 'reference',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_visit_info_ctas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"new_tab" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_visit_info_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" varchar,
  	"hours" varchar,
  	"is_closed" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_visit_info" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"map_position" "enum__pages_v_blocks_visit_info_map_position" DEFAULT 'left',
  	"background_color" "enum__pages_v_blocks_visit_info_background_color" DEFAULT 'ivory',
  	"map_image_id" integer,
  	"map_image_link" varchar,
  	"headline" jsonb,
  	"address" jsonb,
  	"helper_text" varchar,
  	"contact_email" varchar,
  	"hours_note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"alt" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_position" "enum__pages_v_blocks_carousel_image_position" DEFAULT 'right',
  	"background_color" "enum__pages_v_blocks_carousel_background_color" DEFAULT 'ivory',
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"cta_label" varchar,
  	"cta_link_type" "enum__pages_v_blocks_carousel_cta_link_type" DEFAULT 'reference',
  	"cta_link_new_tab" boolean,
  	"cta_link_url" varchar,
  	"slides_per_view" numeric DEFAULT 1.15,
  	"autoplay" boolean DEFAULT true,
  	"autoplay_interval" numeric DEFAULT 4000,
  	"note_panel_enabled" boolean DEFAULT false,
  	"note_panel_eyebrow" varchar,
  	"note_panel_body" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_color" "enum__pages_v_blocks_faq_background_color" DEFAULT 'ivory',
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"intro" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_process_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"step_label" varchar,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_process_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_color" "enum__pages_v_blocks_process_carousel_background_color" DEFAULT 'cream',
  	"autoplay" boolean DEFAULT true,
  	"autoplay_interval" numeric DEFAULT 5000,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_newsletter_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum__pages_v_blocks_newsletter_feature_image_position" DEFAULT 'left',
  	"panel_background_color" "enum__pages_v_blocks_newsletter_feature_panel_background_color" DEFAULT 'maroon',
  	"eyebrow" varchar,
  	"headline" jsonb,
  	"body" jsonb,
  	"input_label" varchar DEFAULT 'Email Address:',
  	"button_label" varchar DEFAULT 'SUBSCRIBE',
  	"endpoint" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_consultation_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"submit_label" varchar DEFAULT 'Submit Enquiry',
  	"endpoint" varchar,
  	"success_redirect" varchar DEFAULT '/thank-you',
  	"success_message" varchar,
  	"background_color" "enum__pages_v_blocks_consultation_form_background_color" DEFAULT 'ivory',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_panel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum__pages_v_blocks_contact_panel_image_position" DEFAULT 'left',
  	"panel_background_color" "enum__pages_v_blocks_contact_panel_panel_background_color" DEFAULT 'maroon',
  	"show_logo" boolean DEFAULT true,
  	"headline" jsonb,
  	"body" jsonb,
  	"address" jsonb,
  	"phone" varchar,
  	"email" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_bullet_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_bullet_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_position" "enum__pages_v_blocks_bullet_list_image_position" DEFAULT 'right',
  	"background_color" "enum__pages_v_blocks_bullet_list_background_color" DEFAULT 'ivory',
  	"image_id" integer,
  	"eyebrow" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_question_panel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_position" "enum__pages_v_blocks_question_panel_image_position" DEFAULT 'left',
  	"panel_background_color" "enum__pages_v_blocks_question_panel_panel_background_color" DEFAULT 'cream',
  	"top_spacing" "enum__pages_v_blocks_question_panel_top_spacing" DEFAULT 'none',
  	"bottom_spacing" "enum__pages_v_blocks_question_panel_bottom_spacing" DEFAULT 'none',
  	"icon_id" integer,
  	"headline" jsonb,
  	"body" jsonb,
  	"email" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_appointment_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"submit_label" varchar DEFAULT 'Book An Appointment',
  	"endpoint" varchar,
  	"success_redirect" varchar DEFAULT '/thank-you',
  	"success_message" varchar,
  	"background_color" "enum__pages_v_blocks_appointment_form_background_color" DEFAULT 'ivory',
  	"faq_link_type" "enum__pages_v_blocks_appointment_form_faq_link_type" DEFAULT 'custom',
  	"faq_link_url" varchar DEFAULT '/faq',
  	"faq_link_new_tab" boolean DEFAULT false,
  	"faq_link_appearance" "enum__pages_v_blocks_appointment_form_faq_link_appearance" DEFAULT 'default',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_hero_block" ADD CONSTRAINT "pages_blocks_hero_block_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_block" ADD CONSTRAINT "pages_blocks_hero_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_info_hero_info_cards" ADD CONSTRAINT "pages_blocks_info_hero_info_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_info_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_info_hero" ADD CONSTRAINT "pages_blocks_info_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_info_hero" ADD CONSTRAINT "pages_blocks_info_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_editorial_split" ADD CONSTRAINT "pages_blocks_editorial_split_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_editorial_split" ADD CONSTRAINT "pages_blocks_editorial_split_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_editorial_split" ADD CONSTRAINT "pages_blocks_editorial_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_founder_quote" ADD CONSTRAINT "pages_blocks_founder_quote_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_founder_quote" ADD CONSTRAINT "pages_blocks_founder_quote_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_founder_quote" ADD CONSTRAINT "pages_blocks_founder_quote_signature_id_media_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_founder_quote" ADD CONSTRAINT "pages_blocks_founder_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid_cards" ADD CONSTRAINT "pages_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_card_grid" ADD CONSTRAINT "pages_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column_feature" ADD CONSTRAINT "pages_blocks_two_column_feature_column_a_image_id_media_id_fk" FOREIGN KEY ("column_a_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column_feature" ADD CONSTRAINT "pages_blocks_two_column_feature_column_a_embed_form_id_forms_id_fk" FOREIGN KEY ("column_a_embed_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column_feature" ADD CONSTRAINT "pages_blocks_two_column_feature_column_b_image_id_media_id_fk" FOREIGN KEY ("column_b_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column_feature" ADD CONSTRAINT "pages_blocks_two_column_feature_column_b_embed_form_id_forms_id_fk" FOREIGN KEY ("column_b_embed_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_two_column_feature" ADD CONSTRAINT "pages_blocks_two_column_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_banner" ADD CONSTRAINT "pages_blocks_image_banner_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_banner" ADD CONSTRAINT "pages_blocks_image_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section_intro" ADD CONSTRAINT "pages_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_visit_info_ctas" ADD CONSTRAINT "pages_blocks_visit_info_ctas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_visit_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_visit_info_hours" ADD CONSTRAINT "pages_blocks_visit_info_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_visit_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_visit_info" ADD CONSTRAINT "pages_blocks_visit_info_map_image_id_media_id_fk" FOREIGN KEY ("map_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_visit_info" ADD CONSTRAINT "pages_blocks_visit_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_images" ADD CONSTRAINT "pages_blocks_carousel_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_images" ADD CONSTRAINT "pages_blocks_carousel_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel" ADD CONSTRAINT "pages_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_carousel_slides" ADD CONSTRAINT "pages_blocks_process_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_carousel_slides" ADD CONSTRAINT "pages_blocks_process_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_process_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_carousel" ADD CONSTRAINT "pages_blocks_process_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_newsletter_feature" ADD CONSTRAINT "pages_blocks_newsletter_feature_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_newsletter_feature" ADD CONSTRAINT "pages_blocks_newsletter_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_consultation_form" ADD CONSTRAINT "pages_blocks_consultation_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_panel" ADD CONSTRAINT "pages_blocks_contact_panel_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_panel" ADD CONSTRAINT "pages_blocks_contact_panel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bullet_list_items" ADD CONSTRAINT "pages_blocks_bullet_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bullet_list" ADD CONSTRAINT "pages_blocks_bullet_list_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_bullet_list" ADD CONSTRAINT "pages_blocks_bullet_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_question_panel" ADD CONSTRAINT "pages_blocks_question_panel_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_question_panel" ADD CONSTRAINT "pages_blocks_question_panel_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_question_panel" ADD CONSTRAINT "pages_blocks_question_panel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_appointment_form" ADD CONSTRAINT "pages_blocks_appointment_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_block" ADD CONSTRAINT "_pages_v_blocks_hero_block_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_block" ADD CONSTRAINT "_pages_v_blocks_hero_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_info_hero_info_cards" ADD CONSTRAINT "_pages_v_blocks_info_hero_info_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_info_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_info_hero" ADD CONSTRAINT "_pages_v_blocks_info_hero_background_media_id_media_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_info_hero" ADD CONSTRAINT "_pages_v_blocks_info_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_editorial_split" ADD CONSTRAINT "_pages_v_blocks_editorial_split_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_editorial_split" ADD CONSTRAINT "_pages_v_blocks_editorial_split_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_editorial_split" ADD CONSTRAINT "_pages_v_blocks_editorial_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_founder_quote" ADD CONSTRAINT "_pages_v_blocks_founder_quote_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_founder_quote" ADD CONSTRAINT "_pages_v_blocks_founder_quote_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_founder_quote" ADD CONSTRAINT "_pages_v_blocks_founder_quote_signature_id_media_id_fk" FOREIGN KEY ("signature_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_founder_quote" ADD CONSTRAINT "_pages_v_blocks_founder_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ADD CONSTRAINT "_pages_v_blocks_card_grid_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_card_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_card_grid" ADD CONSTRAINT "_pages_v_blocks_card_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column_feature" ADD CONSTRAINT "_pages_v_blocks_two_column_feature_column_a_image_id_media_id_fk" FOREIGN KEY ("column_a_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column_feature" ADD CONSTRAINT "_pages_v_blocks_two_column_feature_column_a_embed_form_id_forms_id_fk" FOREIGN KEY ("column_a_embed_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column_feature" ADD CONSTRAINT "_pages_v_blocks_two_column_feature_column_b_image_id_media_id_fk" FOREIGN KEY ("column_b_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column_feature" ADD CONSTRAINT "_pages_v_blocks_two_column_feature_column_b_embed_form_id_forms_id_fk" FOREIGN KEY ("column_b_embed_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_two_column_feature" ADD CONSTRAINT "_pages_v_blocks_two_column_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_banner" ADD CONSTRAINT "_pages_v_blocks_image_banner_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_banner" ADD CONSTRAINT "_pages_v_blocks_image_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section_intro" ADD CONSTRAINT "_pages_v_blocks_section_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visit_info_ctas" ADD CONSTRAINT "_pages_v_blocks_visit_info_ctas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_visit_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visit_info_hours" ADD CONSTRAINT "_pages_v_blocks_visit_info_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_visit_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visit_info" ADD CONSTRAINT "_pages_v_blocks_visit_info_map_image_id_media_id_fk" FOREIGN KEY ("map_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_visit_info" ADD CONSTRAINT "_pages_v_blocks_visit_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_images" ADD CONSTRAINT "_pages_v_blocks_carousel_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_images" ADD CONSTRAINT "_pages_v_blocks_carousel_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel" ADD CONSTRAINT "_pages_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_process_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_process_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_process_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_carousel" ADD CONSTRAINT "_pages_v_blocks_process_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_newsletter_feature" ADD CONSTRAINT "_pages_v_blocks_newsletter_feature_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_newsletter_feature" ADD CONSTRAINT "_pages_v_blocks_newsletter_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_consultation_form" ADD CONSTRAINT "_pages_v_blocks_consultation_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_panel" ADD CONSTRAINT "_pages_v_blocks_contact_panel_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_panel" ADD CONSTRAINT "_pages_v_blocks_contact_panel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bullet_list_items" ADD CONSTRAINT "_pages_v_blocks_bullet_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bullet_list" ADD CONSTRAINT "_pages_v_blocks_bullet_list_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bullet_list" ADD CONSTRAINT "_pages_v_blocks_bullet_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_question_panel" ADD CONSTRAINT "_pages_v_blocks_question_panel_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_question_panel" ADD CONSTRAINT "_pages_v_blocks_question_panel_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_question_panel" ADD CONSTRAINT "_pages_v_blocks_question_panel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_appointment_form" ADD CONSTRAINT "_pages_v_blocks_appointment_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_block_order_idx" ON "pages_blocks_hero_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_block_parent_id_idx" ON "pages_blocks_hero_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_block_path_idx" ON "pages_blocks_hero_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_block_background_image_idx" ON "pages_blocks_hero_block" USING btree ("background_image_id");
  CREATE INDEX "pages_blocks_info_hero_info_cards_order_idx" ON "pages_blocks_info_hero_info_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_info_hero_info_cards_parent_id_idx" ON "pages_blocks_info_hero_info_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_info_hero_order_idx" ON "pages_blocks_info_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_info_hero_parent_id_idx" ON "pages_blocks_info_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_info_hero_path_idx" ON "pages_blocks_info_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_info_hero_background_media_idx" ON "pages_blocks_info_hero" USING btree ("background_media_id");
  CREATE INDEX "pages_blocks_editorial_split_order_idx" ON "pages_blocks_editorial_split" USING btree ("_order");
  CREATE INDEX "pages_blocks_editorial_split_parent_id_idx" ON "pages_blocks_editorial_split" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_editorial_split_path_idx" ON "pages_blocks_editorial_split" USING btree ("_path");
  CREATE INDEX "pages_blocks_editorial_split_image_idx" ON "pages_blocks_editorial_split" USING btree ("image_id");
  CREATE INDEX "pages_blocks_editorial_split_icon_idx" ON "pages_blocks_editorial_split" USING btree ("icon_id");
  CREATE INDEX "pages_blocks_founder_quote_order_idx" ON "pages_blocks_founder_quote" USING btree ("_order");
  CREATE INDEX "pages_blocks_founder_quote_parent_id_idx" ON "pages_blocks_founder_quote" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_founder_quote_path_idx" ON "pages_blocks_founder_quote" USING btree ("_path");
  CREATE INDEX "pages_blocks_founder_quote_portrait_idx" ON "pages_blocks_founder_quote" USING btree ("portrait_id");
  CREATE INDEX "pages_blocks_founder_quote_icon_idx" ON "pages_blocks_founder_quote" USING btree ("icon_id");
  CREATE INDEX "pages_blocks_founder_quote_signature_idx" ON "pages_blocks_founder_quote" USING btree ("signature_id");
  CREATE INDEX "pages_blocks_card_grid_cards_order_idx" ON "pages_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_cards_parent_id_idx" ON "pages_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_cards_image_idx" ON "pages_blocks_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_card_grid_order_idx" ON "pages_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_card_grid_parent_id_idx" ON "pages_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_grid_path_idx" ON "pages_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_two_column_feature_order_idx" ON "pages_blocks_two_column_feature" USING btree ("_order");
  CREATE INDEX "pages_blocks_two_column_feature_parent_id_idx" ON "pages_blocks_two_column_feature" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_two_column_feature_path_idx" ON "pages_blocks_two_column_feature" USING btree ("_path");
  CREATE INDEX "pages_blocks_two_column_feature_column_a_column_a_image_idx" ON "pages_blocks_two_column_feature" USING btree ("column_a_image_id");
  CREATE INDEX "pages_blocks_two_column_feature_column_a_column_a_embed_form_idx" ON "pages_blocks_two_column_feature" USING btree ("column_a_embed_form_id");
  CREATE INDEX "pages_blocks_two_column_feature_column_b_column_b_image_idx" ON "pages_blocks_two_column_feature" USING btree ("column_b_image_id");
  CREATE INDEX "pages_blocks_two_column_feature_column_b_column_b_embed_form_idx" ON "pages_blocks_two_column_feature" USING btree ("column_b_embed_form_id");
  CREATE INDEX "pages_blocks_image_banner_order_idx" ON "pages_blocks_image_banner" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_banner_parent_id_idx" ON "pages_blocks_image_banner" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_banner_path_idx" ON "pages_blocks_image_banner" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_banner_image_idx" ON "pages_blocks_image_banner" USING btree ("image_id");
  CREATE INDEX "pages_blocks_section_intro_order_idx" ON "pages_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_intro_parent_id_idx" ON "pages_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_intro_path_idx" ON "pages_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_visit_info_ctas_order_idx" ON "pages_blocks_visit_info_ctas" USING btree ("_order");
  CREATE INDEX "pages_blocks_visit_info_ctas_parent_id_idx" ON "pages_blocks_visit_info_ctas" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_visit_info_hours_order_idx" ON "pages_blocks_visit_info_hours" USING btree ("_order");
  CREATE INDEX "pages_blocks_visit_info_hours_parent_id_idx" ON "pages_blocks_visit_info_hours" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_visit_info_order_idx" ON "pages_blocks_visit_info" USING btree ("_order");
  CREATE INDEX "pages_blocks_visit_info_parent_id_idx" ON "pages_blocks_visit_info" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_visit_info_path_idx" ON "pages_blocks_visit_info" USING btree ("_path");
  CREATE INDEX "pages_blocks_visit_info_map_image_idx" ON "pages_blocks_visit_info" USING btree ("map_image_id");
  CREATE INDEX "pages_blocks_carousel_images_order_idx" ON "pages_blocks_carousel_images" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel_images_parent_id_idx" ON "pages_blocks_carousel_images" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel_images_image_idx" ON "pages_blocks_carousel_images" USING btree ("image_id");
  CREATE INDEX "pages_blocks_carousel_order_idx" ON "pages_blocks_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel_parent_id_idx" ON "pages_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel_path_idx" ON "pages_blocks_carousel" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_process_carousel_slides_order_idx" ON "pages_blocks_process_carousel_slides" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_carousel_slides_parent_id_idx" ON "pages_blocks_process_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_carousel_slides_image_idx" ON "pages_blocks_process_carousel_slides" USING btree ("image_id");
  CREATE INDEX "pages_blocks_process_carousel_order_idx" ON "pages_blocks_process_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_carousel_parent_id_idx" ON "pages_blocks_process_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_carousel_path_idx" ON "pages_blocks_process_carousel" USING btree ("_path");
  CREATE INDEX "pages_blocks_newsletter_feature_order_idx" ON "pages_blocks_newsletter_feature" USING btree ("_order");
  CREATE INDEX "pages_blocks_newsletter_feature_parent_id_idx" ON "pages_blocks_newsletter_feature" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_newsletter_feature_path_idx" ON "pages_blocks_newsletter_feature" USING btree ("_path");
  CREATE INDEX "pages_blocks_newsletter_feature_image_idx" ON "pages_blocks_newsletter_feature" USING btree ("image_id");
  CREATE INDEX "pages_blocks_consultation_form_order_idx" ON "pages_blocks_consultation_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_consultation_form_parent_id_idx" ON "pages_blocks_consultation_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_consultation_form_path_idx" ON "pages_blocks_consultation_form" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_panel_order_idx" ON "pages_blocks_contact_panel" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_panel_parent_id_idx" ON "pages_blocks_contact_panel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_panel_path_idx" ON "pages_blocks_contact_panel" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_panel_image_idx" ON "pages_blocks_contact_panel" USING btree ("image_id");
  CREATE INDEX "pages_blocks_bullet_list_items_order_idx" ON "pages_blocks_bullet_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_bullet_list_items_parent_id_idx" ON "pages_blocks_bullet_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bullet_list_order_idx" ON "pages_blocks_bullet_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_bullet_list_parent_id_idx" ON "pages_blocks_bullet_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bullet_list_path_idx" ON "pages_blocks_bullet_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_bullet_list_image_idx" ON "pages_blocks_bullet_list" USING btree ("image_id");
  CREATE INDEX "pages_blocks_question_panel_order_idx" ON "pages_blocks_question_panel" USING btree ("_order");
  CREATE INDEX "pages_blocks_question_panel_parent_id_idx" ON "pages_blocks_question_panel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_question_panel_path_idx" ON "pages_blocks_question_panel" USING btree ("_path");
  CREATE INDEX "pages_blocks_question_panel_image_idx" ON "pages_blocks_question_panel" USING btree ("image_id");
  CREATE INDEX "pages_blocks_question_panel_icon_idx" ON "pages_blocks_question_panel" USING btree ("icon_id");
  CREATE INDEX "pages_blocks_appointment_form_order_idx" ON "pages_blocks_appointment_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_appointment_form_parent_id_idx" ON "pages_blocks_appointment_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_appointment_form_path_idx" ON "pages_blocks_appointment_form" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_block_order_idx" ON "_pages_v_blocks_hero_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_block_parent_id_idx" ON "_pages_v_blocks_hero_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_block_path_idx" ON "_pages_v_blocks_hero_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_block_background_image_idx" ON "_pages_v_blocks_hero_block" USING btree ("background_image_id");
  CREATE INDEX "_pages_v_blocks_info_hero_info_cards_order_idx" ON "_pages_v_blocks_info_hero_info_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_info_hero_info_cards_parent_id_idx" ON "_pages_v_blocks_info_hero_info_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_info_hero_order_idx" ON "_pages_v_blocks_info_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_info_hero_parent_id_idx" ON "_pages_v_blocks_info_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_info_hero_path_idx" ON "_pages_v_blocks_info_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_info_hero_background_media_idx" ON "_pages_v_blocks_info_hero" USING btree ("background_media_id");
  CREATE INDEX "_pages_v_blocks_editorial_split_order_idx" ON "_pages_v_blocks_editorial_split" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_editorial_split_parent_id_idx" ON "_pages_v_blocks_editorial_split" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_editorial_split_path_idx" ON "_pages_v_blocks_editorial_split" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_editorial_split_image_idx" ON "_pages_v_blocks_editorial_split" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_editorial_split_icon_idx" ON "_pages_v_blocks_editorial_split" USING btree ("icon_id");
  CREATE INDEX "_pages_v_blocks_founder_quote_order_idx" ON "_pages_v_blocks_founder_quote" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_founder_quote_parent_id_idx" ON "_pages_v_blocks_founder_quote" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_founder_quote_path_idx" ON "_pages_v_blocks_founder_quote" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_founder_quote_portrait_idx" ON "_pages_v_blocks_founder_quote" USING btree ("portrait_id");
  CREATE INDEX "_pages_v_blocks_founder_quote_icon_idx" ON "_pages_v_blocks_founder_quote" USING btree ("icon_id");
  CREATE INDEX "_pages_v_blocks_founder_quote_signature_idx" ON "_pages_v_blocks_founder_quote" USING btree ("signature_id");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_order_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_parent_id_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_cards_image_idx" ON "_pages_v_blocks_card_grid_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_card_grid_order_idx" ON "_pages_v_blocks_card_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_grid_parent_id_idx" ON "_pages_v_blocks_card_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_grid_path_idx" ON "_pages_v_blocks_card_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_two_column_feature_order_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_two_column_feature_parent_id_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_two_column_feature_path_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_two_column_feature_column_a_column_a_image_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("column_a_image_id");
  CREATE INDEX "_pages_v_blocks_two_column_feature_column_a_column_a_embed_form_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("column_a_embed_form_id");
  CREATE INDEX "_pages_v_blocks_two_column_feature_column_b_column_b_image_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("column_b_image_id");
  CREATE INDEX "_pages_v_blocks_two_column_feature_column_b_column_b_embed_form_idx" ON "_pages_v_blocks_two_column_feature" USING btree ("column_b_embed_form_id");
  CREATE INDEX "_pages_v_blocks_image_banner_order_idx" ON "_pages_v_blocks_image_banner" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_banner_parent_id_idx" ON "_pages_v_blocks_image_banner" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_banner_path_idx" ON "_pages_v_blocks_image_banner" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_banner_image_idx" ON "_pages_v_blocks_image_banner" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_section_intro_order_idx" ON "_pages_v_blocks_section_intro" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_section_intro_parent_id_idx" ON "_pages_v_blocks_section_intro" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_intro_path_idx" ON "_pages_v_blocks_section_intro" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_visit_info_ctas_order_idx" ON "_pages_v_blocks_visit_info_ctas" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_visit_info_ctas_parent_id_idx" ON "_pages_v_blocks_visit_info_ctas" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_visit_info_hours_order_idx" ON "_pages_v_blocks_visit_info_hours" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_visit_info_hours_parent_id_idx" ON "_pages_v_blocks_visit_info_hours" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_visit_info_order_idx" ON "_pages_v_blocks_visit_info" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_visit_info_parent_id_idx" ON "_pages_v_blocks_visit_info" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_visit_info_path_idx" ON "_pages_v_blocks_visit_info" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_visit_info_map_image_idx" ON "_pages_v_blocks_visit_info" USING btree ("map_image_id");
  CREATE INDEX "_pages_v_blocks_carousel_images_order_idx" ON "_pages_v_blocks_carousel_images" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel_images_parent_id_idx" ON "_pages_v_blocks_carousel_images" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel_images_image_idx" ON "_pages_v_blocks_carousel_images" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_carousel_order_idx" ON "_pages_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel_parent_id_idx" ON "_pages_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel_path_idx" ON "_pages_v_blocks_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_process_carousel_slides_order_idx" ON "_pages_v_blocks_process_carousel_slides" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_carousel_slides_parent_id_idx" ON "_pages_v_blocks_process_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_carousel_slides_image_idx" ON "_pages_v_blocks_process_carousel_slides" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_process_carousel_order_idx" ON "_pages_v_blocks_process_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_carousel_parent_id_idx" ON "_pages_v_blocks_process_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_carousel_path_idx" ON "_pages_v_blocks_process_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_newsletter_feature_order_idx" ON "_pages_v_blocks_newsletter_feature" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_newsletter_feature_parent_id_idx" ON "_pages_v_blocks_newsletter_feature" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_newsletter_feature_path_idx" ON "_pages_v_blocks_newsletter_feature" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_newsletter_feature_image_idx" ON "_pages_v_blocks_newsletter_feature" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_consultation_form_order_idx" ON "_pages_v_blocks_consultation_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_consultation_form_parent_id_idx" ON "_pages_v_blocks_consultation_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_consultation_form_path_idx" ON "_pages_v_blocks_consultation_form" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_panel_order_idx" ON "_pages_v_blocks_contact_panel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_panel_parent_id_idx" ON "_pages_v_blocks_contact_panel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_panel_path_idx" ON "_pages_v_blocks_contact_panel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_panel_image_idx" ON "_pages_v_blocks_contact_panel" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_bullet_list_items_order_idx" ON "_pages_v_blocks_bullet_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_bullet_list_items_parent_id_idx" ON "_pages_v_blocks_bullet_list_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_bullet_list_order_idx" ON "_pages_v_blocks_bullet_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_bullet_list_parent_id_idx" ON "_pages_v_blocks_bullet_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_bullet_list_path_idx" ON "_pages_v_blocks_bullet_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_bullet_list_image_idx" ON "_pages_v_blocks_bullet_list" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_question_panel_order_idx" ON "_pages_v_blocks_question_panel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_question_panel_parent_id_idx" ON "_pages_v_blocks_question_panel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_question_panel_path_idx" ON "_pages_v_blocks_question_panel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_question_panel_image_idx" ON "_pages_v_blocks_question_panel" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_question_panel_icon_idx" ON "_pages_v_blocks_question_panel" USING btree ("icon_id");
  CREATE INDEX "_pages_v_blocks_appointment_form_order_idx" ON "_pages_v_blocks_appointment_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_appointment_form_parent_id_idx" ON "_pages_v_blocks_appointment_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_appointment_form_path_idx" ON "_pages_v_blocks_appointment_form" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero_block" CASCADE;
  DROP TABLE "pages_blocks_info_hero_info_cards" CASCADE;
  DROP TABLE "pages_blocks_info_hero" CASCADE;
  DROP TABLE "pages_blocks_editorial_split" CASCADE;
  DROP TABLE "pages_blocks_founder_quote" CASCADE;
  DROP TABLE "pages_blocks_card_grid_cards" CASCADE;
  DROP TABLE "pages_blocks_card_grid" CASCADE;
  DROP TABLE "pages_blocks_two_column_feature" CASCADE;
  DROP TABLE "pages_blocks_image_banner" CASCADE;
  DROP TABLE "pages_blocks_section_intro" CASCADE;
  DROP TABLE "pages_blocks_visit_info_ctas" CASCADE;
  DROP TABLE "pages_blocks_visit_info_hours" CASCADE;
  DROP TABLE "pages_blocks_visit_info" CASCADE;
  DROP TABLE "pages_blocks_carousel_images" CASCADE;
  DROP TABLE "pages_blocks_carousel" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_process_carousel_slides" CASCADE;
  DROP TABLE "pages_blocks_process_carousel" CASCADE;
  DROP TABLE "pages_blocks_newsletter_feature" CASCADE;
  DROP TABLE "pages_blocks_consultation_form" CASCADE;
  DROP TABLE "pages_blocks_contact_panel" CASCADE;
  DROP TABLE "pages_blocks_bullet_list_items" CASCADE;
  DROP TABLE "pages_blocks_bullet_list" CASCADE;
  DROP TABLE "pages_blocks_question_panel" CASCADE;
  DROP TABLE "pages_blocks_appointment_form" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_block" CASCADE;
  DROP TABLE "_pages_v_blocks_info_hero_info_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_info_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_editorial_split" CASCADE;
  DROP TABLE "_pages_v_blocks_founder_quote" CASCADE;
  DROP TABLE "_pages_v_blocks_card_grid_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_card_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_two_column_feature" CASCADE;
  DROP TABLE "_pages_v_blocks_image_banner" CASCADE;
  DROP TABLE "_pages_v_blocks_section_intro" CASCADE;
  DROP TABLE "_pages_v_blocks_visit_info_ctas" CASCADE;
  DROP TABLE "_pages_v_blocks_visit_info_hours" CASCADE;
  DROP TABLE "_pages_v_blocks_visit_info" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel_images" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_process_carousel_slides" CASCADE;
  DROP TABLE "_pages_v_blocks_process_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_newsletter_feature" CASCADE;
  DROP TABLE "_pages_v_blocks_consultation_form" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_panel" CASCADE;
  DROP TABLE "_pages_v_blocks_bullet_list_items" CASCADE;
  DROP TABLE "_pages_v_blocks_bullet_list" CASCADE;
  DROP TABLE "_pages_v_blocks_question_panel" CASCADE;
  DROP TABLE "_pages_v_blocks_appointment_form" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_editorial_split_image_position";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_background_color";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_top_spacing";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_bottom_spacing";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_icon_position";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_cta_arrow_position";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_cta_style";
  DROP TYPE "public"."enum_pages_blocks_editorial_split_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_founder_quote_portrait_position";
  DROP TYPE "public"."enum_pages_blocks_founder_quote_background_color";
  DROP TYPE "public"."enum_pages_blocks_card_grid_cards_cta_arrow_position";
  DROP TYPE "public"."enum_pages_blocks_card_grid_cards_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_card_grid_columns";
  DROP TYPE "public"."enum_pages_blocks_card_grid_background_color";
  DROP TYPE "public"."enum_pages_blocks_two_column_feature_background_color";
  DROP TYPE "public"."enum_pages_blocks_two_column_feature_column_a_type";
  DROP TYPE "public"."enum_pages_blocks_two_column_feature_column_a_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_two_column_feature_column_b_type";
  DROP TYPE "public"."enum_pages_blocks_two_column_feature_column_b_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_image_banner_header_theme";
  DROP TYPE "public"."enum_pages_blocks_image_banner_height";
  DROP TYPE "public"."enum_pages_blocks_section_intro_background_color";
  DROP TYPE "public"."enum_pages_blocks_section_intro_cta_style";
  DROP TYPE "public"."enum_pages_blocks_section_intro_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_visit_info_map_position";
  DROP TYPE "public"."enum_pages_blocks_visit_info_background_color";
  DROP TYPE "public"."enum_pages_blocks_carousel_image_position";
  DROP TYPE "public"."enum_pages_blocks_carousel_background_color";
  DROP TYPE "public"."enum_pages_blocks_carousel_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_faq_background_color";
  DROP TYPE "public"."enum_pages_blocks_process_carousel_background_color";
  DROP TYPE "public"."enum_pages_blocks_newsletter_feature_image_position";
  DROP TYPE "public"."enum_pages_blocks_newsletter_feature_panel_background_color";
  DROP TYPE "public"."enum_pages_blocks_consultation_form_background_color";
  DROP TYPE "public"."enum_pages_blocks_contact_panel_image_position";
  DROP TYPE "public"."enum_pages_blocks_contact_panel_panel_background_color";
  DROP TYPE "public"."enum_pages_blocks_bullet_list_image_position";
  DROP TYPE "public"."enum_pages_blocks_bullet_list_background_color";
  DROP TYPE "public"."enum_pages_blocks_question_panel_image_position";
  DROP TYPE "public"."enum_pages_blocks_question_panel_panel_background_color";
  DROP TYPE "public"."enum_pages_blocks_question_panel_top_spacing";
  DROP TYPE "public"."enum_pages_blocks_question_panel_bottom_spacing";
  DROP TYPE "public"."enum_pages_blocks_appointment_form_background_color";
  DROP TYPE "public"."enum_pages_blocks_appointment_form_faq_link_type";
  DROP TYPE "public"."enum_pages_blocks_appointment_form_faq_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_top_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_bottom_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_icon_position";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_cta_arrow_position";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_cta_style";
  DROP TYPE "public"."enum__pages_v_blocks_editorial_split_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_founder_quote_portrait_position";
  DROP TYPE "public"."enum__pages_v_blocks_founder_quote_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_cards_cta_arrow_position";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_cards_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_columns";
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_feature_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_feature_column_a_type";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_feature_column_a_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_feature_column_b_type";
  DROP TYPE "public"."enum__pages_v_blocks_two_column_feature_column_b_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_image_banner_header_theme";
  DROP TYPE "public"."enum__pages_v_blocks_image_banner_height";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_cta_style";
  DROP TYPE "public"."enum__pages_v_blocks_section_intro_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_visit_info_map_position";
  DROP TYPE "public"."enum__pages_v_blocks_visit_info_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_faq_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_process_carousel_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_newsletter_feature_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_newsletter_feature_panel_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_consultation_form_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_contact_panel_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_contact_panel_panel_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_bullet_list_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_bullet_list_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_question_panel_image_position";
  DROP TYPE "public"."enum__pages_v_blocks_question_panel_panel_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_question_panel_top_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_question_panel_bottom_spacing";
  DROP TYPE "public"."enum__pages_v_blocks_appointment_form_background_color";
  DROP TYPE "public"."enum__pages_v_blocks_appointment_form_faq_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_appointment_form_faq_link_appearance";`)
}
