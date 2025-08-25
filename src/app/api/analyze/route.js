import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { openai } from "@/lib/openai";
import { saveReport } from "@/lib/store";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `
You are an expert technical interviewer and communication coach.
Return STRICT JSON in this exact schema:
{
  "interviewee": {
    "wentWell": string[],
    "improvements": string[],
    "actionable": string[]
  },
  "recruiter": {
    "missedAreas": string[],
    "suggestedQuestions": string[],
    "rubricTips": string[]
  }
}
Keep bullets specific and scannable. No prose outside JSON.
`;

export async function POST(req) {
  try {
    console.log("Analyzing....");
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const name = file.name || "upload";
    const lower = name.toLowerCase();
    const type = file.type || "";
    const allowed =
      lower.endsWith(".webm") ||
      lower.endsWith(".m4a") ||
      type.includes("audio/webm") ||
      type.includes("audio/m4a") ||
      type.includes("video/webm");
    if (!allowed) {
      return NextResponse.json(
        { error: "Only .webm or .m4a files supported" },
        { status: 415 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const tmpPath = path.join(
      "/tmp",
      `${crypto.randomUUID?.() || randomUUID()}-${name}`
    );
    await fs.writeFile(tmpPath, bytes);

    console.log("Valid File, Generating Transcript...");

    // 1) Transcription (Whisper)
    // const transcriptionData = await openai.audio.transcriptions.create({
    //   file: await fs.open(tmpPath, "r").then((fh) => {
    //     const stream = fh.createReadStream();
    //     stream.path = tmpPath;
    //     return stream;
    //   }),
    //   model: "whisper-1",
    //   response_format: "verbose_json",
    // });

    // cleanup tmp
    fs.unlink(tmpPath).catch(() => {});

    const transcription = {
      task: "transcribe",
      language: "en",
      duration: 32.5,
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0.0,
          end: 3.2,
          text: " Hi Shivam, thanks for joining today. Can you start by telling me a bit about your background?",
          tokens: [50364, 1007, 5555, 11],
          temperature: 0,
          avg_logprob: -0.1,
          compression_ratio: 1.2,
          no_speech_prob: 0.01,
        },
        {
          id: 1,
          seek: 320,
          start: 3.2,
          end: 8.5,
          text: " Sure, I’m a Full Stack Developer with experience in React, Next.js, Tailwind, and Node.js.",
          tokens: [50364, 987, 2145, 33],
          temperature: 0,
          avg_logprob: -0.08,
          compression_ratio: 1.15,
          no_speech_prob: 0.01,
        },
        {
          id: 2,
          seek: 850,
          start: 8.5,
          end: 14.2,
          text: " Recently, I’ve been building a microSaaS that integrates SmartLead with Calendly to automate cold outreach workflows.",
          tokens: [50364, 1055, 2048, 2921],
          temperature: 0,
          avg_logprob: -0.12,
          compression_ratio: 1.1,
          no_speech_prob: 0.01,
        },
        {
          id: 3,
          seek: 1420,
          start: 14.2,
          end: 19.0,
          text: " What’s the most impressive technical challenge you’ve solved recently?",
          tokens: [50364, 311, 445, 1766],
          temperature: 0,
          avg_logprob: -0.09,
          compression_ratio: 1.12,
          no_speech_prob: 0.01,
        },
        {
          id: 4,
          seek: 1900,
          start: 19.0,
          end: 25.5,
          text: " One was implementing a dynamic link redirection system that fetches user details from SmartLead in real-time and pre-fills a client’s Calendly form.",
          tokens: [50364, 209, 300, 1705],
          temperature: 0,
          avg_logprob: -0.11,
          compression_ratio: 1.18,
          no_speech_prob: 0.01,
        },
        {
          id: 5,
          seek: 2550,
          start: 25.5,
          end: 32.5,
          text: " Perfect, thank you Shivam.",
          tokens: [50364, 1190, 2047, 3551],
          temperature: 0,
          avg_logprob: -0.07,
          compression_ratio: 1.05,
          no_speech_prob: 0.01,
        },
      ],
      text: "Hi Shivam, thanks for joining today. Can you start by telling me a bit about your background? Sure, I’m a Full Stack Developer with experience in React, Next.js, Tailwind, and Node.js. Recently, I’ve been building a microSaaS that integrates SmartLead with Calendly to automate cold outreach workflows. What’s the most impressive technical challenge you’ve solved recently? One was implementing a dynamic link redirection system that fetches user details from SmartLead in real-time and pre-fills a client’s Calendly form. Perfect, thank you Shivam.",
    };

    // Extract plain text transcript
    const transcript = transcription?.text || "";
    const durationSec = transcription?.duration;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    console.log("Analysing Transcript for user and system");

    // 2) Analysis (Responses API) – ask for strict JSON
    const res = await openai.responses.create({
      model: "gpt-3.5-turbo",
      text: {
        format: { type: "json_object" },
      },
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transcript:\n${transcript}` },
      ],
    });

    // Responses API gives unified output
    const text = res.output_text || "{}";
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = {
        interviewee: { wentWell: [], improvements: [], actionable: [] },
        recruiter: { missedAreas: [], suggestedQuestions: [], rubricTips: [] },
      };
    }

    const id = randomUUID();
    const payload = {
      id,
      createdAt: new Date().toISOString(),
      model: "gpt-4o-mini",
      durationSec: typeof durationSec === "number" ? durationSec : undefined,
      transcript,
      interviewee: {
        wentWell: analysis?.interviewee?.wentWell || [],
        improvements: analysis?.interviewee?.improvements || [],
        actionable: analysis?.interviewee?.actionable || [],
      },
      recruiter: {
        missedAreas: analysis?.recruiter?.missedAreas || [],
        suggestedQuestions: analysis?.recruiter?.suggestedQuestions || [],
        rubricTips: analysis?.recruiter?.rubricTips || [],
      },
    };

    await saveReport(id, payload);
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: err?.error || "Unexpected error", message: err?.error?.message },
      { status: 500 }
    );
  }
}
