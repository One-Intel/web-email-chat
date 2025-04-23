
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";

interface FriendSearchProps {
  onSearch: (userCode: string) => Promise<void>;
  searchResult: any;
  searchError: string | null;
  searchLoading: boolean;
  onAddFriend: () => Promise<void>;
}

export const FriendSearch: React.FC<FriendSearchProps> = ({
  onSearch,
  searchResult,
  searchError,
  searchLoading,
  onAddFriend
}) => {
  const { register, handleSubmit, reset } = useForm<{ userCode: string }>();
  
  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center mb-2">
        <Search className="h-4 w-4 mr-2" />
        <span className="font-medium">
          Find Friends
        </span>
      </div>
      <form
        onSubmit={handleSubmit(onSearch)}
        className="flex space-x-2"
      >
        <Input
          {...register("userCode", { required: true, minLength: 6, maxLength: 6, pattern: /^[0-9]+$/ })}
          placeholder="Enter 6-digit User ID"
          maxLength={6}
          minLength={6}
          className="font-mono"
        />
        <Button type="submit" variant="default" disabled={searchLoading}>
          {searchLoading ? "..." : "Search"}
        </Button>
      </form>
      {searchError && (
        <p className="text-xs text-red-500">{searchError}</p>
      )}
      {searchResult && (
        <div className="flex items-center justify-between mt-2 bg-accent/50 p-2 rounded">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={searchResult.avatar_url || undefined} />
              <AvatarFallback>
                {searchResult.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <span>{searchResult.full_name}</span>
          </div>
          <Button
            size="sm"
            onClick={onAddFriend}
            variant="default"
          >
            Add Friend
          </Button>
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Enter your friend's User ID to send a friend request.
      </p>
    </Card>
  );
};
