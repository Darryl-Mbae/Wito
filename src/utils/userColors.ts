export interface UserColor {
  bg: string;
  text: string;
  border: string;
  accent: string;
}

export const getAssigneeColor = (name: string): UserColor => {
  const colors: UserColor[] = [
    // { bg: "bg-blue-50/80", text: "text-blue-600", border: "border-blue-100/50", accent: "bg-blue-500" },
    // { bg: "bg-emerald-50/80", text: "text-emerald-600", border: "border-emerald-100/50", accent: "bg-emerald-500" },
    // { bg: "bg-amber-50/80", text: "text-amber-600", border: "border-amber-100/50", accent: "bg-amber-500" },
    // { bg: "bg-rose-50/80", text: "text-rose-600", border: "border-rose-100/50", accent: "bg-rose-500" },
    // { bg: "bg-purple-50/80", text: "text-purple-600", border: "border-purple-100/50", accent: "bg-purple-500" },
    // { bg: "bg-pink-50/80", text: "text-pink-600", border: "border-pink-100/50", accent: "bg-pink-500" },
    // { bg: "bg-cyan-50/80", text: "text-cyan-600", border: "border-cyan-100/50", accent: "bg-cyan-500" },
    { bg: "bg-[#7877C6]/10", text: "text-[#7877C6]", border: "border-[#7877C6]/20", accent: "bg-[#7877C6]" },
  ];

  if (!name) return colors[colors.length - 1]; // default to the primary brand purple color

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
