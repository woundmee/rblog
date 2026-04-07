export type IconColor = "default" | "blue" | "green" | "orange" | "red" | "purple";

export type IconDefinition = {
  id: string;
  label: string;
  body: string;
};

export const iconLibrary: IconDefinition[] = [
  { id: "code", label: "Code", body: '<path d="M9 8l-4 4 4 4" /><path d="M15 8l4 4-4 4" />' },
  { id: "terminal", label: "Terminal", body: '<path d="M6 9l3 3-3 3" /><path d="M11 16h7" /><rect x="3" y="5" width="18" height="14" rx="2" />' },
  { id: "link", label: "Link", body: '<path d="M10.5 13.5l3-3" /><path d="M8.1 15.9l-1.6 1.6a3 3 0 01-4.2-4.2l1.6-1.6" /><path d="M15.9 8.1l1.6-1.6a3 3 0 114.2 4.2l-1.6 1.6" />' },
  { id: "user", label: "User", body: '<circle cx="12" cy="8" r="3.2" /><path d="M5 20c1.6-3.6 4-5.4 7-5.4s5.4 1.8 7 5.4" />' },
  { id: "mail", label: "Mail", body: '<rect x="3" y="6" width="18" height="12" rx="2" /><path d="M4.2 7.4L12 12.8l7.8-5.4" />' },
  { id: "phone", label: "Phone", body: '<path d="M7.4 3h2.7l1.2 3.6-1.7 1.7a13 13 0 005.2 5.2l1.7-1.7 3.6 1.2v2.7a2.3 2.3 0 01-2.5 2.3A16.8 16.8 0 014.9 6.2 2.3 2.3 0 017.4 3z" />' },
  { id: "globe", label: "Globe", body: '<circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14.5 14.5 0 010 18" /><path d="M12 3a14.5 14.5 0 000 18" />' },
  { id: "bookmark", label: "Bookmark", body: '<path d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />' },
  { id: "star", label: "Star", body: '<path d="M12 3.8l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z" />' },
  { id: "heart", label: "Heart", body: '<path d="M12 20s-7-4.5-8.7-8.7A4.9 4.9 0 0112 6a4.9 4.9 0 018.7 5.3C19 15.5 12 20 12 20z" />' },
  { id: "telegram", label: "Telegram", body: '<path d="M21 4L3 11.3l5.8 2 2.3 6.7 3.1-4 4.8 3.6L21 4z" /><path d="M8.8 13.3L21 4" />' },
  { id: "instagram", label: "Instagram", body: '<rect x="4" y="4" width="16" height="16" rx="4.2" /><circle cx="12" cy="12" r="3.7" /><circle cx="17.2" cy="6.8" r="0.9" />' },
  { id: "youtube", label: "YouTube", body: '<rect x="3.5" y="6.2" width="17" height="11.6" rx="3.2" /><path d="M10 9.3l5 2.7-5 2.7z" />' },
  { id: "x", label: "X", body: '<path d="M4 4l16 16" /><path d="M20 4L4 20" />' },
  { id: "facebook", label: "Facebook", body: '<path d="M14.8 5.2h-2.3a2.6 2.6 0 00-2.6 2.6v2.3H8v3h1.9v5h3v-5h2.2l.4-3h-2.6V8.3c0-.6.4-1 1-1h1.9z" />' },
  { id: "github", label: "GitHub", body: '<path d="M9.2 19c-4.2 1.3-4.2-2.1-5.8-2.6" /><path d="M15 21v-3.2a2.9 2.9 0 00-.8-2.3c2.7-.3 5.5-1.3 5.5-5.8a4.5 4.5 0 00-1.2-3.1 4.2 4.2 0 00-.1-3.1s-1-.3-3.3 1.2a11.2 11.2 0 00-6 0c-2.3-1.5-3.3-1.2-3.3-1.2a4.2 4.2 0 00-.1 3.1 4.5 4.5 0 00-1.2 3.1c0 4.5 2.8 5.5 5.5 5.8a2.9 2.9 0 00-.8 2.3V21" />' },
  { id: "gitlab", label: "GitLab", body: '<path d="M12 19.2l6.4-5.6-2.2-6.7H7.8l-2.2 6.7z" /><path d="M7.8 6.9l1.5-3.9L12 6.9l2.7-3.9 1.5 3.9" />' },
  { id: "docker", label: "Docker", body: '<rect x="3.5" y="11.5" width="3" height="3" /><rect x="7" y="11.5" width="3" height="3" /><rect x="10.5" y="11.5" width="3" height="3" /><rect x="7" y="8" width="3" height="3" /><rect x="10.5" y="8" width="3" height="3" /><path d="M2.8 15.3h11.8c1.4 0 2.7-.4 3.7-1.3.7-.6 1.3-1.5 1.7-2.6-1.2-.4-2.1-.2-2.8.3-.2-.8-.8-1.5-1.6-1.8" />' },
  { id: "kubernetes", label: "Kubernetes", body: '<circle cx="12" cy="12" r="7" /><path d="M12 5v14" /><path d="M6.1 8.4l11.8 7.2" /><path d="M17.9 8.4L6.1 15.6" /><circle cx="12" cy="12" r="2.2" />' },
  { id: "aws", label: "AWS", body: '<path d="M5 16.8c3.8 2.4 10.2 2.4 14 0" /><path d="M7 9.8l2.2 4.8h1.5l2.1-4.8M13.7 9.8h3.8M15.6 9.8v4.8" />' },
  { id: "gcp", label: "GCP", body: '<path d="M7.2 16.8a6.8 6.8 0 119.6-9.6" /><path d="M16.8 7.2a6.8 6.8 0 11-9.6 9.6" /><path d="M12 5.2v13.6" />' },
  { id: "azure", label: "Azure", body: '<path d="M4 18L11.4 4h4.3L20 18H4z" /><path d="M12.2 12l2.2 6" />' },
  { id: "vercel", label: "Vercel", body: '<path d="M12 4l7.5 13H4.5z" />' },
  { id: "netlify", label: "Netlify", body: '<path d="M6 5h4v4H6zM14 5h4v4h-4zM6 15h4v4H6zM14 15h4v4h-4z" /><path d="M10 7h4M10 17h4M8 9v6M16 9v6" />' },
  { id: "react", label: "React", body: '<ellipse cx="12" cy="12" rx="9" ry="3.7" /><ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.7" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.6" />' },
  { id: "nextjs", label: "Next.js", body: '<circle cx="12" cy="12" r="9" /><path d="M9 16V8l6 8V8" />' },
  { id: "nodejs", label: "Node.js", body: '<path d="M12 3l7 4v10l-7 4-7-4V7z" /><path d="M12 7v10" /><path d="M8.5 9l3.5 2 3.5-2" />' },
  { id: "typescript", label: "TypeScript", body: '<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M12 9v8M15 13h3M16.5 13v5" />' },
  { id: "javascript", label: "JavaScript", body: '<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M10 9v5a2 2 0 11-2 2M14 14a2 2 0 104 0c0-2-4-1-4-3a2 2 0 114 0" />' },
  { id: "python", label: "Python", body: '<path d="M8 4h5a3 3 0 013 3v3H9a2 2 0 00-2 2v3H6a3 3 0 01-3-3V9a5 5 0 015-5z" /><path d="M16 20h-5a3 3 0 01-3-3v-3h7a2 2 0 002-2V9h1a3 3 0 013 3v3a5 5 0 01-5 5z" /><circle cx="10" cy="6.8" r="0.7" /><circle cx="14" cy="17.2" r="0.7" />' },
  { id: "linux", label: "Linux", body: '<path d="M12 4c2 0 3 1.9 3 4.1 0 1.9-.7 3.3-1.6 4.4M12 4c-2 0-3 1.9-3 4.1 0 1.9.7 3.3 1.6 4.4" /><ellipse cx="12" cy="14.3" rx="3.5" ry="2.7" /><path d="M8.5 18.5c.7 1.3 2 2 3.5 2s2.8-.7 3.5-2" />' },
  { id: "vscode", label: "VS Code", body: '<path d="M16.8 5.4l-7.6 6.6 7.6 6.6 2.2-1.1V6.5z" /><path d="M9.2 12L4.4 8.2 2.8 9.3 6.6 12l-3.8 2.7 1.6 1.1z" />' },
  { id: "postman", label: "Postman", body: '<circle cx="12" cy="12" r="9" /><path d="M8 15l8-6-4 8-1.3-3.3z" />' },
  { id: "figma", label: "Figma", body: '<rect x="8" y="3.5" width="8" height="5" rx="2.5" /><rect x="8" y="8.5" width="8" height="5" rx="2.5" /><rect x="8" y="13.5" width="8" height="7" rx="3.5" /><rect x="4" y="3.5" width="8" height="5" rx="2.5" /><rect x="4" y="8.5" width="8" height="5" rx="2.5" />' },
  { id: "notion", label: "Notion", body: '<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 15V9l6 6V9" />' },
  { id: "slack", label: "Slack", body: '<path d="M8 4.5v4.2a2 2 0 01-4 0V6.5a2 2 0 014 0M10 6.5h4.2a2 2 0 010 4H12a2 2 0 010-4M14 19.5v-4.2a2 2 0 014 0v2.2a2 2 0 01-4 0M6 17.5H10.2a2 2 0 000-4H8a2 2 0 000 4" />' },
  { id: "jira", label: "Jira", body: '<path d="M6 6h6v6H6zM12 12h6v6h-6zM12 6h6v6h-6z" />' },
  { id: "trello", label: "Trello", body: '<rect x="4" y="4" width="16" height="16" rx="2" /><rect x="7" y="7" width="4" height="9" rx="1" /><rect x="13" y="7" width="4" height="6" rx="1" />' },
  { id: "database", label: "Database", body: '<ellipse cx="12" cy="6.5" rx="7" ry="2.5" /><path d="M5 6.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" /><path d="M5 10.2c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />' },
  { id: "postgres", label: "PostgreSQL", body: '<path d="M9 18c0-2.2.3-4.6.3-6.9 0-2.1 1.4-3.8 3.1-3.8s3.1 1.7 3.1 3.8c0 1.5-.2 3.2-.5 4.9" /><path d="M9.3 12.7c-1.4.1-2.3-.8-2.3-2.1 0-2.2 1.8-4 4.1-4 .8 0 1.6.2 2.3.6" /><path d="M14.6 13.2c1.1.4 2.2.2 2.9-.8" />' },
  { id: "mongodb", label: "MongoDB", body: '<path d="M12 20c3-2.3 4.5-5.2 4.5-9.2 0-2.8-1.2-5.3-4.5-7.8-3.3 2.5-4.5 5-4.5 7.8 0 4 1.5 6.9 4.5 9.2z" /><path d="M12 7v11" />' },
  { id: "redis", label: "Redis", body: '<path d="M4 10l8-3 8 3-8 3zM4 14l8 3 8-3M4 10v4M20 10v4" />' },
  { id: "nginx", label: "Nginx", body: '<path d="M12 3l8 4.6v8.8L12 21 4 16.4V7.6z" /><path d="M9 15V9l6 6V9" />' },
  { id: "kafka", label: "Kafka", body: '<circle cx="12" cy="6" r="1.5" /><circle cx="6" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" /><path d="M12 7.5V16.5M7.5 12h9" />' },
  { id: "rabbitmq", label: "RabbitMQ", body: '<path d="M7 8V5a1 1 0 012 0v3M15 8V5a1 1 0 012 0v3" /><rect x="5" y="8" width="14" height="10" rx="3" /><path d="M9 12h6" />' },
  { id: "graphql", label: "GraphQL", body: '<polygon points="12,3.5 18.5,7.2 18.5,14.8 12,18.5 5.5,14.8 5.5,7.2" /><path d="M12 3.5v15M5.5 7.2l13 7.6M18.5 7.2l-13 7.6" />' },
  { id: "api", label: "API", body: '<path d="M6 18l3-8 3 8M7 14h4M14 10v8M18 10h2a2 2 0 010 4h-2M18 14h2a2 2 0 010 4h-2" />' },
  { id: "cloud", label: "Cloud", body: '<path d="M8 18h9a4 4 0 000-8 5 5 0 00-9.6-1.5A3.5 3.5 0 008 18z" />' },
  { id: "server", label: "Server", body: '<rect x="4" y="5" width="16" height="6" rx="1.5" /><rect x="4" y="13" width="16" height="6" rx="1.5" /><path d="M8 8h.01M8 16h.01" />' },
  { id: "monitor", label: "Monitor", body: '<rect x="3" y="5" width="18" height="12" rx="2" /><path d="M9 21h6M12 17v4" />' },
  { id: "bug", label: "Bug", body: '<path d="M9 8a3 3 0 016 0v6a3 3 0 11-6 0V8z" /><path d="M4 9h4M16 9h4M4 13h4M16 13h4M6 5l2 2M18 5l-2 2" />' },
  { id: "settings", label: "Settings", body: '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1 1 0 00.2 1.1l.1.1a1 1 0 010 1.4l-1.4 1.4a1 1 0 01-1.4 0l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a1 1 0 01-1 1h-2a1 1 0 01-1-1v-.2a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a1 1 0 01-1.4 0l-1.4-1.4a1 1 0 010-1.4l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a1 1 0 01-1-1v-2a1 1 0 011-1h.2a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a1 1 0 010-1.4L6.2 4a1 1 0 011.4 0l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V3a1 1 0 011-1h2a1 1 0 011 1v.2a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a1 1 0 011.4 0l1.4 1.4a1 1 0 010 1.4l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a1 1 0 011 1v2a1 1 0 01-1 1h-.2a1 1 0 00-.9.6z" />' },
  { id: "rocket", label: "Rocket", body: '<path d="M14 4l6 6-5.5 5.5-6-6z" /><path d="M8 16l-4 4M8.5 10.5L6 8l4-2 2.5 2.5M13.5 15.5L16 18l-2 4-2.5-2.5" />' },
  { id: "linkedin", label: "LinkedIn", body: '<path d="M7 9v8" /><path d="M7 6.5a.9.9 0 100 1.8.9.9 0 000-1.8z" /><path d="M11 17V9h3v1.2c.4-.8 1.3-1.4 2.7-1.4 2 0 3.3 1.3 3.3 4V17h-3v-3.8c0-1.2-.4-2-1.5-2-1 0-1.5.7-1.5 2V17z" />' },
  { id: "whatsapp", label: "WhatsApp", body: '<path d="M19.2 11.8a7.2 7.2 0 01-10.4 6.4L5 19l.8-3.6a7.2 7.2 0 1113.4-3.6z" /><path d="M9.5 8.8c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.4l.4 1.1c.1.2.1.4 0 .6l-.4.6a5.4 5.4 0 002.5 2.4l.6-.4c.2-.1.4-.1.6 0l1.1.4c.4.2.4.3.4.6v.5c0 .2 0 .4-.4.6-.6.3-1.3.4-1.9.2-1.7-.6-3.8-2.6-4.5-4.3-.3-.7-.2-1.4.2-2z" />' },
  { id: "rss", label: "RSS", body: '<path d="M6 18a2 2 0 100-4 2 2 0 000 4z" /><path d="M4 11a9 9 0 019 9" /><path d="M4 6a14 14 0 0114 14" />' }
];

export const iconColorOptions: Array<{ id: IconColor; label: string }> = [
  { id: "default", label: "Default" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "red", label: "Red" },
  { id: "purple", label: "Purple" }
];

const iconMap = new Map(iconLibrary.map((icon) => [icon.id, icon]));

export const getIconById = (id: string): IconDefinition | null => iconMap.get(id) ?? null;

export const buildIconSvg = (icon: IconDefinition, className = "md-inline-icon", title?: string): string => {
  const safeTitle = title ? `<title>${title}</title>` : "";
  return `<svg class="${className}" viewBox="0 0 24 24" role="img" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${safeTitle}${icon.body}</svg>`;
};
