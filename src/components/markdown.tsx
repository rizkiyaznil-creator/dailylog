import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders trusted user Markdown (log content, AI narrative) as styled HTML.
 * react-markdown does not use dangerouslySetInnerHTML, so this is XSS-safe.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm prose-slate max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-pre:bg-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
