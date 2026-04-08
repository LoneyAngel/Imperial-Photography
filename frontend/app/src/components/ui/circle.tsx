import { useQuery } from "@tanstack/react-query";
import { Bell, Clock, User } from "lucide-react";
import { Notice } from "@/types";

interface CircleProps {
  notice: Notice;
}

async function fetchNoticeContent(contentUrl: string): Promise<string> {
  try {
    // 通知内容是公开的，直接使用 fetch 获取
    const res = await fetch(contentUrl);
    if (!res.ok) {
      return "无法加载通知内容";
    }
    return await res.text();
  } catch {
    return "无法加载通知内容";
  }
}

export default function Circle({ notice }: CircleProps) {
  const { data: content, isLoading } = useQuery({
    queryKey: ['noticeContent', notice.id],
    queryFn: () => fetchNoticeContent(notice.contentUrl),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6">
      <div className="bg-card border rounded-lg p-6 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{notice.title}</h2>
        </div>

        <div className="flex-1 overflow-auto">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {content || "暂无内容"}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(notice.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>管理员</span>
          </div>
        </div>
      </div>
    </div>
  );
}