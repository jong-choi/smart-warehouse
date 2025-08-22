import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "@/styles/small-header-markdown.css";

type Props = {
  children?: string;
};

export default function ReactMarkdownApp({ children }: Props) {
  return (
    <div className="new-york-small whitespace-normal">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkParse, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
