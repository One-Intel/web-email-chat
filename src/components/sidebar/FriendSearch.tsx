
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

const FormSchema = z.object({
  userCode: z.string().min(6).max(6)
});

type FormValues = z.infer<typeof FormSchema>;

interface FriendSearchProps {
  onSearch: (data: FormValues) => Promise<void>;
  searchResult: any;
  searchError: string | null;
  searchLoading: boolean;
  onAddFriend: () => void;
  onStartChat?: (userId: string) => void;
}

export const FriendSearch = ({
  onSearch,
  searchResult,
  searchError,
  searchLoading,
  onAddFriend,
  onStartChat
}: FriendSearchProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      userCode: "",
    },
  });

  const handleStartChat = () => {
    if (searchResult && onStartChat) {
      onStartChat(searchResult.id);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Find Friends</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSearch)} className="flex space-x-2">
          <FormField
            control={form.control}
            name="userCode"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter 6-digit User ID"
                      {...field}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={searchLoading}>
            Find
          </Button>
        </form>
      </Form>

      {searchError && <p className="text-sm text-red-500">{searchError}</p>}

      {searchResult && (
        <Card className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={searchResult.avatar_url} />
              <AvatarFallback>
                {searchResult.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{searchResult.full_name}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="space-x-1"
              onClick={handleStartChat}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="space-x-1"
              onClick={onAddFriend}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
