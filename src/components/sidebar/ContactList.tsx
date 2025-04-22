
import React from "react";
import { useContacts } from "@/hooks/useContacts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

export const ContactList = () => {
  const { contacts, isLoading, addContact } = useContacts();
  const { register, handleSubmit, reset } = useForm<{ email: string }>();
  const [isOpen, setIsOpen] = React.useState(false);

  const onSubmit = handleSubmit(async (data) => {
    await addContact.mutateAsync(data.email);
    setIsOpen(false);
    reset();
  });

  if (isLoading) return <div>Loading contacts...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <Input
                  {...register("email", { required: true })}
                  placeholder="Enter email address"
                  type="email"
                />
              </div>
              <Button type="submit" className="w-full">
                Send Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {contacts?.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
          >
            <Avatar>
              <AvatarImage src={contact.contact.profiles.avatar_url ?? undefined} />
              <AvatarFallback>
                {contact.contact.profiles.full_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {contact.contact.profiles.full_name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {contact.contact.profiles.status_message || contact.contact.email}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
