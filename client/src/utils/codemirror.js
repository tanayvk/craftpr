import { javascript } from "@codemirror/lang-javascript";
import { languages } from "@codemirror/language-data";

const langMap = {};
for (const lang of languages) {
  for (const ext of lang.extensions) {
    langMap[ext] = lang;
  }
}

export const languageSupport = async (filePath) => {
  const extension = (filePath.split(".").pop() || "").toLowerCase();
  const lang = langMap[extension];
  if (lang) return await lang.load();
  return [];
};
