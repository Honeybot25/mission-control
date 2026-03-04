"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-500/20 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="text-red-500">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-400">
                An error occurred while rendering this page. Please try refreshing.
              </p>
              {this.state.error && (
                <pre className="text-xs bg-slate-950 p-3 rounded overflow-auto max-h-32 text-red-400">
                  {this.state.error.message}
                </pre>
              )}
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
