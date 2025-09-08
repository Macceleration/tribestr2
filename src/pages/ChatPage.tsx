import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ConversationsList } from "@/components/chat/ConversationsList";
import { ChatView } from "@/components/chat/ChatView";
import { LoginArea } from "@/components/auth/LoginArea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Lock } from "lucide-react";

const ChatPage = () => {
  const { user } = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPubkey, setSelectedPubkey] = useState<string | undefined>(
    searchParams.get('with') || undefined
  );

  useSeoMeta({
    title: 'Messages - Tribes',
    description: 'Encrypted direct messages with tribe members.',
  });

  const handleSelectConversation = (pubkey: string) => {
    setSelectedPubkey(pubkey);
    setSearchParams({ with: pubkey });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 px-8 text-center">
              <div className="max-w-sm mx-auto space-y-6">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">Login Required</h3>
                  <p className="text-muted-foreground">
                    Please log in to access your encrypted messages
                  </p>
                </div>
                <LoginArea className="max-w-60 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            💬 Messages
          </h1>
          <p className="text-muted-foreground">
            Encrypted direct messages with tribe members
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Conversations</h2>
              </div>
              <ConversationsList
                selectedPubkey={selectedPubkey}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>

          {/* Chat View */}
          <div className="lg:col-span-2">
            {selectedPubkey ? (
              <ChatView otherUserPubkey={selectedPubkey} />
            ) : (
              <Card className="h-[600px]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="text-4xl">💬</div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">Select a conversation</h3>
                      <p className="text-muted-foreground">
                        Choose a conversation from the list to start chatting
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;