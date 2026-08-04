import type { TemplateVariable } from "../components/TemplateEditor";

export type MarketplaceTemplate = {
  id: string;
  name: string;
  description: string;
  layoutPreset: string;
  tags: string[];
  category: "post" | "story" | "flyer";
  price: number;
  isPremium: boolean;
  previewGradient: string;
  previewUrl?: string;
  htmlCode?: string;
  jsonData?: string;
  variables: TemplateVariable[];
  templateData?: {
    htmlCode: string;
    jsonData: string;
    variables: TemplateVariable[];
  };
  sellerId?: string;
  createdBy?: string;
  isUserGenerated?: boolean;
};

const SAMPLE_JSON = JSON.stringify(
  { event_name: "Leadership Summit", date: "July 8, 2026", time: "6:00 PM", location: "Nairobi Serena Hotel" },
  null,
  2
);

const STORY_JSON = JSON.stringify(
  {
    event_name: "Community Mixer",
    date: "July 15, 2026",
    time: "5:30 PM",
    location: "iHub Nairobi",
    description: "Network with fellow club members.",
  },
  null,
  2
);

const VARS: TemplateVariable[] = [
  { key: "event_name", label: "Event name" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
  { key: "description", label: "Description" },
];

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: "mp-classic-purple",
    name: "Classic Purple",
    description: "Clean gradient invite perfect for formal club events.",
    layoutPreset: "ig-portrait",
    tags: ["minimal", "formal", "club"],
    category: "post",
    price: 0,
    isPremium: false,
    previewGradient: "from-[#7877C6]/30 to-[#a5a4e0]/40",
    htmlCode: `<!DOCTYPE html><html><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1350px;font-family:Inter,sans-serif;background:linear-gradient(135deg,#7877C6,#a5a4e0);display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;padding:60px}.label{font-size:28px;opacity:.85;letter-spacing:.2em;text-transform:uppercase;margin-bottom:24px}h1{font-size:72px;font-weight:800;line-height:1.1;margin-bottom:32px}.meta{font-size:32px;opacity:.9}</style></head><body><p class="label">You're invited</p><h1 id="event_name"></h1><p class="meta" id="datetime"></p><p class="meta" id="location" style="margin-top:16px"></p><script>var d=window.__data__||{};document.getElementById('event_name').textContent=d.event_name||'';document.getElementById('datetime').textContent=(d.date||'')+(d.time?' · '+d.time:'');document.getElementById('location').textContent=d.location||'';</script></body></html>`,
    jsonData: SAMPLE_JSON,
    variables: VARS,
  },
  {
    id: "mp-bold-story",
    name: "Bold Story",
    description: "High-impact vertical layout for Instagram Stories.",
    layoutPreset: "ig-story",
    tags: ["story", "bold", "social"],
    category: "story",
    price: 499,
    isPremium: true,
    previewGradient: "from-emerald-200 to-teal-100",
    htmlCode: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}html,body{width:1080px;height:1920px;font-family:system-ui;background:#0f172a;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:80px}h1{font-size:88px;font-weight:800;line-height:1}p{font-size:36px;margin-top:24px;color:#94a3b8}</style></head><body><h1 id="event_name"></h1><p id="details"></p><script>var d=window.__data__||{};document.getElementById('event_name').textContent=d.event_name||'';document.getElementById('details').textContent=[d.date,d.time,d.location].filter(Boolean).join(' · ');</script></body></html>`,
    jsonData: STORY_JSON,
    variables: VARS,
  },
  {
    id: "mp-minimal-post",
    name: "Minimal White",
    description: "Light, editorial style for professional associations.",
    layoutPreset: "ig-portrait",
    tags: ["minimal", "professional", "post"],
    category: "post",
    price: 299,
    isPremium: true,
    previewGradient: "from-gray-100 to-gray-50",
    htmlCode: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}html,body{width:1080px;height:1350px;font-family:Georgia,serif;background:#fafafa;color:#111;display:flex;flex-direction:column;justify-content:center;padding:100px;border:24px solid #7877C6}h1{font-size:64px;margin-bottom:40px}p{font-size:28px;color:#555;line-height:1.6}</style></head><body><h1 id="event_name"></h1><p id="meta"></p><script>var d=window.__data__||{};document.getElementById('event_name').textContent=d.event_name||'';document.getElementById('meta').textContent=[d.date,d.time,'\\n',d.location].filter(Boolean).join(' ');</script></body></html>`,
    jsonData: SAMPLE_JSON,
    variables: VARS,
  },
  {
    id: "mp-festive-story",
    name: "Festive Night",
    description: "Vibrant story template for socials and mixers.",
    layoutPreset: "ig-story",
    tags: ["story", "party", "social"],
    category: "story",
    price: 399,
    isPremium: true,
    previewGradient: "from-rose-200 to-amber-100",
    htmlCode: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}html,body{width:1080px;height:1920px;background:linear-gradient(180deg,#f43f5e,#f59e0b);font-family:system-ui;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px}h1{font-size:80px;font-weight:900}p{font-size:34px;margin-top:28px}</style></head><body><div><h1 id="event_name"></h1><p id="when"></p></div><script>var d=window.__data__||{};document.getElementById('event_name').textContent=d.event_name||'';document.getElementById('when').textContent=(d.date||'')+(d.time?' at '+d.time:'');</script></body></html>`,
    jsonData: STORY_JSON,
    variables: VARS,
  },
  {
    id: "mp-calendar-pro",
    name: "Monthly Calendar Pro",
    description: "Print-ready A4 calendar with event rows.",
    layoutPreset: "calendar-a4",
    tags: ["calendar", "print", "flyer"],
    category: "flyer",
    price: 799,
    isPremium: true,
    previewGradient: "from-sky-100 to-indigo-50",
    htmlCode: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}html,body{width:794px;height:1123px;font-family:system-ui;padding:48px}h1{font-size:36px;color:#7877C6;margin-bottom:32px}.row{padding:16px 0;border-bottom:1px solid #e5e7eb;font-size:18px}</style></head><body><h1>Upcoming Events</h1><div id="list"></div><script>var d=window.__data__||[];var el=document.getElementById('list');(Array.isArray(d)?d:[d]).forEach(function(e){var div=document.createElement('div');div.className='row';div.textContent=[e.name||e.event_name,e.date,e.time,e.location].filter(Boolean).join(' · ');el.appendChild(div);});</script></body></html>`,
    jsonData: JSON.stringify(
      [
        { name: "Leadership Summit", date: "Jul 8", time: "6:00 PM", location: "Serena Hotel" },
        { name: "Community Mixer", date: "Jul 15", time: "5:30 PM", location: "iHub" },
      ],
      null,
      2
    ),
    variables: [{ key: "events", label: "Events" }],
  },
  {
    id: "mp-community-post",
    name: "Community Warm",
    description: "Friendly post template for chamas and youth groups.",
    layoutPreset: "ig-portrait",
    tags: ["community", "chama", "warm"],
    category: "post",
    price: 0,
    isPremium: false,
    previewGradient: "from-amber-100 to-orange-50",
    htmlCode: `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}html,body{width:1080px;height:1350px;background:#fff8f0;font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;text-align:center}h1{font-size:68px;color:#D85A30}p{font-size:30px;color:#78716c;margin-top:24px}</style></head><body><h1 id="event_name"></h1><p id="info"></p><script>var d=window.__data__||{};document.getElementById('event_name').textContent=d.event_name||'';document.getElementById('info').textContent=[d.date,d.time,d.location].filter(Boolean).join(' · ');</script></body></html>`,
    jsonData: SAMPLE_JSON,
    variables: VARS,
  },
];

export const MARKETPLACE_CATEGORIES: { id: "all" | "post" | "story" | "flyer"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "post", label: "Post" },
    { id: "story", label: "Story" },
    { id: "flyer", label: "Square" },
];