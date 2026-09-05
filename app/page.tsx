"use client"

import { WorkspaceShell } from "@/components/workspace-shell"
import { ProjectIntro } from "../components/project-intro"

export default function HomePage() {
  return (
    <WorkspaceShell>
      <ProjectIntro />
    </WorkspaceShell>
  )
}
