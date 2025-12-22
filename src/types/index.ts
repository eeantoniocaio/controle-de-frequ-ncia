export interface Student {
  id: string;
  name: string;
  classId: string;
}

export interface Class {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  classId: string;
  records: {
    [studentId: string]: boolean; // true = present, false = absent
  };
}
