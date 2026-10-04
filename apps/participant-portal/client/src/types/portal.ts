export type ProjectStatus = "In progress" | "Beta" | "Live" | "Paused" | "Archived";

export type SubmissionFormData = {
  participantName: string;
  participantEmail: string;
  country: string;
  profileUrl: string;
  projectName: string;
  shortDescription: string;
  problemSolved: string;
  category: string;
  repositoryUrl: string;
  liveUrl: string;
  documentationUrl: string;
  demoVideoUrl: string;
  technologyStack: string;
  projectStatus: ProjectStatus | "";
};

export const EMPTY_SUBMISSION: SubmissionFormData = {
  participantName: "",
  participantEmail: "",
  country: "",
  profileUrl: "",
  projectName: "",
  shortDescription: "",
  problemSolved: "",
  category: "",
  repositoryUrl: "",
  liveUrl: "",
  documentationUrl: "",
  demoVideoUrl: "",
  technologyStack: "",
  projectStatus: "",
};
