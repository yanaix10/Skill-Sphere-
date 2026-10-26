import { BACKEND_URL } from "../utils/api";

const API_URL = `${BACKEND_URL}/api/questions`;

export interface Question {
  _id: string;
  question: string;
  category: string;
  difficulty: string;
  answers: {
    answer_a?: string;
    answer_b?: string;
    answer_c?: string;
    answer_d?: string;
    answer_e?: string;
    answer_f?: string;
  };
  correct_answers: {
    answer_a_correct?: string;
    answer_b_correct?: string;
    answer_c_correct?: string;
    answer_d_correct?: string;
    answer_e_correct?: string;
    answer_f_correct?: string;
  };
}

export const fetchPracticeQuestions = async (): Promise<Question[]> => {
  const response = await fetch(`${API_URL}/practice`);
  if (!response.ok) throw new Error("Network response was not ok");
  return await response.json();
};
