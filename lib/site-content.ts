import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";

type SiteContentRow = {
  section_key: "about" | "who_i_am";
  section_value: string;
  updated_at: string;
};

export type AboutContent = {
  about: string;
  whoIAm: string;
  updatedAt: string;
};

const fallbackAbout = "Коротко о блоге и о чем здесь публикуются материалы.";
const fallbackWhoIAm = "Расскажи здесь, кто ты, чем занимаешься и чем можешь быть полезен.";

export const getAboutContent = async (): Promise<AboutContent> => {
  noStore();
  const db = getDb();
  const rows = db
    .prepare("SELECT section_key, section_value, updated_at FROM site_content WHERE section_key IN ('about', 'who_i_am')")
    .all() as SiteContentRow[];

  const aboutRow = rows.find((row) => row.section_key === "about");
  const whoIAmRow = rows.find((row) => row.section_key === "who_i_am");

  return {
    about: aboutRow?.section_value ?? fallbackAbout,
    whoIAm: whoIAmRow?.section_value ?? fallbackWhoIAm,
    updatedAt: aboutRow?.updated_at ?? whoIAmRow?.updated_at ?? new Date().toISOString()
  };
};

export const updateAboutContent = async (payload: { about: string; whoIAm: string }) => {
  const db = getDb();
  const now = new Date().toISOString();
  const aboutValue = payload.about.trim().length > 0 ? payload.about.trim() : fallbackAbout;
  const whoValue = payload.whoIAm.trim().length > 0 ? payload.whoIAm.trim() : fallbackWhoIAm;

  db.prepare(
    `
      INSERT INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(section_key) DO UPDATE SET
        section_value = excluded.section_value,
        updated_at = excluded.updated_at
    `
  ).run("about", aboutValue, now);

  db.prepare(
    `
      INSERT INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(section_key) DO UPDATE SET
        section_value = excluded.section_value,
        updated_at = excluded.updated_at
    `
  ).run("who_i_am", whoValue, now);

  return { updatedAt: now };
};
