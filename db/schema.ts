import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull().default(""),
  studyYear: text("study_year").notNull(),
  school: text("school").notNull(),
  speciality: text("speciality").notNull(),
  desiredProgram: text("desired_program").notNull(),
  desiredStart: text("desired_start").notNull(),
  motivation: text("motivation").notNull(),
  processStage: text("process_stage").notNull(),
  helpTopics: text("help_topics").notNull().default("[]"),
  helpDetails: text("help_details").notNull().default(""),
  appointmentPreference: text("appointment_preference").notNull().default(""),
  consent: integer("consent", { mode: "boolean" }).notNull(),
  status: text("status").notNull().default("nouvelle"),
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
