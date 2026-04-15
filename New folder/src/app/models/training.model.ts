export interface TrainingCourse {
  id: string;
  code: string;
  title: string;
  trainer: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}
