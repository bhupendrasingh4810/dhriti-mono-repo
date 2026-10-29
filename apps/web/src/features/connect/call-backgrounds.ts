export const CALL_BACKGROUNDS = [
  {
    name: "Bright office",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
  },
  {
    name: "Meeting room",
    url: "https://images.unsplash.com/photo-1706074740295-d7a79c079562?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
  },
  {
    name: "Window office",
    url: "https://images.unsplash.com/photo-1698653223247-09aaf01166fc?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
  },
];

/** Background effect names a user can pick, including the built-in blur. */
export const CALL_BACKGROUND_NAMES = ["None", "Blur", ...CALL_BACKGROUNDS.map((item) => item.name)];
