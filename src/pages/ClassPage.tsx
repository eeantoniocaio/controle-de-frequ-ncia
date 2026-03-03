import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, Calendar as CalendarIcon, Check, X } from 'lucide-react';

const ClassPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { classes, students, getAttendanceForDate, toggleAttendance, fetchAttendance, loading } = useAppContext();

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (classId && date) {
            fetchAttendance(classId, date);
        }
    }, [classId, date, fetchAttendance]);

    if (loading) {
        return (
            <div className="container flex items-center justify-center" style={{ height: '50vh' }}>
                <div className="text-center">
                    <div className="spinner mb-md"></div>
                    <p className="text-secondary">Carregando dados da turma...</p>
                </div>
            </div>
        );
    }

    const currentClass = classes.find(c => c.id === classId);
    if (!currentClass) return <div className="container">Turma não encontrada</div>;

    const classStudents = students.filter(s => s.classId === classId);
    const attendanceRecord = classId ? getAttendanceForDate(classId, date) : undefined;

    const getStatus = (studentId: string) => {
        if (!attendanceRecord) return true;
        const status = attendanceRecord.records[studentId];
        return status !== false;
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
            <header className="page-header flex-col items-start gap-md">
                <Link to="/" className="flex items-center text-secondary text-sm">
                    <ChevronLeft size={16} /> Voltar para Turmas
                </Link>
                <div className="flex justify-between items-center w-full gap-sm flex-wrap">
                    <div className="flex items-center gap-md">
                        <h2 className="page-title m-0">{currentClass.name}</h2>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <CalendarIcon size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '40px', width: 'auto' }}
                        />
                    </div>
                </div>
            </header>

            <div className="card shadow-none bg-transparent p-0 overflow-hidden">
                {classStudents.length === 0 ? (
                    <div className="card text-center text-secondary">
                        Nenhum aluno nesta turma ainda. Vá em Configurações para adicionar alunos.
                    </div>
                ) : (
                    <div className="flex-col gap-sm">
                        {classStudents.map((student) => {
                            const isPresent = getStatus(student.id);
                            return (
                                <div key={student.id} className="card flex justify-between items-center" style={{ boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: 0 }}>
                                    <span className="font-semibold" style={{ fontSize: '1rem' }}>
                                        {student.name}
                                    </span>

                                    <button
                                        onClick={() => toggleAttendance(currentClass.id, student.id, date)}
                                        className="btn"
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: isPresent ? 'var(--accent-green)' : '#fee2e2',
                                            color: isPresent ? '#064e3b' : '#991b1b',
                                            minWidth: '110px'
                                        }}
                                    >
                                        {isPresent ? (
                                            <>
                                                <Check size={18} strokeWidth={2.5} /> Presente
                                            </>
                                        ) : (
                                            <>
                                                <X size={18} strokeWidth={2.5} /> Ausente
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassPage;

