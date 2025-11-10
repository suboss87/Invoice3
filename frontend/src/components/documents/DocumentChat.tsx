import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ArrowRight, ThumbsUp, ThumbsDown, ArrowDownCircle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { chatWithDocument, submitFeedback } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id?: string;
  feedback?: 'positive' | 'negative';
}

interface DocumentChatProps {
  documentId: number;
  documentTitle: string;
}

const DocumentChat: React.FC<DocumentChatProps> = ({ documentId, documentTitle }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  // Always use OpenAI for document chat as per system design
  const modelProvider = 'openai';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Manual scroll function (not automatically called)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Automatic scrolling removed as per user request
  // Chat will now require manual scrolling

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setFollowUpQuestions([]);
    
    try {
      const response = await chatWithDocument(documentId, userMessage.content, modelProvider);
      
      // Extract follow-up questions from the AI response and remove from display content
      const extractFollowUpQuestions = (): string[] => {
        // Find follow-up questions section
        const followUpPattern = /\*\*Follow-up Questions:\*\*[\s\n]*([\s\S]*?)(?:DISCLAIMER|$)/i;
        const match = response.answer.match(followUpPattern);
        
        let questions: string[] = [];
        
        if (match && match[1]) {
          // Extract the text containing the follow-up questions
          const followUpText = match[1].trim();
          
          // Split into separate questions (numbered or with line breaks)
          questions = followUpText
            .split(/[\n\r]+|(?:\d+\.\s*)/g) // Split by newlines or numbered list items
            .map(q => q.trim())
            .filter(q => q.length > 0 && q.match(/\w+/) && q.endsWith('?')); // Keep only non-empty lines ending with "?"
          
          if (questions.length >= 2) {
            questions = questions.slice(0, 2); // Return only 2 questions
          }
        }
        
        // Fallback questions if we couldn't extract any
        if (questions.length === 0) {
          questions = [
            "What are the key obligations for each party in this document?",
            "How can this agreement be terminated?"
          ];
        }
        
        return questions;
      };
      
      // Remove the in-text Follow-up Questions section from the display content completely
      let cleanResponse = response.answer;
      
      // First pattern: Remove the "Follow-up Questions:" header and all content until disclaimer
      cleanResponse = cleanResponse.replace(/\s*(?:\*\*)?Follow-up Questions:(?:\*\*)?\s*[\s\S]*?(?=\s*(?:\*\*)?DISCLAIMER|$)/i, '');
      
      // Second pattern: Remove numbered/bulleted follow-up questions that might appear elsewhere
      cleanResponse = cleanResponse.replace(/\s*(?:(?:\d+\.|\-)\s*(?:[A-Z][^?]*\?)\s*)+(?=\s*(?:\*\*)?DISCLAIMER|$)/i, '');
      
      // Set the follow-up questions
      const suggestedQuestions = extractFollowUpQuestions();
      setFollowUpQuestions(suggestedQuestions);
      
      const assistantMessage: Message = {
        role: 'assistant',
        // Use the cleaned response without the duplicated follow-up questions
        content: cleanResponse,
        timestamp: new Date(response.timestamp)
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in document chat:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFollowUpQuestion = (question: string) => {
    // Automatically submit the follow-up question without requiring user to press Enter/Submit
    setInputValue(question);
    
    // Use setTimeout to ensure the state update has happened
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        // Create and dispatch a submit event
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
    }, 100);
  };
  
  const handleFeedback = async (messageIndex: number, feedback: 'positive' | 'negative') => {
    const message = messages[messageIndex];
    if (message.role !== 'assistant' || message.feedback === feedback) {
      return;
    }
    
    // Generate a temporary ID if the message doesn't have one
    const messageId = message.id || `temp-${Date.now()}-${messageIndex}`;
    
    // Update local state first to show feedback immediately
    setMessages(prevMessages => 
      prevMessages.map((msg, idx) => 
        idx === messageIndex ? { ...msg, feedback, id: messageId } : msg
      )
    );
    
    // Show loading state for this feedback
    setFeedbackLoading(prev => ({ ...prev, [messageId]: true }));
    
    try {
      await submitFeedback(messageId, documentId, feedback);
      toast({
        title: feedback === 'positive' ? 'Thanks for the positive feedback!' : 'Thanks for your feedback',
        description: 'Your input helps us improve our responses.',
        variant: feedback === 'positive' ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again later.',
        variant: 'destructive',
      });
      
      // Revert the feedback state if the API call fails
      setMessages(prevMessages => 
        prevMessages.map((msg, idx) => 
          idx === messageIndex ? { ...msg, feedback: undefined } : msg
        )
      );
    } finally {
      // Clear loading state
      setFeedbackLoading(prev => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Document Chat</CardTitle>
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 flex items-center"
            onClick={() => setMessages([])}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask questions about document: <strong>{documentTitle}</strong></p>
            <p className="text-sm mt-2">Examples:</p>
            <div className="mt-4 space-y-2 max-w-md mx-auto">
              {[
                "What are the key obligations in this contract?",
                "What is the termination clause?",
                "Summarize the main points of this document.",
                "What happens if a party breaches this agreement?"
              ].map((question, idx) => (
                <button
                  key={idx}
                  className="text-left w-full px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs flex items-center justify-between transition-colors border border-blue-100"
                  onClick={() => handleFollowUpQuestion(question)}
                >
                  <span className="flex-1">{question}</span>
                  <ArrowRight className="h-3 w-3 text-blue-400 ml-2 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-headings:text-blue-900 prose-headings:font-medium prose-headings:mb-1 prose-h3:text-sm prose-headings:mt-2 prose-p:my-1 prose-li:my-0.5 prose-li:ml-2 prose-strong:text-blue-700 prose-strong:font-medium">
                      <ReactMarkdown 
                        components={{
                          // Make sure code blocks are properly styled
                          code: ({ className, children, ...props }: any) => {
                            const isInline = !props.node?.properties?.className?.includes('language-');
                            return (
                              <code
                                className={`${isInline ? 'text-blue-600 bg-blue-50 px-1 py-0.5 rounded' : 'block bg-gray-100 p-2 rounded'} ${className || ''}`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          // Add custom styles to list items
                          li: ({ className, children, ...props }: any) => (
                            <li
                              className={`my-0.5 ${className || ''}`}
                              {...props}
                            >
                              {children}
                            </li>
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div
                      className={`text-xs ${
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    
                    {/* Feedback buttons - only shown for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleFeedback(index, 'positive')}
                          disabled={feedbackLoading[message.id || ''] || message.feedback === 'positive'}
                          className={`rounded-full p-1 transition-colors ${
                            message.feedback === 'positive'
                              ? 'bg-green-100 text-green-600'
                              : 'hover:bg-gray-200 text-gray-400 hover:text-green-600'
                          }`}
                          aria-label="Helpful"
                          title="This was helpful"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(index, 'negative')}
                          disabled={feedbackLoading[message.id || ''] || message.feedback === 'negative'}
                          className={`rounded-full p-1 transition-colors ${
                            message.feedback === 'negative'
                              ? 'bg-red-100 text-red-600'
                              : 'hover:bg-gray-200 text-gray-400 hover:text-red-600'
                          }`}
                          aria-label="Not helpful"
                          title="This was not helpful"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Follow-up questions - show only for the most recent assistant message */}
                  {message.role === 'assistant' && 
                   index === messages.length - 1 && 
                   followUpQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Follow-up questions:</p>
                      <div className="space-y-2">
                        {followUpQuestions.map((question, idx) => (
                          <button
                            key={idx}
                            className="text-left w-full px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs flex items-center justify-between transition-colors"
                            onClick={() => handleFollowUpQuestion(question)}
                          >
                            <span className="flex-1">{question}</span>
                            <ArrowRight className="h-3 w-3 text-blue-400 ml-2 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
        
        {/* Scroll to bottom button - only visible when there are messages */}
        {messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
            aria-label="Scroll to bottom"
            title="Scroll to bottom"
          >
            <ArrowDownCircle className="h-5 w-5" />
          </button>
        )}
      </CardContent>
      
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-2"
      >
        <Textarea
          placeholder="Ask a question about this document..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="min-h-[60px] resize-none flex-1"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </Card>
  );
};

export default DocumentChat;