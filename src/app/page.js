"use client";

import { useState } from "react";
import AnimatedBackground from "@/components/animatedBg";
import UploadCard from "@/components/upload";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Page() {
  const [result, setResult] = useState(null);

  console.log(result);

  return (
    <main className="min-h-[85vh] flex items-center justify-center p-6 relative">
      <AnimatedBackground />
      <div className="w-full max-w-2xl space-y-6">
        {/* Upload */}
        <UploadCard onResult={setResult} />

        {/* Error */}
        {result && result?.error && (
          <Alert variant="destructive">
            <AlertTitle>Error: </AlertTitle>
            <AlertDescription>{result?.error}</AlertDescription>
          </Alert>
        )}

        {/* Output */}
        {result && result?.data && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">For Interviewee:</h3>
                <p className="text-gray-700">{result?.data?.interviewee}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg">For Recruiter:</h3>
                <p className="text-gray-700">{result?.data?.recruiter}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
