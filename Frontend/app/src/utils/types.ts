

export type Department = {
  department_id: number;
  department_name: string;
};

export type Job = {
  department_id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  deadline: string; // ISO date string
  application_fee: number;
  skills_weight: number;
  experience_weight: number;
  hr_id: number;

  questions_form: {
    questions: string[];
  };
};
