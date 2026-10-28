export interface PersonalProfileDetails {
  prefix: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  workEmail: string | null;
  alternateEmail: string | null;
  isdCode: string | null;
  mobileNumber: string | null;
}

export interface EmploymentProfileDetails {
  employeeCode: string | null;
  biometricId: string | null;
  dateOfJoining: string | null;
  retirementDate: string | null;
  employmentType: string | null;
  employmentStatus: string | null;
  dateOfResignation: string | null;
}

export interface UpdatePersonalProfileInput extends Partial<PersonalProfileDetails> {
  name?: string;
  timezone?: string;
  locale?: string;
}
