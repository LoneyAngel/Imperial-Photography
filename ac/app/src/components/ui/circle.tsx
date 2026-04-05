import { useQuery } from "@tanstack/react-query";
import { Bell, Clock, User } from "lucide-react";

export default function Circle({id}: {id: number}) {
    const fetchNoticeByid = async (id: number) => {
        return ({
            id,
            title: "Welcome to join us and become our exclusive photographer！",
            content: "We are excited to welcome you to our community of talented photographers. This is a place where you can share your work, connect with other photographers, and grow your skills. We look forward to seeing your amazing contributions!",
            created_at: "2024-06-01T12:00:00Z",
            created_by: "Admin",
        })
    }
    const { data: noticeData, isLoading } = useQuery({
        queryKey: ['notice', id],
        queryFn: () => fetchNoticeByid(id),
        staleTime: Infinity,
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
                <h2 className="text-xl font-semibold">{noticeData?.title}</h2>
            </div>

            <div className="flex-1 overflow-auto">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {noticeData?.content}
                </p>
            </div>

            <div className="mt-6 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{noticeData?.created_at}</span>
                </div>
                <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{noticeData?.created_by}</span>
                </div>
            </div>
        </div>
    </div>
  );
}