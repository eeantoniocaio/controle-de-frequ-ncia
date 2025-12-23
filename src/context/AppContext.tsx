import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Class, Student, AttendanceRecord } from '../types';
import { supabase } from '../supabase';

interface AppContextType {
    classes: Class[];
    students: Student[];
    attendance: AttendanceRecord[];
    loading: boolean;
    addClass: (name: string) => Promise<void>;
    updateClass: (id: string, newName: string) => Promise<void>;
    addStudent: (classId: string, name: string) => Promise<void>;
    addStudentsFromCSV: (classId: string, studentNames: string[]) => Promise<void>;
    toggleAttendance: (classId: string, studentId: string, date: string) => Promise<void>;
    getAttendanceForDate: (classId: string, date: string) => AttendanceRecord | undefined;
    deleteClass: (classId: string) => Promise<void>;
    deleteStudent: (studentId: string) => Promise<void>;
    deleteStudents: (studentIds: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                { data: classesData },
                { data: studentsData },
                { data: attendanceData }
            ] = await Promise.all([
                supabase.from('classes').select('*').order('name'),
                supabase.from('students').select('*').order('name'),
                supabase.from('attendance').select('*')
            ]);

            if (classesData) setClasses(classesData);
            if (studentsData) {
                // Map DB snake_case to frontend camelCase
                const mappedStudents = studentsData.map(s => ({
                    id: s.id,
                    name: s.name,
                    classId: s.class_id
                }));
                setStudents(mappedStudents);
            }

            if (attendanceData) {
                // Group normalized DB attendance into aggregated frontend objects
                const grouped: { [key: string]: AttendanceRecord } = {};
                attendanceData.forEach(row => {
                    const key = `${row.class_id}_${row.date}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            date: row.date,
                            classId: row.class_id,
                            records: {}
                        };
                    }
                    grouped[key].records[row.student_id] = row.present;
                });
                setAttendance(Object.values(grouped));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addClass = async (name: string) => {
        const { data, error } = await supabase
            .from('classes')
            .insert([{ name }])
            .select()
            .single();

        if (error) console.error('Error adding class:', error);
        else if (data) setClasses(prev => [...prev, data]);
    };

    const updateClass = async (id: string, newName: string) => {
        const { error } = await supabase
            .from('classes')
            .update({ name: newName })
            .eq('id', id);

        if (error) console.error('Error updating class:', error);
        else {
            setClasses(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
        }
    };

    const addStudent = async (classId: string, name: string) => {
        const sanitizedName = name.trim();

        // Prevent duplicates
        const exists = students.some(s => s.classId === classId && s.name.toLowerCase() === sanitizedName.toLowerCase());
        if (exists) {
            console.warn(`Student "${sanitizedName}" already exists in this class.`);
            return;
        }

        const { data, error } = await supabase
            .from('students')
            .insert([{ name: sanitizedName, class_id: classId }])
            .select()
            .single();

        if (error) console.error('Error adding student:', error);
        else if (data) {
            // Map DB snake_case to frontend camelCase
            const mappedStudent: Student = { id: data.id, name: data.name, classId: data.class_id };
            setStudents(prev => [...prev, mappedStudent]);
        }
    };

    const addStudentsFromCSV = async (classId: string, studentNames: string[]) => {
        // Get existing names in this class to filtered them out
        const existingNames = new Set(
            students
                .filter(s => s.classId === classId)
                .map(s => s.name.toLowerCase())
        );

        const uniqueNames = [...new Set(studentNames.map(n => n.trim()))]
            .filter(name => name && !existingNames.has(name.toLowerCase()));

        if (uniqueNames.length === 0) {
            console.warn('No new students to add.');
            return;
        }

        const studentsToInsert = uniqueNames.map(name => ({
            name,
            class_id: classId
        }));

        const { data, error } = await supabase
            .from('students')
            .insert(studentsToInsert)
            .select();

        if (error) console.error('Error adding students:', error);
        else if (data) {
            const mapped = data.map(s => ({ id: s.id, name: s.name, classId: s.class_id }));
            setStudents(prev => [...prev, ...mapped]);
        }
    };

    const toggleAttendance = async (classId: string, studentId: string, date: string) => {
        // 1. Calculate next status
        const currentRecord = attendance.find(r => r.classId === classId && r.date === date);
        const currentStatus = currentRecord?.records[studentId] ?? true; // Default to present
        const nextStatus = !currentStatus;

        // 2. Optimistic UI update (Immediate)
        setAttendance(prev => {
            const index = prev.findIndex(r => r.classId === classId && r.date === date);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    records: { ...updated[index].records, [studentId]: nextStatus }
                };
                return updated;
            } else {
                return [...prev, { date, classId, records: { [studentId]: nextStatus } }];
            }
        });

        // 3. Background Sync with Supabase
        const { error } = await supabase
            .from('attendance')
            .upsert({
                class_id: classId,
                student_id: studentId,
                date,
                present: nextStatus
            }, {
                onConflict: 'class_id,student_id,date'
            });

        if (error) {
            console.error('Error toggling attendance:', error);
            // Rollback optimistic update if error occurs
            setAttendance(prev => {
                const index = prev.findIndex(r => r.classId === classId && r.date === date);
                if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        records: { ...updated[index].records, [studentId]: currentStatus }
                    };
                    return updated;
                }
                return prev;
            });
        }
    };

    const getAttendanceForDate = (classId: string, date: string) => {
        return attendance.find(r => r.classId === classId && r.date === date);
    };

    const deleteClass = async (classId: string) => {
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) console.error('Error deleting class:', error);
        else {
            setClasses(prev => prev.filter(c => c.id !== classId));
            setStudents(prev => prev.filter(s => s.classId !== classId));
            setAttendance(prev => prev.filter(a => a.classId !== classId));
        }
    };

    const deleteStudent = async (studentId: string) => {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) console.error('Error deleting student:', error);
        else {
            setStudents(prev => prev.filter(s => s.id !== studentId));
            setAttendance(prev => prev.map(record => {
                const { [studentId]: _, ...rest } = record.records;
                return { ...record, records: rest };
            }));
        }
    };

    const deleteStudents = async (studentIds: string[]) => {
        const { error } = await supabase.from('students').delete().in('id', studentIds);
        if (error) console.error('Error deleting students:', error);
        else {
            const idsSet = new Set(studentIds);
            setStudents(prev => prev.filter(s => !idsSet.has(s.id)));
            setAttendance(prev => prev.map(record => {
                const newRecords = { ...record.records };
                studentIds.forEach(id => delete newRecords[id]);
                return { ...record, records: newRecords };
            }));
        }
    };

    return (
        <AppContext.Provider value={{
            classes, students, attendance, loading,
            addClass, updateClass, addStudent, addStudentsFromCSV,
            toggleAttendance, getAttendanceForDate,
            deleteClass, deleteStudent, deleteStudents
        }}>
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
