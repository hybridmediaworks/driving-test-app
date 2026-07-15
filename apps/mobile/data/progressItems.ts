export type ProgressItemType = "manual" | "nav";

export type ProgressItemData = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: ProgressItemType;
  href?: string;
};

export const PROGRESS_ITEMS: ProgressItemData[] = [
  {
    id: "manual",
    title: "Manual",
    subtitle: "Please confirm you've read it",
    image:
      "https://images.pexels.com/photos/1098743/pexels-photo-1098743.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    type: "manual",
  },
  {
    id: "practice",
    title: "Practice Tests",
    subtitle: "0 of 7 tests completed",
    image:
      "https://images.pexels.com/photos/259571/pexels-photo-259571.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    type: "nav",
    href: undefined,
  },
  {
    id: "challenge",
    title: "Challenge Bank™",
    subtitle: "2 questions left",
    image:
      "https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    type: "nav",
    href: "/(tabs)/challange-bank",
  },
  {
    id: "marathon",
    title: "Marathon Tests",
    subtitle: "0 of 309 questions completed",
    image:
      "https://images.pexels.com/photos/1687093/pexels-photo-1687093.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    type: "nav",
    href: "/test/see-all?difficulty=hard",
  },
  {
    id: "exam",
    title: "Exam Simulator",
    subtitle: "0 of 3 exam passed",
    image:
      "https://images.pexels.com/photos/1178449/pexels-photo-1178449.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop",
    type: "nav",
    href: "/test/see-all?difficulty=hardest",
  },
];
