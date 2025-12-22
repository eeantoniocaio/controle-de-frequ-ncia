import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Class, Student, AttendanceRecord } from '../types';

interface AppContextType {
    classes: Class[];
    students: Student[];
    attendance: AttendanceRecord[];
    addClass: (name: string) => void;
    addStudentsFromCSV: (classId: string, studentNames: string[]) => void;
    toggleAttendance: (classId: string, studentId: string, date: string) => void;
    getAttendanceForDate: (classId: string, date: string) => AttendanceRecord | undefined;
    deleteClass: (classId: string) => void;
    deleteStudent: (studentId: string) => void;
    deleteStudents: (studentIds: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<Class[]>(() => {
        const saved = localStorage.getItem('classes');
        return saved ? JSON.parse(saved) : [];
    });

    const [students, setStudents] = useState<Student[]>(() => {
        const saved = localStorage.getItem('students');
        return saved ? JSON.parse(saved) : [];
    });

    const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
        const saved = localStorage.getItem('attendance');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('classes', JSON.stringify(classes));
    }, [classes]);

    useEffect(() => {
        localStorage.setItem('students', JSON.stringify(students));
    }, [students]);

    useEffect(() => {
        localStorage.setItem('attendance', JSON.stringify(attendance));
    }, [attendance]);

    const addClass = (name: string) => {
        const newClass: Class = {
            id: crypto.randomUUID(),
            name,
        };
        setClasses([...classes, newClass]);
    };

    const addStudentsFromCSV = (classId: string, studentNames: string[]) => {
        const newStudents: Student[] = studentNames.map(name => ({
            id: crypto.randomUUID(),
            name: name.trim(),
            classId,
        }));
        setStudents(prev => [...prev, ...newStudents]);
    };

    const toggleAttendance = (classId: string, studentId: string, date: string) => {
        setAttendance(prev => {
            const existingRecordIndex = prev.findIndex(r => r.classId === classId && r.date === date);

            if (existingRecordIndex >= 0) {
                const updatedRecords = [...prev];
                const record = updatedRecords[existingRecordIndex];

                const currentStatus = record.records[studentId] ?? true;

                updatedRecords[existingRecordIndex] = {
                    ...record,
                    records: {
                        ...record.records,
                        [studentId]: !currentStatus
                    }
                };
                return updatedRecords;
            } else {
                return [...prev, {
                    date,
                    classId,
                    records: {
                        [studentId]: false
                    }
                }];
            }
        });
    };

    const getAttendanceForDate = (classId: string, date: string) => {
        return attendance.find(r => r.classId === classId && r.date === date);
    };

    const deleteClass = (classId: string) => {
        setClasses(prev => prev.filter(c => c.id !== classId));
        // Remove students associated with this class
        setStudents(prev => prev.filter(s => s.classId !== classId));
        // Remove attendance records for this class
        setAttendance(prev => prev.filter(a => a.classId !== classId));
    };

    const deleteStudent = (studentId: string) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        // Clean up student from attendance records
        setAttendance(prev => prev.map(record => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [studentId]: _, ...rest } = record.records;
            return { ...record, records: rest };
        }));
    };

    const deleteStudents = (studentIds: string[]) => {
        const idsSet = new Set(studentIds);
        setStudents(prev => prev.filter(s => !idsSet.has(s.id)));

        setAttendance(prev => prev.map(record => {
            const newRecords = { ...record.records };
            studentIds.forEach(id => delete newRecords[id]);
            return { ...record, records: newRecords };
        }));
    };

    return (
        <AppContext.Provider value={{ classes, students, attendance, addClass, addStudentsFromCSV, toggleAttendance, getAttendanceForDate, deleteClass, deleteStudent, deleteStudents }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
