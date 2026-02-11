"use client";

import { useState, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  data?: any[];
  intent?: any;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi 👋 I'm DW-GPT. Your company's AI data assistant. Ask me about shipments, tasks, or anything else!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Show initial loader for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3002/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          conversationId 
        }),
      });

      const result = await res.json();

      if (!result.ok) {
        throw new Error(result.error || "Failed to process request");
      }

      // Save conversation ID for next message
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      const { intent, data, aiResponse } = result;

      let responseContent = "";
      let responseData = undefined;

      // Handle different response types
      if (data) {
        if (data.type === "shipments") {
          responseContent = aiResponse || `Found ${data.count} shipment(s). ${
            data.count === 0 ? "Try adjusting your filters." : "Showing records below 👇"
          }`;
          responseData = data.records;
        } 
        else if (data.type === "tasks") {
          responseContent = aiResponse || `Found ${data.count} task(s). ${
            data.count === 0 ? "No tasks found." : "Showing records below 👇"
          }`;
          responseData = data.records;
        }
        else if (data.type === "insights") {
          // AI-generated insights and analysis
          responseContent = data.response;
          
          // Optionally show what data was used
          if (data.dataUsed) {
            const dataInfo = [];
            if (data.dataUsed.shipments > 0) {
              dataInfo.push(`${data.dataUsed.shipments} shipments`);
            }
            if (data.dataUsed.tasks > 0) {
              dataInfo.push(`${data.dataUsed.tasks} tasks`);
            }
            
            if (dataInfo.length > 0) {
              responseContent += `\n\n📊 Analysis based on: ${dataInfo.join(', ')}`;
            }
          }
        }
      } else {
        responseContent = aiResponse || "✅ I understood your request. Processing...";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseContent,
          data: responseData,
          intent: intent,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Failed to process your request. ${
            err instanceof Error ? err.message : "Please try again."
          }`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Optional: Add a function to clear conversation history
  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const downloadExcel = (data: any[]) => {
    if (!data || data.length === 0) return;

    // Convert data to CSV format
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header]?.toString() || "";
          // Escape commas and quotes
          return value.includes(",") || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `data_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initial Loading Screen
  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading your AI Chatbot</h1>
          <p className="text-gray-400">Preparing DW-GPT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-4">DW-GPT</h1>
        <p className="text-sm text-gray-400">
          Your company's AI data assistant
        </p>
        <div className="mt-6 text-sm text-gray-300 space-y-2">
          <p>✨ Powered by Llama 3.3 70B</p>
          <p>• Ask about shipments</p>
          <p>• Query tasks</p>
          <p>• Natural language queries</p>
          <p>• Smart filters</p>
        </div>

        <div className="mt-auto pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500">Try asking:</p>
          <div className="mt-2 space-y-1 text-xs text-gray-400">
            <p>→ Show latest shipments</p>
            <p>→ Shipments where POL is Nhava Sheva</p>
            <p>→ Find tasks for shipment ABC123</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-950 text-white">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Chat with DW-GPT</h2>
            <p className="text-xs text-gray-400">AI-powered data assistant</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Thinking...
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`max-w-xl p-4 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-800 text-gray-100 mr-auto border border-gray-700"
                }`}
              >
                {msg.content}
              </div>

              {msg.data && msg.data.length > 0 && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">
                      {msg.data.length} record(s)
                    </p>
                    <button
                      onClick={() => downloadExcel(msg.data || [])}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download Excel
                    </button>
                  </div>

                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-400 border-b border-gray-700">
                      <tr>
                        {Object.keys(msg.data[0] || {}).slice(0, 6).map((key) => (
                          <th key={key} className="p-2 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.data.slice(0, 50).map((row: any, i: number) => (
                        <tr
                          key={i}
                          className="border-b border-gray-800 hover:bg-gray-800"
                        >
                          {Object.keys(row).slice(0, 6).map((key) => (
                            <td key={key} className="p-2">
                              {row[key]?.toString() || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {msg.data.length > 50 && (
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Showing first 50 of {msg.data.length} records
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-gray-800 flex gap-2 bg-gray-900">
          <input
            type="text"
            placeholder="Ask me anything... e.g., 'Show shipments where POL is Nhava Sheva'"
            className="flex-1 rounded-lg px-4 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) sendMessage();
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium ${
              loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "⏳" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}