import * as React from "react";
import { useLocation } from "wouter";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

export function NotificationDropdown() {
  const [_, setLocation] = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleAction = (notification: Notification) => {
    if (notification.metadata?.actionUrl) {
      setLocation(notification.metadata.actionUrl);
    }
    markAsRead(notification.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-auto p-2"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="grid gap-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "grid grid-cols-[1fr,16px] items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  <div onClick={() => handleAction(notification)}>
                    <p className="text-sm">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}