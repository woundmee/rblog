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
  { id: "mail", label: "Mail", body: '<path d="M4 7h16v10H4z" /><path d="M4 8l8 5 8-5" />' },
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
  { id: "gear", label: "Gear", body: '<path d="M8.6 3.5h6.8l.9 2.3 2.3.9v6.8l-2.3.9-.9 2.3H8.6l-.9-2.3-2.3-.9V6.7l2.3-.9z" /><circle cx="12" cy="10.1" r="2.4" />' },
  { id: "settings", label: "Settings", body: '<path d="M8.6 3.5h6.8l.9 2.3 2.3.9v6.8l-2.3.9-.9 2.3H8.6l-.9-2.3-2.3-.9V6.7l2.3-.9z" /><circle cx="12" cy="10.1" r="2.4" />' },
  { id: "rocket", label: "Rocket", body: '<path d="M14 4l6 6-5.5 5.5-6-6z" /><path d="M8 16l-4 4M8.5 10.5L6 8l4-2 2.5 2.5M13.5 15.5L16 18l-2 4-2.5-2.5" />' },
  { id: "linkedin", label: "LinkedIn", body: '<path d="M7 9v8" /><path d="M7 6.5a.9.9 0 100 1.8.9.9 0 000-1.8z" /><path d="M11 17V9h3v1.2c.4-.8 1.3-1.4 2.7-1.4 2 0 3.3 1.3 3.3 4V17h-3v-3.8c0-1.2-.4-2-1.5-2-1 0-1.5.7-1.5 2V17z" />' },
  { id: "whatsapp", label: "WhatsApp", body: '<path d="M19.2 11.8a7.2 7.2 0 01-10.4 6.4L5 19l.8-3.6a7.2 7.2 0 1113.4-3.6z" /><path d="M9.5 8.8c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.4l.4 1.1c.1.2.1.4 0 .6l-.4.6a5.4 5.4 0 002.5 2.4l.6-.4c.2-.1.4-.1.6 0l1.1.4c.4.2.4.3.4.6v.5c0 .2 0 .4-.4.6-.6.3-1.3.4-1.9.2-1.7-.6-3.8-2.6-4.5-4.3-.3-.7-.2-1.4.2-2z" />' },
  { id: "bitbucket", label: "Bitbucket", body: '<path d="M4 6h16l-2 12H6z" /><path d="M8 10h8l-1 5H9z" />' },
  { id: "cloudflare", label: "Cloudflare", body: '<path d="M6 17h11a3.5 3.5 0 100-7 5 5 0 00-9.4-1.2A3.2 3.2 0 006 17z" /><path d="M8.4 17a2.2 2.2 0 014.3-.6A1.7 1.7 0 0114 17" />' },
  { id: "digitalocean", label: "DigitalOcean", body: '<circle cx="12" cy="10.5" r="4.5" /><path d="M12 16v4M16.5 10.5H20M4 19.5h4" />' },
  { id: "supabase", label: "Supabase", body: '<path d="M6 4h10l-6 16H4z" /><path d="M10 4h6L9 20" />' },
  { id: "prisma", label: "Prisma", body: '<path d="M9 4l7 13-5 2-7-13z" /><path d="M9 4l-3 7 5 8" />' },
  { id: "laravel", label: "Laravel", body: '<path d="M6 7l6-3 6 3v7l-6 3-6-3z" /><path d="M12 4v6l6 4M12 10l-6 4" />' },
  { id: "django", label: "Django", body: '<rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 10v4M11 10v4M15 10v4M8 14h7" />' },
  { id: "flask", label: "Flask", body: '<path d="M10 4h4M11 4v4l-5 8a2 2 0 001.7 3h8.6a2 2 0 001.7-3l-5-8V4" /><path d="M8 13h8" />' },
  { id: "go", label: "Go", body: '<circle cx="9" cy="12" r="4" /><path d="M9 12h5" /><circle cx="17.8" cy="10.5" r="0.8" /><circle cx="17.8" cy="13.5" r="0.8" />' },
  { id: "rust", label: "Rust", body: '<circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="12" r="6.6" /><path d="M12 4.8v-1.3M12 20.5v-1.3M4.8 12H3.5M20.5 12h-1.3M6.9 6.9L6 6M18 18l-.9-.9M17.1 6.9L18 6M6.9 17.1L6 18" />' },
  { id: "csharp", label: "C#", body: '<polygon points="12,3.6 18.6,7.3 18.6,14.7 12,18.4 5.4,14.7 5.4,7.3" /><path d="M10.3 10h3.4M10.3 14h3.4M14.8 10v4M16.4 10v4" />' },
  { id: "php", label: "PHP", body: '<ellipse cx="12" cy="12" rx="8.5" ry="5.2" /><path d="M8 13v-3h1.7a1.2 1.2 0 010 2.4H8M12 13v-3h2M12 11.5h1.6M16 13v-3h1.7a1.2 1.2 0 010 2.4H16" />' },
  { id: "java", label: "Java", body: '<path d="M8 17h8" /><path d="M9 14h6" /><path d="M10 9c0 1.7 4 1.7 4 3.4 0 .8-.8 1.4-2 1.6" /><path d="M13 6c.8.9.8 1.8 0 2.7" /><path d="M15 5c1.2 1.3 1.2 2.7 0 4" />' },
  { id: "kotlin", label: "Kotlin", body: '<path d="M5 5h14l-7 7 7 7H5z" /><path d="M5 19l7-7-7-7" />' },
  { id: "swift", label: "Swift", body: '<path d="M6 16c2.6 2.2 6.6 2.3 9.3.2 1.4 1 2.2 2 2.7 3-2-.8-3.4-.8-4.2.1-3 .8-5.9.3-8-1.6" /><path d="M8 7l4 4-2-5M12 8l4 4" />' },
  { id: "angular", label: "Angular", body: '<path d="M12 3l7 2.6-1.1 9.2L12 21l-5.9-6.2L5 5.6z" /><path d="M12 7l-3.4 8h1.7l.8-2h2l.8 2h1.7z" />' },
  { id: "vue", label: "Vue", body: '<path d="M4 6h4l4 7 4-7h4l-8 13z" /><path d="M7 6h3l2 3.5L14 6h3l-5 8z" />' },
  { id: "svelte", label: "Svelte", body: '<path d="M15.8 6.4c-.8-1.8-3.5-2.5-5.8-1.9-2.3.6-3.8 2.2-3.4 3.8.3 1.4 1.7 2 3.8 2.5 2 .4 2.8.8 2.9 1.6.2.9-.8 1.8-2.3 2.2-1.5.4-3 .2-4.1-.6" /><path d="M16.8 13.6c.7 1.7-.7 3.8-3.4 4.6-2.7.8-5.6-.1-6.6-1.9" />' },
  { id: "tailwind", label: "Tailwind", body: '<path d="M5 10.2c1.3-2.1 2.6-3 4-2.7 1 .2 1.8 1 2.6 2 .8 1 1.5 1.8 2.5 2 1.3.2 2.6-.6 4-2.7" /><path d="M3 16.2c1.3-2.1 2.6-3 4-2.7 1 .2 1.8 1 2.6 2 .8 1 1.5 1.8 2.5 2 1.3.2 2.6-.6 4-2.7" />' },
  { id: "bootstrap", label: "Bootstrap", body: '<rect x="5" y="4.5" width="14" height="15" rx="3" /><path d="M9 9h4a2 2 0 010 4H9zM9 13h4.5a2 2 0 010 4H9z" />' },
  { id: "npm", label: "npm", body: '<rect x="3.5" y="8" width="17" height="8" /><path d="M6.5 15v-5h2.2v3.4M10 10h3v5M13 12h2v3M16 10h1.8a1.6 1.6 0 010 3.2H16" />' },
  { id: "yarn", label: "Yarn", body: '<circle cx="8.2" cy="8.2" r="2.2" /><circle cx="14.6" cy="8.8" r="2.2" /><circle cx="11.4" cy="14.8" r="2.2" /><path d="M9.9 9.1l3 4.8M10.2 8.4h2.3" />' },
  { id: "pnpm", label: "pnpm", body: '<rect x="4" y="5" width="3.5" height="3.5" /><rect x="8.3" y="5" width="3.5" height="3.5" /><rect x="12.6" y="5" width="3.5" height="3.5" /><rect x="8.3" y="9.3" width="3.5" height="3.5" /><rect x="12.6" y="9.3" width="3.5" height="3.5" /><rect x="8.3" y="13.6" width="3.5" height="3.5" />' },
  { id: "vite", label: "Vite", body: '<path d="M6 4l6 14 6-14-6 4z" /><path d="M9.5 9.5l2.5 1.7 2.5-1.7" />' },
  { id: "webpack", label: "Webpack", body: '<path d="M12 3.8l7.2 4.1v8.2L12 20.2l-7.2-4.1V7.9z" /><path d="M12 3.8v8.2l7.2 4.1M12 12L4.8 7.9M12 20.2V12" />' },
  { id: "babel", label: "Babel", body: '<rect x="4" y="6.5" width="16" height="11" rx="1.8" /><path d="M8 10h8M8 13.5h5" />' },
  { id: "eslint", label: "ESLint", body: '<path d="M12 4l6.5 3.7v7.6L12 19l-6.5-3.7V7.7z" /><path d="M9 9h6v6H9z" />' },
  { id: "github-actions", label: "GitHub Actions", body: '<circle cx="6.5" cy="7.5" r="1.4" /><circle cx="17.5" cy="7.5" r="1.4" /><circle cx="12" cy="16.5" r="1.4" /><path d="M7.7 8.5l3 6.1M16.3 8.5l-3 6.1M8 7.5h8" />' },
  { id: "android", label: "Android", body: '<path d="M8 7h8a2 2 0 012 2v6H6V9a2 2 0 012-2z" /><path d="M9 7l-1.3-2M15 7l1.3-2M10 10h.01M14 10h.01M8 15v2M16 15v2" />' },
  { id: "apple", label: "Apple", body: '<path d="M14.6 7.2c.7-.8 1.1-1.9 1-3.1-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1 .1 2-.4 2.8-1.3z" /><path d="M16.8 12.3c0-2 1.6-3 1.7-3.1-.9-1.3-2.4-1.5-2.9-1.5-1.2-.1-2.4.7-3 .7-.7 0-1.6-.7-2.7-.6-1.4 0-2.7.8-3.4 2-.9 1.6-.2 4 1 5.7.6.8 1.3 1.8 2.2 1.8.9 0 1.2-.6 2.3-.6s1.3.6 2.3.6c1 0 1.6-.9 2.2-1.7.7-.9 1-1.9 1-2-.1 0-1.9-.8-1.9-3.3z" />' },
  { id: "windows", label: "Windows", body: '<path d="M3 5l8-1v8H3zM13 3.8l8-1v9.2h-8zM3 13h8v8l-8-1zM13 13h8v9.2l-8-1z" />' },
  { id: "ubuntu", label: "Ubuntu", body: '<circle cx="12" cy="12" r="5.2" /><circle cx="12" cy="4.6" r="1.1" /><circle cx="5.7" cy="15.8" r="1.1" /><circle cx="18.3" cy="15.8" r="1.1" /><path d="M12 6.8v2.5M7.6 14.9l2.2-1.3M16.4 14.9l-2.2-1.3" />' },
  { id: "firebase", label: "Firebase", body: '<path d="M7.2 19.5l1.8-11.1 3 4.2-4.8 6.9z" /><path d="M12 12.6L9 8.4l2.4-4.2 5.4 9.5z" /><path d="M16.8 13.7L11.4 4.2l2.8-2.2 3.8 17.5z" />' },
  { id: "heroku", label: "Heroku", body: '<rect x="6" y="4" width="12" height="16" rx="2" /><path d="M10 8v8M14 10v6M10 12h4" />' },
  { id: "openai", label: "OpenAI", body: '<circle cx="12" cy="12" r="2.2" /><path d="M12 4.5a3.6 3.6 0 013.6 3.6v.2a3.6 3.6 0 01-3.6 3.6 3.6 3.6 0 01-3.6-3.6" /><path d="M6.2 7.8a3.6 3.6 0 015 .2l.2.2a3.6 3.6 0 01.1 5.1 3.6 3.6 0 01-5.1.1" /><path d="M7.2 16.7a3.6 3.6 0 01-.1-5.1l.1-.2a3.6 3.6 0 015-.1 3.6 3.6 0 01.2 5" /><path d="M16.8 16.2a3.6 3.6 0 01-5-.2l-.2-.2a3.6 3.6 0 01-.1-5.1 3.6 3.6 0 015.1-.1" /><path d="M17.8 7.3a3.6 3.6 0 01.1 5.1l-.1.2a3.6 3.6 0 01-5 .1 3.6 3.6 0 01-.2-5" /><path d="M8 4.2a3.6 3.6 0 015 .2l.2.2a3.6 3.6 0 01.1 5.1 3.6 3.6 0 01-5 .1" />' },
  { id: "claude", label: "Claude", body: '<path d="M8 4h8a4 4 0 010 8H8a4 4 0 010-8z" /><path d="M8 12h8a4 4 0 010 8H8a4 4 0 010-8z" /><path d="M8 8h8M8 16h8" />' },
  { id: "gemini", label: "Gemini", body: '<path d="M12 3l2.3 4.7L19 10l-4.7 2.3L12 17l-2.3-4.7L5 10l4.7-2.3z" /><path d="M12 7.2v5.6M9.2 10h5.6" />' },
  { id: "cursor-ai", label: "Cursor", body: '<path d="M5 5h14v14H5z" /><path d="M9 9l6 3-6 3z" /><path d="M9 9v6" />' },
  { id: "copilot", label: "Copilot", body: '<rect x="4" y="5" width="16" height="12" rx="3" /><circle cx="9" cy="11" r="1.2" /><circle cx="15" cy="11" r="1.2" /><path d="M8 15h8" />' },
  { id: "windsurf", label: "Windsurf", body: '<path d="M4 15c2-2.3 4-3.5 6-3.5 2.7 0 4.5 2.1 6 4.5" /><path d="M5 10c1.6-1.7 3.2-2.6 4.8-2.6 2.1 0 3.7 1.5 5.2 3.3" /><path d="M6 6.5c1-.8 2-1.2 3-1.2 1.4 0 2.5.8 3.6 1.9" />' },
  { id: "huggingface", label: "Hugging Face", body: '<circle cx="9" cy="11.5" r="4.2" /><circle cx="15" cy="11.5" r="4.2" /><circle cx="9" cy="11.5" r="0.8" /><circle cx="15" cy="11.5" r="0.8" /><path d="M8.3 14.6c1.2 1.1 2.3 1.6 3.7 1.6s2.5-.5 3.7-1.6" />' },
  { id: "perplexity", label: "Perplexity", body: '<path d="M12 3l7 4v10l-7 4-7-4V7z" /><path d="M8 9h8M8 12h8M8 15h5" />' },
  { id: "ollama", label: "Ollama", body: '<rect x="6" y="4.5" width="12" height="15" rx="4" /><circle cx="10" cy="11" r="1.1" /><circle cx="14" cy="11" r="1.1" /><path d="M9.5 14.3h5" />' },
  { id: "langchain", label: "LangChain", body: '<path d="M6 7h6v6H6zM12 11h6v6h-6z" /><path d="M10 9l4 4" />' },
  { id: "pinecone", label: "Pinecone", body: '<path d="M12 4c3 2.2 4.6 4.9 4.6 8.1 0 2.9-1.5 5.3-4.6 7.1-3.1-1.8-4.6-4.2-4.6-7.1 0-3.2 1.6-5.9 4.6-8.1z" /><path d="M12 7v10M9.6 10h4.8M9.6 13h4.8" />' },
  { id: "qdrant", label: "Qdrant", body: '<circle cx="10" cy="10" r="5" /><path d="M13.5 13.5L18.5 18.5" /><circle cx="10" cy="10" r="1.2" />' },
  { id: "milvus", label: "Milvus", body: '<path d="M4 18V6l4 4 4-6 4 6 4-4v12" /><path d="M8 18v-6M16 18v-6" />' },
  { id: "datadog", label: "Datadog", body: '<path d="M5 15V9l4-3 4 2 4-2v9z" /><path d="M8 12h.01M12 11h.01M16 10h.01" />' },
  { id: "grafana", label: "Grafana", body: '<circle cx="12" cy="12" r="6.5" /><path d="M12 12l5-2.2" /><circle cx="12" cy="12" r="1.4" /><path d="M8 7l1.5 2.2M16 8.5l-2 1.3M7 13h2.5" />' },
  { id: "prometheus", label: "Prometheus", body: '<circle cx="12" cy="12" r="6.8" /><path d="M12 12l3.8-2.2" /><circle cx="12" cy="12" r="1.6" /><path d="M12 5v2M5 12h2M17 12h2M12 17v2" />' },
  { id: "sentry", label: "Sentry", body: '<path d="M5 14c1.1-2.8 3.3-4.2 6.2-4.2 2.9 0 5 1.4 6.2 4.2" /><path d="M7 10.5c.5-2.1 2-3.2 4.2-3.2 2.1 0 3.6 1.1 4.2 3.2" /><path d="M12 13.2a2.2 2.2 0 110 4.4 2.2 2.2 0 010-4.4z" />' },
  { id: "linear", label: "Linear", body: '<path d="M7 4v16M7 4h10M7 12h8M7 20h10" />' },
  { id: "asana", label: "Asana", body: '<circle cx="8" cy="15" r="2.2" /><circle cx="12" cy="8.5" r="2.2" /><circle cx="16" cy="15" r="2.2" />' },
  { id: "discord", label: "Discord", body: '<path d="M6 7.5c2.5-1 5.5-1 8 0l1.2 6.7c-2.2 1.6-4.2 2.1-6.2 2.1s-4-.5-6.2-2.1z" /><circle cx="9.4" cy="11.6" r="0.9" /><circle cx="14.6" cy="11.6" r="0.9" /><path d="M8.2 15c1.2.8 2.4 1.1 3.8 1.1s2.6-.3 3.8-1.1" />' },
  { id: "reddit", label: "Reddit", body: '<circle cx="12" cy="12.5" r="5.2" /><circle cx="9.8" cy="12.3" r="0.8" /><circle cx="14.2" cy="12.3" r="0.8" /><path d="M9.6 14.8c.8.6 1.6.9 2.4.9s1.6-.3 2.4-.9" /><path d="M13.2 8.7l2.8.8" /><circle cx="17.2" cy="10.1" r="1" />' },
  { id: "tiktok", label: "TikTok", body: '<path d="M14 5v7.5a3.5 3.5 0 11-3.5-3.5" /><path d="M14 5c.7 1.8 2 2.8 4 3" />' },
  { id: "railway", label: "Railway", body: '<path d="M5 18V6h2.6l2.2 3.3L12 6h2.8v12" /><path d="M5 14h10" />' },
  { id: "render", label: "Render", body: '<path d="M5 5h6a4 4 0 010 8H5z" /><path d="M11 13l4 6" />' },
  { id: "flyio", label: "Fly.io", body: '<path d="M4 14l8-9 8 9" /><path d="M7 14l5-5 5 5" /><path d="M10 14l2-2 2 2" />' },
  { id: "coolify", label: "Coolify", body: '<path d="M5 6h14l-7 12z" /><path d="M12 6v12" />' },
  { id: "chat", label: "Chat", body: '<path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H11l-4 4v-4H6.5A2.5 2.5 0 014 13.5z" /><path d="M8 9.5h8M8 12.5h5" />' },
  { id: "obsidian", label: "Obsidian", body: '<path d="M12 3l6.5 4.2-1.2 9.3L12 21l-5.3-4.5-1.2-9.3z" /><path d="M9 9l3 9 3-9-3-3z" />' },
  { id: "stackoverflow", label: "Stack Overflow", body: '<path d="M7 18h10M8.2 15.8h7.6M8.8 13.6l7 1.4M10 11.3l6.2 2.2M11.7 9.2l5.1 3M14 7.5l3.3 4.1" /><path d="M6 9v9h12V9" />' },
  { id: "medium", label: "Medium", body: '<ellipse cx="8" cy="12" rx="3" ry="5" /><ellipse cx="13.8" cy="12" rx="2" ry="4" /><ellipse cx="18" cy="12" rx="1.2" ry="3" />' },
  { id: "devto", label: "DEV.to", body: '<rect x="4" y="6" width="16" height="12" rx="2" /><path d="M7.5 10v4M9.5 10h1.8a2 2 0 010 4H9.5M13 10l1.4 4 1.4-4M17 10h2.3M17 12h2" />' },
  { id: "chrome", label: "Chrome", body: '<circle cx="12" cy="12" r="3.2" /><path d="M12 3a9 9 0 017.8 4.5H12" /><path d="M4.2 7.5A9 9 0 0112 3l3.8 6.5" /><path d="M8.2 19.8A9 9 0 014.2 7.5h7.6" /><path d="M15.8 19.8a9 9 0 01-7.6 0l3.8-6.5" /><path d="M19.8 7.5a9 9 0 01-4 12.3l-3.8-6.5" />' },
  { id: "safari", label: "Safari", body: '<circle cx="12" cy="12" r="8.7" /><path d="M12 6.2v5.8l4.5 2.6" /><path d="M14.8 9.2l1.7-3.4-3.4 1.7z" />' },
  { id: "edge", label: "Edge", body: '<path d="M5.2 14.8c0-3.7 2.8-6.6 6.4-6.6 2.9 0 5 1.8 5.7 4.3-1-.9-2.4-1.3-3.9-1.3-2.5 0-4.6 1.2-5.8 3.6-.7 1.3-.7 2.5-.5 3.4-1.2-.7-1.9-1.8-1.9-3.4z" /><path d="M18.2 13.5c-.6 2.8-2.9 4.7-5.8 4.7-3.6 0-6.5-2.6-6.5-5.8 0-.6.1-1.2.3-1.8.8 1.9 2.9 3.1 5.7 3.1 2.2 0 4.5-.1 6.3-.2z" />' },
  { id: "brave", label: "Brave", body: '<path d="M7 5l5-2 5 2 2 4-2 8-5 4-5-4-2-8z" /><path d="M9.2 10.2l1.1 3h3.4l1.1-3M10 9h4" />' },
  { id: "stripe", label: "Stripe", body: '<path d="M6 10.2c0-1.7 1.4-2.8 3.6-2.8 1.1 0 2.3.2 3.6.8v2.2a6.3 6.3 0 00-3-.8c-.9 0-1.3.3-1.3.7 0 .5.6.7 1.6 1 1.6.4 3.6.9 3.6 3.1 0 1.8-1.4 2.9-3.7 2.9-1.4 0-2.8-.3-4-.9V14a8 8 0 003.8 1.1c.9 0 1.3-.3 1.3-.8 0-.5-.6-.7-1.5-1-1.7-.4-4-.9-4-3.1z" />' },
  { id: "paypal", label: "PayPal", body: '<path d="M8 6h5a3 3 0 010 6H9.7L9 16H6.5L8 6z" /><path d="M11 8h4a2.6 2.6 0 010 5.2h-3.1l-.5 2.8H8.8" />' },
  { id: "shield", label: "Shield", body: '<path d="M12 3l7 3v5.8c0 4.3-2.7 7.6-7 9.2-4.3-1.6-7-4.9-7-9.2V6z" /><path d="M9 12l2 2 4-4" />' },
  { id: "key", label: "Key", body: '<circle cx="8.2" cy="11.8" r="3.2" /><path d="M11.4 11.8H20M16 11.8v2M18.4 11.8v2" />' },
  { id: "camera", label: "Camera", body: '<rect x="4" y="7" width="16" height="11" rx="2" /><path d="M8 7l1.4-2h5.2L16 7" /><circle cx="12" cy="12.5" r="2.7" />' },
  { id: "image", label: "Image", body: '<rect x="3.5" y="4" width="17" height="14" rx="2" /><path d="M6 14l3.1-3.5 2.9 2.9 2.4-2.4 3.6 3.7" /><circle cx="8.2" cy="8.3" r="1" />' },
  { id: "file-code", label: "File Code", body: '<path d="M7 4h7l4 4v12H7z" /><path d="M14 4v4h4" /><path d="M10.2 13l-1.7 1.7 1.7 1.7M13.8 13l1.7 1.7-1.7 1.7" />' },
  { id: "clipboard", label: "Clipboard", body: '<rect x="6" y="5" width="12" height="15" rx="2" /><rect x="9" y="3" width="6" height="3.5" rx="1.2" /><path d="M9 11h6M9 14h6M9 17h4" />' },
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

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const buildIconSvg = (icon: IconDefinition, className = "md-inline-icon", title?: string): string => {
  const safeTitle = title ? `<title>${escapeHtml(title)}</title>` : "";
  const ariaHidden = title ? "false" : "true";
  const role = title ? "img" : "presentation";
  return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="${role}" aria-hidden="${ariaHidden}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet" focusable="false">${safeTitle}${icon.body}</svg>`;
};
