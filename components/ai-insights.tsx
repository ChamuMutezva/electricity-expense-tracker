"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Brain,
    MessageCircle,
    Lightbulb,
    RefreshCw,
    Send,
    Sparkles,
    AlertCircle,
    Settings,
} from "lucide-react";
import { generateElectricityInsights } from "@/actions/ai-analysis-actions";
import { useChat } from "ai/react";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
    hasData: boolean;
}

export default function AIInsights({ hasData }: AIInsightsProps) {
    const [insights, setInsights] = useState<string>("");
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
    const [configError, setConfigError] = useState<string>("");
    const { toast } = useToast();

    // Chat functionality using AI SDK's useChat hook
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading: isChatLoading,
        error: chatError,
    } = useChat({
        api: "/api/electricity-chat",
        onError: (error) => {
            console.error("Chat error:", error);
            toast({
                title: "Chat Error",
                description:
                    error.message ||
                    "Failed to send message. Please try again.",
                variant: "destructive",
            });
        },
    });

    // Generate initial insights when component mounts
    useEffect(() => {
        if (hasData && !insights && !configError) {
            handleGenerateInsights();
        }
    }, [hasData]);

    const handleGenerateInsights = async () => {
        if (!hasData) {
            toast({
                title: "No Data Available",
                description:
                    "Add some electricity readings first to get AI insights.",
                variant: "destructive",
            });
            return;
        }

        setIsGeneratingInsights(true);
        setConfigError("");

        try {
            const newInsights = await generateElectricityInsights();

            // Check if the response indicates a configuration error
            if (
                newInsights.includes("Configuration Error") ||
                newInsights.includes("API key")
            ) {
                setConfigError(newInsights);
                setInsights("");
            } else {
                setInsights(newInsights);
                setLastGenerated(new Date());
                toast({
                    title: "Insights Generated",
                    description: "AI has analyzed your electricity data!",
                });
            }
        } catch (error) {
            console.error("Error generating insights:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            setConfigError(`❌ **Error**: ${errorMessage}`);
            toast({
                title: "Error",
                description:
                    "Failed to generate insights. Please check the console for details.",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const formatInsights = (text: string) => {
        // Split by sections and format nicely
        const sections = text.split(/\*\*([^*]+)\*\*/g);

        return sections.map((section, index) => {
            if (index % 2 === 1) {
                // This is a header
                return (
                    <h3
                        key={index}
                        className="text-lg font-semibold mt-4 mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2"
                    >
                        <Lightbulb className="h-5 w-5" />
                        {section}
                    </h3>
                );
            } else {
                // This is content
                return (
                    <div
                        key={index}
                        className="text-gray-700 dark:text-gray-300 whitespace-pre-line"
                    >
                        {section}
                    </div>
                );
            }
        });
    };

    if (!hasData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        AI Insights (Powered by DeepSeek - Free!)
                    </CardTitle>
                    <CardDescription>
                        Get AI-powered analysis of your electricity usage
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 mb-4">
                            No electricity data available for analysis
                        </p>
                        <p className="text-sm text-gray-400">
                            Add some electricity readings to get AI-powered
                            insights and tips!
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Configuration Error Alert */}
            {configError && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <Settings className="h-5 w-5" />
                            DeepSeek AI Setup Required (Free!)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none dark:prose-invert text-blue-700 dark:text-blue-300">
                            {formatInsights(configError)}
                        </div>
                        <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">
                                🆓 Free Setup Instructions:
                            </h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                                <li>
                                    Go to{" "}
                                    <a
                                        href="https://platform.deepseek.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline font-medium"
                                    >
                                        platform.deepseek.com
                                    </a>{" "}
                                    and create a free account
                                </li>
                                <li>
                                    Navigate to API Keys section and create a
                                    new API key
                                </li>
                                <li>
                                    Add it to your{" "}
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                                        .env.local
                                    </code>{" "}
                                    file as:{" "}
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                                        DEEPSEEK_API_KEY=your_key_here
                                    </code>
                                </li>
                                <li>Restart your development server</li>
                                <li>Try generating insights again</li>
                            </ol>
                            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded text-sm">
                                <strong>💡 Why DeepSeek?</strong> It&apos;s
                                completely free, fast, and great for analysis
                                tasks!
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                        value="insights"
                        className="flex items-center gap-2"
                    >
                        <Sparkles className="h-4 w-4" />
                        AI Insights
                    </TabsTrigger>
                    <TabsTrigger
                        value="chat"
                        className="flex items-center gap-2"
                    >
                        <MessageCircle className="h-4 w-4" />
                        Ask AI
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-purple-600" />
                                        Electricity Usage Analysis
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-green-100 text-green-700"
                                        >
                                            Powered by DeepSeek (Free!)
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        AI-powered insights about your
                                        electricity consumption patterns
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {lastGenerated && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            Updated{" "}
                                            {lastGenerated.toLocaleTimeString()}
                                        </Badge>
                                    )}
                                    <Button
                                        onClick={handleGenerateInsights}
                                        disabled={isGeneratingInsights}
                                        size="sm"
                                        variant="outline"
                                    >
                                        {isGeneratingInsights ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Refresh Analysis
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isGeneratingInsights ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Brain className="h-5 w-5 animate-pulse" />
                                        <span>
                                            DeepSeek AI is analyzing your
                                            electricity data...
                                        </span>
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            ) : insights ? (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {formatInsights(insights)}
                                </div>
                            ) : !configError ? (
                                <div className="text-center py-8">
                                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 mb-4">
                                        No insights generated yet
                                    </p>
                                    <Button onClick={handleGenerateInsights}>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate AI Insights
                                    </Button>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-green-600" />
                                Chat with AI Assistant
                                <Badge
                                    variant="secondary"
                                    className="text-xs bg-green-100 text-green-700"
                                >
                                    Free with DeepSeek!
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Ask questions about your electricity usage, get
                                tips, and receive personalized advice
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {configError ? (
                                <div className="text-center py-8">
                                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500 mb-4">
                                        AI Chat is not available
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Please configure your DeepSeek API key
                                        first
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Chat Messages */}
                                    <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                                        {messages.length === 0 ? (
                                            <div className="text-center text-gray-500 py-8">
                                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>
                                                    Start a conversation! Ask me
                                                    anything about your
                                                    electricity usage.
                                                </p>
                                                <div className="mt-4 text-sm space-y-1">
                                                    <p className="font-medium">
                                                        Try asking:
                                                    </p>
                                                    <p>
                                                        &quot;What are my peak usage
                                                        hours?&quot;
                                                    </p>
                                                    <p>
                                                        &quot;How can I reduce my
                                                        electricity bill?&quot;
                                                    </p>
                                                    <p>
                                                        &quot;Are there any unusual
                                                        patterns in my usage?&quot;
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${
                                                        message.role === "user"
                                                            ? "justify-end"
                                                            : "justify-start"
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                            message.role ===
                                                            "user"
                                                                ? "bg-blue-600 text-white"
                                                                : "bg-white dark:bg-gray-800 border"
                                                        }`}
                                                    >
                                                        <div className="whitespace-pre-wrap">
                                                            {message.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {isChatLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-gray-800 border rounded-lg px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="animate-pulse">
                                                            DeepSeek AI is
                                                            thinking...
                                                        </div>
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Input */}
                                    <form
                                        onSubmit={handleSubmit}
                                        className="flex gap-2"
                                    >
                                        <Textarea
                                            value={input}
                                            onChange={handleInputChange}
                                            placeholder="Ask me about your electricity usage..."
                                            className="flex-1 min-h-[60px] resize-none"
                                            disabled={isChatLoading}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    handleSubmit(e);
                                                }
                                            }}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={
                                                isChatLoading || !input.trim()
                                            }
                                            className="self-end"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>

                                    {chatError && (
                                        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                                            Error: {chatError.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
