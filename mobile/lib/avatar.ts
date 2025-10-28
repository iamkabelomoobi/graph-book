const palette = [
  { backgroundColor: "#E0E7FF", textColor: "#3730A3" },
  { backgroundColor: "#FEF3C7", textColor: "#B45309" },
  { backgroundColor: "#DCFCE7", textColor: "#047857" },
  { backgroundColor: "#FDE68A", textColor: "#92400E" },
  { backgroundColor: "#FCE7F3", textColor: "#9D174D" },
  { backgroundColor: "#E2E8F0", textColor: "#1E293B" },
  { backgroundColor: "#E0F2FE", textColor: "#0369A1" },
  { backgroundColor: "#F3E8FF", textColor: "#7C3AED" },
] as const;

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getAvatarPalette(name: string) {
  const firstChar = name.trim()[0];
  const charCode = firstChar ? firstChar.toUpperCase().charCodeAt(0) : 0;
  const index = palette.length ? charCode % palette.length : 0;
  return palette[index] ?? palette[0];
}
