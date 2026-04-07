import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";

type SiteContentRow = {
  section_key: "about" | "who_i_am" | "about_title" | "who_i_am_title";
  section_value: string;
  updated_at: string;
};

export type AboutContent = {
  aboutTitle: string;
  whoIAmTitle: string;
  about: string;
  whoIAm: string;
  updatedAt: string;
};

const fallbackAboutTitle = "About";
const fallbackWhoIAmTitle = "Кто я";
const fallbackAbout = "Коротко о блоге и о чем здесь публикуются материалы.";
const fallbackWhoIAm = "Расскажи здесь, кто ты, чем занимаешься и чем можешь быть полезен.";

export const getAboutContent = async (): Promise<AboutContent> => {
  noStore();
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT section_key, section_value, updated_at FROM site_content WHERE section_key IN ('about', 'who_i_am', 'about_title', 'who_i_am_title')"
    )
    .all() as SiteContentRow[];

  const aboutTitleRow = rows.find((row) => row.section_key === "about_title");
  const whoIAmTitleRow = rows.find((row) => row.section_key === "who_i_am_title");
  const aboutRow = rows.find((row) => row.section_key === "about");
  const whoIAmRow = rows.find((row) => row.section_key === "who_i_am");
  const updatedAt = rows
    .map((row) => row.updated_at)
    .sort((a, b) => b.localeCompare(a))[0] ?? new Date().toISOString();

  return {
    aboutTitle: aboutTitleRow?.section_value ?? fallbackAboutTitle,
    whoIAmTitle: whoIAmTitleRow?.section_value ?? fallbackWhoIAmTitle,
    about: aboutRow?.section_value ?? fallbackAbout,
    whoIAm: whoIAmRow?.section_value ?? fallbackWhoIAm,
    updatedAt
  };
};

export const updateAboutContent = async (payload: {
  aboutTitle: string;
  whoIAmTitle: string;
  about: string;
  whoIAm: string;
}) => {
  const db = getDb();
  const now = new Date().toISOString();
  const aboutTitle = payload.aboutTitle.trim().length > 0 ? payload.aboutTitle.trim() : fallbackAboutTitle;
  const whoIAmTitle = payload.whoIAmTitle.trim().length > 0 ? payload.whoIAmTitle.trim() : fallbackWhoIAmTitle;
  const aboutValue = payload.about.trim().length > 0 ? payload.about.trim() : fallbackAbout;
  const whoValue = payload.whoIAm.trim().length > 0 ? payload.whoIAm.trim() : fallbackWhoIAm;

  const upsert = db.prepare(
    `
    INSERT INTO site_content (section_key, section_value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(section_key) DO UPDATE SET
      section_value = excluded.section_value,
      updated_at = excluded.updated_at
  `
  );

  upsert.run("about_title", aboutTitle, now);
  upsert.run("who_i_am_title", whoIAmTitle, now);
  upsert.run("about", aboutValue, now);
  upsert.run("who_i_am", whoValue, now);

  return { updatedAt: now };
};
