import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, ChevronRight } from "lucide-react";
import Circle from "@/components/ui/circle";

export default function Notice() {
  const [selectId, setSelectId] = useState<number>(1);

  const fetchNoticeList = async () => {
    return [
      { id: 1, title: "Welcome to join us!" },
      { id: 2, title: "New photography contest announced" },
      { id: 3, title: "Update: Gallery features improved" },
      { id: 4, title: "Community guidelines updated" },
      { id: 5, title: "Monthly showcase submissions open" },
      { id: 6, title: "New member spotlight: John Doe" },
      { id: 7, title: "Technical maintenance notice" },
      { id: 8, title: "Exclusive workshop registration" },
      { id: 9, title: "Year-end celebration event" },
    ];
  };

  const { data: noticeData } = useQuery({
    queryKey: ['notice'],
    queryFn: fetchNoticeList,
    staleTime: Infinity,
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
          {noticeData?.map((notice) => (
            <div
              key={notice.id}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-2 group
                ${selectId === notice.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-background hover:bg-accent'
                }
              `}
              onClick={() => setSelectId(notice.id)}
            >
              <p className="font-medium text-sm truncate flex-1">{notice.title}</p>
              <ChevronRight className={`h-4 w-4 shrink-0 transition-opacity
                ${selectId === notice.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
              `} />
            </div>
          ))}
        </div>

        {/* 右侧详情 */}
        <div className="flex-1 h-[500px] border rounded-lg bg-background">
          <Circle id={selectId || 1} />
        </div>
      </div>
    </div>
  );
}