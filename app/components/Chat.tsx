"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Agent, ContentBlock, TextBlock, BedrockModel } from "@strands-agents/sdk";
import { getForecastTool } from "@/app/tools/openMeteo";
import { getLocationTool } from "@/app/tools/nominatim";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: ContentBlock[];
  timestamp: Date;
}

export default function Chat() {
  const { signOut } = useAuthenticator();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const initializeAgent = async () => {
      try {
        // Amplify Authから認証情報を取得
        const session = await fetchAuthSession();
        
        if (!session.credentials) {
          console.error("認証情報が取得できませんでした");
          return;
        }

        // BedrockModelを認証情報付きで初期化
        const bedrockModel = new BedrockModel({
          clientConfig: {
            credentials: {
              accessKeyId: session.credentials.accessKeyId!,
              secretAccessKey: session.credentials.secretAccessKey!,
              sessionToken: session.credentials.sessionToken,
            },
          },
        });

        // Agentを初期化
        const systemPrompt = `
        あなたは天気予報を行うエージェントです。
        以下のルールに従ってください。
        - 現在の天気を取得する場合は、getForecastToolを使用してください。
        - 位置情報を取得する場合は、getLocationToolを使用して取得したものを使用してください。
        - 位置情報の検索するときのqueryは、必ず英語表記してください。
        `;
        const newAgent = new Agent({
          model: bedrockModel,
          systemPrompt: systemPrompt,
          tools: [getForecastTool, getLocationTool],
        });

        setAgent(newAgent);
      } catch (error) {
        console.error("Agentの初期化に失敗しました:", error);
      }
    };

    initializeAgent();
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: [
        new TextBlock('こんにちは！天気についてお聞きしたいことがあれば、お気軽にどうぞ。'),
      ],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: [new TextBlock(input.trim())],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (!agent) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: [new TextBlock("エージェントが初期化されていません。しばらく待ってから再度お試しください。")],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await agent.invoke(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.lastMessage?.content ?? [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error invoking agent:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: [new TextBlock("エラーが発生しました。もう一度お試しください。")],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* ヘッダー */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              天気エージェント
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              天気について何でもお聞きください
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-950"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {message.content.map((content, index) => {
                    if (content.type === "textBlock") {
                      return <p key={`${message.id}-${index}`}>{content.text}</p>;
                    }
                    if (content.type === "toolUseBlock") {
                      return (
                        <p key={`${message.id}-${index}`} className="text-xs italic opacity-75">
                          ツール使用: {content.name}
                        </p>
                      );
                    }
                    if (content.type === "toolResultBlock") {
                      return (
                        <p key={`${message.id}-${index}`} className="text-xs italic opacity-75">
                          ツール結果: {content.status === "success" ? "成功" : "エラー"}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    message.role === "user"
                      ? "text-blue-100"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-zinc-900">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力フォーム */}
      <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-950"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
