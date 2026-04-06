import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { useFunction } from "@/context/function";
import { Notice } from "@/types";
import Circle from "@/components/ui/circle";

export default function NoticePage() {
  const { fetchNotices } = useFunction();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const { data: noticeData } = useQuery({
    queryKey: ['notices'],
    queryFn: fetchNotices,
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="h-6 w-6" />
        <h1 className="text-2xl font-bold">消息通知</h1>
      </div>

      <div className="w-full flex gap-4">
        {/* 左侧通知列表 */}
        <div className="w-[320px] h-[500px] overflow-y-auto flex flex-col gap-2 border rounded-lg p-2 bg-muted/30">
          {noticeData?.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3 text-center">
              暂无通知
            </div>
          ) : (
            noticeData?.map((notice) => (
              <div
                key={notice.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 group
                  ${selectedNotice?.id === notice.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background hover:bg-accent'
                  }
                `}
                onClick={() => setSelectedNotice(notice)}
              >
                <p className="font-medium text-sm truncate flex-1">{notice.title}</p>
                <ChevronRight className={`h-4 w-4 shrink-0 transition-opacity
                  ${selectedNotice?.id === notice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
                `} />
              </div>
            ))
          )}
        </div>

        {/* 右侧详情 */}
        <div className="flex-1 h-[500px] border rounded-lg bg-background">
          {selectedNotice ? (
            <Circle notice={selectedNotice} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              请选择一条通知查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}