"use client";

import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Share2 } from 'lucide-react';

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! How can I help you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user" as const, content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      const aiMessage = { role: "ai" as const, content: data.message };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a notification here if you want
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="w-full bg-black border-b border-purple-500/20 p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            AI Answer Engine
          </h1>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl border border-purple-500/50 text-blue-300 hover:bg-purple-500/20 transition-all"
            title="Share conversation"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32 pt-4">
        <div className="max-w-3xl mx-auto px-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 mb-4 ${
                msg.role === "ai"
                  ? "justify-start"
                  : "justify-end flex-row-reverse"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                  msg.role === "ai"
                    ? "bg-black border border-purple-500/50 text-blue-300 shadow-lg shadow-purple-500/20 markdown-content"
                    : "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 text-pink-300 ml-auto border border-pink-500/30"
                }`}
              >
                {msg.role === "ai" ? (
                  <ReactMarkdown 
                    className="prose prose-invert max-w-none
                      prose-headings:text-purple-300
                      prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4
                      prose-h2:text-lg prose-h2:font-semibold prose-h2:mb-3
                      prose-p:text-blue-300 prose-p:mb-2
                      prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4
                      prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4
                      prose-li:text-blue-300 prose-li:my-1
                      prose-strong:text-pink-300
                      prose-a:text-purple-300 hover:prose-a:text-purple-400"
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 mb-4">
              <div className="px-4 py-2 rounded-2xl bg-black border border-purple-500/50 text-blue-300">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-black border-t border-purple-500/20 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-purple-500/50 bg-black px-4 py-3 text-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent placeholder-purple-300/50"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 text-pink-300 px-5 py-3 rounded-xl hover:from-blue-500/30 hover:via-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-pink-500/30"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}