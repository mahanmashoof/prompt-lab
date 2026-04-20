import { useState } from "react";

interface PromptResult {
  text: string;
  tokens: number;
  loading: boolean;
  error: string | null;
}

const defaultResult: PromptResult = {
  text: "",
  tokens: 0,
  loading: false,
  error: null,
};

async function runPrompt(
  systemPrompt: string,
  userMessage: string,
): Promise<{ text: string; tokens: number }> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function App() {
  const [userMessage, setUserMessage] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [resultA, setResultA] = useState<PromptResult>(defaultResult);
  const [resultB, setResultB] = useState<PromptResult>(defaultResult);

  const handleRun = async () => {
    if (!userMessage.trim() || !promptA.trim() || !promptB.trim()) return;

    // Set both to loading simultaneously
    setResultA({ ...defaultResult, loading: true });
    setResultB({ ...defaultResult, loading: true });

    // Run both API calls in parallel — Promise.all waits for both
    // This is the same as Promise.all in JS — Python equivalent is asyncio.gather()
    const [resA, resB] = await Promise.allSettled([
      runPrompt(promptA, userMessage),
      runPrompt(promptB, userMessage),
    ]);

    setResultA(
      resA.status === "fulfilled"
        ? {
            text: resA.value.text,
            tokens: resA.value.tokens,
            loading: false,
            error: null,
          }
        : {
            ...defaultResult,
            error: resA.reason?.message ?? "Error",
            loading: false,
          },
    );
    setResultB(
      resB.status === "fulfilled"
        ? {
            text: resB.value.text,
            tokens: resB.value.tokens,
            loading: false,
            error: null,
          }
        : {
            ...defaultResult,
            error: resB.reason?.message ?? "Error",
            loading: false,
          },
    );
  };

  const isRunning = resultA.loading || resultB.loading;
  const canRun =
    userMessage.trim() && promptA.trim() && promptB.trim() && !isRunning;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-medium text-gray-900">Prompt Lab</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Compare two system prompts side by side
          </p>
        </div>

        {/* Shared user input */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
            User message
          </label>
          <textarea
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
            rows={2}
            placeholder="What should both prompts respond to?"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
          />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Prompt A",
              value: promptA,
              setter: setPromptA,
              result: resultA,
            },
            {
              label: "Prompt B",
              value: promptB,
              setter: setPromptB,
              result: resultB,
            },
          ].map(({ label, value, setter, result }) => (
            <div key={label} className="flex flex-col gap-3">
              {/* System prompt input */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="text-xs uppercase tracking-wide text-gray-400 block mb-2">
                  {label} — system prompt
                </label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                  rows={4}
                  placeholder="You are a..."
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                />
              </div>

              {/* Output */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-40">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs uppercase tracking-wide text-gray-400">
                    Output
                  </label>
                  {result.tokens > 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {result.tokens} tokens
                    </span>
                  )}
                </div>

                {result.loading && (
                  <p className="text-sm text-gray-400 animate-pulse">
                    Generating...
                  </p>
                )}
                {result.error && (
                  <p className="text-sm text-red-500">{result.error}</p>
                )}
                {result.text && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {result.text}
                  </p>
                )}
                {!result.loading && !result.text && !result.error && (
                  <p className="text-sm text-gray-300">
                    Output will appear here
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Run button */}
        <div className="flex justify-end">
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors"
          >
            {isRunning ? "Running..." : "Run both prompts"}
          </button>
        </div>
      </div>
    </div>
  );
}
