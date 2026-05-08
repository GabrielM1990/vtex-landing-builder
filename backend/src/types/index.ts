export interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[]; // IDs de bloques hijos para referencias VTEX
}

export interface Landing {
  id: string;
  name: string;
  route: string;
  blocks: Block[];
  status: 'draft' | 'deployed';
  deployedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

export interface Deployment {
  id: string;
  landingId: string;
  status: 'pending' | 'success' | 'failed';
  commitSha?: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubDeployRequest {
  landing: Landing;
  workspace?: string;
  vtexAccount?: string;
  vtexAppKey?: string;
  vtexAppToken?: string;
}

export interface GitHubDeployResponse {
  success: boolean;
  message: string;
  landingId: string;
  workspace: string;
  previewUrl: string;
  logs: string[];
  summary?: {
    successfulSteps: number;
    totalSteps: number;
  };
  filesUpdated?: {
    routes: string;
    blocks: string;
  };
}

export interface VtexCollection {
  id: number;
  name: string;
  type: string;
}

export interface AIAnalysis {
  repository?: {
    name: string;
    defaultBranch: string;
  };
  recommendations?: Array<{
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  warnings?: Array<{
    message: string;
    type: string;
  }>;
  filesToGenerate?: Record<string, unknown>;
}

export interface BlockValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
