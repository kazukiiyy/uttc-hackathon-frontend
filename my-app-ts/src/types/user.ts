export type Sex = 'male' | 'female' | 'other' | 'unspecified';

export interface UserProfilePayload {
  uid: string;
  sex: Sex;
  nickname: string;
  birthyear: number;
  birthdate: number;
}

export interface RegisterFormData {
  nickname: string;
  sex: Sex;
  birthyear: string;
  birthdate: string;
}

export interface UserProfile {
  uid: string;
  nickname: string;
  sex: Sex;
  birthyear: number;
  birthdate: number;
  createdAt?: Date;
}
