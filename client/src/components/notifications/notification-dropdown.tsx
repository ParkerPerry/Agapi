import * as React from "react";
import { useLocation } from "wouter";
import { Bell, Trash2, X, FlaskConical, Users, MessageCircle, Mail, CircleAlert } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Notification } from "@shared/schema";

export function NotificationDropdown() {
  const [_, setLocation] = useLocation();
  const { notifications, unreadCount, markAsRead, deleteNotification, deleteAllNotifications } = useNotifications();

  const handleAction = (notification: Notification) => {
    if (notification.metadata?.actionUrl) {
      setLocation(notification.metadata.actionUrl);
    }
    markAsRead(notification.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
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
              onClick={() => deleteAllNotifications()}
              className="h-auto p-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Dismiss all
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
                    "grid grid-cols-[36px,1fr,16px] items-start gap-2 p-4 hover:bg-muted/50",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  <div className="flex justify-center items-start pt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 rounded-full bg-muted">
                            {notification.type === "lab_experiment" && (
                              <FlaskConical className="h-4 w-4 text-blue-500" />
                            )}
                            {notification.type === "circle_invite" && (
                              <Users className="h-4 w-4 text-green-500" />
                            )}
                            {notification.type === "follower_interaction" && (
                              <MessageCircle className="h-4 w-4 text-purple-500" />
                            )}
                            {notification.type === "mention" && (
                              <Mail className="h-4 w-4 text-amber-500" />
                            )}
                            {notification.type === "circle_update" && (
                              <CircleAlert className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{notification.type.replace("_", " ")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div onClick={() => handleAction(notification)} className="cursor-pointer">
                    <p className="text-sm">{notification.content}</p>
                    {notification.type === "lab_experiment" && notification.metadata?.labName && (
                      <p className="text-xs font-medium text-blue-500 mt-1">
                        Lab: {notification.metadata.labName}
                        {notification.metadata.circleName && ` • Circle: ${notification.metadata.circleName}`}
                        {notification.metadata.circleRole && ` • Role: ${notification.metadata.circleRole}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
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