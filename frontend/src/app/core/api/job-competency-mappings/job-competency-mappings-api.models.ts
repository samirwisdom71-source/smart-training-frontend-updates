export interface JobCompetencyMappingListDto {
  id: string;
  jobId: string;
  jobCode: string | null;
  jobTitleEn: string | null;
  jobTitleAr?: string | null;
  competencyId: string;
  competencyCode: string | null;
  competencyNameEn: string | null;
  competencyNameAr?: string | null;
  requiredProficiencyLevelId: string;
  requiredProficiencyLevelCode: string | null;
  levelNumber: number;
  importanceWeight: number | null;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface JobCompetencyMappingDto extends JobCompetencyMappingListDto {
  notes: string | null;
  modifiedAt: string | null;
}
export interface CreateJobCompetencyMappingRequest {
  jobId: string;
  competencyId: string;
  requiredProficiencyLevelId: string;
  importanceWeight?: number | null;
  isMandatory: boolean;
  notes?: string | null;
}

export interface UpdateJobCompetencyMappingRequest {
  requiredProficiencyLevelId: string;
  importanceWeight?: number | null;
  isMandatory: boolean;
  notes?: string | null;
}

export interface SetStatusRequest {
  isActive: boolean;
}
