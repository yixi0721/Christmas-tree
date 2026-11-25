// 将共享画布、当款场景和交互直接装进每份 HTML。只需 Node.js 标准库。
import { readFile, writeFile } from "node:fs/promises";

const source = name => new URL(name, import.meta.url);
const editions = [
  { name: "玫瑰星愿", scene: "rose.js", sky: "#100812", color: "#F28DBA", heartColor: "#F28DBA", count: 4600, greeting: "Merry Christmas", letter: `` },
  { name: "冰晶回旋", scene: "ice.js", sky: "#050d17", color: "#9CDEFF", count: 3750, greeting: "愿星光为你停留", letter: `` },
  { name: "平安夜灯火", scene: "fir.js", sky: "#07100e", color: "#FFBD69", count: 3950, greeting: "岁岁平安", letter: `` }
];
// 导出的正文仍可直接回车换行，文字里的特殊字符按原样显示。
function letterLiteral(value) {
  const escaped = value.replace(/\\|`|\$\{|</g, token => token === "<" ? "\\u003c" : "\\" + token);
  return "`" + escaped + "`";
}
const read = name => readFile(source(name), "utf8");
const [template, drawing, effects, letterArt, letter, player] = await Promise.all(
  ["page.tmpl", "drawing.js", "effects.js", "letter-art.js", "letter.js", "player.js"].map(read)
);
for (const edition of editions) {
  const colors = edition.heartColor
    ? [`color: "${edition.color}",         // 树身主色`, `heartColor: "${edition.heartColor}",     // 爱心与夜空的主光色`]
    : [`color: "${edition.color}",         // 主光颜色，使用六位十六进制色值`];
  const parts = {
    NAME: edition.name, SKY: edition.sky, COLORS: colors.join("\n      "), COUNT: edition.count,
    GREETING: JSON.stringify(edition.greeting).replaceAll("<", "\\u003c"),
    LETTER_TEXT: letterLiteral(edition.letter),
    DRAWING: drawing.trimEnd(), EFFECTS: effects.trimEnd(), SCENE: (await read(edition.scene)).trimEnd(),
    LETTER_ART: letterArt.trimEnd(), LETTER: letter.trimEnd(), PLAYER: player.trimEnd()
  };
  const html = template.replace(/__(\w+)__/g, (token, key) => {
    if (!Object.hasOwn(parts, key)) throw new Error("未知模板标记 " + token);
    return parts[key];
  });
  await writeFile(source("../" + edition.name + ".html"), html, "utf8");
}
const [lesson, preview] = await Promise.all([read("tutorial.tmpl"), readFile(source("../三款预览.webp"))]);
await writeFile(source("../制作教程.html"),
  lesson.replace("__PREVIEW_IMAGE__", "data:image/webp;base64," + preview.toString("base64")), "utf8");
