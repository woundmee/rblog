import { unstable_noStore as noStore } from "next/cache";
import { getDb } from "@/lib/db";
import { normalizeMarkdownLinks } from "@/lib/markdown";

type SiteContentRow = {
  section_key: "about" | "who_i_am" | "about_title" | "who_i_am_title" | "ad_enabled" | "ad_markdown";
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

export type AdContent = {
  enabled: boolean;
  markdown: string;
  updatedAt: string;
};

const fallbackAboutTitle = "About";
const fallbackWhoIAmTitle = "Кто я";
const fallbackAbout = "Коротко о блоге и о чем здесь публикуются материалы.";
const fallbackWhoIAm = "Расскажи здесь, кто ты, чем занимаешься и чем можешь быть полезен.";
const fallbackAdEnabled = false;
const fallbackAdMarkdown = "###### Партнёрский блок\nКороткий дополнительный текст в нейтральном стиле.";

const getRows = (): SiteContentRow[] => {
  const db = getDb();
  return db
    .prepare(
      "SELECT section_key, section_value, updated_at FROM site_content WHERE section_key IN ('about', 'who_i_am', 'about_title', 'who_i_am_title', 'ad_enabled', 'ad_markdown')"
    )
    .all() as SiteContentRow[];
};

const latestUpdatedAt = (rows: SiteContentRow[]): string =>
  rows
    .map((row) => row.updated_at)
    .sort((a, b) => b.localeCompare(a))[0] ?? new Date().toISOString();

export const getAboutContent = async (): Promise<AboutContent> => {
  noStore();
  const rows = getRows();

  const aboutTitleRow = rows.find((row) => row.section_key === "about_title");
  const whoIAmTitleRow = rows.find((row) => row.section_key === "who_i_am_title");
  const aboutRow = rows.find((row) => row.section_key === "about");
  const whoIAmRow = rows.find((row) => row.section_key === "who_i_am");

  return {
    aboutTitle: aboutTitleRow?.section_value ?? fallbackAboutTitle,
    whoIAmTitle: whoIAmTitleRow?.section_value ?? fallbackWhoIAmTitle,
    about: aboutRow?.section_value ?? fallbackAbout,
    whoIAm: whoIAmRow?.section_value ?? fallbackWhoIAm,
    updatedAt: latestUpdatedAt(rows)
  };
};

export const getAdContent = async (): Promise<AdContent> => {
  noStore();
  const rows = getRows();
  const adEnabledRow = rows.find((row) => row.section_key === "ad_enabled");
  const adMarkdownRow = rows.find((row) => row.section_key === "ad_markdown");

  return {
    enabled: adEnabledRow ? adEnabledRow.section_value === "1" : fallbackAdEnabled,
    markdown: normalizeMarkdownLinks(adMarkdownRow?.section_value ?? fallbackAdMarkdown),
    updatedAt: latestUpdatedAt(rows)
  };
};

const upsertContent = (sectionKey: SiteContentRow["section_key"], sectionValue: string, updatedAt: string) => {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO site_content (section_key, section_value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(section_key) DO UPDATE SET
        section_value = excluded.section_value,
        updated_at = excluded.updated_at
    `
  ).run(sectionKey, sectionValue, updatedAt);
};

export const updateAboutContent = async (payload: {
  aboutTitle: string;
  whoIAmTitle: string;
  about: string;
  whoIAm: string;
}) => {
  const now = new Date().toISOString();
  const aboutTitle = payload.aboutTitle.trim().length > 0 ? payload.aboutTitle.trim() : fallbackAboutTitle;
  const whoIAmTitle = payload.whoIAmTitle.trim().length > 0 ? payload.whoIAmTitle.trim() : fallbackWhoIAmTitle;
  const aboutValue = payload.about.trim().length > 0 ? payload.about.trim() : fallbackAbout;
  const whoValue = payload.whoIAm.trim().length > 0 ? payload.whoIAm.trim() : fallbackWhoIAm;

  upsertContent("about_title", aboutTitle, now);
  upsertContent("who_i_am_title", whoIAmTitle, now);
  upsertContent("about", aboutValue, now);
  upsertContent("who_i_am", whoValue, now);

  return { updatedAt: now };
};

export const updateAdContent = async (payload: { enabled: boolean; markdown: string }) => {
  const now = new Date().toISOString();
  const enabledValue = payload.enabled ? "1" : "0";
  const markdownValue =
    payload.markdown.trim().length > 0 ? normalizeMarkdownLinks(payload.markdown.trim()) : fallbackAdMarkdown;

  upsertContent("ad_enabled", enabledValue, now);
  upsertContent("ad_markdown", markdownValue, now);

  return { updatedAt: now };
};
