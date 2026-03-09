import { BookOpen, ListTodo, Smartphone } from "lucide-react";

const features = [
  {
    icon: ListTodo,
    title: "メモ エディタ",
    description:
      "一行の短文入力で、ToDoリストのように一覧で確認。思いついたらサッと書き留める。",
  },
  {
    icon: BookOpen,
    title: "ノート エディタ",
    description:
      "長い文章を書きたいときに。同じアプリ内で、用途に応じて切り替えて使える。",
  },
  {
    icon: Smartphone,
    title: "どこからでも",
    description:
      "スマートフォン・PCのブラウザどちらでも。ホーム画面に追加すればアプリとして起動。",
  },
];

export default function WelcomeContent() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="flex flex-col items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/2 p-6 text-center md:p-8"
        >
          <f.icon
            className="h-8 w-8 md:h-10 md:w-10"
            strokeWidth={1.5}
          />
          <h3 className="text-base font-semibold md:text-xl">{f.title}</h3>
          <p className="text-sm leading-relaxed md:text-base md:leading-relaxed">
            {f.description}
          </p>
        </div>
      ))}
    </div>
  );
}
