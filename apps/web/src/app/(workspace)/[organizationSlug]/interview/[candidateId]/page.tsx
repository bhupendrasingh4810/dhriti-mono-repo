import { InterviewFeedbackPage } from "@/features/hrms/interview-feedback-page";

export default async function Page({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  return <InterviewFeedbackPage candidateId={candidateId} />;
}
