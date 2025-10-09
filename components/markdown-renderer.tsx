"use client"

import { useMemo, memo } from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer = memo(({ content, className = "" }: MarkdownRendererProps) => {
  const renderedContent = useMemo(() => {
    if (!content) return ""

    let html = content
      .replace(/^#### (.*$)/gm, '<h4 class="text-sm font-medium mb-1 mt-2">$1</h4>')
      .replace(/^### (.*$)/gm, '<h3 class="text-base font-medium mb-2 mt-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mb-2 mt-4">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mb-3 mt-4">$1</h1>')

      .replace(
        /- \[ \] (.*)/g,
        '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded"> <span>$1</span></div>',
      )
      .replace(
        /- \[x\] (.*)/g,
        '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded"> <span class="line-through text-muted-foreground">$1</span></div>',
      )

      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')

      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // 粗体
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // 斜体
      .replace(/__(.*?)__/g, "<u>$1</u>") // 下划线
      .replace(/~~(.*?)~~/g, "<del>$1</del>") // 删除线
      .replace(/\^(.*?)\^/g, "<sup>$1</sup>") // 上标
      .replace(/~(.*?)~/g, "<sub>$1</sub>") // 下标

      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>',
      )
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')

      .replace(
        /^> (.*$)/gm,
        '<blockquote class="border-l-4 border-muted-foreground/20 pl-4 my-2 italic text-muted-foreground">$1</blockquote>',
      )

      .replace(
        /\[([^\]]+)\]$$([^)]+)$$/g,
        '<a href="$2" class="text-primary underline hover:text-primary/80 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>',
      )

      .replace(/\|(.+)\|/g, (match) => {
        const cells = match
          .split("|")
          .filter((cell) => cell.trim())
          .map((cell) => cell.trim())
        return (
          "<tr>" +
          cells.map((cell) => `<td class="border border-muted-foreground/20 px-2 py-1">${cell}</td>`).join("") +
          "</tr>"
        )
      })

      .replace(/\n/g, "<br>")

    html = html.replace(/(<li[^>]*>.*?<\/li>)/g, (match) => {
      if (!match.includes("<ul>") && !match.includes("<ol>")) {
        return `<ul class="my-2">${match}</ul>`
      }
      return match
    })

    html = html.replace(/(<tr[^>]*>.*?<\/tr>)/g, (match) => {
      if (!match.includes("<table>")) {
        return `<table class="my-2 border-collapse">${match}</table>`
      }
      return match
    })

    return html
  }, [content])

  return (
    <div
      className={`prose prose-sm max-w-none text-left ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  )
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
