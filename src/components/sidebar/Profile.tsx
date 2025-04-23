
import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export const Profile = () => {
  const { profile, isLoading } = useProfile();
  const { user } = useAuth();

  if (isLoading) return <div>Loading profile...</div>;
  return (
    <Card className="p-4 flex items-center gap-4">
      <Link to={`/profile/${user?.id}`}>
        <Avatar className="h-16 w-16 cursor-pointer">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>
            {profile?.full_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <Link to={`/profile/${user?.id}`} className="hover:underline font-semibold block">
          {profile?.full_name}
        </Link>
        {/* No edit button here, only view profile */}
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link to={`/profile/${user?.id}`}>View Profile</Link>
        </Button>
      </div>
    </Card>
  );
};
